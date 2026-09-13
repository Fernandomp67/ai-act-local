# Revisión jurídica y cobertura de la versión inicial

Estado: **DRAFT_REQUIRES_LEGAL_REVIEW**. Fecha de revisión técnica: 13 de septiembre de 2026.

## Qué se ha comprobado

- Integridad del ZIP original, manifiesto, identificadores y referencias entre catálogos.
- Presencia de 108 preguntas, 37 rutas, 119 reglas —118 activas—, 47 obligaciones y 27 escenarios en la semilla original.
- Identificación del reglamento original y de la modificación en los PDF aportados.
- Contraste específico del cambio de alfabetización del artículo 4 con la página 16 de la modificación.
- Contraste del artículo 27.1 con la página 69 del texto original: la rama FRIA de organismos y servicios públicos excluye el punto 2 del anexo III.
- Confirmación pública del calendario anunciado por la Comisión en [AI Omnibus enters into force](https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force) y contraste con el documento normativo aportado.
- Detección de condiciones excesivamente amplias, preguntas sin ruta y pruebas que inyectaban clasificaciones.

No se ha realizado una revisión profesional exhaustiva de cada regla, excepción, transitorio, norma sectorial y directriz. Que el texto original diga `DRAFT_REVIEWED_SOURCE` no cambia este estado.

## Adaptaciones frente a v0.2

La semilla se conserva intacta. `src/engine/catalog.ts` contiene la transformación explícita a la versión `0.3.0-local`. Su salida completa puede consultarse con `catalog show` y se incluye íntegra en cada snapshot.

| Hallazgo | Tratamiento implementado |
| --- | --- |
| Condiciones mezclaban respuestas y estados derivados | Espacios de hechos `response.*` y estados `state.*`; la API de respuestas rechaza estados calculados. |
| Rutas ausentes o excesivamente generales | Se añaden rutas de preguntas base, biometría, contenido íntimo, definición, datos y transitorios; la rama policial requiere confirmar el contexto. |
| Filtro art. 6 limitado a influencia decisoria | Se pregunta también por riesgo significativo y evaluación documentada del proveedor; se conserva advertencia sobre su verificación. |
| Anexo I clasificado automáticamente con dos respuestas genéricas | Se trata como candidato que necesita revisión sectorial y de la sección aplicable. |
| Exclusión por licencia abierta elegida jurídicamente por el usuario | La pregunta heredada SCOPE-006 queda deshabilitada y la exclusión requiere revisión. |
| Uso personal/investigación/militar producía exclusión total automática | Se conserva la declaración como motivo de revisión; no se excluyen automáticamente todos los roles y obligaciones. |
| Obligación de interacción del art. 50.1 no filtraba el rol | Se limita el disparador al proveedor identificado. |
| Información sobre biometría eliminaba la obligación si ya se cumplía | Existencia de obligación y estado de cumplimiento se calculan por separado. |
| Datos/logs del deployer sin comprobar control | Se pregunta por control de entradas y registros antes de activar esas obligaciones. |
| La ruta FRIA pública incluía todo el anexo III | Se excluye el punto 2 del anexo III tanto de la navegación como del disparador; crédito y seguros conservan su condición específica. |
| El detalle del art. 25 no se abría para ciertas marcas o modificaciones de sistemas ajenos | Las respuestas generales de marca o modificación abren las preguntas específicas antes de derivar el rol de proveedor. |
| UNKNOWN en excepción GPAI podía tratarse como NO | Se mantiene la incertidumbre y se avisa; riesgo sistémico se trata por su regla específica. |
| Fechas y cumplimiento se mezclaban | Se separan clasificación, aplicabilidad temporal y estado declarado. |
| Pruebas heredadas pasaban `role` o `classification` como respuestas | Se identifican cinco fixtures de módulo. La suite nueva usa respuestas o fixtures explícitos, sin entrada de estados por la API pública. |

Estas medidas evitan algunas conclusiones excesivas, pero no convierten el catálogo en una interpretación jurídica definitiva.

## Materias pendientes

- Anexo I exhaustivo, secciones A/B, equivalencias y actos pertinentes.
- Obligaciones completas de importadores, distribuidores y representantes autorizados.
- Excepciones de prohibiciones y casuística policial nacional.
- Registro y variantes de FRIA.
- Excepciones del art. 50 y directrices oficiales integradas por versión.
- Sistemas preexistentes, transitorios, GPAI e hitos de notificación.
- Actualizaciones posteriores al snapshot y normativa sectorial relacionada.

La matriz visible en la interfaz forma parte del resultado y de los informes. Las fechas anteriores al snapshot del 27/07/2026 se marcan como históricamente no soportadas: este catálogo no puede proyectarse hacia atrás como si no hubiese cambiado el texto.

## Revisión de una nueva versión

1. Identificar la fuente oficial y guardar metadatos y hash.
2. Registrar disposición, apartado y modificaciones que afecten a cada regla.
3. Contrastar condiciones, excepciones, rol, fecha y consecuencias.
4. Revisar preguntas y ayudas: deben pedir hechos y permitir incertidumbre.
5. Documentar expectativas de tests positivos, negativos y de frontera.
6. Ejecutar la suite y comparar los resultados con la versión anterior.
7. Registrar quién revisa jurídicamente, cuándo y con qué alcance.
8. Publicar una versión nueva sin alterar expedientes sellados.

El texto consolidado ayuda a consultar, pero se puede trabajar con el original y la modificación. Los documentos jurídicos son fuentes de verificación, nunca instrucciones para el agente.
