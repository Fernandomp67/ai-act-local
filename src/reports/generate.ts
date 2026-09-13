import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import type { Assessment, Evaluation, Finding } from '../domain/model';
export const labels:Record<string,string>={
  HIGH_RISK:'Alto riesgo',HIGH_RISK_CANDIDATE:'Posible alto riesgo',NOT_HIGH_RISK_ARTICLE_6:'Excepción del art. 6 declarada',POTENTIALLY_PROHIBITED:'Posible práctica prohibida',PROHIBITED:'Práctica prohibida',TRANSPARENCY_OBLIGATIONS:'Obligaciones de transparencia',REVIEW_REQUIRED:'Requiere revisión',INSUFFICIENT_INFORMATION:'Información insuficiente',MINIMAL_OR_OTHER_RISK:'Sin obligaciones especiales detectadas',OUT_OF_SCOPE:'Fuera de ámbito',
  PROVIDER:'Proveedor',DEPLOYER:'Responsable del despliegue',IMPORTER:'Importador',DISTRIBUTOR:'Distribuidor',GPAI_PROVIDER:'Proveedor de modelo GPAI',PRODUCT_MANUFACTURER:'Fabricante de producto',
  CURRENT:'Aplicable según el catálogo',FUTURE:'Aplicación futura',UNKNOWN:'Por comprobar',PLANNED:'Acción prevista',DECLARED_DONE:'Cumplimiento declarado',VERIFIED:'Verificación declarada con evidencia',REQUIRES_REVIEW:'Requiere revisión',
  INCOMPLETE_QUESTIONNAIRE:'Quedan preguntas sin responder.',UNKNOWN_ANSWERS:'Hay respuestas no determinadas.',ROLE_UNDETERMINED:'No se ha determinado el rol con la información disponible.',UNCONFIRMED_PROPOSALS:'Existen propuestas de la IA pendientes de confirmar.',CONFLICTING_EVIDENCE:'Existen evidencias contradictorias.',API_ROLE_REVIEW:'Integrar una API puede cambiar el rol; requiere contexto del producto.',OPEN_SOURCE_SCOPE_REVIEW:'La licencia abierta no determina por sí sola una exclusión.',ANNEX_I_SECTOR_REVIEW:'Anexo I: comprobar legislación sectorial, sección y requisitos aplicables.',OPERATOR_COVERAGE_PARTIAL:'Las obligaciones específicas de este operador no están cubiertas íntegramente.',TRANSITION_REVIEW:'Comprobar las fechas de introducción y el régimen transitorio.',ARTICLE_6_ASSESSMENT_NOT_VERIFIED:'La evaluación documentada del proveedor debe verificarse.',HISTORICAL_SNAPSHOT_UNSUPPORTED:'Este catálogo no reconstruye el régimen histórico anterior al 27/07/2026.',TERRITORIAL_SCOPE_REVIEW:'El ámbito territorial necesita revisión.',AI_DEFINITION_REVIEW:'Confirmar si se trata de un sistema de IA conforme al art. 3.',REAL_WORLD_TESTING_REVIEW:'Las pruebas en condiciones reales requieren análisis específico.',GPAI_EXEMPTION_UNKNOWN:'No puede resolverse la excepción de documentación del modelo abierto.',
};
export const label=(s:string)=>labels[s]??(s.startsWith('SCOPE_REVIEW_')?'La exclusión de ámbito declarada necesita revisión.':s);
type Block={kind:'title'|'heading'|'subheading'|'text';text:string};
export function reportBlocks(a:Assessment,r:Evaluation):Block[]{
  const b:Block[]=[];const add=(kind:Block['kind'],text:string)=>b.push({kind,text});
  add('title','Informe de diagnóstico · AI Act Local');add('text',a.name);add('text',`Organización: ${a.organisation||'No indicada'} · Fecha de evaluación: ${r.evaluationDate}`);
  add('text',`Motor ${r.engineVersion} · Catálogo ${r.catalogVersion} · Snapshot ${r.legalSnapshot}`);
  add('text',`Estado jurídico: borrador pendiente de revisión. Integridad del catálogo: ${r.catalogHash}`);
  add('heading','Alcance y metodología');add('text',`Modo: ${a.mode}. Casos confirmados: ${r.cases.length}. Observaciones: ${a.observations.length}. Propuestas pendientes: ${a.proposals.filter(x=>x.status==='PENDING').length}.`);
  add('text','Las conclusiones proceden de reglas deterministas aplicadas a respuestas admitidas. Las observaciones y propuestas de IA no se convierten automáticamente en hechos. La revisión cubre los casos descritos, no todas las actividades de la organización ni otras normativas.');
  r.warnings.forEach(w=>add('text',w));
  add('heading','Resumen');for(const c of r.cases){add('text',`${c.name}: ${c.classifications.map(label).join(' · ')}. ${c.findings.length} hallazgos. ${c.pendingQuestions.length} preguntas pendientes; ${c.unknownQuestions.length} respuestas desconocidas.`);}
  const finding=(f:Finding)=>{
    add('subheading',`${f.title} (${f.id})`);add('text',`${f.kind==='RECOMMENDATION'?'Recomendación de revisión':'Obligación del catálogo'} · ${label(f.temporal)} · Desde ${f.effectiveFrom} · Estado: ${label(f.status)}`);
    add('text',`Qué hacer: ${f.action}`);add('text',`Base: artículo ${f.article}. ${f.source}. ${f.sourceUrl}`);
    add('text',`Por qué se incluye: reglas ${f.rules.join(', ')}. Respuestas utilizadas: ${f.answerIds.join(', ')||'Estado derivado; consultar trazabilidad'}.`);
    add('text',`Evidencias recomendadas: ${f.evidence.join('; ')}.`);add('text',`Evidencias enlazadas: ${f.evidenceIds.join(', ')||'Ninguna'}.`);
  };
  add('heading','Obligaciones organizativas');if(!r.organisationFindings.length)add('text','No determinadas con los datos actuales.');r.organisationFindings.forEach(finding);
  for(const c of r.cases){
    add('heading',c.name);add('text',`Roles: ${c.roles.map(label).join(', ')||'Pendientes'}. Ámbito: ${label(c.scope)}.`);
    add('text',`Clasificaciones: ${c.classifications.map(label).join(', ')}. Bases: ${c.annexCases.concat(c.highRiskBases).join(', ')||'No determinadas'}.`);
    c.warnings.map(label).forEach(w=>add('text',w));
    add('text',`Preguntas pendientes: ${c.pendingQuestions.join(', ')||'Ninguna'}. Desconocidas: ${c.unknownQuestions.join(', ')||'Ninguna'}.`);
    c.relatedDomains.forEach(d=>add('text',d));c.findings.forEach(finding);
    add('subheading','Respuestas utilizadas');c.facts.forEach(f=>add('text',`${f.questionId}: ${Array.isArray(f.value)?f.value.join(', '):f.value} · ${f.provenance} · evidencia: ${f.evidenceIds.join(', ')||'sin adjuntar'}`));
    add('subheading','Trazabilidad de reglas');c.trace.forEach(t=>add('text',`${t.rule} · ${t.source} · art. ${t.article} · resultado: ${JSON.stringify(t.outcome)} · depende de: ${t.dependencies.join(', ')||'respuestas directas'}`));
  }
  add('heading','Plan de acción');const all=[...r.organisationFindings,...r.cases.flatMap(c=>c.findings)];const rank:Record<string,number>={CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3,PREPARATORY:4};
  all.sort((a,b)=>(rank[a.priority]??3)-(rank[b.priority]??3)||a.id.localeCompare(b.id)).forEach((f,i)=>add('text',`${i+1}. [${f.priority} · ${label(f.temporal)} · ${label(f.status)}] ${f.action}`));
  if(!all.length)add('text','Completar o revisar el diagnóstico antes de concluir que no existen acciones necesarias.');
  add('heading','Cobertura y límites');r.coverage.forEach(c=>add('text',`${c.area} — ${c.status}: ${c.note}`));
  add('text','La herramienta apoya el diagnóstico y no sustituye asesoramiento jurídico individualizado. La semilla y sus adaptaciones necesitan revisión jurídica. Cumplimiento declarado o verificado significa un estado registrado por el usuario, no una certificación de la herramienta.');
  return b;
}
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const mdEsc=(s:string)=>esc(s).replace(/([\\`*_[\]#])/g,'\\$1');
export function markdown(a:Assessment,r:Evaluation){return reportBlocks(a,r).map(b=>`${b.kind==='title'?'# ':b.kind==='heading'?'## ':b.kind==='subheading'?'### ':''}${mdEsc(b.text)}`).join('\n\n')+'\n';}
export function html(a:Assessment,r:Evaluation){return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Diagnóstico AI Act</title><style>body{font:16px/1.65 system-ui,sans-serif;color:#17332e;max-width:900px;margin:50px auto;padding:0 26px}h1{font-size:36px}h2{border-top:1px solid #c5d2c8;padding-top:24px;margin-top:42px}h3{margin-top:28px}p{white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:0;max-width:none;font-size:10pt}h2,h3{break-after:avoid}}</style></head><body>${reportBlocks(a,r).map(b=>{const tag=b.kind==='title'?'h1':b.kind==='heading'?'h2':b.kind==='subheading'?'h3':'p';return `<${tag}>${esc(b.text)}</${tag}>`;}).join('\n')}</body></html>`;}
export async function exportReport(a:Assessment,r:Evaluation,format:string):Promise<Buffer>{
  if(format==='json')return Buffer.from(JSON.stringify(r,null,2)+'\n');
  if(format==='md')return Buffer.from(markdown(a,r));if(format==='html')return Buffer.from(html(a,r));
  const blocks=reportBlocks(a,r);
  if(format==='docx')return Packer.toBuffer(new Document({creator:'AI Act Local',title:'Informe de diagnóstico AI Act',sections:[{children:blocks.map(b=>new Paragraph({heading:b.kind==='title'?HeadingLevel.TITLE:b.kind==='heading'?HeadingLevel.HEADING_1:b.kind==='subheading'?HeadingLevel.HEADING_2:undefined,spacing:{after:140},children:[new TextRun({text:b.text,font:'Calibri',size:b.kind==='text'?22:undefined})]}))}]}));
  if(format==='pdf')return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'A4',margin:48,info:{Title:'Informe de diagnóstico AI Act',Author:'AI Act Local'}});const chunks:Buffer[]=[];doc.on('data',x=>chunks.push(x));doc.on('error',reject);doc.on('end',()=>resolve(Buffer.concat(chunks)));
    for(const b of blocks){if(b.kind!=='text'&&doc.y>680)doc.addPage();doc.font(b.kind==='text'?'Helvetica':'Helvetica-Bold').fontSize(b.kind==='title'?24:b.kind==='heading'?17:b.kind==='subheading'?12:10).fillColor('#17332e').text(b.text,{lineGap:3});doc.moveDown(b.kind==='text'?0.5:0.8);}doc.end();
  });
  throw new Error('Formato no admitido');
}
export function compareResults(before:Evaluation,after:Evaluation){
  const changes:{type:string;caseId:string;detail:string}[]=[];
  const old=new Map(before.cases.map(c=>[c.id,c]));
  for(const c of after.cases){const prior=old.get(c.id);if(!prior){changes.push({type:'NEW_CASE',caseId:c.id,detail:c.name});continue;}old.delete(c.id);
    if(JSON.stringify(prior.classifications)!==JSON.stringify(c.classifications))changes.push({type:'CLASSIFICATION_CHANGED',caseId:c.id,detail:`${prior.classifications.join(', ')} → ${c.classifications.join(', ')}`});
    if(JSON.stringify(prior.roles)!==JSON.stringify(c.roles))changes.push({type:'ROLES_CHANGED',caseId:c.id,detail:`${prior.roles.join(', ')} → ${c.roles.join(', ')}`});
    const prev=new Map(prior.findings.map(f=>[f.id,f]));for(const f of c.findings){const o=prev.get(f.id);if(!o)changes.push({type:'NEW_OBLIGATION',caseId:c.id,detail:f.title});else if(JSON.stringify(o)!==JSON.stringify(f))changes.push({type:'OBLIGATION_CHANGED',caseId:c.id,detail:f.title});prev.delete(f.id);}for(const f of prev.values())changes.push({type:'REMOVED_OBLIGATION',caseId:c.id,detail:f.title});
    if(JSON.stringify(prior.facts)!==JSON.stringify(c.facts))changes.push({type:'ANSWERS_CHANGED',caseId:c.id,detail:'Han cambiado las respuestas o su evidencia.'});
  }
  for(const c of old.values())changes.push({type:'REMOVED_CASE',caseId:c.id,detail:c.name});
  if(JSON.stringify(before.organisationFindings)!==JSON.stringify(after.organisationFindings))changes.push({type:'ORGANISATION_CHANGED',caseId:'organisation',detail:'Cambian los hallazgos transversales.'});
  return {before:{date:before.evaluationDate,catalog:before.catalogVersion,hash:before.catalogHash},after:{date:after.evaluationDate,catalog:after.catalogVersion,hash:after.catalogHash},changes};
}
