import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Catalog, Condition, Question, Rule, Value } from '../domain/model';
export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const seedRoot = path.join(projectRoot, 'legal/catalogs/seed-v0.2');
export const readSeed = (name: string) => JSON.parse(readFileSync(path.join(seedRoot, `${name}.json`), 'utf8'));
export const factKey = (id: string) => `response.${id.toLowerCase().replaceAll('-', '_')}`;
export const referenceKey = (id: string) => /^[A-Z0-9]+-\d+$/.test(id) ? factKey(id) : `state.${id}`;
export const eq = (id: string, value: Value): Condition => ({ fact: referenceKey(id), op: 'eq', value });
export const anyValue = (id: string, value: string[]): Condition => ({ fact: referenceKey(id), op: 'any', value });
export const all = (...conditions: Condition[]): Condition => ({ all: conditions });
export const either = (...conditions: Condition[]): Condition => ({ any: conditions });
function normalizeConditions(input: Record<string, unknown>): Condition {
  return { all: Object.entries(input).map(([k,v]): Condition => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const [op, value] = Object.entries(v)[0];
      if (!['equals','in','contains','any'].includes(op)) throw new Error(`Operador desconocido: ${op}`);
      return { fact: referenceKey(k), op: op === 'equals' ? 'eq' : op as 'in'|'contains'|'any', value: value as Value };
    }
    return eq(k, v as Value);
  }) };
}
function routeCondition(i: Record<string, any>): Condition {
  const out: Condition[] = [];
  if (i.question) out.push({ fact: factKey(i.question), op: i.equals !== undefined ? 'eq' : 'any', value: i.equals ?? i.any });
  if (i.answer) out.push(normalizeConditions(i.answer));
  if (i.any_question_equals) out.push(either(...i.any_question_equals.map(normalizeConditions)));
  const aliases: Record<string,string> = { use: 'USE-001', function: 'FUNC-001', affected: 'PERSON-001' };
  for (const [k,v] of Object.entries(i)) {
    if (['question','equals','any','answer','any_question_equals'].includes(k)) continue;
    const [prefix, op] = k.split('_');
    if (aliases[prefix]) out.push({ fact: factKey(aliases[prefix]), op: op === 'contains' ? 'contains' : 'any', value: v as Value });
    else out.push(eq(k,v as Value));
  }
  return all(...out);
}
export function loadCatalog(): Catalog {
  const questions: Question[] = readSeed('question_catalog').questions.map((q: any) => ({ ...q, scope: /^(ORG|GOV)-/.test(q.id) ? 'ORG' : 'CASE', factKey: factKey(q.id) }));
  for (const q of questions) {
    if (!q.options.some(x=>x.value==='UNKNOWN')) q.options.push({ value: 'UNKNOWN', label: 'No estoy seguro' });
  }
  const addQuestion = (id: string, title: string, help: string, options?: Question['options']) => {
    questions.push({ id, title, module: id.split('-')[0], scope:'CASE', factKey:factKey(id), answer_type:'SINGLE', help_text:help, options: options ?? [{value:'YES',label:'Sí'},{value:'NO',label:'No'},{value:'UNKNOWN',label:'No estoy seguro'}] });
  };
  addQuestion('DEF-001','¿El sistema obtiene resultados mediante un modelo que infiere a partir de los datos?', 'Por ejemplo, genera texto, hace predicciones o clasifica imágenes. Una automatización que solo sigue reglas escritas manualmente puede requerir otra valoración. La definición del artículo 3 debe comprobarse si hay dudas.');
  addQuestion('SYS-006','Además de ofrecerlo, ¿utilizáis vosotros este sistema bajo vuestra responsabilidad?', 'Por ejemplo, una empresa desarrolla un sistema y también lo utiliza en su propio proceso. Puede desempeñar más de un papel.');
  addQuestion('DATA-001','¿Este uso trata información que permite identificar a personas?', 'Piensa en cuentas, mensajes, imágenes, solicitudes o datos de empleados. No aportes datos personales reales.');
  addQuestion('A6-007','¿Puede causar un riesgo importante para la salud, la seguridad o los derechos de las personas?', 'La excepción del artículo 6.3 exige también valorar este riesgo, no solo la influencia en decisiones.');
  addQuestion('A6-008','¿El proveedor ha documentado por qué este uso encaja en la excepción de alto riesgo?', 'Una respuesta del usuario no sustituye la evaluación documentada del proveedor.');
  addQuestion('TIME-001','¿El sistema o modelo ya estaba en el mercado o en uso antes de las fechas de aplicación que le afectan?', 'Los sistemas y modelos preexistentes pueden tener un régimen transitorio. Si no conoces la fecha, el informe lo dejará pendiente.');
  addQuestion('LAW-002','¿El uso se realiza por una autoridad policial o en su nombre?', 'La detección de fraude de una tienda no equivale por sí sola a un uso policial.');
  addQuestion('DEP-014','¿Controláis los datos que se introducen en el sistema?', 'Permite precisar las obligaciones del artículo 26 sobre datos de entrada.');
  addQuestion('DEP-015','¿Los registros automáticos del sistema están bajo vuestro control?', 'El proveedor puede conservarlos sin que tengáis control sobre ellos.');
  addQuestion('DEP-016','¿Existe una evaluación de impacto de protección de datos que debáis realizar?', 'No se decide aquí si el RGPD exige esa evaluación; se pregunta por un requisito que ya habéis identificado.');
  addQuestion('GPAI-011','¿La Comisión ha designado expresamente el modelo como de riesgo sistémico?', 'Permite distinguir la designación del mero umbral de cálculo, que puede requerir notificación y valoración adicional.');
  addQuestion('GPAI-012','¿Habéis comunicado a la Comisión que se cumple el criterio de cálculo o habéis presentado argumentos para una excepción?', 'El estado y los plazos de la notificación requieren revisión específica.');
  const byId = new Map(questions.map(q=>[q.id,q]));
  byId.get('SCOPE-006')!.help_text = 'Pregunta heredada deshabilitada: el usuario no debe clasificarse jurídicamente a sí mismo.';
  for (const id of ['ESS-001','BIO-001','HR-001','EDU-001']) byId.get(id)!.options.push({value:'OTHER',label:'Ninguna de estas funciones'});
  byId.get('TR-004')!.title = '¿El contenido parece mostrar personas, lugares o hechos reales de forma auténtica, aunque sea artificial?';
  byId.get('TR-004')!.help_text = 'Por ejemplo, un vídeo que aparenta mostrar a una persona diciendo algo que nunca dijo. No toda imagen generada es una ultrafalsificación.';
  let routes: Catalog['routes'] = readSeed('question_routes').routes.filter((r:any)=>r.route_id!=='R-SCOPE-OPEN-SOURCE').map((r:any)=>({id:r.route_id,condition:routeCondition(r.if),show:r.show}));
  const route = (id:string, condition:Condition, show:string[]) => { routes = routes.filter(r=>r.id!==id); routes.push({id,condition,show}); };
  const annexIIICases:string[] = readSeed('annex_iii_catalog').cases.map((item:{code:string})=>item.code);
  const friaPublicCases = annexIIICases.filter(code=>code!=='III-2');
  const media = anyValue('TR-003',['IMAGE','AUDIO','VIDEO']);
  const high = eq('classification','HIGH_RISK');
  const deployer = all(high,eq('role','DEPLOYER'));
  route('R-TR-DIRECT',eq('TR-001','YES'),['TR-002']);
  route('R-BIO',either(anyValue('USE-001',['BIOMETRICS','EMOTION']),anyValue('FUNC-001',['EMOTION_RECOGNITION','BIOMETRIC_CATEGORISE','IDENTIFY_PERSON'])),['BIO-001']);
  route('R-PROH-EMOTION',either(eq('FUNC-001','EMOTION_RECOGNITION'),eq('BIO-001','EMOTION_RECOGNITION')),['PROH-005']);
  route('R-PROH-EMOTION-EXCEPTION',eq('PROH-005','YES'),['PROH-006']);
  route('R-PROH-BIO',either(eq('FUNC-001','BIOMETRIC_CATEGORISE'),eq('BIO-001','SENSITIVE_BIOMETRIC_CATEGORISATION')),['PROH-007']);
  route('R-FACE-SCRAPING',either(anyValue('USE-001',['BIOMETRICS','SECURITY']),eq('FUNC-001','IDENTIFY_PERSON')),['PROH-004']);
  route('R-INTIMATE',media,['PROH-008']);
  route('R-ARTICLE6',eq('classification_candidate','ANNEX_III'),['A6-001','A6-002','A6-003','A6-004','A6-005','A6-006','A6-007']);
  route('R-A6-DOCUMENTATION',all(eq('classification_candidate','ANNEX_III'),eq('A6-001','NO'),eq('A6-006','NO'),eq('A6-007','NO'),either(...['A6-002','A6-003','A6-004','A6-005'].map(x=>eq(x,'YES')))),['A6-008']);
  route('R-LAW',anyValue('USE-001',['SECURITY']),['LAW-002']);
  route('R-LAW-PURPOSE',eq('LAW-002','YES'),['LAW-001']);
  route('R-DEPLOYER-HR',deployer,['DEP-001','DEP-002','DEP-003','DEP-005','DEP-007','DEP-014','DEP-015','DEP-016']);
  route('R-DEP-WORKERS',all(deployer,eq('DEP-007','YES')),['DEP-008']);
  route('R-DEP-INPUT',all(deployer,eq('DEP-014','YES')),['DEP-004']);
  route('R-DEP-LOGS',all(deployer,eq('DEP-015','YES')),['DEP-006']);
  route('R-FRIA',all(deployer,anyValue('annex_case',friaPublicCases)),['FRIA-001']);
  route('R-FRIA-FINANCE',all(deployer,anyValue('annex_case',['III-5(b)','III-5(c)'])),['FRIA-002']);
  route('R-ROLE-ART25',either(eq('SYS-003','YES'),eq('SYS-004','YES')),['ROLE-004','ROLE-005','ROLE-006']);
  route('R-GPAI',either(eq('USE-001','GPAI_MODEL_PROVIDER'),eq('SYS-001','OWN_GPAI_MODEL')),['GPAI-001']);
  route('R-GPAI-DETAIL',eq('role','GPAI_PROVIDER'),['GPAI-002','GPAI-003','GPAI-004','GPAI-005','GPAI-006','GPAI-007','GPAI-010']);
  route('R-GPAI-SYSTEMIC',eq('GPAI-003','YES'),['GPAI-008','GPAI-009','GPAI-011','GPAI-012']);
  // Every route condition must hold; base questions are the only unconditional entries.
  const base = ['ORG-001','ORG-002','ORG-003','ORG-004','ORG-005','GOV-001','USE-001','DEF-001','SYS-001','SYS-002','SYS-003','SYS-004','SCOPE-001','SCOPE-002','SCOPE-003','SCOPE-004','SCOPE-005','FUNC-001','PERSON-001','DATA-001','TR-001','PROH-001','PROH-002','PROH-003','TIME-001'];
  route('R-SYS-MODEL',eq('SYS-001','OWN_GPAI_MODEL'),['SYS-005']);
  route('R-SYS-OWN-USE',anyValue('SYS-001',['OWN_AI_SYSTEM','OWN_APP_THIRD_PARTY_MODEL']),['SYS-006']);
  let rules: Rule[] = readSeed('rule_catalog').rules.map((r:any)=>({ ...r, conditions:normalizeConditions(r.conditions), review:'DRAFT_REQUIRES_LEGAL_REVIEW' }));
  const edit = (code:string, condition:Condition, result?:Rule['result']) => { const r = rules.find(x=>x.code===code)!; r.conditions=condition; if(result)r.result=result; };
  // Quarantine overly broad exclusions and role shortcuts; keep originals unchanged on disk.
  for(const code of ['AIA-SCOPE-OSS-001','AIA-SCOPE-OSS-EXCEPTION-001','ROLE-DEPLOYER-001','ROLE-PROVIDER-001','AIA-ANNEXI-001']) rules.find(x=>x.code===code)!.active=false;
  for(const r of rules.filter(r=>r.code.startsWith('AIA-SCOPE-') && r.result.classification==='OUT_OF_SCOPE')) r.result={classification:'REVIEW_REQUIRED',warning_add:`SCOPE_REVIEW_${r.code}`};
  for(const r of rules.filter(r=>r.code.startsWith('AIA-ART6-') && r.result.classification==='NOT_HIGH_RISK_ARTICLE_6')) {
    r.conditions=all(r.conditions,eq('A6-007','NO'),eq('A6-008','YES'));
  }
  edit('AIA-ART50-INTERACTION-001',all(eq('role','PROVIDER'),eq('TR-001','YES'),eq('TR-002','NO')));
  edit('AIA-ART50-EMOTION-BIO-001',all(eq('role','DEPLOYER'),either(anyValue('FUNC-001',['EMOTION_RECOGNITION','BIOMETRIC_CATEGORISE']),anyValue('BIO-001',['EMOTION_RECOGNITION','SENSITIVE_BIOMETRIC_CATEGORISATION']))));
  for(const code of ['AIA-ART50-DEEPFAKE-001','AIA-ART50-PUBLIC-TEXT-001']) { const r=rules.find(x=>x.code===code)!; r.conditions=all(r.conditions,eq('role','DEPLOYER')); }
  for(const [code,question] of [['TRIGGER-OBL-DEP-INPUT-DATA-001','DEP-014'],['TRIGGER-OBL-DEP-LOGS-001','DEP-015'],['TRIGGER-OBL-DEP-DPIA','DEP-016']]) { const r=rules.find(x=>x.code===code)!;r.conditions=all(r.conditions,eq(question,'YES')); }
  edit('TRIGGER-OBL-FRIA-PUBLIC',all(deployer,anyValue('annex_case',friaPublicCases),eq('FRIA-001','YES')));
  edit('TRIGGER-OBL-FRIA-FINANCE',all(deployer,anyValue('annex_case',['III-5(b)','III-5(c)']),eq('FRIA-002','YES')));
  // No unknown-as-no in the open-source exception, including the representative obligation.
  for(const code of ['GPAI-OBL-TECH-DOC','GPAI-OBL-DOWNSTREAM']) {const r=rules.find(x=>x.code===code)!;r.conditions=all(eq('role','GPAI_PROVIDER'),eq('GPAI-002','NO'));}
  edit('GPAI-OBL-AUTH-REP',all(eq('role','GPAI_PROVIDER'),eq('GPAI-010','YES'),either(eq('GPAI-002','NO'),eq('gpai_classification','SYSTEMIC_RISK'))));
  const addRule = (code:string, conditions:Condition, result:Rule['result'], article:string, effective_from?:string) => rules.push({code,conditions,result,article,effective_from,version:'0.3.0-local',rule_type:'DERIVATION',legal_source_id:'EU_AI_ACT_2026-07-27',active:true,review:'DRAFT_REQUIRES_LEGAL_REVIEW'});
  addRule('LOCAL-ROLE-TOOL',eq('SYS-001','THIRD_PARTY_TOOL'),{role_add:'DEPLOYER'},'3.4');
  addRule('LOCAL-ROLE-API',eq('SYS-001','THIRD_PARTY_API'),{role_add:'DEPLOYER',warning_add:'API_ROLE_REVIEW'},'3,25');
  addRule('LOCAL-ROLE-PROVIDER',all(anyValue('SYS-001',['OWN_AI_SYSTEM','OWN_APP_THIRD_PARTY_MODEL']),eq('SYS-003','YES')),{role_add:'PROVIDER'},'3.3');
  addRule('LOCAL-ROLE-OWN-USE',all(anyValue('SYS-001',['OWN_AI_SYSTEM','OWN_APP_THIRD_PARTY_MODEL']),eq('SYS-006','YES')),{role_add:'DEPLOYER'},'3.4');
  addRule('LOCAL-ARTICLE6-SIGNIFICANT',all(eq('classification_candidate','ANNEX_III'),either(eq('A6-006','YES'),eq('A6-007','YES'))),{classification:'HIGH_RISK'},'6.2–3');
  addRule('LOCAL-ARTICLE6-NO-EXCEPTION',all(eq('classification_candidate','ANNEX_III'),...['A6-002','A6-003','A6-004','A6-005'].map(q=>eq(q,'NO'))),{classification:'HIGH_RISK'},'6.2–3');
  addRule('LOCAL-ANNEXI-REVIEW',eq('ANNEX1-001','YES'),{classification:'HIGH_RISK_CANDIDATE',high_risk_basis:'ANNEX_I',warning_add:'ANNEX_I_SECTOR_REVIEW'},'2.2,2.13,6.1');
  addRule('LOCAL-OSS-REVIEW',eq('SCOPE-005','YES'),{warning_add:'OPEN_SOURCE_SCOPE_REVIEW'},'2.12');
  addRule('LOCAL-DEFINITION-NO',eq('DEF-001','NO'),{classification:'REVIEW_REQUIRED',warning_add:'AI_DEFINITION_REVIEW'},'3.1');
  addRule('LOCAL-PREEXISTING',anyValue('TIME-001',['YES','UNKNOWN']),{warning_add:'TRANSITION_REVIEW'},'111');
  const obligations = readSeed('obligation_catalog').obligations;
  return {
    version:'0.3.0-local',legalSnapshot:'EU_AI_ACT_2026-07-27',status:'DRAFT_REQUIRES_LEGAL_REVIEW',questions,routes,base,rules,obligations,sources:readSeed('legal_sources').sources,
    dates:{ANNEX_III:'2027-12-02',ANNEX_I:'2028-08-02',ARTICLE_50:'2026-08-02',GPAI:'2025-08-02',NEW_PROHIBITIONS:'2026-12-02',SNAPSHOT_FROM:'2026-07-27'},
    amendments:['Normalized conditions into response/state namespaces with provenance.','Added unknown and other options; repaired unreachable routes.','Quarantined broad scope and Annex I classification shortcuts.','Article 6 includes significant-risk and documented provider assessment checks.','Corrected role filtering, Article 27 point 2 exclusion, open-source uncertainty and conditional deployer obligations.','Seed is preserved; no rule is claimed professionally validated.'],
    coverage:[
      {area:'Ámbito y roles',status:'PARTIAL',note:'Exclusiones, integración por API y cambios de rol requieren contexto; no se certifican automáticamente.'},
      {area:'Prohibiciones (art. 5)',status:'DRAFT',note:'Indicios prioritarios; excepciones, perjuicio y garantías nacionales requieren revisión.'},
      {area:'Anexo III y art. 6',status:'DRAFT',note:'Catálogo y filtro implementados; las conclusiones mantienen el estado de borrador jurídico.'},
      {area:'Anexo I',status:'PARTIAL',note:'Activación preliminar; no determina la sección sectorial ni la equivalencia del art. 2.13.'},
      {area:'Transparencia (art. 50)',status:'PARTIAL',note:'Disparadores por rol. Excepciones especializadas y directrices aún no incorporadas íntegramente.'},
      {area:'Despliegue, proveedores y FRIA',status:'PARTIAL',note:'Obligaciones principales; registro, excepciones y requisitos sectoriales pendientes.'},
      {area:'GPAI',status:'PARTIAL',note:'Obligaciones, open source y riesgo sistémico; transitorios y notificación necesitan revisión.'},
      {area:'Importación y distribución',status:'NOT_COVERED',note:'Se identifica el rol, pero falta el catálogo exhaustivo de los arts. 22–24.'},
      {area:'Transitorios y normativa posterior',status:'NOT_COVERED',note:'Se detecta su posible relevancia; no hay actualización normativa automática.'},
    ],
  };
}
export const catalog = loadCatalog();
