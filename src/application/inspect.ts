import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import http from 'node:http';
import https from 'node:https';
import type { Observation } from '../domain/model';
const patterns:[RegExp,string][]=[
  [/\b(openai|anthropic|langchain|ollama|huggingface|generative-ai|ai-sdk)\b/i,'Integración potencial de IA'],
  [/\b(chatbot|chat-completion|chatcompletion|assistant|asistente virtual)\b/i,'Posible asistente o interacción conversacional'],
  [/\b(candidate|candidato|recruit|curriculum|resume.score|cv.filter)\b/i,'Proceso de selección o evaluación de personas'],
  [/\b(face.recognition|biometric|biom[eé]tri|emotion.recognition)\b/i,'Posible uso biométrico o de reconocimiento de emociones'],
];
function observations(text:string,source:'WEB'|'CODE',locator:string):Observation[]{
  const out:Observation[]=[];
  for(const [pattern,title] of patterns){const lines=text.split('\n');const hits=lines.map((s,i)=>pattern.test(s)?i+1:0).filter(Boolean).slice(0,5);if(!hits.length)continue;
    out.push({id:randomUUID(),title,description:`Indicio textual en ${hits.length} línea(s). No demuestra uso en producción ni determina el rol o el riesgo. Revisar el contexto y confirmar mediante preguntas.`,source,locator:source==='CODE'?`${locator}:${hits.join(',')}`:locator,collectedAt:new Date().toISOString(),method:'Inspección textual estática; no ejecuta código ni JavaScript',provenance:'INFERRED',contentHash:createHash('sha256').update(text).digest('hex')});
  }return out;
}
export async function inspectRepo(target:string){
  const root=await fs.realpath(target);if(!(await fs.stat(root)).isDirectory())throw new Error('Se esperaba una carpeta');
  const ignored=new Set(['.git','.codex','.agents','node_modules','dist','build','coverage','vendor','audits','data','uploads','secrets','credentials','.ssh','.aws','.venv','venv','__pycache__']);
  const out:Observation[]=[];let scanned=0;let limited=false;const errors:string[]=[];
  async function visit(dir:string,depth:number){if(depth>12){limited=true;return;}for(const f of await fs.readdir(dir,{withFileTypes:true})){
    if(scanned>=1200||out.length>=200){limited=true;return;}if(f.isSymbolicLink()||f.name.startsWith('.')||ignored.has(f.name)||/secret|credential|password|token|\.env|\.pem$|\.key$|lock\.(json|yaml)$|package-lock/i.test(f.name))continue;
    const p=path.join(dir,f.name);if(f.isDirectory()){await visit(p,depth+1);continue;}
    if(!/\.(tsx?|jsx?|mjs|cjs|py|html|vue|svelte|md|json|yaml|yml)$/i.test(f.name))continue;
    try{const s=await fs.lstat(p);if(s.isSymbolicLink()||s.size>250000){limited=true;continue;}const text=await fs.readFile(p,'utf8');scanned++;out.push(...observations(text,'CODE',path.relative(root,p).split(path.sep).join('/')));}catch{errors.push(path.relative(root,p));}
  }}
  await visit(root,0);return {observations:out.slice(0,200),proposals:[],summary:{scanned,limited,errors,note:'Solo indicios estáticos. Los archivos ocultos, generados, grandes y potencialmente secretos se excluyen. Confirma los usos; no detectar IA no prueba su ausencia.'}};
}
function privateAddress(ip:string){
  if(ip.includes(':'))return true; // Conservative: IPv6 inspection requires external browser; avoids mapped/private variants.
  const [a,b]=ip.split('.').map(Number);return a===0||a===10||a===127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a>=224;
}
async function download(url:URL,allowLocal:boolean,redirects=0):Promise<{body:string;url:string}>{
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error('URL no permitida');
  const hostname=url.hostname.replace(/^\[|\]$/g,'');const resolved=isIP(hostname)?[{address:hostname,family:isIP(hostname)}]:await lookup(hostname,{all:true});
  if(!resolved.length||!allowLocal&&resolved.some(x=>privateAddress(x.address)))throw new Error('Destino local o reservado: utiliza --allow-local solo para un servidor propio autorizado.');
  const address=resolved[0];
  return new Promise((resolve,reject)=>{
    const client=url.protocol==='https:'?https:http;
    const req=client.get(url,{headers:{'User-Agent':'AI-Act-Local/0.1 (read-only)','Accept':'text/html,text/plain'},lookup:((_host:any,opts:any,cb:any)=>opts.all?cb(null,[address]):cb(null,address.address,address.family)) as any},res=>{
      if(res.statusCode&&res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();if(redirects>=3){reject(new Error('Demasiadas redirecciones'));return;}download(new URL(res.headers.location,url),allowLocal,redirects+1).then(resolve,reject);return;}
      if(res.statusCode!==200){res.resume();reject(new Error(`HTTP ${res.statusCode}`));return;}
      if(!/text\/(html|plain)|application\/xhtml\+xml/.test(res.headers['content-type']??'')){res.resume();reject(new Error('Solo se admite HTML o texto'));return;}
      const chunks:Buffer[]=[];let size=0;res.on('data',chunk=>{size+=chunk.length;if(size>1_000_000){req.destroy(new Error('Página demasiado grande'));return;}chunks.push(chunk);});res.on('end',()=>resolve({body:Buffer.concat(chunks).toString('utf8'),url:url.toString()}));res.on('error',reject);
    });req.setTimeout(10000,()=>req.destroy(new Error('Tiempo de espera agotado')));req.on('error',reject);
  });
}
export async function inspectWeb(target:string,allowLocal=false){const page=await download(new URL(target),allowLocal);return {observations:observations(page.body,'WEB',page.url),proposals:[],summary:{url:page.url,pages:1,javascriptExecuted:false,note:'Solo se ha leído el HTML de esta página, sin enviar formularios. Un agente con navegador puede aportar más evidencias. No encontrar indicios no descarta usos internos de IA.'}};}
