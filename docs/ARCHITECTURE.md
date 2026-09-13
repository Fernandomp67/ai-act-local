# Arquitectura

## Capas

`src/domain` define los contratos. `src/engine/catalog.ts` adapta de forma versionada la semilla original a condiciones declarativas. `logic.ts` evalúa operadores permitidos con lógica ternaria. `evaluate.ts` normaliza respuestas, construye hechos, resuelve la navegación y ejecuta reglas hasta estabilizarse.

Las claves de hechos tienen un espacio explícito `response.*`; los resultados derivados utilizan `state.*`. Los hechos conservan pregunta, valor, procedencia y referencias a evidencias. No se admiten estados derivados en el canal de respuestas.

Las reglas no se evalúan con `eval`, funciones externas ni un LLM. La evaluación de conjunciones y disyunciones conserva UNKNOWN. Una regla que comprueba literalmente UNKNOWN puede producir una advertencia, sin convertirlo en NO.

`src/application/service.ts` es el único servicio de mutaciones de cuestionario, evidencias y seguimiento. Lo comparten servidor y CLI. `src/storage/store.ts` realiza escrituras atómicas y comprueba versiones para detectar ediciones concurrentes. `src/reports` usa un mismo modelo de bloques para Markdown, HTML, PDF y DOCX; JSON contiene el resultado estructurado.

## Persistencia

El PRP presenta archivos separados como estructura orientativa. La implementación utiliza un único `assessment.json` por borrador para asegurar que respuestas, propuestas y eventos se actualicen atómicamente. Los hechos y resultados se recalculan; se fijan dentro del snapshot al sellar. No existe una base de datos.

El snapshot contiene el catálogo efectivo completo, no solo su número de versión. La huella canónica ordena claves y separa el resultado jurídico de las marcas temporales de ejecución. Para reproducir un snapshot se exige la versión compatible del motor. Las etiquetas Git conservarán esa implementación.

## Navegación

Cada evaluación parte de las preguntas base y añade rutas cuyas condiciones se cumplen. Solo consume respuestas de preguntas activas. El proceso es monotónico y está acotado por el número de preguntas y reglas; si no se estabiliza, falla expresamente.

Al cambiar contexto, el servicio invalida respuestas dependientes y conserva eventos históricos. El rol y la clasificación son conjuntos: proveedor y responsable del despliegue pueden coexistir; también alto riesgo y transparencia.

## Servidor local

Servidor HTTP de Node limitado a loopback. Valida Host, Origin, Fetch Metadata, token de sesión y tipo de contenido para escrituras. No admite ejecución de comandos ni acceso arbitrario a archivos desde sus endpoints. Sirve únicamente los recursos compilados, rechazando escapes de ruta y enlaces fuera del directorio.

Los endpoints GET son de lectura. La exportación del navegador descarga el informe sin mutar el expediente. La exportación CLI escribe en su directorio `reports/`.

## Inspección

El analizador de repositorio no ejecuta scripts. El de web resuelve y comprueba cada destino y redirección, limita tamaño y tiempo, y fija la dirección resuelta al realizar la conexión. Por defecto rechaza direcciones privadas; `--allow-local` es una autorización explícita para un objetivo propio.

Las observaciones son INFERRED, sin extractos completos de código para reducir exposición accidental. Un agente puede aportar observaciones más ricas usando el esquema, pero su mera importación no altera las respuestas del usuario.
