# Guía de uso

## En el navegador

Crea un diagnóstico, selecciona el modo y fija una fecha. Añade uno o varios usos concretos. Las respuestas sobre la organización se comparten entre esos usos; las respuestas sobre finalidad, sistema y funcionamiento pertenecen a cada caso.

Selecciona una opción —o varias donde se permita— y pulsa **Guardar y continuar**. Solo entonces queda persistida. Al volver a abrir el expediente se muestra la siguiente pregunta pendiente. «Revisar respuestas guardadas» permite volver a una anterior.

Los cambios de finalidad, función o adquisición invalidan respuestas condicionales para que no se reapliquen conclusiones antiguas. El historial conserva las respuestas invalidadas. No se borran revisiones selladas.

En **Evidencias** puedes registrar una referencia manual o importar JSON de un agente. En **Resultados** se muestran hallazgos, incertidumbres y trazas. El seguimiento de una acción puede ser «por comprobar», «prevista» o «cumplimiento declarado».

En **Informes y revisiones** puedes descargar los cinco formatos, sellar el estado actual, comprobar su reproducción o crear una nueva revisión. Un diagnóstico parcial puede sellarse, pero seguirá indicando sus carencias.

## Verificación con evidencia mediante CLI

La verificación es una afirmación del revisor, no de la IA ni de la herramienta. Necesita al menos una observación `OBSERVED` o `DECLARED` y una nota justificativa. Utiliza un archivo de mutación:

```json
{
  "action": "compliance",
  "caseId": "CASE_ID",
  "obligationId": "OBL-TR-DEEPFAKE-001",
  "status": "VERIFIED",
  "evidenceIds": ["EVIDENCE_ID"],
  "note": "El revisor ha comprobado el aviso en la publicación identificada."
}
```

```sh
npm run cli -- mutate --id ID --file verification.json
```

Solo se aceptan obligaciones activas. Actualizar respuestas invalida el seguimiento relacionado para evitar que un «cumplido» se traslade a un contexto distinto.

## Copias y recuperación

Cada expediente está en `audits/ID/assessment.json`. Este archivo es la fuente de verdad del borrador: incluye casos, respuestas, observaciones, propuestas y eventos. La escritura es atómica. `reports/` contiene exportaciones; `revisions/` contiene snapshots completos.

Haz copias del directorio de expedientes fuera del repositorio. No envíes esa carpeta a GitHub. La aplicación no cifra ni sincroniza tus archivos.

Si un proceso se interrumpe exactamente mientras tiene el bloqueo de escritura, puede quedar `audits/ID/.write-lock`. Antes de retirar manualmente ese directorio vacío, cierra todas las instancias y guarda una copia del expediente. La herramienta nunca elimina bloqueos automáticamente para evitar interferir con una operación activa.

## Límites de la primera versión

- La inspección integrada ofrece indicios textuales; no un rastreo completo ni un navegador con JavaScript.
- Los informes describen las respuestas confirmadas y la cobertura del catálogo, no una certificación jurídica.
- La normativa no se actualiza automáticamente. Las evaluaciones anteriores al snapshot se marcan como no soportadas históricamente.
- La interfaz no realiza cambios correctivos en el proyecto analizado.
- Los archivos seleccionados como evidencias se referencian; no existe una gestión de subida y almacenamiento de adjuntos binarios en esta versión. Conserva las capturas o documentos originales junto con tu expediente si los necesitas.
