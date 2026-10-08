# Tareas 001 — Mapa de calor

Orden de dependencia: primero la lógica pura con sus tests (nada de interfaz hasta que los
cálculos estén verdes), después el pintado, la interacción y la verificación final.
Cada tarea dura 20-30 min como máximo. Fuente: `spec.md` + `plan.md`.

## Fase 0 — Base del módulo de lógica

- [x] **T1. Crear `heatmap.js` con estructura vacía y cargarlo antes que `app.js` en `index.html`.**
  - RF: ninguno todavía (habilita todo lo demás). RNF-1, RNF-3.
  - Hecho cuando: al abrir `index.html` con doble clic no hay errores en consola y
    `ventanaUltimas12Semanas` está disponible como global en la consola del navegador.

- [x] **T2. Montar el primer test de `node --test` en `tests/heatmap.test.js` y comprobarlo en verde.**
  - RF: ninguno (habilita RNF-2).
  - Hecho cuando: `node --test` termina con 1 test en verde sin instalar nada.

## Fase 1 — Fechas y ventana (lógica pura)

- [x] **T3. `normalizarHoy(hoy)` y `parseFechaLocal("AAAA-MM-DD")`.**
  - RF: RF-1, RF-2 (parcial). RNF-5.
  - Hecho cuando: `node --test` pasa comprobando que `normalizarHoy` devuelve medianoche local
    y que `parseFechaLocal` da `Date` local a medianoche (no UTC) y `null` con basura.

- [x] **T4. `inicioSemanaLunes(fecha)` y `añadirDias(fecha, n)` con `setDate()`.**
  - RF: RF-1 (CA-1.1). RNF-5.
  - Hecho cuando: los tests pasan para miércoles→lunes, domingo→lunes anterior, lunes→lunes,
    y `añadirDias(d, -7)` devuelve la semana previa.

- [x] **T5. `ventanaUltimas12Semanas(hoy)` con exactamente 84 días.**
  - RF: RF-1 (CA-1.1, CA-1.2, CA-1.3).
  - Hecho cuando: los tests pasan con `hoy` = 2026-10-07 (miércoles) verificando 84 días, primer
    día lunes, último domingo de la semana en curso y orden cronológico lunes→domingo por filas.

- [x] **T6. Tests de hoy lunes y hoy domingo.**
  - RF: RF-1 (CA-1.4, CA-1.5).
  - Hecho cuando: con `hoy` lunes, los tests verifican que solo esa celda de la última fila es
    disponible y las otras 6 son futuras; con `hoy` domingo, los tests verifican que el domingo
    es la última celda de la rejilla.

## Fase 2 — Minutos por día y niveles (lógica pura)

- [x] **T7. `sesionValida(s)` y validación de sesión inválida sin tocar datos.**
  - RF: RF-2 (CA-2.4). RNF-4.
  - Hecho cuando: los tests pasan rechazando minutos ausentes, no numéricos, <= 0 y no enteros
    y aceptando un caso válido, sin que el objeto de entrada cambie.

- [x] **T8. `minutosPorDia(sesiones, diasVentana, hoyNorm)` sumando solo válidas y dentro de ventana.**
  - RF: RF-2 (CA-2.1, CA-2.5), RF-3 (CA-3.2).
  - Hecho cuando: los tests pasan con (a) tres sesiones mismo día sumadas, (b) válida + inválida
    en el mismo día contando solo la válida y (c) sesión anterior a la ventana no influyendo.

- [x] **T9. `nivelPorMinutos(minTotal)` con los cuatro niveles y fronteras.**
  - RF: RF-2 (CA-2.2, CA-2.3).
  - Hecho cuando: los tests pasan en las fronteras 30→1, 60→2, 120→3, más 0→0, 1→1, 31→2,
    61→3, 121→4 y 1000→4.

- [x] **T10. `esFechaFutura(dia, hoyNorm)` y `estadoCelda(dia, hoyNorm, minutosMap)` diferenciando
  futuro de nivel 0.**
  - RF: RF-3 (CA-3.1, CA-3.3), RF-4 (CA-4.6 parcial).
  - Hecho cuando: los tests pasan mostrando que una celda futura tiene `esFuturo=true` y sin nivel
    1-4, y que un día pasado sin sesiones tiene `esFuturo=false` con nivel 0; los dos estados son
    distintos.

## Fase 3 — Agregados y textos (lógica pura)

- [x] **T11. `cifraAgregada12Semanas(sesiones, ventana)` y `formatearMinutosMapa(total)`.**
  - RF: RF-5 (CA-5.3).
  - Hecho cuando: los tests pasan verificando el texto **«0 min»** con total 0, y que 45→«45 min»,
    60→«1 h», 90→«1 h 30 min», 135→«2 h 15 min», ignorando sesiones fuera de la ventana.

- [x] **T12. `formatearFechaDetalle(fecha)` y `textoDetalleCelda(estado)` con los tres textos.**
  - RF: RF-4 (CA-4.6, CA-4.7), RF-10 (CA-10.1 vía `textoAvisoLecturaIlegible`), RF-9 (vía
    `textoSinDatos`). RNF-6.
  - Hecho cuando: los tests pasan con los textos literales **«Día futuro. No hay sesiones
    registradas.»**, **«Aún no hay sesiones»**, **«No se han podido leer los datos del diario.
    El mapa de calor no se puede mostrar.»**, el detalle con sesiones (fecha + «·» + minutos
    formateados) y el de día sin sesiones («No hay sesiones.»), todo en español.

- [x] **T13. `rotulacionDiasSemana()` y `etiquetasMesPorFilas(ventanaDias)` con mes y año.**
  - RF: RF-6 (CA-6.1, CA-6.2).
  - Hecho cuando: los tests pasan con la lista `lun, mar, mié, jue, vie, sáb, dom` y con una
    ventana que cruza diciembre→enero generando etiquetas «diciembre 2026» y «enero 2027» en las
    filas correctas.

## Fase 4 — Estructura y estilo

- [x] **T14. Añadir la sección del mapa en `index.html` (título, contenedores, leyenda, cifra,
  mensaje de detalle, estado sin datos, aviso de lectura).**
  - RF: RF-1 (título), RF-5, RF-6, RF-9, RF-10, RF-11.
  - Hecho cuando: en el navegador se ve la sección vacía con su título en español, y el árbol de
    accesibilidad muestra `role="alert"` en el aviso y `role="status"` en el detalle.

- [x] **T15. CSS de la rejilla 12x7, niveles 0-4, estado `.no-disponible` y foco visible.**
  - RF: RF-1, RF-2, RF-3 (CA-3.3), RF-7. RNF-7.
  - Hecho cuando: con datos de prueba, las 84 celdas se ven en 12 filas × 7 columnas, los niveles
    1-4 se distinguen entre sí, `.no-disponible` no parece un nivel 0 y la celda enfocada tiene
    foco visible.

- [x] **T16. CSS responsive de rotulación, etiquetas de mes y scroll interno de la sección.**
  - RF: RF-6. RNF-8.
  - Hecho cuando: a 320, 375 y 512 px `document.documentElement.scrollWidth == clientWidth`
    (sin desbordamiento de página) y, si algo sobra, el scroll es solo interno del mapa.

## Fase 5 — Pintado

- [x] **T17. Render de la rejilla desde `app.js` usando las funciones puras con `hoy` inyectado.**
  - RF: RF-1, RF-2, RF-3. RNF-1.
  - Hecho cuando: con las 3 sesiones de prueba (hoy, ayer, anteayer) las celdas de esos días
    muestran sus niveles y el resto aparece en nivel 0 o no disponible según corresponda.

- [x] **T18. Pintar rotulación de días de semana y etiquetas de mes por fila.**
  - RF: RF-6 (CA-6.1, CA-6.2).
  - Hecho cuando: se leen «lun…dom» sobre las columnas y aparece «octubre 2026» al lado de la
    fila donde cambia de mes, sin desbordar a 375 px.

- [x] **T19. Pintar leyenda de los 4 niveles y cifra agregada de las 12 semanas.**
  - RF: RF-5 (CA-5.1, CA-5.2, CA-5.3).
  - Hecho cuando: con las 3 sesiones de prueba la cifra muestra «2 h 15 min» y la leyenda lista
    los rangos 1-30 / 31-60 / 61-120 / 121+, visibles también con la rejilla vacía.

- [x] **T20. Estado sin datos con el texto «Aún no hay sesiones».**
  - RF: RF-9 (CA-9.1, CA-9.2, CA-9.3).
  - Hecho cuando: vaciando `localStorage`, la sección muestra rejilla en nivel 0 + leyenda +
    rotulación + etiquetas + cifra «0 min» + «Aún no hay sesiones», y ningún aviso de error.

- [x] **T21. Lectura segura del almacenamiento: aviso de ilegibilidad ocultando el mapa.**
  - RF: RF-10 (CA-10.1, CA-10.2, CA-10.3, CA-10.4).
  - Hecho cuando: guardando JSON corrupto en `diario-estudio-sesiones`, la sección muestra
    **solo** «No se han podido leer los datos del diario. El mapa de calor no se puede mostrar.»,
    sin mapa ni «Aún no hay sesiones», la clave sigue intacta y el resto de la página funciona.

## Fase 6 — Interacción y accesibilidad

- [x] **T22. Detalle con ratón (mouseover/mouseout) y teclado (focus/blur), nunca dos a la vez.**
  - RF: RF-4 (CA-4.1, CA-4.3, CA-4.4, CA-4.5), RF-7.
  - Hecho cuando: al pasar el cursor o al llegar con `Tab` aparece el detalle de esa celda, al
    salir o perder el foco desaparece, y solo existe uno visible.

- [x] **T23. Detalle táctil con prioridad de scroll sobre el tooltip.**
  - RF: RF-4 (CA-4.2, CA-4.5). RNF-8.
  - Hecho cuando: en emulación táctil, un toque mantiene el detalle mientras dura el contacto y
    al deslizar el dedo el detalle se oculta dejando hacer scroll dentro de la sección.

- [x] **T24. `aria-label` por celda con fecha, minutos y estado (día futuro / sin sesiones).**
  - RF: RF-4 (CA-4.7), RF-6 (CA-6.3), RF-7 (CA-7.1, CA-7.2).
  - Hecho cuando: el árbol de accesibilidad anuncia en cada celda su fecha y minutos (o «No hay
    sesiones» o «Día futuro») y la información se entiende sin depender del color.

- [x] **T25. Refresco del mapa al guardar sesión, reevaluando «hoy», sin recargar.**
  - RF: RF-8 (CA-8.1, CA-8.2, CA-8.3).
  - Hecho cuando: registrando una sesión de 120 min de hoy el mapa sube de nivel y la cifra
    agregada sube sin recargar la página, y guardando una sesión anterior a la ventana (hace más
    de 12 semanas) la rejilla no cambia.

- [x] **T26. Confirmar que el mapa es solo lectura (sin escritura de sesiones).**
  - RF: RF-11 (CA-11.1, CA-11.2). RNF-4.
  - Hecho cuando: pulsando, manteniendo pulsado y arrastrando sobre celdas, el contenido de
    `localStorage` es byte a byte idéntico antes y después y solo cambia la visibilidad del detalle.

## Fase 7 — Verificación final

- [x] **T27. Batería de verificación en navegador: escritorio y 375 px, consola y regresiones.**
  - RF: todos (verificación). RNF-6, RNF-7, RNF-8, RNF-9.
  - Hecho cuando: con Chrome DevTools se comprueba que racha/mejor racha/resumen/lista dan los
    mismos valores que antes, no hay mensajes en consola, no hay desbordamiento a 320/375/512 px
    y el detalle funciona con ratón, `Tab` y toque a 375 px.

- [x] **T28. `node --test` completo en verde y `MEMORY.md` actualizado.**
  - RF: todos (criterios de finalización).
  - Hecho cuando: `node --test` termina con todos los tests en verde y `MEMORY.md` refleja las
    decisiones del mapa (ventana 84 días, umbrales, textos literales, aviso exclusivo) sin
    pasar de ~50 líneas.
