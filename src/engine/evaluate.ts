import type { Answer, Assessment, Catalog, CaseResult, Condition, Evaluation, Fact, Finding, Trace, Value } from '../domain/model';
import { catalog as defaultCatalog, factKey } from './catalog';
import { hash, keys, matches } from './logic';
export const ENGINE_VERSION = '0.1.0';
const unique = (xs:string[]) => [...new Set(xs)].sort();
const outputKey: Record<string,string> = { role_add:'role',classification:'classification',classification_candidate:'classification_candidate',high_risk_basis:'high_risk_basis',annex_case:'annex_case',gpai_classification:'gpai_classification',warning_add:'warnings',obligation_add:'obligations' };
export function validateValue(id:string, value:Value, c:Catalog=defaultCatalog): Value {
  const q=c.questions.find(x=>x.id===id); if(!q) throw new Error(`Pregunta desconocida: ${id}`);
  const multiple = q.answer_type==='MULTI' || q.answer_type==='MULTIPLE';
  if (Array.isArray(value) !== multiple) throw new Error(`${id}: se esperaba selección ${multiple?'múltiple':'simple'}`);
  const values=Array.isArray(value)?value:[value];
  if(!values.length || values.some(v=>!q.options.some(o=>o.value===v)))throw new Error(`${id}: opción no válida`);
  if (new Set(values).size!==values.length)throw new Error(`${id}: opción duplicada`);
  if(values.length>1 && values.some(v=>['UNKNOWN','NONE','NO','OTHER','NOT_APPLICABLE'].includes(v)))throw new Error(`${id}: la opción seleccionada es exclusiva`);
  return multiple? [...values].sort():values[0];
}
export function validateAnswers(answers:Record<string,Answer>, c:Catalog=defaultCatalog) {
  for(const [id,a] of Object.entries(answers))validateValue(id,a.value,c);
}
export function infer(answers:Record<string,Answer>, c:Catalog=defaultCatalog) {
  const facts:Record<string,Value>={};
  for(const [id,a] of Object.entries(answers))facts[factKey(id)]=a.value;
  for(const key of Object.values(outputKey))facts[`state.${key}`]=[];
  const trace:Trace[]=[]; const fired=new Set<string>();
  const rules=c.rules.filter(r=>r.active).sort((a,b)=>a.code.localeCompare(b.code,'en'));
  for(let n=0;n<=rules.length;n++){
    let changed=false;
    for(const r of rules){
      if(fired.has(r.code)||matches(r.conditions,facts)!==true)continue;
      fired.add(r.code); changed=true;
      const required=keys(r.conditions);
      const dependencies=trace.filter(t=>Object.keys(t.outcome).some(k=>required.includes(`state.${outputKey[k]}`))).map(t=>t.rule);
      trace.push({rule:r.code,source:r.legal_source_id,article:[r.article,r.annex].filter(Boolean).join(' · '),outcome:r.result,facts:required.filter(k=>k.startsWith('response.')),dependencies});
      for(const [k,v] of Object.entries(r.result))if(outputKey[k]){
        const f=`state.${outputKey[k]}`;facts[f]=unique([...(facts[f] as string[]),v]);
      }
    }
    if(!changed)return {facts,trace};
  }
  throw new Error('El motor no se estabiliza; revisar el catálogo');
}
export function resolveQuestionnaire(input:Record<string,Answer>, c:Catalog=defaultCatalog) {
  validateAnswers(input,c);
  const active=new Set(c.base); let answers:Record<string,Answer>={};
  for(let n=0;n<=c.questions.length;n++){
    answers=Object.fromEntries(Object.entries(input).filter(([id])=>active.has(id)));
    const {facts}=infer(answers,c); let changed=false;
    for(const route of c.routes)if(matches(route.condition,facts)===true){
      for(const id of route.show)if(!active.has(id)){active.add(id);changed=true;}
    }
    if(!changed){
      const baseOrder=new Map(c.base.map((id,i)=>[id,i]));
      const qs=c.questions.filter(q=>active.has(q.id)).sort((a,b)=>(baseOrder.get(a.id)??1000)-(baseOrder.get(b.id)??1000));
      return {active:qs,answers,pending:qs.filter(q=>!answers[q.id]),inactive:Object.keys(input).filter(id=>!active.has(id))};
    }
  }
  throw new Error('La navegación no se estabiliza');
}
export function nextQuestions(a:Assessment,caseId:string,c:Catalog=defaultCatalog){
  const uc=a.cases.find(x=>x.id===caseId);if(!uc)throw new Error('Caso inexistente');
  return resolveQuestionnaire({...a.organisationAnswers,...uc.answers},c);
}
function traceAnswerIds(traces:Trace[], ruleCodes:string[], c:Catalog):string[]{
  const byCode=new Map(traces.map(t=>[t.rule,t])); const visited=new Set<string>();const facts=new Set<string>();
  function visit(code:string){if(visited.has(code))return;visited.add(code);const t=byCode.get(code);if(!t)return;t.facts.forEach(x=>facts.add(x));t.dependencies.forEach(visit);}
  ruleCodes.forEach(visit);return c.questions.filter(q=>facts.has(q.factKey)).map(q=>q.id).sort();
}
export function evaluateCase(a:Assessment, caseId:string,c:Catalog=defaultCatalog):CaseResult{
  const uc=a.cases.find(x=>x.id===caseId)!;const q=nextQuestions(a,caseId,c);const {facts,trace}=infer(q.answers,c);
  const values=(key:string)=>facts[`state.${key}`] as string[];
  const roles=values('role').filter(x=>x!=='REVIEW_REQUIRED');
  const classes=new Set(values('classification'));const candidate=values('classification_candidate').length>0;
  if(candidate && !classes.has('HIGH_RISK') && !classes.has('NOT_HIGH_RISK_ARTICLE_6'))classes.add('HIGH_RISK_CANDIDATE');
  const unknowns=q.active.filter(x=>{const v=q.answers[x.id]?.value;return v==='UNKNOWN'||Array.isArray(v)&&v.includes('UNKNOWN');}).map(x=>x.id);
  const warnings=[...values('warnings')];
  if(!roles.length)warnings.push('ROLE_UNDETERMINED');
  if(q.pending.length)warnings.push('INCOMPLETE_QUESTIONNAIRE');
  if(unknowns.length)warnings.push('UNKNOWN_ANSWERS');
  if(roles.some(x=>['IMPORTER','DISTRIBUTOR','PRODUCT_MANUFACTURER'].includes(x)))warnings.push('OPERATOR_COVERAGE_PARTIAL');
  if(classes.has('NOT_HIGH_RISK_ARTICLE_6'))warnings.push('ARTICLE_6_ASSESSMENT_NOT_VERIFIED');
  if(a.proposals.some(x=>x.caseId===caseId&&x.status==='PENDING'))warnings.push('UNCONFIRMED_PROPOSALS');
  if(a.observations.some(x=>x.caseId===caseId&&x.provenance==='CONFLICTING'))warnings.push('CONFLICTING_EVIDENCE');
  const scopeReview=warnings.some(x=>x.startsWith('SCOPE_REVIEW_'))||warnings.includes('AI_DEFINITION_REVIEW');
  const territorial=q.answers['ORG-001']?.value==='OUTSIDE_EU_EEA' && q.answers['ORG-005']?.value!=='YES';
  if(territorial)warnings.push('TERRITORIAL_SCOPE_REVIEW');
  const historical=a.evaluationDate<c.dates.SNAPSHOT_FROM;
  if(historical)warnings.push('HISTORICAL_SNAPSHOT_UNSUPPORTED');
  if(q.answers['SCOPE-003']?.value==='REAL_WORLD_TESTING')warnings.push('REAL_WORLD_TESTING_REVIEW');
  if(q.answers['SCOPE-005']?.value==='YES')warnings.push('OPEN_SOURCE_SCOPE_REVIEW');
  if(q.answers['GPAI-002']?.value==='UNKNOWN')warnings.push('GPAI_EXEMPTION_UNKNOWN');
  const findings:Finding[]=[];
  for(const id of values('obligations')){
    const o=c.obligations.find(x=>x.id===id);if(!o)throw new Error(`Obligación desconocida ${id}`);
    const reviewAction=/STOP-REVIEW|SCOPE-REVIEW/.test(id);
    if(!reviewAction&&!o.operator_roles.some(r=>roles.includes(r)||r==='ALL'||r==='ANY'))continue;
    const trigger=trace.filter(t=>t.outcome.obligation_add===id);const source=c.sources.find(s=>s.source_id===o.legal_source_id)!;
    let effectiveFrom=o.effective_from;
    const highDependent=trigger.some(t=>keys(c.rules.find(r=>r.code===t.rule)!.conditions).includes('state.classification'));
    if(highDependent&&values('high_risk_basis').length)effectiveFrom=values('high_risk_basis').map(b=>c.dates[b]).filter(Boolean).sort()[0]??effectiveFrom;
    if(reviewAction){ const dates=trigger.map(t=>c.rules.find(r=>r.code===t.rule)?.effective_from).filter((x):x is string=>!!x);if(dates.length)effectiveFrom=dates.sort()[0]; }
    const transitionRelevant=highDependent||id.startsWith('OBL-GPAI-')||id.startsWith('OBL-TR-');
    const temporal=historical?'REVIEW_REQUIRED':a.evaluationDate<effectiveFrom?'FUTURE':transitionRelevant&&warnings.includes('TRANSITION_REVIEW')?'TRANSITION_REVIEW':'CURRENT';
    const state=a.compliance[`${caseId}:${id}`];
    const status=scopeReview||territorial?'REQUIRES_REVIEW':state?.status??'UNKNOWN';
    const ruleCodes=trigger.map(x=>x.rule).sort(); const answerIds=traceAnswerIds(trace,ruleCodes,c);
    findings.push({id,title:o.title,article:o.article,source:source.title,sourceUrl:source.url,legalStatus:c.status,temporal,effectiveFrom,status,priority:o.priority,action:o.action_template,evidence:o.evidence_template,rules:ruleCodes,answerIds,evidenceIds:unique(answerIds.flatMap(qid=>q.answers[qid]?.evidenceIds??[]).concat(state?.evidenceIds??[])),kind:reviewAction?'RECOMMENDATION':'OBLIGATION'});
  }
  if(findings.some(f=>f.id.startsWith('OBL-TR-')))classes.add('TRANSPARENCY_OBLIGATIONS');
  if(!classes.size)classes.add(q.pending.length||unknowns.length||!roles.length?'INSUFFICIENT_INFORMATION':'MINIMAL_OR_OTHER_RISK');
  const related:string[]=[];
  if(q.answers['DATA-001']?.value==='YES')related.push('Protección de datos (RGPD / normativa nacional): no evaluada');
  const use=q.answers['USE-001']?.value??[];
  if(use.includes('HR'))related.push('Derecho laboral: no evaluado');
  if(facts[factKey('TR-003')] && !['NONE','UNKNOWN'].includes(String(facts[factKey('TR-003')])))related.push('Propiedad intelectual y derechos de imagen: no evaluados');
  if(['HEALTH','CREDIT','INSURANCE','PUBLIC_SERVICES'].some(x=>use.includes(x)))related.push('Normativa sectorial: no evaluada');
  const factList:Fact[]=Object.entries(q.answers).sort(([a],[b])=>a.localeCompare(b,'en')).map(([id,v])=>({key:factKey(id),value:v.value,questionId:id,provenance:v.provenance,evidenceIds:v.evidenceIds}));
  return {id:caseId,name:uc.name,scope:scopeReview||territorial?'REVIEW_REQUIRED':'ASSESSMENT_PENDING_VALIDATION',roles,classifications:unique([...classes]),annexCases:values('annex_case'),highRiskBases:values('high_risk_basis'),gpai:values('gpai_classification'),facts:factList,trace,findings:findings.sort((a,b)=>a.id.localeCompare(b.id,'en')),pendingQuestions:q.pending.map(x=>x.id),unknownQuestions:unknowns,warnings:unique(warnings),relatedDomains:related};
}
export function evaluate(a:Assessment,c:Catalog=defaultCatalog):Evaluation{
  const cases=a.cases.map(x=>evaluateCase(a,x.id,c));const orgFindings:Finding[]=[];
  for(const uc of cases){const org=uc.findings.filter(f=>f.id==='OBL-AI-LITERACY-001'); for(const o of org)if(!orgFindings.some(x=>x.id===o.id))orgFindings.push(o); uc.findings=uc.findings.filter(f=>f.id!=='OBL-AI-LITERACY-001');}
  return {schemaVersion:'1.0',engineVersion:ENGINE_VERSION,catalogVersion:c.version,catalogHash:hash(c),legalSnapshot:c.legalSnapshot,legalStatus:c.status,evaluationDate:a.evaluationDate,assessmentId:a.id,cases,organisationFindings:orgFindings,coverage:c.coverage,warnings:['Catálogo jurídico en borrador; resultados orientativos pendientes de revisión.',...(a.evaluationDate<c.dates.SNAPSHOT_FROM?['La fecha solicitada es anterior al snapshot: no se ofrece una reconstrucción histórica válida.']:[]),...(a.cases.length?[]:['No se han confirmado casos de uso.']), 'No se actualiza la normativa automáticamente. Verifica la vigencia antes de utilizar el informe.']};
}
