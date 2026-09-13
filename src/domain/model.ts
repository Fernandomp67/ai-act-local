import { z } from 'zod';

export const idSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(`${v}T00:00:00Z`); return Number.isFinite(+d) && d.toISOString().slice(0, 10) === v;
}, 'Fecha inexistente');
export const valueSchema = z.union([z.string().min(1).max(100), z.array(z.string().min(1).max(100)).min(1).max(60)]);
export type Value = z.infer<typeof valueSchema>;
export const answerSchema = z.object({
  value: valueSchema, provenance: z.enum(['DECLARED', 'OBSERVED']),
  evidenceIds: z.array(idSchema).max(30).default([]),
  admittedBy: z.string().min(1).max(150), recordedAt: z.string().datetime(),
}).strict();
export type Answer = z.infer<typeof answerSchema>;
export const observationSchema = z.object({
  id: idSchema, caseId: idSchema.optional(),
  title: z.string().min(1).max(200), description: z.string().min(1).max(4000),
  provenance: z.enum(['OBSERVED', 'DECLARED', 'INFERRED', 'UNKNOWN', 'CONFLICTING']),
  source: z.enum(['WEB', 'CODE', 'USER']), locator: z.string().min(1).max(2000),
  collectedAt: z.string().datetime(), method: z.string().min(1).max(200),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  commit: z.string().max(80).optional(),
}).strict();
export type Observation = z.infer<typeof observationSchema>;
export const proposalSchema = z.object({
  id: idSchema, caseId: idSchema, questionId: idSchema, value: valueSchema,
  evidenceIds: z.array(idSchema).min(1).max(30), reason: z.string().min(1).max(2000),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']).default('PENDING'),
}).strict();
export type Proposal = z.infer<typeof proposalSchema>;
export const useCaseSchema = z.object({ id: idSchema, name: z.string().min(1).max(150), description: z.string().max(1000).default(''), answers: z.record(z.string(), answerSchema).default({}) }).strict();
export type UseCase = z.infer<typeof useCaseSchema>;
export const assessmentSchema = z.object({
  schemaVersion: z.literal('1.0'), id: idSchema, name: z.string().min(1).max(150),
  organisation: z.string().max(150), mode: z.enum(['QUESTIONNAIRE', 'INSPECTION', 'MIXED']),
  evaluationDate: dateSchema, status: z.enum(['DRAFT', 'SEALED']),
  version: z.number().int().nonnegative(), createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
  target: z.string().max(2000).default(''), organisationAnswers: z.record(z.string(), answerSchema),
  cases: z.array(useCaseSchema).max(50), observations: z.array(observationSchema).max(2000),
  proposals: z.array(proposalSchema).max(1000),
  compliance: z.record(z.string(), z.object({ status: z.enum(['UNKNOWN', 'PLANNED', 'DECLARED_DONE', 'VERIFIED']), evidenceIds: z.array(idSchema), note: z.string().max(2000) }).strict()).default({}),
  events: z.array(z.object({ at: z.string().datetime(), type: z.string(), detail: z.string() }).strict()).max(50000),
}).strict();
export type Assessment = z.infer<typeof assessmentSchema>;
export const createSchema = z.object({ name: z.string().trim().min(1).max(150), organisation: z.string().max(150).default(''), mode: z.enum(['QUESTIONNAIRE', 'INSPECTION', 'MIXED']).default('QUESTIONNAIRE'), evaluationDate: dateSchema, target: z.string().max(2000).default('') }).strict();

export type Condition = { all: Condition[] } | { any: Condition[] } | { not: Condition } | { fact: string; op: 'eq' | 'in' | 'contains' | 'any'; value: Value };
export interface Question { id: string; module: string; title: string; help_text?: string; description?: string; answer_type: string; options: { value: string; label: string }[]; scope: 'ORG' | 'CASE'; factKey: string; }
export interface Rule { code: string; version: string; rule_type: string; conditions: Condition; result: Record<string, string>; legal_source_id: string; article?: string; annex?: string; effective_from?: string; active: boolean; review: string; }
export interface Obligation { id: string; version: string; title: string; operator_roles: string[]; legal_source_id: string; article: string; effective_from: string; priority: string; action_template: string; evidence_template: string[]; status: string; }
export interface Catalog { version: string; legalSnapshot: string; status: string; questions: Question[]; routes: { id: string; condition: Condition; show: string[] }[]; base: string[]; rules: Rule[]; obligations: Obligation[]; sources: { source_id: string; title: string; url: string; [key: string]: unknown }[]; dates: Record<string,string>; amendments: string[]; coverage: { area: string; status: string; note: string }[]; }
export interface Fact { key: string; value: Value; questionId: string; provenance: string; evidenceIds: string[]; }
export interface Trace { rule: string; source: string; article: string; outcome: Record<string,string>; facts: string[]; dependencies: string[]; }
export interface Finding { id: string; title: string; article: string; source: string; sourceUrl: string; legalStatus: string; temporal: string; effectiveFrom: string; status: string; priority: string; action: string; evidence: string[]; rules: string[]; answerIds: string[]; evidenceIds: string[]; kind: 'OBLIGATION' | 'RECOMMENDATION'; }
export interface CaseResult { id: string; name: string; scope: string; roles: string[]; classifications: string[]; annexCases: string[]; highRiskBases: string[]; gpai: string[]; facts: Fact[]; trace: Trace[]; findings: Finding[]; pendingQuestions: string[]; unknownQuestions: string[]; warnings: string[]; relatedDomains: string[]; }
export interface Evaluation { schemaVersion: '1.0'; engineVersion: string; catalogVersion: string; catalogHash: string; legalSnapshot: string; legalStatus: string; evaluationDate: string; assessmentId: string; cases: CaseResult[]; organisationFindings: Finding[]; coverage: Catalog['coverage']; warnings: string[]; }
