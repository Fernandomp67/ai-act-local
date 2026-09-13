import type { Assessment, Answer, Value } from '../src/domain/model';
export const stamp='2026-09-13T00:00:00.000Z';
export function declared(value:Value):Answer{return {value,provenance:'DECLARED',evidenceIds:[],admittedBy:'Fictional test user',recordedAt:stamp};}
export function assessment(overrides:Record<string,Value>={},date='2026-09-13'):Assessment{
  const base:Record<string,Value>={'ORG-001':'ES','ORG-002':'COMPANY','ORG-003':'2_9','ORG-004':'TECH','ORG-005':'YES','GOV-001':'YES','GOV-002':['INTERNAL_GUIDES'],'USE-001':['ASSISTANTS'],'DEF-001':'YES','SYS-001':'THIRD_PARTY_TOOL','SYS-002':'NO','SYS-003':'NO','SYS-004':'NO','SCOPE-001':'NO','SCOPE-002':'NO','SCOPE-003':'NO','SCOPE-004':'NO','SCOPE-005':'NO','FUNC-001':['GENERATE_TEXT'],'PERSON-001':['INTERNAL_USERS_ONLY'],'DATA-001':'NO','TR-001':'NO','TR-003':['TEXT'],'TR-005':'NO','PROH-001':'NO','PROH-002':'NO','PROH-003':'NO','TIME-001':'NO',...overrides};
  const organisationAnswers:Record<string,Answer>={};const answers:Record<string,Answer>={};for(const [k,v]of Object.entries(base))(/^(ORG|GOV)-/.test(k)?organisationAnswers:answers)[k]=declared(v);
  return {schemaVersion:'1.0',id:'test-assessment',name:'Diagnóstico ficticio',organisation:'Empresa de ejemplo',mode:'QUESTIONNAIRE',evaluationDate:date,status:'DRAFT',version:0,createdAt:stamp,updatedAt:stamp,target:'',organisationAnswers,cases:[{id:'case-one',name:'Caso ficticio',description:'',answers}],observations:[],proposals:[],compliance:{},events:[]};
}
export const hr:Record<string,Value>={'USE-001':['HR'],'FUNC-001':['CLASSIFY'],'HR-001':['FILTER_CV'],'A6-001':'YES'};
export const provider:Record<string,Value>={'SYS-001':'OWN_APP_THIRD_PARTY_MODEL','SYS-002':'YES','SYS-003':'YES'};
export const gpai:Record<string,Value>={'USE-001':['GPAI_MODEL_PROVIDER'],'SYS-001':'OWN_GPAI_MODEL','SYS-005':'YES','GPAI-001':'YES','GPAI-002':'NO','GPAI-003':'NO','GPAI-010':'NO'};
