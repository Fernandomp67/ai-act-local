import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { assessmentSchema, createSchema, idSchema, type Assessment } from '../domain/model';
import { catalog, projectRoot } from '../engine/catalog';
import { canonical, hash } from '../engine/logic';
import { evaluate, ENGINE_VERSION } from '../engine/evaluate';
export class Conflict extends Error {}
export class Store {
  readonly root:string;
  constructor(root=process.env.AI_ACT_AUDITS_DIR??path.join(projectRoot,'audits')) { this.root=path.resolve(root); }
  private async safeRoot(){
    // Refuse symlinks at every existing segment, including ancestors supplied by configuration.
    let current=path.parse(this.root).root;
    for(const part of this.root.slice(current.length).split(path.sep).filter(Boolean)){
      current=path.join(current,part);
      try{const stat=await fs.lstat(current);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('La ruta de expedientes contiene un enlace o no es una carpeta');}
      catch(e:any){if(e.code!=='ENOENT')throw e;await fs.mkdir(current);}
    }
  }
  async folder(id:string){idSchema.parse(id);await this.safeRoot();const p=path.join(this.root,id);try{if((await fs.lstat(p)).isSymbolicLink())throw new Error('Expediente enlazado no permitido');}catch(e:any){if(e.code!=='ENOENT')throw e;}return p;}
  async list(){await this.safeRoot(); const out:Assessment[]=[];for(const e of await fs.readdir(this.root,{withFileTypes:true})){if(e.isDirectory()&&idSchema.safeParse(e.name).success){try{out.push(await this.read(e.name));}catch{/* Ignore non-assessment folders; never follow symlinks. */}}}return out.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  async read(id:string):Promise<Assessment>{const p=path.join(await this.folder(id),'assessment.json');if((await fs.lstat(p)).isSymbolicLink())throw new Error('Archivo enlazado no permitido');return assessmentSchema.parse(JSON.parse(await fs.readFile(p,'utf8')));}
  private async atomic(p:string,value:unknown){const tmp=`${p}.${randomUUID()}.tmp`;await fs.writeFile(tmp,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});try{await fs.rename(tmp,p);}catch(e){await fs.unlink(tmp).catch(()=>{});throw e;}}
  async create(input:unknown){const v=createSchema.parse(input);const id=randomUUID();const now=new Date().toISOString();const a:Assessment={schemaVersion:'1.0',id,...v,status:'DRAFT',version:0,createdAt:now,updatedAt:now,organisationAnswers:{},cases:[],observations:[],proposals:[],compliance:{},events:[{at:now,type:'CREATED',detail:v.mode}]};const p=await this.folder(id);await fs.mkdir(p,{mode:0o700});await this.atomic(path.join(p,'assessment.json'),a);return a;}
  async update(id:string,expected:number,fn:(a:Assessment)=>void|Promise<void>){
    const p=await this.folder(id);const lock=path.join(p,'.write-lock');try{await fs.mkdir(lock);}catch{throw new Conflict('El expediente está siendo actualizado. Recarga y vuelve a intentarlo.');}
    try{const a=await this.read(id);if(a.version!==expected)throw new Conflict('El expediente cambió en otra ventana. Recarga antes de guardar.');if(a.status==='SEALED')throw new Conflict('Revisión sellada: crea una nueva revisión para editar.');await fn(a);a.version++;a.updatedAt=new Date().toISOString();assessmentSchema.parse(a);await this.atomic(path.join(p,'assessment.json'),a);return a;}
    finally{await fs.rmdir(lock);}
  }
  async seal(id:string,expected:number){let snapshotId='';const a=await this.update(id,expected,async a=>{
    const p=await this.folder(id);const result=evaluate(a);const payload={assessment:structuredClone(a),catalog:structuredClone(catalog),evaluation:result,engineVersion:ENGINE_VERSION};
    const digest=hash(payload);snapshotId=digest.slice(0,24);const revisions=path.join(p,'revisions');await this.realDirectory(revisions);const destination=path.join(revisions,`${snapshotId}.json`);
    await fs.writeFile(destination,JSON.stringify({schemaVersion:'1.0',digest,...payload},null,2)+'\n',{flag:'wx',mode:0o600});a.status='SEALED';a.events.push({at:new Date().toISOString(),type:'SEALED',detail:snapshotId});
  });return {assessment:a,snapshotId};}
  async revisions(id:string){const p=path.join(await this.folder(id),'revisions');try{await this.realDirectory(p);return (await fs.readdir(p)).filter(n=>/^[a-f0-9]{24}\.json$/.test(n)).map(n=>n.slice(0,-5));}catch(e:any){if(e.code==='ENOENT')return [];throw e;}}
  async snapshot(id:string,revision:string,reproduce=true){if(!/^[a-f0-9]{24}$/.test(revision))throw new Error('Revisión inválida');const p=path.join(await this.folder(id),'revisions');await this.realDirectory(p);const file=path.join(p,`${revision}.json`);if((await fs.lstat(file)).isSymbolicLink())throw new Error('Revisión enlazada no permitida');const s=JSON.parse(await fs.readFile(file,'utf8'));const {digest,schemaVersion,...payload}=s;if(schemaVersion!=='1.0'||hash(payload)!==digest)throw new Error('La integridad de la revisión no coincide');assessmentSchema.parse(s.assessment);if(reproduce){if(s.engineVersion!==ENGINE_VERSION)throw new Error(`Reproducción requiere motor ${s.engineVersion}`);if(canonical(evaluate(s.assessment,s.catalog))!==canonical(s.evaluation))throw new Error('La reproducción no coincide con el resultado sellado');}return s;}
  async bundle(id:string){const a=await this.read(id);if(a.status==='SEALED'){const revision=a.events.findLast(e=>e.type==='SEALED')?.detail;if(!revision)throw new Error('Falta la revisión sellada');const s=await this.snapshot(id,revision,false);return {assessment:a,result:s.evaluation as ReturnType<typeof evaluate>,catalog:s.catalog as typeof catalog};}return {assessment:a,result:evaluate(a),catalog};}
  async fork(id:string){const old=await this.read(id);const a=await this.create({name:`${old.name} — revisión`.slice(0,150),organisation:old.organisation,mode:old.mode,evaluationDate:old.evaluationDate,target:old.target});return this.update(a.id,0,next=>{next.cases=structuredClone(old.cases);next.organisationAnswers=structuredClone(old.organisationAnswers);next.observations=structuredClone(old.observations);next.proposals=structuredClone(old.proposals);next.compliance=structuredClone(old.compliance);next.events.push({at:new Date().toISOString(),type:'REVISION_OF',detail:id});});}
  async realDirectory(p:string){try{const s=await fs.lstat(p);if(s.isSymbolicLink()||!s.isDirectory())throw new Error('Carpeta enlazada no permitida');}catch(e:any){if(e.code!=='ENOENT')throw e;await fs.mkdir(p,{mode:0o700});}}
  async writeReport(id:string,filename:string,data:Buffer|string){if(!/^report\.(md|html|pdf|docx|json)$/.test(filename))throw new Error('Formato no permitido');const dir=path.join(await this.folder(id),'reports');await this.realDirectory(dir);const target=path.join(dir,filename);try{if((await fs.lstat(target)).isSymbolicLink())throw new Error('Informe enlazado no permitido');}catch(e:any){if(e.code!=='ENOENT')throw e;}const tmp=path.join(dir,`${randomUUID()}.tmp`);await fs.writeFile(tmp,data,{flag:'wx',mode:0o600});await fs.rename(tmp,target);return target;}
}
