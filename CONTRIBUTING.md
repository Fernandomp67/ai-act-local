# Contribuir

Se agradecen mejoras de experiencia, errores reproducibles, escenarios de frontera y revisiones jurídicas documentadas.

1. Abre una incidencia con datos ficticios o un ejemplo mínimo, nunca expedientes de clientes.
2. Para cambios jurídicos, aporta disposición, versión, fuente oficial y explicación de la condición o excepción afectada.
3. Conserva la semilla y los documentos originales. Introduce cambios en una versión derivada y documenta su efecto.
4. Añade pruebas significativas. Un test no valida la interpretación jurídica por sí mismo.
5. Ejecuta `npm run check`, `npm run catalog:validate` y los recorridos de navegador afectados.
6. Describe la situación anterior, el resultado nuevo y la verificación realizada.

No utilices puntuaciones globales de cumplimiento, no elimines UNKNOWN y no hagas que la IA decida libremente qué artículos aplicar. No publiques credenciales, archivos `.env`, rutas privadas, datos reales ni contenido de `audits/`.

## Publicación de catálogos

La publicación jurídica debe incluir registro de revisión humana, fuentes contrastadas, excepciones comprobadas y pruebas de regresión. Hasta entonces, mantén `DRAFT_REQUIRES_LEGAL_REVIEW` visible. La primera versión de este repositorio no afirma haber completado esa revisión profesional.
