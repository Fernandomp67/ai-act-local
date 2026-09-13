import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { Store, Conflict } from '../storage/store';
import { catalog, projectRoot } from '../engine/catalog';
import { evaluate, nextQuestions } from '../engine/evaluate';
import { mutate } from '../application/service';
import { compareResults, exportReport } from '../reports/generate';
import { validateCatalog } from '../engine/validate';
const store=new Store();const token=randomBytes(32).toString('hex');
const port=Number(process.env.AI_ACT_PORT??4317);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Puerto inválido');
const origin=`http://127.0.0.1:${port}`;const dev=process.argv.includes('--dev');
const vite=dev?await (await import('vite')).createServer({configFile:path.join(projectRoot,'vite.config.ts'),root:projectRoot,server:{middlewareMode:true},appType:'spa'}):null;
const json=(res:http.ServerResponse,status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function body(req:http.IncomingMessage){let n=0;const chunks:Buffer[]=[];for await(const x of req){n+=x.length;if(n>4_000_000)throw new Error('Petición demasiado grande');chunks.push(x);}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self' ${dev?"'unsafe-inline'":''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${dev?'ws://127.0.0.1:*':''}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`);
  if(req.headers.host!==`127.0.0.1:${port}`){json(res,403,{error:`Accede mediante ${origin}`});return;}
  if(req.headers.origin&&req.headers.origin!==origin){json(res,403,{error:'Origen no permitido'});return;}
  if(req.headers['sec-fetch-site']==='cross-site'){json(res,403,{error:'Petición externa no permitida'});return;}
  try{
    const url=new URL(req.url??'/',origin);const parts=url.pathname.split('/').filter(Boolean);
    if(parts[0]!=='api'){
      if(req.method!=='GET'&&req.method!=='HEAD'){json(res,405,{error:'Método no permitido'});return;}
      if(vite){vite.middlewares(req,res,()=>json(res,404,{error:'No encontrado'}));return;}
      const relative=parts.length?parts.join('/'):'index.html';const file=path.resolve(projectRoot,'dist',relative);const dist=path.resolve(projectRoot,'dist');
      if(!file.startsWith(`${dist}${path.sep}`)||relative.includes('..')){json(res,404,{error:'No encontrado'});return;}
      const real=await fs.realpath(file);if(!real.startsWith(`${dist}${path.sep}`)){json(res,404,{error:'No encontrado'});return;}
      const data=await fs.readFile(real);const ext=path.extname(real);const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':mime[ext]??'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);return;
    }
    if(req.method!=='GET'){
      const supplied=String(req.headers['x-ai-act-token']??'');if(supplied.length!==token.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(token))){json(res,403,{error:'Sesión local inválida; recarga la página'});return;}
      if(!String(req.headers['content-type']).startsWith('application/json')){json(res,415,{error:'Se requiere JSON'});return;}
    }
    if(req.method==='GET'&&parts[1]==='session'){json(res,200,{token,version:'0.1.0'});return;}
    if(req.method==='GET'&&parts[1]==='catalog'){json(res,200,catalog);return;}
    if(req.method==='GET'&&parts[1]==='health'){json(res,200,{ok:true,validation:validateCatalog()});return;}
    if(parts[1]==='assessments'){
      if(parts.length===2){if(req.method==='GET'){json(res,200,(await store.list()).map(({id,name,organisation,mode,status,version,updatedAt,cases})=>({id,name,organisation,mode,status,version,updatedAt,caseCount:cases.length})));return;}if(req.method==='POST'){json(res,201,await store.create(await body(req)));return;}}
      const id=parts[2];const a=await store.read(id);
      if(parts.length===3&&req.method==='GET'){const b=await store.bundle(id);json(res,200,{assessment:a,result:b.result,revisions:await store.revisions(id),questions:Object.fromEntries(a.cases.map(c=>[c.id,nextQuestions(a,c.id,b.catalog)]))});return;}
      if(parts[3]==='mutate'&&req.method==='POST'){const b=z.object({version:z.number().int(),mutation:z.unknown()}).strict().parse(await body(req));json(res,200,await mutate(store,id,b.version,b.mutation));return;}
      if(parts[3]==='seal'&&req.method==='POST'){const b=z.object({version:z.number().int()}).strict().parse(await body(req));json(res,200,await store.seal(id,b.version));return;}
      if(parts[3]==='revise'&&req.method==='POST'){json(res,201,await store.fork(id));return;}
      if(parts[3]==='reproduce'&&req.method==='GET'){const s=await store.snapshot(id,url.searchParams.get('revision')??'');json(res,200,{verified:true,digest:s.digest,evaluation:s.evaluation});return;}
      if(parts[3]==='compare'&&req.method==='GET'){const s=await store.snapshot(id,url.searchParams.get('revision')??'',false);json(res,200,compareResults(s.evaluation,(await store.bundle(id)).result));return;}
      if(parts[3]==='compare-assessment'&&req.method==='GET'){json(res,200,compareResults((await store.bundle(url.searchParams.get('before')??'')).result,(await store.bundle(id)).result));return;}
      if(parts[3]==='report'&&req.method==='GET'){const format=url.searchParams.get('format')??'md';const buffer=await exportReport(a,(await store.bundle(id)).result,format);const mime:Record<string,string>={md:'text/markdown',html:'text/html',json:'application/json',pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};res.writeHead(200,{'Content-Type':mime[format],'Content-Disposition':`attachment; filename="report.${format}"`,'Cache-Control':'no-store'});res.end(buffer);return;}
    }
    json(res,404,{error:'Operación no encontrada'});
  }catch(e:any){json(res,e instanceof Conflict?409:e.code==='ENOENT'?404:400,{error:e.message,details:e.issues??undefined});}
});
server.requestTimeout=20000;server.headersTimeout=10000;
server.listen(port,'127.0.0.1',()=>console.log(`AI Act Local: ${origin}\nLos expedientes se guardan en tu ordenador. Ctrl+C para cerrar.`));
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>{server.close();void vite?.close();});
