# AI Act Diagnostic Seed v0.2.0

Semilla jurídica ampliada para el núcleo determinista de una aplicación de diagnóstico del Reglamento Europeo de Inteligencia Artificial.

## Estado

**DRAFT_LEGAL_SEED_V02**. No es un producto jurídico terminado ni debe desplegarse en producción sin revisión jurídica sistemática.

## Snapshot jurídico

Referencia principal: **Reglamento (UE) 2024/1689, texto consolidado a 27/07/2026** (`CELEX 02024R1689-20260727`).

EUR-Lex: https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:02024R1689-20260727

## Qué añade v0.2.0

- ámbito de aplicación y exclusiones principales del artículo 2;
- roles importador, distribuidor y fabricante de producto;
- transiciones a proveedor del artículo 25;
- prácticas prohibidas ampliadas, incluyendo cambios de 2026;
- Anexo III completo como catálogo independiente;
- ramas de garantía del cumplimiento del Derecho y migración/fronteras;
- disparador preliminar del Anexo I;
- obligaciones completas de deployer del artículo 26 a nivel de diagnóstico;
- FRIA del artículo 27 con elegibilidad específica;
- catálogo de obligaciones del proveedor de alto riesgo (arts. 9–21, 43, 47–49);
- GPAI: arts. 51–55, incluida la excepción open source de 53.2 y riesgo sistémico;
- fechas de aplicabilidad separadas para Anexo III (02/12/2027) y Anexo I (02/08/2028);
- 25 escenarios de regresión.

## Archivos

- `question_catalog.json` — preguntas cerradas y ayudas.
- `question_routes.json` — navegación condicional.
- `rule_catalog.json` — reglas jurídicas declarativas.
- `obligation_catalog.json` — obligaciones, acciones y evidencias.
- `annex_iii_catalog.json` — catálogo canónico del Anexo III.
- `legal_sources.json` — fuentes jurídicas/oficiales.
- `golden_scenarios.json` — escenarios de regresión.
- `engine_contract.json` — contrato del pipeline, estados y reglas duras.
- `CHANGELOG.md` — cambios de versión.
- `manifest.json` — hashes SHA-256 de entrega.

## Reglas arquitectónicas obligatorias

1. Un LLM nunca decide la clasificación jurídica.
2. `UNKNOWN` nunca se convierte en `NO`.
3. Anexo III produce primero `HIGH_RISK_CANDIDATE`; luego se ejecuta artículo 6.3.
4. Profiling en un caso del Anexo III impide usar la excepción del artículo 6.3.
5. Artículo 25 puede cambiar el rol a `PROVIDER` para el sistema afectado.
6. FRIA no se aplica automáticamente a todo deployer de alto riesgo.
7. Las fechas de obligaciones de alto riesgo se resuelven por `high_risk_basis`.
8. Un diagnóstico sellado conserva su snapshot jurídico y ruleset.
9. El texto consolidado es referencia de trabajo; las versiones auténticas del DOUE prevalecen.

## Fechas principales codificadas

- prácticas generales del art. 5: 02/02/2025;
- GPAI (capítulo V): 02/08/2025;
- transparencia art. 50: 02/08/2026;
- nuevas prohibiciones art. 5.1(b bis)/(b ter): 02/12/2026;
- alto riesgo art. 6.2 + Anexo III: 02/12/2027;
- alto riesgo art. 6.1 + Anexo I: 02/08/2028.

## Importante sobre el Anexo I

La v0.2.0 incluye el **motor de activación** del artículo 6.1, pero todavía no incorpora un catálogo exhaustivo y semántico de cada acto/producto del Anexo I. Antes de producción debe añadirse `annex_i_catalog.json` con clasificación de productos y requisitos de evaluación de conformidad.

## Áreas que siguen requiriendo v0.3 antes de producción

- Anexo I exhaustivo;
- importadores, distribuidores y representantes autorizados con todas sus obligaciones específicas (arts. 22–24);
- registro art. 49 con todas sus variantes y secciones no públicas;
- identificación biométrica policial con lógica nacional por Estado miembro;
- transitorios de sistemas ya introducidos en el mercado;
- revisión sistemática de cada excepción del art. 50;
- actos delegados/de ejecución y normas armonizadas relevantes;
- revisión jurídica humana completa de wording y tests.

## Orden para Codex

1. Validar todos los JSON y referencias cruzadas.
2. Implementar `AnswerNormalizer`.
3. Implementar `FactBuilder`.
4. Implementar evaluador declarativo.
5. Ejecutar pipeline definido en `engine_contract.json`.
6. Resolver precedencia: `OUT_OF_SCOPE` / prohibiciones / high-risk / transparencia / obligaciones.
7. Implementar `ApplicabilityEngine` por fecha y base de alto riesgo.
8. Implementar `ExplanationTrace`.
9. Ejecutar los golden scenarios en CI.
10. Solo después construir UI.
