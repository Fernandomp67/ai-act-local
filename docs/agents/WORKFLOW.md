# Contrato de trabajo con agentes

## Antes de empezar

Comprueba Node y la instalación. Lee la ayuda de la CLI. Aclara objetivo, organización y fecha de evaluación; la fecha es una entrada explícita y no debe inventarse silenciosamente. Mantén cada caso de uso separado y confirma agrupaciones para evitar duplicados.

## Cuestionario

1. `init --name ... --date YYYY-MM-DD --mode QUESTIONNAIRE`.
2. `cases add --id ID --name ...` por cada caso confirmado.
3. `questions next --id ID --case CASE_ID`.
4. Presenta `next.title`, sus opciones exactas y la ayuda si es pertinente. Usa botones si tu entorno los admite o números asociados a cada opción.
5. Registra la respuesta con `answers set`. Los valores múltiples son arrays JSON, nunca texto interpretado libremente.
6. Repite hasta completar o hasta que el usuario quiera un resultado parcial.
7. `evaluate` y `report`. Explica las limitaciones y mantén visibles las preguntas pendientes.

La CLI rechaza respuestas de ramas no activas. No escribas directamente `assessment.json` para eludir la validación. Si necesitas volver a una respuesta, consulta las preguntas activas; al cambiar contexto se invalidarán respuestas dependientes.

## Inspección y modo mixto

`inspect repo --target CARPETA` y `inspect web --target URL` generan objetos `observations`, `proposals` y un resumen de alcance. Puedes guardarlos o construir objetos equivalentes con tus herramientas de lectura o navegador.

Las observaciones necesitan ID, título, descripción, procedencia, fuente, localizador, método y fecha. Las propuestas necesitan ID, caso, pregunta, valor válido, evidencias y motivo. No guardes contenido secreto ni información personal innecesaria. El analizador integrado no almacena las líneas completas que encuentra, solo localizadores y hashes.

Importa con `observations import --id ID --file FILE.json`. Las propuestas deben permanecer `PENDING`. Presenta la evidencia y solicita confirmación al usuario antes de `proposals accept`. Una propuesta para una pregunta todavía no activa se podrá conservar, pero no aplicar hasta resolver sus antecedentes.

Una observación `INFERRED` no puede considerarse por sí sola prueba de un requisito legal. La confirmación del usuario se conserva como `DECLARED` y referencia la evidencia original. Una evidencia `CONFLICTING` impide aceptar automáticamente una propuesta: descártala o resuelve la contradicción y aporta evidencia coherente.

La inspección web integrada lee una página sin JavaScript. Si dispones de navegador, registra de manera explícita el alcance adicional. No envíes formularios ni accedas a información privada sin autorización. Los comandos que ejecutan el proyecto objetivo o modifican sus archivos no son parte de la inspección predeterminada.

## Informes, revisiones y consumo programático

Todos los comandos producen JSON y códigos de salida distintos de cero ante error. Para evitar cabeceras de npm, utiliza `node --import tsx src/cli/main.ts ...`.

`report --format md|html|pdf|docx|json` guarda en `reports/` del expediente. `seal` conserva un snapshot. `reproduce --revision REV` comprueba integridad y vuelve a ejecutar el motor compatible. `revise` crea un expediente editable y conserva el anterior. `compare --before ID --after ID` compara resultados.

La exportación de un expediente sellado usa el resultado conservado. Si una versión futura cambia el motor, podrá seguir leyéndose el snapshot, pero reproducirlo exigirá la versión de motor indicada, disponible en la etiqueta Git correspondiente.

La IA puede explicar estos resultados en la conversación. No debe añadir obligaciones, cambiar fechas o eliminar advertencias del resultado canónico.
