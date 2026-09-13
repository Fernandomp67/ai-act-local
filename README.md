# AI Act Local

**Preguntas claras. Decisiones trazables.** Un repositorio local para analizar usos de IA mediante un cuestionario adaptativo, inspección asistida de proyectos y un motor de reglas del AI Act.

Sin cuentas, Supabase, Vercel, telemetría ni servicio de IA propio. Los expedientes permanecen en tu ordenador. El cuestionario funciona sin un asistente de IA; también puedes abrir el repositorio con tu agente y utilizar la CLI.

> Versión inicial experimental. El motor es ejecutable y verificable; el catálogo jurídico sigue en **borrador**. No es una certificación de cumplimiento ni una cobertura exhaustiva del AI Act. Consulta [cobertura y revisión jurídica](docs/legal-maintenance/REVIEW.md).

## Empezar

Necesitas **Node.js 22.12 o posterior** y npm. Se recomienda una versión LTS. La instalación inicial requiere Internet; después, el cuestionario, motor e informes funcionan sin red.

```sh
git clone https://github.com/Fernandomp67/ai-act-local.git
cd ai-act-local
npm ci
npm run local
```

Abre **http://127.0.0.1:4317**. El proceso permanece abierto en la terminal; pulsa Ctrl+C para detenerlo. No expongas este servidor como un servicio público: está diseñado para un único usuario en su ordenador.

Para actualizar: guarda tus cambios locales, descarga una nueva versión y ejecuta `npm ci`. Los expedientes de `audits/` no forman parte de Git. No reemplaces esta carpeta al actualizar. Los diagnósticos sellados conservan su catálogo y resultados históricos.

## Tres formas de usarlo

| Modo | Qué aportas | Qué hace |
| --- | --- | --- |
| Cuestionario | Respuestas cerradas sobre cada uso de IA | Formula preguntas pertinentes, aplica reglas y prepara un informe. |
| Inspección | Una URL o carpeta de un proyecto que puedes analizar | Recoge indicios con procedencia; puedes importar más evidencias desde tu agente. |
| Mixto | Inspección y respuestas confirmadas | Completa lo observado con preguntas sobre lo que no se puede saber desde fuera. |

Una web no muestra todos los usos internos de una empresa. Una dependencia en el código no demuestra que se utilice en producción. Por eso las observaciones del analizador son **hipótesis**, no respuestas jurídicas admitidas automáticamente.

La unidad del diagnóstico es **cada uso de IA**. No crees tres casos para «ChatGPT», «textos» y «marketing» si describen un único proceso.

## Usar con tu asistente

Abre esta carpeta con un agente que pueda leer archivos y ejecutar comandos. Dale, por ejemplo:

> Lee AGENTS.md. Quiero analizar mis usos de IA mediante preguntas cerradas. Crea un expediente, utiliza la CLI para obtener cada pregunta y guarda mis respuestas. Si no sé algo, registra UNKNOWN. Al terminar, genera un informe HTML y PDF con sus fuentes y limitaciones.

O bien:

> Lee AGENTS.md. Inspecciona este proyecto dentro del alcance que te indique. Registra observaciones con referencias verificables, propón los casos de uso y guíame por las preguntas pendientes. Pídeme confirmar las hipótesis antes de usarlas como respuestas.

No hace falta una clave API de OpenAI ni de otro proveedor para la herramienta. Si eliges un asistente remoto, los datos que le compartas estarán sujetos a la configuración y condiciones de ese proveedor: «motor local» no significa «asistente remoto sin transferencia de datos».

Consulta el [contrato para agentes](docs/agents/WORKFLOW.md) y la [guía de uso](docs/usage/GUIDE.md).

## CLI

```sh
npm run cli -- help
npm run cli -- init --name "Mi proyecto" --date 2026-09-13 --mode MIXED
npm run cli -- list
```

Los identificadores los devuelve la CLI. Sustituye `ID` y `CASE_ID` por ellos:

```sh
npm run cli -- cases add --id ID --name "Chatbot de atención"
npm run cli -- questions next --id ID --case CASE_ID
npm run cli -- answers set --id ID --case CASE_ID --question ORG-001 --value ES
npm run cli -- evaluate --id ID
npm run cli -- report --id ID --format pdf
npm run cli -- seal --id ID
```

Selecciones múltiples se envían como un array JSON. En shells donde el entrecomillado resulte incómodo, usa `mutate --file mutation.json`. Hay ejemplos en [examples/](examples/).

La salida de la CLI es JSON. Para invocaciones programáticas sin las cabeceras de npm:

```sh
node --import tsx src/cli/main.ts questions next --id ID --case CASE_ID
```

### Inspección inicial

```sh
npm run cli -- inspect repo --target /ruta/al/proyecto
npm run cli -- inspect web --target https://example.com
```

La inspección de repositorio es estática, limitada y excluye archivos ocultos, secretos, dependencias y directorios generados. La inspección web lee **una página HTML** y no ejecuta JavaScript. Un agente con navegador puede recorrer otras páginas y aportar observaciones adicionales usando el mismo esquema.

No se ejecuta el proyecto analizado, no se envían formularios y no se modifica su código. Para analizar un servidor local propio mediante CLI, especifica `--allow-local` expresamente.

## Informes y seguimiento

Markdown, HTML autónomo, PDF, DOCX y JSON comparten un único resultado estructurado. Incluyen casos, roles, hallazgos, fechas, acciones, evidencias, fuentes, preguntas pendientes y trazabilidad.

Un hallazgo «por comprobar» no significa incumplimiento. Puedes marcar acciones previstas o cumplimiento declarado. La verificación registrada necesita evidencia y justificación; nunca se presenta como certificación de la herramienta.

Sellar guarda un snapshot de respuestas, catálogo y resultado. Los hashes detectan alteraciones, pero no son una firma digital ni un sello temporal certificado. Una nueva revisión crea otro expediente editable.

## Privacidad y archivos

- `audits/` contiene los expedientes privados y está excluido de Git.
- `examples/` contiene únicamente datos ficticios.
- No incluyas CV, mensajes reales, historias clínicas, claves API ni archivos `.env` en las evidencias.
- No hay cifrado propio de expedientes: aplica las medidas y copias de seguridad adecuadas en tu ordenador.
- Puedes elegir otra ubicación mediante `AI_ACT_AUDITS_DIR` o `--root` en la CLI.
- `AI_ACT_PORT` cambia el puerto de la interfaz; el servidor escucha únicamente en `127.0.0.1`.

Ejemplo en PowerShell:

```powershell
$env:AI_ACT_AUDITS_DIR = "C:\MisDiagnosticosIA"
npm run local
```

Ejemplo en macOS/Linux:

```sh
AI_ACT_AUDITS_DIR=/ruta/a/mis-diagnosticos npm run local
```

## Desarrollo y verificaciones

```sh
npm run typecheck
npm test
npm run build
npm run catalog:validate
npm run scenarios:test
npx playwright install chromium
npm run test:e2e
```

`npm test` ejecuta escenarios nuevos, navegación, incertidumbre, persistencia, sellado, informes e inspección. `scenarios:test` es una **auditoría de compatibilidad de los 27 escenarios originales**, no una afirmación de que sus expectativas legales sean correctas: identifica fixtures que inyectaban estados derivados y expectativas modificadas.

La configuración de CI cubre Windows, macOS y Linux. La comprobación real en cada plataforma depende del resultado de esos jobs. [Arquitectura](docs/ARCHITECTURE.md) · [Seguridad](SECURITY.md) · [Contribuir](CONTRIBUTING.md) · [PRP](docs/PRP.md).

## Fuentes y licencia

Se preservan los dos PDF aportados del DOUE y la semilla `ai-act-diagnostic-seed-v0.2.0`, con sus hashes. Las adaptaciones del catálogo están documentadas y versionadas; ninguna regla se publica como revisada por un profesional jurídico sin que exista esa revisión.

El código y las aportaciones originales del proyecto se distribuyen bajo **MIT**. Los textos normativos y demás materiales de terceros conservan sus condiciones propias; consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
