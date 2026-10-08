# Tareas 002 — Objetivo semanal de estudio

Orden de dependencia: primero la lógica pura con sus tests (nada de interfaz hasta que los
cálculos estén verdes), después el HTML/CSS, el guardado y el pintado, y al final la
verificación. Cada tarea dura 20-30 min como máximo. Fuente: `spec.md` + `plan.md`.
La spec está **aprobada**: ninguna tarea necesita aprobación pendiente y la creación de
ficheros nuevos (`objetivo.js`, `tests/objetivo.test.js`) ya está autorizada.

## Fase 0 — Base del módulo de lógica

- [x] **T1. Crear `objetivo.js` con estructura vacía y cargarlo en `index.html` tras `heatmap.js` y antes de `app.js`.**
  - RF: ninguno todavía (habilita todo lo demás). RNF-1, RNF-3.
  - Hecho cuando: al abrir `index.html` con doble clic no hay errores en consola, y un test
    de `node --test` (en el fichero nuevo `tests/objetivo.test.js`) comprueba el orden de
    carga de los tres scripts en verde.

- [x] **T2. `interpretarObjetivo(texto)` con sus tests de válidos e inválidos.**
  - RF: RF-1 (CA-1.2), RF-7 (CA-7.2, CA-7.3).
  - Hecho cuando: `node --test` pasa comprobando que `"300"`→300 y `"007"`→7, y que `""`,
    `null`, `"0"`, `"-5"`, `"90,5"`, `"0,5"`, `"1e3"`, `"30a"` y `" 300"` devuelven `null`
    sin modificar la entrada.

## Fase 1 — Lógica semanal y progreso (lógica pura)

- [x] **T3. Mover `minutosDeEstaSemana()` de `app.js` a `objetivo.js` como pura `(sesiones, hoy)` y consumirla desde el Resumen.**
  - RF: RF-2 (CA-2.3, CA-2.4, CA-2.8). RNF-1, RNF-9.
  - Hecho cuando: los tests pasan con «hoy» inyectado (sesión del lunes cuenta, del domingo
    anterior no, futura no cuenta, dos del mismo día suman, semana pasada no cuenta) y en el
    navegador la cifra «estudiados esta semana» es exactamente la misma que antes del cambio.

- [x] **T4. `calcularProgreso(sesiones, objetivo, hoy)` con los textos en español y sus tests.**
  - RF: RF-2 (CA-2.1, CA-2.2, CA-2.5, CA-2.6, CA-2.8), RF-3 (CA-3.1–3.3), RF-5 (CA-5.1),
    RF-6 (CA-6.3).
  - Hecho cuando: los tests pasan cubriendo: en curso («Te faltan 3 h 30 min»), cumplido
    exacto («Objetivo cumplido»), superado («Superado en 1 h» con el total real y nunca
    cifras negativas), `porcentajeBarra` topada a 100, objetivo 1 min con 0 estudiados,
    objetivo nulo o inválido → `null`, `estudiados === minutosDeEstaSemana(sesiones, hoy)`
    (CA-2.8) y los textos exactos de invitación, valor inválido, guardado y aviso de
    sesiones ilegibles, todos en español y sin porcentaje.

## Fase 2 — Estructura y estilo

- [x] **T5. Añadir el bloque del objetivo en `index.html` (campo, botón, mensaje propio, cifras, barra, aviso) y su CSS responsive.**
  - RF: RF-1 (CA-1.5), RF-2 (CA-2.6, CA-2.7), RF-8 (CA-8.2–8.5). RNF-7, RNF-8.
  - Hecho cuando: en el navegador el bloque aparece dentro de «Resumen», tras «estudiado
    esta semana» y antes de «estudiados este mes», sin tarjeta nueva; el campo mide ≥16 px
    y ≥44 px de alto, la barra tiene `role="progressbar"` con `aria-label`, y a 320/375/512 px
    `document.documentElement.scrollWidth == clientWidth`.

## Fase 3 — Guardado y pintado (app.js)

- [x] **T6. Cargar y guardar el objetivo en `diario-estudio-objetivo` con validación y mensaje propio.**
  - RF: RF-1 (CA-1.1–CA-1.5), RF-7 (CA-7.1), RNF-4.
  - Hecho cuando: con la página abierta, escribir 300 y pulsar «Guardar» (o Intro) guarda
    «300» en `diario-estudio-objetivo`, rellena el campo y confirma «Objetivo guardado.»;
    al recargar, el campo sigue con 300 y la clave de sesiones no cambia ni un byte;
    escribir `90,5` (o 0, vacío, texto) muestra «Escribe un número entero de minutos mayor
    que 0.» en `#objetivoMensaje` (con `aria-live`, nunca en `#mensaje`), el campo conserva
    lo escrito y el objetivo anterior sigue vigente.

- [x] **T7. `pintarObjetivo()` con sus cuatro estados y refresco al cargar, al guardar sesión y al guardar objetivo.**
  - RF: RF-2 (CA-2.1, CA-2.2, CA-2.9), RF-3, RF-4 (CA-4.1, CA-4.2), RF-5 (CA-5.1–5.3),
    RF-6 (CA-6.1–6.3), RF-7 (CA-7.2).
  - Hecho cuando: sin objetivo se ve la invitación y nada de «te falta» o barra; con
    objetivo y sesiones ilegibles (JSON corrupto) se ve el aviso de progreso no calculable
    y nunca un «te falta X» sobre 0; con objetivo y datos sanos se ven cifras «X de Y», el
    estado (faltan/cumplido/superado) y la barra con `aria-valuenow/aria-valuetext`
    actualizados; guardar una sesión refresca el progreso al instante, cambiar el objetivo
    y pulsar Guardar recalcula al instante, y guardando una sesión con fecha de la semana
    pasada o futura el progreso no cambia. Renombra `leerSesionesParaMapa` a
    `leerSesionesConEstado` sin romper el aviso del mapa.

## Fase 4 — Verificación final

- [x] **T8. Batería de verificación en navegador: escritorio y 375 px, cambio de semana simulado, consola y regresiones.**
  - RF: todos (verificación). RNF-5–RNF-9.
  - Hecho cuando: con Chrome DevTools se comprueban los casos límite de la spec (primer
    uso, lunes, sesión futura, domingo pasado, superado, objetivo corrupto guardado,
    objetivo 10000), el cambio de semana simulando la fecha local antes de recargar
    (progreso a 0 y mismo objetivo vigente), racha/mejor racha/resumen/mes/lista/mapa con
    los mismos valores que antes, consola sin mensajes y sin desbordamiento a 320/375/512 px.

- [x] **T9. `node --test` completo en verde y `MEMORY.md` actualizado.**
  - RF: todos (criterios de finalización). RNF-2.
  - Hecho cuando: `node --test` termina con todas las pruebas (heatmap + objetivo) en verde
    y `MEMORY.md` refleja las decisiones de esta feature (clave nueva, `objetivo.js`,
    `minutosDeEstaSemana` pura compartida, `type="text"` para validar el objetivo)
    sin pasar de ~50 líneas, proponiendo además actualizar `AGENTS.md` en lo de los tests.
