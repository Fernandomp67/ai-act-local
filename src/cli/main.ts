import { readFile } from 'node:fs/promises';
import { Store } from '../storage/store';
import { mutate } from '../application/service';
import { evaluate, nextQuestions } from '../engine/evaluate';
import { catalog } from '../engine/catalog';
import { validateCatalog, seedScenarioAudit } from '../engine/validate';
import { compareResults, exportReport } from '../reports/generate';
import { inspectRepo, inspectWeb } from '../application/inspect';
const raw=process.argv.slice(2);const args:string[]=[];const flags:Record<string,string>={};
for(let i=0;i<raw.length;i++){if(raw[i].startsWith('--')){const name=raw[i].slice(2);flags[name]=raw[i+1]&&!raw[i+1].startsWith('--')?raw[++i]:'true';}else args.push(raw[i]);}
const store=new Store(flags.root);const out=(x:unknown)=>process.stdout.write(JSON.stringify(x,null,2)+'\n');
const required=(key:string)=>{if(!flags[key]||flags[key]==='true')throw new Error(`Falta --${key}`);return flags[key];};
const jsonInput=async()=>JSON.parse(flags.file?await readFile(flags.file,'utf8'):required('json'));
async function main(){
  const [command,sub]=args;
  if(!command||command==='help'||flags.help){out({name:'AI Act Local',version:'0.1.0',usage:[
    'init --name "Mi diagnóstico" --date YYYY-MM-DD [--mode QUESTIONNAIRE|INSPECTION|MIXED] [--organisation Nombre] [--target URL]',
    'list', 'show --id ID', 'cases add --id ID --name Nombre', 'cases remove --id ID --case CASE_ID',
    'questions next --id ID --case CASE_ID', 'answers set --id ID --case CASE_ID --question Q_ID --value YES',
    'answers set --id ID --case CASE_ID --question USE-001 --value \'["HR"]\'',
    'observations import --id ID --file observations.json', 'proposals accept|reject --id ID --proposal P_ID',
    'inspect repo --target /path/to/project', 'inspect web --target https://example.com [--allow-local]',
    'evaluate --id ID', 'report --id ID --format md|html|pdf|docx|json', 'seal --id ID',
    'revisions list --id ID', 'reproduce --id ID --revision REVISION_ID', 'revise --id ID',
    'compare --before ID --after ID', 'catalog validate', 'catalog show', 'scenarios test',
    'mutate --id ID --file mutation.json', 'Todas las salidas son JSON. --root cambia la carpeta local de expedientes.',
  ]});return;}
  if(command==='init'){out(await store.create({name:required('name'),evaluationDate:required('date'),organisation:flags.organisation??'',mode:flags.mode??'QUESTIONNAIRE',target:flags.target??''}));return;}
  if(command==='list'){out((await store.list()).map(({id,name,organisation,mode,status,version})=>({id,name,organisation,mode,status,version})));return;}
  if(command==='catalog'){if(sub==='validate'){const r=validateCatalog();out(r);if(!r.valid)process.exitCode=1;}else out(catalog);return;}
  if(command==='scenarios'){out(seedScenarioAudit());return;}
  if(command==='inspect'){out(sub==='repo'?await inspectRepo(required('target')):sub==='web'?await inspectWeb(required('target'),flags['allow-local']==='true'):(()=>{throw new Error('Usa inspect repo o inspect web');})());return;}
  if(command==='compare'){out(compareResults((await store.bundle(required('before'))).result,(await store.bundle(required('after'))).result));return;}
  const id=required('id');const a=await store.read(id);const version=flags.version?Number(flags.version):a.version;
  if(command==='show'){out(a);return;}
  if(command==='cases'){out(await mutate(store,id,version,sub==='add'?{action:'case.add',name:required('name')}:{action:'case.remove',caseId:required('case')}));return;}
  if(command==='questions'){const q=nextQuestions(a,required('case'),(await store.bundle(id)).catalog);out({next:q.pending[0]??null,pending:q.pending,activeIds:q.active.map(x=>x.id),answers:q.answers,inactive:q.inactive});return;}
  if(command==='answers'){const value=required('value');out(await mutate(store,id,version,{action:'answer',caseId:required('case'),questionId:required('question'),value:value.startsWith('[')?JSON.parse(value):value,admittedBy:flags.by??'Usuario mediante CLI'}));return;}
  if(command==='observations'){const input=await jsonInput();out(await mutate(store,id,version,{action:'evidence.import',observations:input.observations,proposals:input.proposals??[]}));return;}
  if(command==='proposals'){if(!['accept','reject'].includes(sub))throw new Error('Usa proposals accept o reject');out(await mutate(store,id,version,{action:'proposal.resolve',proposalId:required('proposal'),accept:sub==='accept'}));return;}
  if(command==='mutate'){out(await mutate(store,id,version,await jsonInput()));return;}
  if(command==='evaluate'){out((await store.bundle(id)).result);return;}
  if(command==='seal'){out(await store.seal(id,version));return;}
  if(command==='revise'){out(await store.fork(id));return;}
  if(command==='revisions'){out(await store.revisions(id));return;}
  if(command==='reproduce'){const s=await store.snapshot(id,required('revision'));out({verified:true,digest:s.digest,evaluation:s.evaluation});return;}
  if(command==='report'){const format=flags.format??'md';const result=(await store.bundle(id)).result;const buffer=await exportReport(a,result,format);const file=await store.writeReport(id,`report.${format}`,buffer);out({file,bytes:buffer.length,format});return;}
  throw new Error('Comando desconocido. Ejecuta npm run cli -- help');
}
main().catch(e=>{process.stderr.write(JSON.stringify({error:e.message,details:e.issues??undefined})+'\n');process.exitCode=1;});
