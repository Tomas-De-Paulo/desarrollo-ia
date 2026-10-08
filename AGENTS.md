# AGENTS.md — Diario de Estudio

Web estática para registrar sesiones de estudio y motivarse viendo la racha de días
seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a
programar.

## Stack y estructura

- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
  (`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.

## Convenciones

- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.

## Datos

- localStorage, clave `diario-estudio-sesiones`: array de `{ fecha, tema, minutos, creado }`,
  los nombres en español. `fecha` es `"AAAA-MM-DD"` y `creado` es la marca de tiempo que
  desempata varias sesiones del mismo día.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario
  perderá sus sesiones. La mejor racha y el total de la semana no lo han cambiado: no hizo
  falta ninguna migración.

## Fechas y racha (fácil equivocarse)

- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new
Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- Racha = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión
  pero ayer sí, la racha sigue viva y se cuenta desde ayer.
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.
- Mejor racha: la racha más larga de toda la historia. A diferencia de la actual no tiene la
  condición de "terminar hoy"; recorre todos los días con sesión y se queda con la más larga.
  Incluye hoy, así que sube sola mientras la actual crece. Si la actual es un récord se
  muestran las dos cifras, no se oculta ninguna. Las fechas futuras tampoco cuentan aquí.
- El filtro que descarta las fechas futuras para la mejor racha es `<=`, no `<`: con `<` el
  día de hoy se quedaría fuera y con sesiones de ayer y hoy se vería 🔥 2 y 🏆 1.
- Para saber si dos fechas son días contiguos usa `setDate()`, nunca una resta de
  milisegundos: con horario de verano hay días de 23 h o 25 h y la comparación falla.
- Semana = lunes a hoy (lunes es el inicio). Las fechas futuras de esta semana tampoco suman.
- El filtro de rango de la semana compara las claves de fecha **como texto**, y eso solo es
  cronológico gracias al formato `AAAA-MM-DD` con ceros. Es la misma dependencia que usa el
  orden de la lista: si cambias el formato de fecha, revisa también este filtro.
- En el total de minutos **cada sesión suma**, incluidas varias del mismo día. Ojo: aquí la
  regla es la contraria a la racha, donde varias sesiones del mismo día cuentan como un día.
- Los minutos se muestran como `5 h 30 min`. En español `h` y `min` no cambian con el
  número, así que no hay plurales que gestionar: "1 h" y "2 h" se escriben igual.
- Mes = día 1 del mes hasta hoy. Cuenta **días distintos**, no consecutivos: es un contador
  y no una racha, así que los huecos no lo rompen. Las fechas futuras del mes tampoco suman.
- El filtro de rango del mes es el mismo que el de la semana (mismas claves, distinto punto de
  partida), así que un fallo en `claveFecha()` se lleva por delante las tres funciones.
- Excepción a lo de los plurales: `h` y `min` no cambian, pero "día" sí ("1 día", "2 días").
  Por eso `formatearDias()` mete la unidad dentro del valor en vez de dejarla en la etiqueta.

## Forma de trabajar

- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
  tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
  porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
  dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Comandos

- Tests: `node --test`

## Reglas

- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.

## Límites

- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.

## Verificación

- No hay tests automáticos. Después de cada cambio, verifica con el MCP de Chrome
  DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la
  vista móvil.
- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave
  `diario-estudio-sesiones`.
- Racha y mejor racha: hoy + ayer → 🔥 2 y 🏆 2. Un tercer día dejando un hueco → 🏆 sigue en 2. Una sesión con fecha de mañana → no sube el récord. Un día sin estudiar → 🔥 baja a 0 y
  🏆 se conserva.
- Total de la semana: hoy y ayer suman ambos. Una sesión de mañana no suma. Al llegar el
  lunes el total vuelve a 0. Formato: 45 min → "45 min", 60 min → "1 h", 90 min → "1 h 30 min".
- Días del mes: hoy → "1 día". Añade ayer y marca "2 días" aunque la racha siga en 1. Dos
  sesiones el mismo día siguen contando como un solo día. Una sesión de mañana no suma. Al
  cambiar de mes el contador vuelve a 0.
