# PRP — Diagnóstico local del AI Act asistido por IA

Versión: 1.0 · Fecha: 13 de septiembre de 2026
Estado: especificación de producto para implementación
Nombre provisional del repositorio: `ai-act-local`

## 1. Visión y objetivo

Crear un repositorio que cualquier persona pueda descargar, ejecutar en su ordenador y utilizar con su asistente de IA para identificar cómo afecta el AI Act a sus usos de inteligencia artificial, a los proyectos que desarrolla o a los de sus clientes.

El usuario podrá iniciar un cuestionario, analizar una web o un repositorio de código, o combinar ambas vías. Obtendrá un expediente local con los usos identificados, respuestas, evidencias, roles, conclusiones, obligaciones, fechas, acciones y fuentes.

El repositorio contendrá un motor determinista ejecutable, catálogos versionados, instrucciones para agentes, una interfaz de línea de comandos y una interfaz web local para responder mediante botones y tarjetas. La IA del usuario ayudará a investigar y explicar; la clasificación procederá del motor.

La distribución se orienta a compañeros de un foro y a una eventual publicación abierta en GitHub. El producto debe ser comprensible para desarrolladores y para usuarios capaces de abrir una carpeta con su asistente de IA.

## 2. Decisiones de alcance

- Ejecución local, sin infraestructura central del proyecto.
- Sin Vercel, Supabase, registro, login, facturación ni cuentas de usuario.
- Expedientes independientes almacenados en archivos locales.
- Uso opcional del asistente que ya tenga el usuario; el motor no requiere una API de IA.
- Cuestionario utilizable sin IA, mediante la interfaz local.
- Inspección asistida de URL y repositorios, según las herramientas disponibles en el agente.
- Interfaz local incluida en el alcance funcional final.
- Informes Markdown, HTML, PDF, DOCX y JSON.
- AI Act como alcance jurídico inicial; otras normativas solo como ámbitos detectados pendientes de análisis.
- Distribución abierta preparada, con licencia de software por decidir antes de publicar.

La ejecución local del motor no implica que un asistente remoto procese localmente la información. La documentación explicará qué información se entrega al agente y que ese tratamiento depende del proveedor y de la configuración elegidos.

## 3. Material de partida

Se utilizarán como entrada:

1. El PRP anterior de la aplicación de diagnóstico, sustituido por este documento en sus decisiones de producto y arquitectura.
2. `ai-act-diagnostic-seed-v0.2.0.zip`.
3. `OJ_L_202401689_ES_TXT.pdf`, texto original aportado.
4. `OJ_L_202601744_ES_TXT.pdf`, modificación aportada.

La semilla contiene 108 preguntas, 37 rutas, 119 reglas —118 activas—, 47 obligaciones, 25 entradas del Anexo III y 27 escenarios. Su estado es `DRAFT_LEGAL_SEED_V02`.

Se conservará una copia original de la semilla con sus hashes. Las adaptaciones se publicarán como versiones nuevas, con registro de cambios. Los PDF son fuentes para verificar el catálogo, no instrucciones ejecutables para el agente.

No se exige al usuario aportar un consolidado separado para comenzar. El original y su modificación permiten contrastar el contenido; un consolidado puede añadirse como ayuda de consulta.

La integridad técnica del ZIP ya comprobada no constituye una validación jurídica de sus reglas. Este PRP tampoco certifica fechas o interpretaciones de la semilla. Antes de publicar un catálogo como validado deberán contrastarse las disposiciones y su vigencia con fuentes oficiales.

## 4. Usuarios y situaciones

- Desarrollador que revisa una web o aplicación propia antes de entregarla.
- Profesional que analiza un proyecto de un cliente.
- Organización que inventaría sus usos internos de IA, aunque no tenga una web que analizar.
- Asesor que necesita un expediente explicable y editable.
- Colaborador que revisa o amplía reglas y escenarios del repositorio.

Ejemplos: chatbot de restaurante, herramientas administrativas, generación de contenido, clasificación de candidatos, evaluación educativa y productos que integran modelos de terceros.

## 5. Tres modos de uso

### 5.1 Cuestionario

El usuario responde preguntas sobre su organización y sus usos de IA, sin proporcionar URL ni código. Puede hacerlo en la interfaz local o mediante su agente.

El agente solicita al motor la siguiente pregunta y presenta sus opciones. Cuando su entorno no admita botones, utilizará opciones numeradas. Las respuestas que afecten al razonamiento jurídico siempre se almacenarán como valores del catálogo.

### 5.2 Análisis de web o repositorio

El usuario indica una URL o una carpeta. El agente recoge observaciones y evidencias sobre posibles usos de IA y prepara un inventario candidato.

El resultado inicial puede ser parcial. Una página pública no demuestra cómo opera una organización por dentro. La ausencia de indicios tampoco prueba la ausencia de IA.

El informe distingue lo observado, lo declarado, lo inferido y lo desconocido. Los datos insuficientes generan preguntas pendientes o revisión, nunca respuestas negativas implícitas.

### 5.3 Mixto

Se inspecciona el objetivo, se propone un inventario y el usuario confirma o corrige los usos detectados. El motor solicita únicamente las preguntas pendientes necesarias para completar el diagnóstico.

Los tres modos comparten catálogos, validación, inferencia y modelo de informe. Con las mismas entradas confirmadas, versiones y fecha de evaluación deben producir el mismo resultado jurídico.

## 6. Unidad de diagnóstico

La unidad principal es cada caso de uso de IA. La organización proporciona contexto y puede tener obligaciones transversales.

Una web puede contener varios casos; un caso puede abarcar distintas páginas o componentes. Un repositorio puede implementar un sistema que distintas organizaciones utilicen con finalidades diferentes.

Cada caso identificará, cuando se conozca:

- Organización y proceso analizados.
- Sistema o componente utilizado.
- Finalidad, funciones y personas afectadas.
- Contexto de despliegue y papel de la organización.
- Evidencias y respuestas que lo describen.

Las selecciones de descubrimiento no crearán automáticamente casos independientes. «ChatGPT», «textos» y «marketing» pueden describir el mismo uso. El usuario podrá agrupar, separar, añadir y eliminar casos antes de confirmarlos.

## 7. Flujo funcional

1. Crear un expediente y elegir modo.
2. Delimitar organización, objetivo, contexto y fecha de evaluación.
3. Recoger observaciones, cuando corresponda.
4. Descubrir y confirmar los casos de uso.
5. Responder las preguntas pertinentes para cada caso.
6. Completar las preguntas organizativas transversales.
7. Revisar respuestas, incertidumbres y evidencia disponible.
8. Evaluar el diagnóstico y mostrar resultados.
9. Generar el plan de acción y exportar informes.
10. Sellar una revisión para conservarla y poder compararla posteriormente.

Se podrá guardar, cerrar y continuar desde cualquier paso. La inspección es una entrada opcional; no condiciona el cuestionario.

## 8. Reparto de responsabilidades

| Componente | Responsabilidad |
| --- | --- |
| Agente de IA | Inspeccionar, recoger evidencias, proponer usos y respuestas, presentar preguntas y explicar resultados existentes. |
| Usuario | Aportar contexto interno y confirmar hechos que requieran su conocimiento. |
| Catálogo de preguntas y rutas | Definir qué se pregunta, las opciones válidas y las condiciones de navegación. |
| Normalizador y constructor de hechos | Validar respuestas y transformarlas en hechos con procedencia. |
| Motor jurídico | Evaluar reglas, roles, clasificaciones, obligaciones y aplicabilidad temporal. |
| Generador de informes | Representar los resultados sin alterar su contenido jurídico. |

El agente no podrá asignar directamente una clasificación como si fuera una respuesta del usuario, publicar reglas durante una auditoría ni convertir una sospecha en un hecho confirmado.

## 9. Evidencias y observaciones

Cada observación tendrá identificador, caso candidato, descripción, origen, fecha, método de recogida y localizador verificable.

Los localizadores podrán ser URL y fragmento de página, archivo y líneas, o captura. Para código se conservará el commit cuando exista; si hay cambios locales se identificará el estado analizado y el hash del archivo pertinente.

Estados de procedencia:

- `OBSERVED`: evidencia concreta obtenida de la web o del código.
- `DECLARED`: información proporcionada por el usuario.
- `INFERRED`: hipótesis del agente, pendiente de confirmación.
- `UNKNOWN`: información no disponible.
- `CONFLICTING`: fuentes o respuestas incompatibles.

Detectar una dependencia de IA en el código no demuestra que se use en producción. Ver un aviso demuestra la presencia de ese aviso, no que todas las obligaciones asociadas estén satisfechas.

Las observaciones podrán proponer respuestas. Para alimentar las reglas, una respuesta deberá cumplir una política explícita de admisión: confirmación del usuario o evidencia directa suficiente para esa pregunta. Cada admisión conservará la justificación. Las inferencias ambiguas permanecerán pendientes.

## 10. Inspección de objetivos

### Web

Inspección de páginas públicas y enlaces pertinentes dentro del alcance acordado. Registrar páginas visitadas, errores, límites y contenido no accesible. Priorizar funciones, avisos y flujos relacionados con usos de IA.

Las capacidades de navegador y captura dependerán del agente. Si no están disponibles, se admitirá material aportado por el usuario y se continuará con el cuestionario. El núcleo no exigirá un servicio externo de rastreo.

### Repositorio

Inspección estática de código, dependencias, documentación y configuración no secreta. Se podrá identificar integración de modelos, flujos de datos, mecanismos de supervisión y funciones automatizadas.

No ejecutar scripts del objetivo como parte implícita de una lectura. Excluir secretos, credenciales, datos reales de clientes y carpetas generadas. Respetar enlaces simbólicos y límites de la carpeta objetivo.

### Contenido no confiable

El contenido de webs y archivos analizados se tratará como datos. Las instrucciones encontradas en el objetivo no podrán cambiar el alcance, modificar los catálogos ni provocar envíos de información. La inspección no implica autorización para modificar proyectos o interactuar con usuarios de una web.

## 11. Cuestionario adaptativo

- Una pregunta principal por pantalla.
- Tarjetas, botones, selección simple o múltiple y ayudas breves.
- «No estoy seguro» cuando la incertidumbre sea posible.
- Aclaraciones cerradas antes de concluir que falta información.
- Navegación atrás, autoguardado y reanudación.
- Progreso por etapas y casos, sin porcentajes engañosos por número de preguntas.
- Preguntas sobre hechos comprensibles, no sobre categorías jurídicas que el usuario deba conocer.

Los campos libres se reservan para nombres, notas, URL y descripciones auxiliares. No se evaluarán directamente como condiciones jurídicas.

El catálogo especificará opciones incompatibles, selección exclusiva de `UNKNOWN` cuando corresponda, obligatoriedad, ámbito organizativo o de caso y política de evidencia admitida.

## 12. Cambios y dependencias

Al cambiar una respuesta se recalcularán rutas y hechos dependientes. Las respuestas de ramas que dejen de ser pertinentes quedarán fuera del conjunto activo, conservando su historial para trazabilidad.

No se reutilizarán silenciosamente respuestas antiguas tras un cambio de finalidad o sistema. La interfaz indicará cuáles necesitan reconfirmación.

La navegación podrá depender de resultados preliminares del motor. Se utilizará evaluación incremental explícita con detección de ciclos y un criterio de estabilización. La evaluación final volverá a calcular todo desde las entradas activas.

## 13. Contrato de datos

Separar las siguientes entidades:

- `Assessment`: expediente, modo, organización, alcance y estado.
- `Target`: web o repositorio, opcional.
- `AIUseCase`: caso confirmado o candidato.
- `Observation`: evidencia o hipótesis recogida.
- `AnswerProposal`: respuesta sugerida con sus referencias.
- `Answer`: respuesta admitida, con procedencia y estado.
- `Fact`: hecho normalizado y sus dependencias.
- `Evaluation`: resultado derivado exclusivamente por el motor.
- `Action` y `EvidenceRequirement`: acciones y evidencias requeridas o recomendadas.
- `Snapshot`: revisión sellada e inmutable.

Todos los archivos tendrán esquema y versión. El motor rechazará identificadores desconocidos, opciones inválidas, estructuras ambiguas y versiones incompatibles con mensajes claros.

Se resolverá la mezcla actual de identificadores de preguntas y estados derivados en las condiciones de la semilla mediante una migración explícita a hechos normalizados y estado de evaluación separado.

## 14. Normalización y lógica de incertidumbre

`YES`, `NO` y `UNKNOWN` tendrán significados distintos. Un dato ausente no equivale a `NO`; una contradicción tampoco se resolverá eligiendo arbitrariamente una fuente.

Las condiciones manejarán al menos tres valores: verdadero, falso y desconocido. Se documentará su comportamiento con AND, OR y negación.

Los hechos conservarán pregunta, respuesta, evidencia y regla de derivación. Los campos calculados como rol o clasificación no se aceptarán en el canal de respuestas públicas.

Una conclusión negativa solo se emitirá cuando exista información suficiente para descartar su condición. En otros casos se mostrará que no ha podido determinarse.

## 15. Motor jurídico

Pipeline de referencia:

1. Validación y normalización de entradas.
2. Construcción de hechos.
3. Ámbito de aplicación y exclusiones.
4. Roles y cambios de rol.
5. Prácticas prohibidas y excepciones.
6. Candidatos de alto riesgo de Anexos I y III.
7. Filtro del artículo 6 cuando corresponda.
8. Régimen GPAI.
9. Transparencia.
10. Obligaciones por rol y organizativas.
11. Evaluación de impacto en derechos fundamentales cuando corresponda.
12. Aplicabilidad temporal y transitorios.
13. Acciones, evidencias y explicación trazable.

El orden concreto deberá resolver las dependencias del catálogo, incluidas transiciones de rol dependientes del riesgo. Se admitirán etapas internas adicionales sin cambiar el contrato externo.

Reglas declarativas con operadores limitados y documentados; nunca ejecución de código arbitrario desde JSON. Cada regla tendrá versión, condiciones, resultado, fuente, ámbito, fechas cuando procedan, explicación y estado de revisión.

## 16. Clasificaciones y roles coexistentes

No reducir el diagnóstico a un único enum excluyente. Separar dimensiones:

- Ámbito: aplicable, excluido, limitado o indeterminado.
- Roles: conjunto de papeles detectados y cambios de rol.
- Prohibiciones: hallazgos y excepciones por práctica.
- Alto riesgo: candidato, confirmado, excepción o revisión, con su fundamento.
- Transparencia: obligaciones detectadas de forma independiente.
- GPAI: clasificación y obligaciones propias.
- Incertidumbre y cobertura: cuestiones pendientes.

Un caso puede ser de alto riesgo y tener obligaciones de transparencia. El resumen visual no eliminará resultados secundarios. «Sin obligaciones especiales detectadas» no significará «cumplimiento global certificado».

## 17. Catálogo jurídico y cobertura

La semilla v0.2 es el punto de partida. Se auditarán las referencias, condiciones, excepciones y fechas antes de elevar una regla a estado validado.

Mantener una matriz de cobertura por materia: implementada y validada, implementada en borrador, parcial o no cubierta. Las áreas incompletas deben generar limitaciones visibles cuando afecten al caso.

Pendientes ya identificados en el paquete: Anexo I exhaustivo, obligaciones específicas de importadores/distribuidores/representantes, variantes de registro, casuística policial nacional, transitorios y revisión de excepciones de transparencia.

La presencia de 25 entradas del Anexo III no prueba que todas sus condiciones estén cubiertas por preguntas y reglas. Se verificará la cadena completa por entrada.

Las directrices citadas en el material previo solo se incorporarán con una fuente identificada, verificable y versionada. Ante discrepancias se registrará el hallazgo y se dejará la regla afectada pendiente de revisión; una auditoría de usuario no modificará el catálogo automáticamente.

## 18. Fechas y reproducibilidad

La fecha de evaluación será una entrada explícita. Ninguna decisión reproducible dependerá silenciosamente de la fecha del ordenador.

El motor distinguirá clasificación, existencia de obligación, aplicabilidad temporal y estado de cumplimiento declarado. No deducirá que una obligación está incumplida por el mero hecho de que se aplique.

Las fechas se obtendrán de datos versionados y verificados. No se fijan en este PRP las fechas de la semilla como conclusiones legales ya auditadas.

Iguales respuestas activas, hechos admitidos, fecha de evaluación y versiones producirán un resultado jurídico canónico idéntico. Los metadatos de ejecución, como la hora de exportación, se separarán del contenido utilizado para comparar resultados.

## 19. Obligaciones y acciones

Cada obligación mostrará:

- Qué exige y a qué caso o entidad afecta.
- Condiciones que la activaron.
- Respuestas y evidencias utilizadas.
- Artículo, apartado, fuente y versión.
- Aplicabilidad actual, futura o transitoria.
- Estado declarado o acreditado y puntos por comprobar.
- Acción sugerida y evidencia pertinente.

Separar obligaciones normativas de recomendaciones operativas. Una política interna recomendada no se presentará como obligación universal sin respaldo específico.

El plan de acción ordenará urgencia, aplicabilidad, gravedad y revisión pendiente. No asignará un porcentaje global de cumplimiento.

## 20. Expedientes y persistencia local

Estructura orientativa:

```text
audits/<expediente>/
  assessment.json
  targets.json
  use-cases.json
  observations.json
  answer-proposals.json
  answers.json
  facts.json
  result.json
  trace.json
  actions.json
  events.jsonl
  evidence/
  revisions/<revision>/
  reports/
```

Permitir elegir una carpeta de expedientes fuera del repositorio. La carpeta local predeterminada estará excluida de Git. Los ejemplos públicos usarán datos ficticios y vivirán en otra ubicación.

Utilizar escrituras atómicas, detección de edición concurrente y recuperación de borradores. No sobrescribir una revisión sellada ni aceptar rutas que escapen al directorio del expediente mediante nombres manipulados.

## 21. Sellado y revisiones

Un borrador puede editarse. Al sellar se conservan las entradas activas, evidencias referenciadas, resultados, fecha de evaluación y versiones exactas de preguntas, reglas, obligaciones y fuentes.

Incluir los catálogos necesarios en el snapshot o conservarlos por contenido de forma que la reproducción no dependa de que una versión remota siga disponible.

Los hashes permiten detectar cambios; no constituyen por sí solos una firma digital ni un sellado de tiempo certificado.

Actualizar reglas crea una nueva evaluación o revisión. La comparación distinguirá cambios en respuestas, normativa, motor, clasificación, obligaciones y fechas. El historial anterior permanecerá intacto.

## 22. Informes

Todos los formatos se generarán desde el mismo modelo estructurado:

- Markdown para lectura en el repositorio y edición sencilla.
- HTML autónomo para abrir y compartir sin servidor.
- PDF para entrega final.
- DOCX para revisión profesional.
- JSON para reproducción e integraciones.

Contenido: alcance, organización, usos, metodología, cobertura, resultados por caso, obligaciones, acciones, evidencia, incertidumbres, normativa adicional detectada, fuentes y trazabilidad.

El HTML no cargará recursos externos por defecto. Los formatos de entrega ocultarán rutas locales sensibles y secretos; las referencias internas se podrán conservar en el expediente técnico.

El informe deberá ser completo mediante plantillas deterministas. Una explicación adicional del agente se identificará como texto auxiliar y no sustituirá los resultados canónicos. No se precisa construir una integración LLM propia.

## 23. Interfaz local

Aplicación servida en `127.0.0.1`, con apertura manual o asistida en el navegador. Pantallas:

1. Lista de expedientes y creación.
2. Selección del modo y alcance.
3. Inventario de casos y confirmación de propuestas.
4. Cuestionario adaptativo.
5. Revisión de respuestas y pendientes.
6. Resultados, obligaciones y plan de acción.
7. Evidencias y trazabilidad.
8. Exportación y comparación de revisiones.

Objetivo de accesibilidad: WCAG 2.2 AA, con teclado, foco visible, controles semánticos, contraste y estados que no dependan del color.

Sin panel jurídico administrativo complejo en la primera versión: los catálogos se mantendrán mediante archivos, comandos de validación, pruebas y revisión de cambios en Git.

## 24. CLI e integración con agentes

Una CLI común será el contrato de integración. Comandos previstos, cuya sintaxis final se documentará:

```text
ai-act init
ai-act observations import
ai-act cases confirm
ai-act questions next
ai-act answers set
ai-act evaluate
ai-act report
ai-act seal
ai-act compare
ai-act catalog validate
ai-act scenarios test
```

Los comandos admitirán salida JSON estable, códigos de error y modo no interactivo. `questions next` devolverá opciones, ayuda y ámbito. `answers set` validará la entrada antes de guardarla.

El README incluirá un prompt de inicio para cada modo. `AGENTS.md` explicará cómo usar la herramienta y distinguirá mantenimiento del repositorio de análisis de un objetivo. Se podrán añadir instrucciones breves para otros agentes, remitiendo al contrato común para evitar divergencias.

La compatibilidad se describirá según capacidades comprobadas: lectura local, ejecución de comandos y, para inspección web, navegación. No se prometerá compatibilidad universal ni botones interactivos en todos los chats.

## 25. Arquitectura y stack propuesto

- Node.js LTS compatible, fijado y documentado al implementar.
- TypeScript para dominio, motor, CLI y servidor local.
- React y Vite para la interfaz local.
- Zod o validación equivalente para esquemas y entradas.
- JSON para catálogos y expedientes; JSONL para eventos.
- Vitest para motor y escenarios; Playwright para recorridos de la interfaz.
- Generadores de documentos locales, desacoplados de la UI.

No se necesita Next.js ni una base de datos para este alcance. El adaptador de persistencia se separará del dominio para permitir una evolución posterior sin alterar las reglas.

La instalación documentará requisitos y ofrecerá comandos sencillos, previsiblemente `npm ci` y `npm run local`. El funcionamiento básico debe verificarse en Windows, macOS y Linux. Las versiones concretas de dependencias se elegirán durante la implementación.

## 26. Estructura del repositorio

```text
AGENTS.md
README.md
package.json
src/
  domain/
  engine/
  questionnaire/
  application/
  storage/
  cli/
  server/
  ui/
  reports/
legal/
  originals/
  sources/
  catalogs/<version>/
  coverage/
schemas/
examples/
tests/
  engine/
  scenarios/
  integration/
  e2e/
docs/
  usage/
  agents/
  legal-maintenance/
audits/                    # contenido privado, excluido de Git
```

UI, CLI y agentes consumen los mismos servicios. La lógica jurídica vive en catálogos y motor; no se duplica en componentes, prompts o exportadores.

## 27. Privacidad y seguridad local

- Sin telemetría ni subida automática de expedientes.
- Motor y cuestionario operativos sin red después de instalar dependencias.
- Inspección web y asistentes remotos claramente identificados como funciones que pueden usar red.
- Servidor limitado a loopback, validación de origen y protección frente a peticiones de otras webs; sesión o token local cuando corresponda.
- Sin acceso arbitrario al sistema de archivos desde la API local.
- Escape de contenido no confiable en informes e interfaz.
- Credenciales y archivos de clientes excluidos de ejemplos y Git.
- Ningún almacenamiento de CV, historiales médicos u otros datos personales innecesarios para describir un proceso.

El almacenamiento inicial no se presentará como cifrado. La protección del ordenador y de las copias del expediente seguirá dependiendo del entorno del usuario.

## 28. Pruebas y aceptación del catálogo

La suite separará:

1. Integridad: esquemas, identificadores, referencias, hashes y destinos de rutas.
2. Evaluador: operadores, incertidumbre, precedencia y resultados coexistentes.
3. Reglas: casos positivos, negativos, excepciones y fronteras.
4. Escenarios de módulo: estados derivados preparados explícitamente como fixtures.
5. Escenarios de extremo a extremo: únicamente respuestas admitidas y evidencia, sin inyectar roles o clasificaciones.
6. Navegación: todas las preguntas necesarias son alcanzables, sin ciclos ni ramas huérfanas.
7. Tiempo: fechas frontera y transitorios, con fecha de evaluación explícita.
8. Persistencia: reanudación, cambios de respuesta, sellado y reproducción.
9. Seguridad: aislamiento de rutas, contenido malicioso en evidencias y exclusión de datos privados.
10. Exportación: coherencia del contenido jurídico entre formatos.

Los 27 escenarios existentes se revisarán y categorizarán: algunos contienen estados derivados y no constituyen recorridos completos. Se incorporarán al menos 30 escenarios iniciales con cobertura significativa y se ampliarán según las reglas validadas, sin perseguir un número como sustituto de cobertura.

Un test basado en una interpretación errónea también puede pasar. La aprobación jurídica de los resultados esperados es independiente de la ejecución técnica de la suite.

## 29. Mantenimiento y publicación

Flujo de catálogo: borrador → validación técnica → revisión jurídica registrada → publicación de versión.

Cada cambio indicará fuentes, reglas afectadas, motivo, pruebas y consecuencias para expedientes. No habrá actualización normativa automática ni reescritura silenciosa de diagnósticos.

Antes de publicar el repositorio se decidirá la licencia y se documentarán por separado las condiciones de código, catálogos y documentos de terceros. Se incluirán guía de contribución, reporte de errores jurídicos, limitaciones conocidas y un ejemplo ficticio reproducible.

La publicación en GitHub es un paso posterior; este PRP define un repositorio preparado para compartir, sin autorizar por sí mismo su publicación.

## 30. Orden de construcción y prueba one shot

La implementación se plantea como una prueba one shot, sin el proceso obligatorio de tasks y subtasks detallados de la Forja. Se conservan las convenciones útiles de arquitectura, documentación, seguridad, calidad y verificación que resulten aplicables.

El orden interno será:

1. Importar materiales, preservar originales y validar catálogos.
2. Definir contratos y migrar respuestas/hechos/estado derivado.
3. Construir motor, navegación, CLI y pruebas jurídicas.
4. Añadir expedientes, evidencia, snapshots e informes.
5. Construir la interfaz local y las instrucciones de agentes.
6. Verificar los tres modos y preparar documentación de distribución.

Este orden no recorta el alcance funcional. Si una materia jurídica no está validada, la aplicación debe indicarlo de forma precisa y producir resultados parciales trazables para lo que sí cubra.

## 31. Criterios de aceptación del producto

El repositorio estará funcionalmente completo cuando:

- Se instale y ejecute siguiendo el README en los sistemas soportados.
- El cuestionario funcione sin cuentas, servicios propios ni IA.
- Un agente pueda usar la CLI para guiar el mismo cuestionario.
- Se admitan observaciones de una URL y de una carpeta de código con procedencia.
- El modo mixto complete preguntas pendientes sin tratar inferencias como certezas.
- Se gestionen varios casos por expediente sin duplicación automática de usos solapados.
- La navegación respete dependencias y cambios de respuestas.
- El motor conserve incertidumbre, roles múltiples y clasificaciones coexistentes.
- Las obligaciones incluyan fuente, motivo, fecha y estado con su evidencia.
- Se muestren límites de cobertura y cuestiones pendientes.
- Se generen los cinco formatos previstos desde el mismo resultado.
- Un snapshot pueda reproducirse y compararse sin modificar el original.
- Los expedientes privados queden excluidos de Git.
- La suite jurídica y los recorridos funcionales necesarios pasen.
- La documentación explique los tres modos, requisitos, mantenimiento y límites.

«Funcionalmente completo» y «catálogo jurídicamente validado» se reportarán por separado. No se declarará cobertura exhaustiva del AI Act mientras existan áreas pendientes relevantes.

## 32. Fuera de alcance

- SaaS, usuarios remotos, equipos colaborativos y facturación.
- Backend alojado o base de datos gestionada.
- Certificación oficial de cumplimiento.
- Auditoría automática de toda la actividad interna a partir de una URL.
- Escáner de vulnerabilidades o pruebas intrusivas de webs.
- Modificación automática de proyectos analizados.
- Motores completos de RGPD u otras leyes.
- Monitorización regulatoria automática y notificaciones.
- Integraciones propias de pago con proveedores LLM.
- Firma electrónica o sellado de tiempo certificado.

## 33. Entregables

Repositorio ejecutable; motor determinista; catálogos versionados y originales preservados; matriz de cobertura; esquemas; CLI; interfaz local; instrucciones para agentes; gestión de expedientes; exportadores; pruebas; ejemplos ficticios; documentación de instalación, uso, arquitectura y mantenimiento jurídico.

La experiencia buscada es sencilla: abrir el repositorio, indicar «quiero responder preguntas» o «analiza este proyecto», completar lo que falta y obtener un expediente comprensible, reproducible y respaldado por fuentes.
