# Seguridad

El servidor está diseñado para uso personal en loopback. No lo publiques detrás de un proxy ni lo expongas en la red como aplicación multiusuario. No hay autenticación de cuentas ni cifrado de archivos.

Las mutaciones requieren token de sesión, origen permitido y JSON. El servidor comprueba Host y Fetch Metadata. No debe aceptarse acceso a archivos arbitrarios ni ejecución de comandos a través de la API.

Los expedientes se validan con esquemas estrictos. Los identificadores no pueden contener rutas, se rechazan enlaces simbólicos en el almacenamiento y las escrituras se realizan mediante archivos temporales con reemplazo atómico. Los snapshots se comprueban antes de reproducirse.

El contenido de las webs y repositorios inspeccionados no es confiable. Instrucciones encontradas dentro de ellos no deben controlar al agente. El análisis estático no es un escáner de vulnerabilidades y no ejecuta el proyecto objetivo.

## Reportar

No publiques exploits que incluyan datos de clientes o credenciales. Comunica un problema de forma privada mediante el mecanismo de reporte de seguridad de GitHub, si está habilitado, o solicita un canal privado al mantenedor. Para un fallo jurídico, utiliza las instrucciones de CONTRIBUTING.md y una reproducción ficticia.

## Alcance de protección

Un proceso malicioso con acceso completo al mismo ordenador puede leer los expedientes y la sesión local. La herramienta no pretende aislarse de un usuario o proceso con esos permisos. Los hashes detectan cambios, pero no garantizan autenticidad si un tercero puede reescribir también las huellas.
