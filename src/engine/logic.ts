import { createHash } from 'node:crypto';
import type { Condition, Value } from '../domain/model';
export type Truth = true | false | 'UNKNOWN';
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([k,v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export const hash = (v: unknown) => createHash('sha256').update(canonical(v)).digest('hex');
export const conjunction = (a: Truth[]): Truth => a.includes(false) ? false : a.includes('UNKNOWN') ? 'UNKNOWN' : true;
export const disjunction = (a: Truth[]): Truth => a.includes(true) ? true : a.includes('UNKNOWN') ? 'UNKNOWN' : false;
export function matches(c: Condition, facts: Record<string, Value>): Truth {
  if ('all' in c) return conjunction(c.all.map(x => matches(x, facts)));
  if ('any' in c) return disjunction(c.any.map(x => matches(x, facts)));
  if ('not' in c) { const t = matches(c.not, facts); return t === 'UNKNOWN' ? t : !t; }
  const raw = facts[c.fact];
  if (raw === undefined) return 'UNKNOWN';
  const values = Array.isArray(raw) ? raw : [raw];
  const expected = Array.isArray(c.value) ? c.value : [c.value];
  // Explicit UNKNOWN rules may produce review findings; otherwise unknown never becomes false.
  if (values.includes('UNKNOWN') && !expected.includes('UNKNOWN')) return 'UNKNOWN';
  if (['eq','in','contains','any'].includes(c.op)) return expected.some(x => values.includes(x));
  throw new Error('Operador no permitido');
}
export function keys(c: Condition): string[] {
  if ('all' in c) return c.all.flatMap(keys);
  if ('any' in c) return c.any.flatMap(keys);
  if ('not' in c) return keys(c.not);
  return [c.fact];
}
