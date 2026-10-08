# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- Sesiones con fecha/tema/minutos, racha 🔥/🏆, resumen de semana/mes, lista y mapa de calor
  (`specs/001-heat-map/`). localStorage intacto: nada ha migrado.
- Objetivo semanal TERMINADO (`specs/002-weekly-goal/`, T1-T9 de 9): 60 tests en verde
  (`node --test`, 31 heatmap + 29 objetivo); nuevos `objetivo.js` y `tests/objetivo.test.js`,
  tocados `index.html`, `styles.css`, `app.js`. T8 PASS en navegador (casos límite, lunes
  simulado con `Date`, consola vacía).
- En Resumen, bloque `.objetivo` (campo `#objetivoMinutos`, mensaje `#objetivoMensaje`
  aria-live, estados invitación / aviso ilegibles / cifras + barra progressbar); `app.js`
  usa `CLAVE_OBJETIVO`, `leerSesionesConEstado()`, `pintarObjetivo(sesiones, legible, hoy)`.
- `README.md` creado (español, sin capturas ni licencia) y subido al repo
  github.com/Tomas-De-Paulo/desarrollo-ia. En el navegador quedan datos de captura
  (10 sesiones: 19–24 sep + 5–8 oct, objetivo 600): si estorran, borrar las claves.

## Decisiones (y por qué)
- Clave nueva `diario-estudio-objetivo` = texto de dígitos ("300"): sesiones intactas, sin
  migración (RNF-4). `minutosDeEstaSemana(sesiones, hoy)` vive en `objetivo.js` y la
  comparten Resumen y objetivo (CA-2.8, RNF-1).
- Campo `type="text"` + `inputmode="numeric"` validado SIN `trim()`: CA-1.2 exige rechazar
  `" 300"` y conservar el texto escrito; `type="number"` lo vaciaría y admitiría `1e3`.
- `objetivo.js` puro tras `heatmap.js` (reutiliza sus ayudantes): testeable con `vm` en
  `node --test` sin romper el doble clic (sin módulos ES). Sin backend ni dependencias.
- `leerSesionesParaMapa` → `leerSesionesConEstado` (dos consumidores: mapa y aviso CA-2.9).
- Barra con `aria-valuenow` (porcentaje topado) y `aria-valuetext` («cifras. estado»).
- El `initScript` de DevTools NO persiste entre recargas: pasarlo en cada navegación.
- Dos tarjetas; degradado oscuro (#c2410c → #dc2626) porque el blanco encima necesita 4.5:1
  (#ef4444 daba 3.76); corte móvil 419px. `formatearMinutos()` duplicada en mapa y objetivo.

## Aprendizajes y errores a evitar
- Fechas, minutos y plurales: en `AGENTS.md`. Aquí: los valores solo se recalculan al cargar
  y al guardar; `[hidden]` no oculta si una clase fija `display: flex/row` (falta `!important`).
- El mapa/objetivo leen el almacén por su cuenta porque `cargarSesiones()` devuelve `[]`
  también con JSON roto (el aviso necesita distinguirlo); nunca escriben.
- El toque arrastra tras de sí ratón y foco simulados: ignorar ~700 ms o el detalle se reabre.
- CSS: a igualdad de especificidad gana el que va ANTES. `flex: 1` colapsa la `height` de un
  input (48→23px): al apilar, `flex: none`. `emulate({viewport})` recarga: montar DESPUÉS.
- Verificación con Chrome DevTools (lo pide AGENTS.md): sin imágenes, medir con
  `evaluate_script` (MCP `browser.*` caído); Lighthouse: 100 a11y.

## Pendientes y próximos pasos
- Objetivo de 21+ dígitos: se acepta, pero `String(Number(...))` lo guarda en notación
  exponencial y se pierde al recargar; falta decidir persistir solo dígitos o rechazar.
- CA-2.9 (aviso de sesiones ilegibles): el test cubre solo el texto; la lógica está
  verificada solo en navegador.
- Docs desactualizados, a proponer al usuario (NO editar sin permiso): `AGENTS.md` «No hay
  tests automáticos» (falso: `node --test`, 60) y `docs/constitution.md` p. 6 «código en
  inglés» (está en español). Por revisar: citas a CA-4.7 y fecha en `aria-label` de futuro.
