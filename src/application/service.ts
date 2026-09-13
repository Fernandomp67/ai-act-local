import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { answerSchema, idSchema, observationSchema, proposalSchema, useCaseSchema, valueSchema, dateSchema, type Assessment, type Value } from '../domain/model';
import { catalog } from '../engine/catalog';
import { evaluate, nextQuestions, validateValue } from '../engine/evaluate';
import { Store } from '../storage/store';
export const mutationSchema=z.discriminatedUnion('action',[
  z.object({action:z.literal('case.add'),name:z.string().trim().min(1).max(150),description:z.string().max(1000).default('')}).strict(),
  z.object({action:z.literal('case.rename'),caseId:idSchema,name:z.string().trim().min(1).max(150)}).strict(),
  z.object({action:z.literal('case.remove'),caseId:idSchema}).strict(),
  z.object({action:z.literal('answer'),caseId:idSchema,questionId:idSchema,value:valueSchema,evidenceIds:z.array(idSchema).max(30).default([]),admittedBy:z.string().min(1).max(150).default('Usuario local')}).strict(),
  z.object({action:z.literal('evidence.import'),observations:z.array(observationSchema).max(200),proposals:z.array(proposalSchema).max(200).default([])}).strict(),
  z.object({action:z.literal('proposal.resolve'),proposalId:idSchema,accept:z.boolean()}).strict(),
  z.object({action:z.literal('date'),evaluationDate:dateSchema}).strict(),
  z.object({action:z.literal('compliance'),caseId:idSchema,obligationId:idSchema,status:z.enum(['UNKNOWN','PLANNED','DECLARED_DONE','VERIFIED']),evidenceIds:z.array(idSchema).max(30).default([]),note:z.string().max(2000).default('')}).strict(),
]);
export function event(a:Assessment,type:string,detail:string){a.events.push({at:new Date().toISOString(),type,detail});}
function prune(a:Assessment){const activeOrg=new Set<string>();for(const c of a.cases){const q=nextQuestions(a,c.id);q.active.filter(x=>x.scope==='ORG').forEach(x=>activeOrg.add(x.id));for(const id of q.inactive){if(c.answers[id]){event(a,'ANSWER_INVALIDATED',`${c.id}:${id}:${JSON.stringify(c.answers[id])}`);delete c.answers[id];}}}for(const id of Object.keys(a.organisationAnswers))if(!activeOrg.has(id)&&a.cases.length){event(a,'ANSWER_INVALIDATED',`organisation:${id}:${JSON.stringify(a.organisationAnswers[id])}`);delete a.organisationAnswers[id];}}
function answer(a:Assessment,caseId:string,id:string,value:Value,evidenceIds:string[],admittedBy:string){
  const c=a.cases.find(x=>x.id===caseId);if(!c)throw new Error('Caso inexistente');
  const q=nextQuestions(a,caseId).active.find(x=>x.id===id);if(!q)throw new Error('Esta pregunta no está activa para el caso; responde primero a sus antecedentes');
  const v=validateValue(id,value);const target=q.scope==='ORG'?a.organisationAnswers:c.answers;
  for(const e of evidenceIds)if(!a.observations.some(x=>x.id===e && (!x.caseId||x.caseId===caseId)))throw new Error('Evidencia inexistente o de otro caso');
  if(target[id]){
    event(a,'ANSWER_CHANGED',`${caseId}:${id}:previous=${JSON.stringify(target[id])}`);
    // Purpose/acquisition changes require reconfirmation of conditional conclusions, even when the same branch remains visible.
    if(['USE-001','SYS-001','SYS-003','SYS-004','FUNC-001','HR-001','EDU-001','ESS-001','BIO-001','LAW-001','MIG-001','JUST-001','A6-001','A6-006','A6-007','ORG-001','ORG-005'].includes(id)){
      const affected=q.scope==='ORG'?a.cases:[c];
      for(const ac of affected){for(const other of Object.keys(ac.answers))if(other!==id&&!catalog.base.includes(other)){event(a,'ANSWER_INVALIDATED',`${ac.id}:${other}:${JSON.stringify(ac.answers[other])}`);delete ac.answers[other];}}
    }
  }
  target[id]=answerSchema.parse({value:v,provenance:'DECLARED',evidenceIds,admittedBy,recordedAt:new Date().toISOString()});
  // A manual confirmation is a declaration linked to evidence, never a claim of machine verification.
  for(const key of Object.keys(a.compliance)){if(q.scope==='ORG'||key.startsWith(`${caseId}:`)){event(a,'COMPLIANCE_INVALIDATED',`${key}:${JSON.stringify(a.compliance[key])}`);delete a.compliance[key];}}
  event(a,'ANSWER_CREATED',`${caseId}:${id}`);prune(a);
}
export async function mutate(store:Store,id:string,version:number,input:unknown){const m=mutationSchema.parse(input);return store.update(id,version,a=>{
  if(m.action==='case.add'){a.cases.push(useCaseSchema.parse({id:randomUUID(),name:m.name,description:m.description,answers:{}}));event(a,'CASE_CREATED',m.name);}
  if(m.action==='case.rename'){const c=a.cases.find(x=>x.id===m.caseId);if(!c)throw new Error('Caso inexistente');c.name=m.name;event(a,'CASE_RENAMED',c.id);}
  if(m.action==='case.remove'){const c=a.cases.find(x=>x.id===m.caseId);if(!c)throw new Error('Caso inexistente');event(a,'CASE_REMOVED',JSON.stringify(c));a.cases=a.cases.filter(x=>x.id!==m.caseId);a.observations=a.observations.map(x=>x.caseId===m.caseId?{...x,caseId:undefined}:x);a.proposals=a.proposals.filter(x=>x.caseId!==m.caseId);for(const k of Object.keys(a.compliance))if(k.startsWith(`${m.caseId}:`))delete a.compliance[k];}
  if(m.action==='answer')answer(a,m.caseId,m.questionId,m.value,m.evidenceIds,m.admittedBy);
  if(m.action==='date'){a.evaluationDate=m.evaluationDate;event(a,'DATE_CHANGED',m.evaluationDate);}
  if(m.action==='evidence.import'){
    for(const ob of m.observations){if(a.observations.some(x=>x.id===ob.id))throw new Error(`Evidencia duplicada ${ob.id}`);if(ob.caseId&&!a.cases.some(x=>x.id===ob.caseId))throw new Error('Caso de evidencia inexistente');a.observations.push(ob);}
    for(const proposal of m.proposals){if(a.proposals.some(x=>x.id===proposal.id)||proposal.status!=='PENDING')throw new Error('Propuesta duplicada o ya resuelta');if(!a.cases.some(x=>x.id===proposal.caseId))throw new Error('Caso de propuesta inexistente');validateValue(proposal.questionId,proposal.value);for(const e of proposal.evidenceIds)if(!a.observations.some(x=>x.id===e&&(!x.caseId||x.caseId===proposal.caseId)))throw new Error('Evidencia de propuesta inexistente');a.proposals.push(proposal);}
    event(a,'EVIDENCE_IMPORTED',`${m.observations.length} observaciones, ${m.proposals.length} propuestas`);
  }
  if(m.action==='proposal.resolve'){
    const p=a.proposals.find(x=>x.id===m.proposalId);if(!p||p.status!=='PENDING')throw new Error('Propuesta no disponible');
    if(m.accept){if(p.evidenceIds.some(id=>a.observations.find(x=>x.id===id)?.provenance==='CONFLICTING'))throw new Error('Resuelve las evidencias contradictorias antes de aceptar; responde directamente con evidencia coherente');answer(a,p.caseId,p.questionId,p.value,p.evidenceIds,'Usuario: confirma propuesta');}
    p.status=m.accept?'ACCEPTED':'REJECTED';event(a,'PROPOSAL_RESOLVED',`${p.id}:${p.status}`);
  }
  if(m.action==='compliance'){
    const r=evaluate(a);const found=r.cases.find(x=>x.id===m.caseId)?.findings.find(x=>x.id===m.obligationId)??r.organisationFindings.find(x=>x.id===m.obligationId);
    if(!found)throw new Error('Obligación no activa');
    if(m.status==='VERIFIED'&&(!m.evidenceIds.length||!m.note.trim()))throw new Error('Una verificación necesita evidencia y justificación');
    if(m.evidenceIds.some(id=>!a.observations.some(x=>x.id===id&&['OBSERVED','DECLARED'].includes(x.provenance))))throw new Error('Evidencia insuficiente');
    a.compliance[`${m.caseId}:${m.obligationId}`]={status:m.status,evidenceIds:m.evidenceIds,note:m.note};event(a,'COMPLIANCE_UPDATED',`${m.caseId}:${m.obligationId}:${m.status}`);
  }
});}
