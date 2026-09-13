import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { catalog, projectRoot, readSeed, referenceKey } from './catalog';
import { keys } from './logic';
import { infer, validateValue } from './evaluate';
import type { Answer, Catalog } from '../domain/model';
export function validateCatalog(c:Catalog=catalog){
  const errors:string[]=[];
  const duplicate=(items:string[],kind:string)=>{const seen=new Set<string>();for(const id of items){if(seen.has(id))errors.push(`${kind}: duplicado ${id}`);seen.add(id);}};
  duplicate(c.questions.map(x=>x.id),'Preguntas');duplicate(c.rules.map(x=>x.code),'Reglas');duplicate(c.obligations.map(x=>x.id),'Obligaciones');duplicate(c.routes.map(x=>x.id),'Rutas');
  const qids=new Set(c.questions.map(x=>x.id));const validKeys=new Set(c.questions.map(x=>x.factKey));
  const states=new Set(['state.role','state.classification','state.classification_candidate','state.high_risk_basis','state.annex_case','state.gpai_classification']);
  const reachable=new Set(c.base);c.routes.forEach(r=>r.show.forEach(q=>reachable.add(q)));
  for(const q of c.questions){if(!reachable.has(q.id)&&q.id!=='SCOPE-006')errors.push(`Pregunta inaccesible: ${q.id}`);duplicate(q.options.map(o=>o.value),q.id);}
  for(const id of c.base)if(!qids.has(id))errors.push(`Base desconocida ${id}`);
  for(const r of c.routes){for(const id of r.show)if(!qids.has(id))errors.push(`Ruta ${r.id}: pregunta ${id} desconocida`);for(const key of keys(r.condition))if(!validKeys.has(key)&&!states.has(key))errors.push(`Ruta ${r.id}: hecho ${key} desconocido`);}
  for(const r of c.rules){for(const k of keys(r.conditions))if(!validKeys.has(k)&&!states.has(k))errors.push(`Regla ${r.code}: hecho ${k} desconocido`);if(!c.sources.some(s=>s.source_id===r.legal_source_id))errors.push(`Fuente desconocida ${r.code}`);if(r.result.obligation_add&&!c.obligations.some(o=>o.id===r.result.obligation_add))errors.push(`Obligación desconocida ${r.code}`);}
  for(const o of c.obligations)if(!c.sources.some(s=>s.source_id===o.legal_source_id))errors.push(`Fuente de obligación desconocida: ${o.id}`);
  for(const entry of readSeed('manifest').files){const data=readFileSync(path.join(projectRoot,'legal/catalogs/seed-v0.2',entry.name));if(createHash('sha256').update(data).digest('hex')!==entry.sha256)errors.push(`Hash original incorrecto: ${entry.name}`);}
  return {valid:!errors.length,errors,version:c.version,status:c.status,counts:{questions:c.questions.length,routes:c.routes.length,rules:c.rules.filter(x=>x.active).length,obligations:c.obligations.length},notes:['SCOPE-006 heredada está deshabilitada deliberadamente.','Integridad técnica no equivale a validación jurídica.']};
}
export function seedScenarioAudit(){
  // These are a compatibility audit, not a claim that altered expectations pass unchanged.
  const results=[];
  for(const s of readSeed('golden_scenarios').scenarios){
    const derived=Object.keys(s.answers).filter(k=>!catalog.questions.some(q=>q.id===k));
    if(derived.length){results.push({id:s.scenario_id,kind:'MODULE_FIXTURE',status:'REQUIRES_MIGRATION',reason:`Inyecta estados derivados: ${derived.join(', ')}`});continue;}
    const answers:Record<string,Answer>={};
    for(const [k,v] of Object.entries(s.answers)){validateValue(k,v as any);answers[k]={value:v as any,provenance:'DECLARED',evidenceIds:[],admittedBy:'fixture',recordedAt:'2026-09-13T00:00:00.000Z'};}
    const {facts}=infer(answers);const failed:string[]=[];
    for(const [key,expected] of Object.entries(s.expected)){
      const map:Record<string,string>={roles_contains:'role',classification_not:'classification',classification:'classification',classification_candidate:'classification_candidate',annex_case:'annex_case',obligations_contains:'obligations',obligations_not:'obligations',warnings_contains:'warnings',gpai_classification:'gpai_classification'};
      if(!map[key])continue;const value=facts[referenceKey(map[key])]??[];const e=Array.isArray(expected)?expected:[expected];
      if(e.some(x=>key.endsWith('_not')?value.includes(x as string):!value.includes(x as string)))failed.push(key);
    }
    results.push({id:s.scenario_id,kind:'ANSWER_FIXTURE',status:failed.length?'EXPECTATION_CHANGED':'COMPATIBLE',reason:failed.join(', ')});
  }
  return {results,note:'Los cambios frente a v0.2 son visibles. Los escenarios ejecutables nuevos se verifican con npm test; no se confunde compatibilidad con validación jurídica.'};
}
