# Plan 002 — Objetivo semanal de estudio

## 1. Resumen

El objetivo semanal añade, dentro de la sección «Resumen», un **campo editable siempre**
para fijar los minutos que se quiere estudiar cada semana y un **bloque de progreso**
(cifras + barra) que compara lo estudiado de la semana en curso (lunes → hoy) con ese
objetivo. Sin objetivo guardado hay una invitación a fijarlo; con objetivo inválido en el
campo, el guardado anterior sigue vigente y el rechazo se anuncia junto al campo; si el
objetivo es válido pero las sesiones no se pueden leer, se muestra un aviso en vez de un
«te falta X» calculado sobre 0.

El plan sigue la Constitución: HTML/CSS/JS puros (doble clic, `file://`, sin build),
**lógica separada de la interfaz** (funciones puras con «hoy» como parámetro), **tests con
`node --test`**, fechas en hora local, datos de sesiones intactos (clave nueva
`diario-estudio-objetivo`) y textos en español. La cifra semanal sale de **una sola
función** —`minutosDeEstaSemana()`, refactorizada a pura— usada por el Resumen y por el
objetivo (CA-2.8).

## 2. Archivos a crear o modificar

| Archivo | Acción | Responsabilidad | RF cubiertos |
|---|---|---|---|
| `objetivo.js` | **Crear** | Lógica pura del objetivo: interpretar el valor guardado, calcular el progreso (incluida `minutosDeEstaSemana()` movida aquí en versión pura) y producir los textos en español. Sin DOM ni localStorage. Se carga como `<script>` global tras `heatmap.js` y antes de `app.js`. | RF-1 (CA-1.2, CA-7.2–7.3), RF-2 (CA-2.1–2.9), RF-3, RF-5 (parcial), RF-6, RNF-1, RNF-2, RNF-5 |
| `tests/objetivo.test.js` | **Crear** | Pruebas `node --test` que cargan `heatmap.js` y luego `objetivo.js` con `vm.runInThisContext` (mismo patrón que `tests/heatmap.test.js`) y cubren interpretación del objetivo, minutos semanales con «hoy» inyectado, progreso, topes de la barra, textos y casos límite. | RF-1–RF-7 (vía funciones), RNF-2, criterios de finalización |
| `index.html` | Modificar | Bloque del objetivo dentro de la sección «Resumen», justo después de la fila «estudiado esta semana» y antes de «estudiados este mes»: mini-formulario (campo + botón «Guardar»), mensaje `aria-live` propio, cifras, barra `role="progressbar"` y aviso de sesiones ilegibles. Carga de `objetivo.js` antes de `app.js`. No toca ids ni cifras existentes. | RF-1 (CA-1.1, CA-1.5), RF-2 (CA-2.6–2.7), RF-6, RF-8 (CA-8.3–8.5) |
| `styles.css` | Modificar | Estilos del bloque: campo del objetivo (≥16 px, ≥44 px), botón, mensaje, cifras, barra (raíl + relleno con `--primario`), aviso y estado sin objetivo. Responsive sin desbordamiento a 320/375/512 px. | RF-2 (CA-2.6), RF-8 (CA-8.4–8.5), RNF-7, RNF-8 |
| `app.js` | Modificar | Orquestación: lee/guarda `diario-estudio-objetivo` (validando con la lógica pura), rellena el campo, gestiona el guardado (botón/Intro) con mensaje propio sin tocar `#mensaje`, pinta el progreso en sus cuatro estados (sin objetivo, aviso de sesiones ilegibles, en curso, cumplido/superado) y refresca al cargar y tras cada guardado válido. `minutosDeEstaSemana()` se vuelve pura y se consume desde `objetivo.js`. Renombra `leerSesionesParaMapa()` a `leerSesionesConEstado()` (misma conducta, ahora con dos consumidores). | RF-1, RF-2, RF-3, RF-4 (CA-4.1–4.2), RF-5, RF-6, RF-7, RNF-3, RNF-4, RNF-9 |

> **Nota (constitución):** sin módulos ES. `objetivo.js` se carga con
> `<script src="objetivo.js"></script>` después de `heatmap.js` (del que reutiliza
> ayudantes de fecha) y antes de `app.js`, exponiendo sus funciones en el ámbito global.
> Los ficheros nuevos ya están autorizados en la spec.

## 3. Funciones puras de `objetivo.js` (con «hoy» como parámetro)

Todas son **puras** (RNF-1): sin DOM, sin localStorage, sin efectos secundarios. Se prueban
en `tests/objetivo.test.js`. Reutiliza de `heatmap.js` (cargado antes):
`normalizarHoy`, `añadirDias`, `inicioSemanaLunes`, `claveDiaMapa`.

| Función | Firma (propuesta) | Descripción | RF cubiertos |
|---|---|---|---|
| `interpretarObjetivo(texto)` | `(texto: any) => number \| null` | Acepta solo texto que sea dígitos de un entero > 0 (regexp `^\d+$`, p. ej. `"300"` → `300`; `"007"` → `7`). Rechaza vacío, `null`, decimales (`"90,5"`, `"0,5"`), notación `1e3`, negativos, `"0"`, textos no numéricos y textos con espacios alrededor (`" 300"`, `"300 "`, sin `trim()`: se valida el texto tal cual, CA-1.2) → `null`. No modifica la entrada. | RF-1 (CA-1.2), RF-7 (CA-7.2, CA-7.3) |
| `minutosDeEstaSemana(sesiones, hoy)` | `(sesiones: any[], hoy: Date) => number` | **Movida desde `app.js` y hecha pura**: recibe «hoy» y devuelve la suma de minutos de la semana lunes→hoy. Misma conducta que hoy: compara claves `AAAA-MM-DD` como texto (cronológico gracias al formato con ceros), ignora minutos no finitos, excluye fechas posteriores a hoy (el límite superior es hoy) y la semana anterior. Es **la única** fuente de la cifra semanal (Resumen y objetivo). | RF-2 (CA-2.3, CA-2.4, CA-2.8), RNF-1, RNF-5 |
| `calcularProgreso(sesiones, objetivo, hoy)` | `(sesiones: any[], objetivo: number \| null, hoy: Date) => object \| null` | Si `objetivo` no es un entero > 0 → `null` (sin objetivo, RF-6). Si no, devuelve `{ estudiados, objetivo, cumplido, superado, faltan, superadoEn, porcentajeBarra }`: `estudiados = minutosDeEstaSemana(sesiones, hoy)` (una sola función, CA-2.8); `cumplido = estudiados >= objetivo`; `superado = estudiados > objetivo`; `faltan = max(0, objetivo - estudiados)`; `superadoEn = max(0, estudiados - objetivo)` (nunca cifras negativas); `porcentajeBarra = min(100, estudiados / objetivo * 100)` redondeado, tope en 100 (CA-2.6). | RF-2 (CA-2.1, CA-2.6), RF-3 (CA-3.1–3.3), RF-5, RF-6 |
| `formatearMinutosObjetivo(minutos)` | `(minutos: number) => string` | Mismo formato que `formatearMinutos()` («0 min», «45 min», «1 h», «1 h 30 min»). Duplicada a propósito, como `formatearMinutosMapa()`: cada script se carga por separado y así `objetivo.js` no depende de `app.js`. | RF-2 (CA-2.5), RNF-6 |
| `textoCifrasProgreso(progreso)` | `(progreso: object) => string` | «1 h 30 min de 5 h»: estudiados + «de» + objetivo, con `formatearMinutosObjetivo`. Sin porcentaje (CA-2.1). | RF-2 (CA-2.1, CA-2.7), RF-8 |
| `textoFaltanProgreso(progreso)` | `(progreso: object) => string` | Tres estados: en curso → «Te faltan 3 h 30 min»; cumplido exacto → «Objetivo cumplido»; superado → «Superado en 1 h» (el exceso). Nunca una cifra negativa ni un fracaso. | RF-3 (CA-3.1–3.3), RF-8 |
| `textoInvitacionObjetivo()` | `() => string` | «Aún no has fijado objetivo. Escribe cuántos minutos quieres estudiar esta semana y pulsa "Guardar".» (CA-6.2). | RF-6 (CA-6.2), RNF-6 |
| `textoValorInvalidoObjetivo()` | `() => string` | «Escribe un número entero de minutos mayor que 0.» (CA-1.2). | RF-1 (CA-1.2), RNF-6 |
| `textoObjetivoGuardado()` | `() => string` | «Objetivo guardado.» (mensaje de éxito propio del campo). | RF-1 (CA-1.3), RNF-6 |
| `textoAvisoSesionesIlegibles()` | `() => string` | «No se puede calcular el progreso de esta semana: no se han podido leer las sesiones.» (CA-2.9). | RF-2 (CA-2.9), RNF-6 |

> **Separación (RNF-2):** el DOM, `localStorage` y los eventos viven solo en `app.js`.

## 4. Pintado del objetivo (pseudocódigo)

`app.js` añade `CLAVE_OBJETIVO = "diario-estudio-objetivo"` y estos pasos, todos con el
mismo objeto `hoy` calculado una vez por pintado:

```text
pintar():
  lectura = leerSesionesConEstado()            // { legible, sesiones } (antes leerSesionesParaMapa)
  sesiones = ordenarSesiones(lectura.sesiones)
  hoy = new Date()
  ...pintados existentes (pintarMinutosSemana ahora pasa hoy a minutosDeEstaSemana)...
  pintarObjetivo(sesiones, lectura.legible, hoy)

pintarObjetivo(sesiones, legible, hoy):
  objetivo = cargarObjetivo()                  // interpretarObjetivo(localStorage.getItem(CLAVE_OBJETIVO))
  SI objetivo === NULL:                        // sin objetivo (también valor corrupto guardado: en silencio, CA-7.2)
      ocultar cifras, barra y aviso; mostrar invitación (textoInvitacionObjetivo); FIN
  SI NO legible:                               // objetivo válido pero sesiones ilegibles (CA-2.9)
      ocultar cifras y barra; mostrar #objetivo-aviso (textoAvisoSesionesIlegibles); FIN
  progreso = calcularProgreso(sesiones, objetivo, hoy)
  mostrar textoCifrasProgreso + textoFaltanProgreso; ocultar aviso
  barra: ancho = porcentajeBarra % (topado a 100), aria-valuenow y aria-valuetext con los textos

guardarObjetivo(texto):                        // botón «Guardar» o Intro (submit del mini-formulario)
  valor = interpretarObjetivo(texto)          // texto del campo tal cual, SIN trim: " 300" y "300 " se rechazan (CA-1.2)
  SI valor === NULL:
      mensaje propio junto al campo (textoValorInvalidoObjetivo, aria-live); conservar texto escrito
      y objetivo guardado; FIN (sin tocar #mensaje)
  localStorage.setItem(CLAVE_OBJETIVO, String(valor))    // solo dígitos, p. ej. "300"
  rellenar el campo con String(valor); mensaje «Objetivo guardado.»; pintar()
```

Recálculo al cargar (llamada final a `pintar()`), tras guardar objetivo y tras guardar una
sesión (el submit del formulario de sesiones ya llama a `pintar()`, que ahora refresca el
objetivo: CA-4.1 sin código extra). Mientras el usuario teclea no se recalcula.

## 5. Cómo se pinta en la interfaz

### 5.1 Estructura HTML (index.html, dentro de «Resumen»)

Entre la fila «estudiado esta semana» y la fila «estudiados este mes», sin `.tarjeta` nueva:

```html
<div class="objetivo">
  <form class="objetivo-formulario" id="formularioObjetivo" novalidate>
    <label class="campo-label" for="objetivoMinutos">Objetivo de la semana (minutos, se puede cambiar)</label>
    <div class="objetivo-entrada">
      <input class="campo campo-objetivo" type="text" id="objetivoMinutos" placeholder="Ej: 300"
             inputmode="numeric" autocomplete="off" aria-describedby="objetivoMensaje">
      <button class="boton boton-objetivo" type="submit">Guardar</button>
    </div>
    <p class="mensaje" id="objetivoMensaje" role="status" aria-live="polite"></p>
  </form>

  <p class="objetivo-invitacion" id="objetivoInvitacion" hidden></p>

  <div class="objetivo-progreso" id="objetivoProgreso" hidden>
    <p class="objetivo-cifras">
      <span id="objetivoEstudiado"></span>
      <span class="objetivo-faltan" id="objetivoFaltan"></span>
    </p>
    <div class="objetivo-barra" id="objetivoBarra" role="progressbar"
         aria-label="Progreso del objetivo semanal" aria-valuemin="0" aria-valuemax="100">
      <div class="objetivo-relleno" id="objetivoRelleno"></div>
    </div>
  </div>

  <p class="objetivo-aviso" id="objetivoAviso" role="status" aria-live="polite" hidden></p>
</div>
```

Notas:
- El campo es `type="text"` con `inputmode="numeric"`: la validación es propia (CA-1.2) y el
  campo debe **conservar el texto escrito** cuando se rechaza; `16px` de fuente y `48px` de
  alto cumplen CA-8.5 reutilizando `.campo`.
- Mini-formulario: el botón es `type="submit"` y **Intro** dispara el mismo guardado (CA-1.5)
  sin código de teclado adicional. Es un `<form>` hermano del de sesiones, nunca anidado.
- Mensaje de rechazo en `#objetivoMensaje` con `role="status" aria-live="polite"`, jamás en
  `#mensaje` (CA-1.2).
- La barra usa `role="progressbar"` con `aria-valuenow` (porcentaje topado) y
  `aria-valuetext` («1 h 30 min de 5 h, te faltan 3 h 30 min») para que el lector anuncie la
  proporción sin depender del color (CA-8.3, CA-8.2).

### 5.2 Renderizado y estados (app.js)

Cuatro estados mutuamente excluyentes, siempre con el campo visible y editable:

1. **Sin objetivo** (`cargarObjetivo() === null`): se muestra `#objetivoInvitacion` con
   `textoInvitacionObjetivo()`; progreso y barra ocultos; nada de «incumplido» ni «te
   falta» (CA-6.3). Si lo guardado está corrupto, mismo estado y **en silencio** (CA-7.2).
2. **Sesiones ilegibles con objetivo válido**: `#objetivoAviso` con
   `textoAvisoSesionesIlegibles()`; sin cifras ni barra; el resto de la página sigue
   (CA-2.9). Se apoya en `leerSesionesConEstado().legible`.
3. **En curso**: cifras «X de Y» + «Te faltan Z» + barra (CA-2.1, CA-3.3).
4. **Cumplido/superado**: «Objetivo cumplido» o «Superado en X», total real visible y
   barra llena al 100 % como máximo (CA-3.1, CA-3.2, CA-2.6).

Al cargar, el campo se rellena con el objetivo guardado (`String(valor)`); un objetivo
guardado corrupto deja el campo vacío (la invitación explica cómo fijarlo). El objetivo
guardado vive en `diario-estudio-objetivo` como texto de dígitos; la clave de sesiones no se
toca nunca desde esta feature (RF-7).

### 5.3 CSS

- Reutiliza `.campo`, `.campo-label`, `.mensaje` (`.error`/`.exito`) y `.boton`; añade
  `.objetivo-*`: disposición de la entrada (campo + botón en fila que se apila en pantallas
  estrechas), raíl de barra (`--borde`) con relleno (`--primario`), transición de ancho solo
  con `prefers-reduced-motion: no-preference`, y avisos con el estilo del `.mapa-aviso`.
- Sin desbordamiento horizontal a 320/375/512 px; cuidado con `[hidden]` (el bloque usa
  `display` propio, por eso la regla global `[hidden] { display: none !important; }` ya
  existente debe seguir aplicándose).

## 6. Decisiones técnicas justificadas (y alternativas descartadas)

| Decisión | Justificación | Alternativa descartada |
|---|---|---|
| **Nuevo `objetivo.js` cargado tras `heatmap.js` y antes de `app.js`, sin módulos** | Principio 1 (doble clic, `file://`) y RNF-2: la lógica debe poder cargarse en `node --test` sin DOM. | Meter la lógica en `app.js` → no testeable (lee `document` al cargar). ES modules → romperían `file://`. Descartadas. |
| **`objetivo.js` reutiliza los ayudantes de fecha de `heatmap.js` (`normalizarHoy`, `añadirDias`, `inicioSemanaLunes`, `claveDiaMapa`)** | Una sola implementación de fechas locales (los errores de fecha ya costaron caro: `setDate()`, nunca milisegundos). `claveDiaMapa` es idéntica a `claveFecha`. | Duplicar los ayudantes en `objetivo.js` → duplicidad de la lógica más peligrosa del proyecto y riesgo de divergencia. Descartada. Los tests cargan primero `heatmap.js`. |
| **`minutosDeEstaSemana()` se mueve a `objetivo.js` como pura `(sesiones, hoy)` y `app.js` la consume** | Garantiza CA-2.8 de forma estructural: hay **una sola** función para la cifra semanal; el Resumen y el objetivo usan el mismo valor. Cumple RNF-1. | Dejarla en `app.js` y «probar» la unicidad leyendo el código del fuente → frágil y sin ejecución real. Descartada. |
| **`calcularProgreso` recibe las sesiones y el «hoy» y llama internamente a `minutosDeEstaSemana`** | Misma garantía (CA-2.8): el progreso no puede divergir del Resumen. | Que `calcularProgreso` reciba ya los minutos calculados → la unicidad depende del llamante, fácil de romper. Descartada. |
| **Campo `type="text"` + `inputmode="numeric"` con validación propia (`interpretarObjetivo`)** | CA-1.2 exige rechazar `90,5`, `0,5`, `1e3` y conservar **el texto escrito** al rechazar. Un texto de dígitos es exactamente lo que se guarda (`"300"`). | `type="number"` → el navegador normaliza o vacía el campo, admite `1e3` y no permite un rechazo propio conservando lo escrito. Descartado. |
| **Mini-formulario con botón `type="submit"` para el objetivo** | CA-1.5: «Guardar» **y** Intro con la semántica estándar, sin código de teclado. Hermano del formulario de sesiones (nunca anidado). | Botón suelto + manejador `keydown` manual → más código y fácil de olvidar (p. ej. con el dedo). Descartada. |
| **Valor guardado normalizado: `localStorage.setItem(CLAVE_OBJETIVO, String(valor))`** | Un solo formato canónico («300»); `"007"` se guarda como `"7"`. La lectura tolera formatos corruptos interpretándolos como sin objetivo (CA-7.2). | Guardar el texto tal cual → dos representaciones distintas del mismo objetivo y más casos de borde al leer. Descartada. |
| **`calcularProgreso` devuelve `null` cuando no hay objetivo válido** | Un solo camino para los estados sin objetivo y el valor corrupto guardado (RF-6, CA-7.2–7.3); la interfaz decide qué texto mostrar. | Objeto con campo `estado` y más ramas (`"sin-objetivo"`, `"corrupto"`, …) → complejidad sin aportar, la spec pide el mismo comportamiento para ambos. Descartada. |
| **`porcentajeBarra` nace ya topado al 100 % y los textos nunca llevan porcentaje** | CA-2.6 (barra llena como máximo) y CA-2.1 (sin cifra de porcentaje en texto) se cumplen en la lógica pura, testeable. | Calcular el tope en la interfaz → el tope no sería testeable con `node --test`. Descartada. |
| **Renombrar `leerSesionesParaMapa()` → `leerSesionesConEstado()` y usarla en mapa y objetivo** | La función distingue «ilegible» de «vacío» y ahora tiene dos consumidores (mapa y aviso CA-2.9). Mismo comportamiento, nombre honesto. | Copiar el `try/catch` por tercera vez en el objetivo → tres sitios que mantener si cambia la lectura. Descartada. |
| **`pintar()` lee el almacén una vez y pasa `sesiones` y `legible` a `pintarObjetivo`** | Evita dobles lecturas y garantiza que Resumen y objetivo usan exactamente el mismo array (CA-2.8). | Que `pintarObjetivo` lea el almacén por su cuenta → doble lectura y riesgo de divergencia. Descartada. |
| **`hoy` se calcula una vez en `pintar()` y se pasa a todos los pintados** | Misma referencia para todas las cifras del mismo pintado; comportamiento «se recalcula al cargar y al guardar» intacto. | Recalcular `new Date()` dentro de cada función → mismas cifras por casualidad y más difícil de testear. Descartada. |
| **Barra con `div[role=progressbar]` en vez de `<progress>`** | Control total del estilo (raíl/relleno, 100 % topado, transición) y ARIA explícita (`aria-valuenow`, `aria-valuetext`). | `<progress>` → estilos por navegador poco consistentes y `aria-valuetext` incómodo de personalizar. Descartado. |
| **Mensaje de éxito «Objetivo guardado.» en el campo propio** | Mismo patrón que el formulario de sesiones (feedback inmediato sin recargar). | Silencio total tras guardar → el usuario no tiene confirmación de que se guardó. Descartada. |

## 7. Estrategia de tests con `node --test`

Tests **solo** de funciones puras de `objetivo.js` (RNF-2). Patrón de 001:
`fs.readFileSync` + `vm.runInThisContext` de `heatmap.js` **y después** de `objetivo.js`
(orden de carga real de la página), y destructuring desde `globalThis`. «Hoy» inyectado en
todos los casos (p. ej. `new Date(2026, 9, 7)` = miércoles 7 oct 2026). Comando:
`node --test`.

| Caso | Qué probar | Funciones | RF/CA |
|---|---|---|---|
| **Orden y pureza del módulo** | `objetivo.js` se carga tras `heatmap.js` y antes de `app.js` en `index.html`; el código no usa `document`, `localStorage` ni módulos ES; expone `calcularProgreso` como global. | (inspección) | RNF-1–RNF-3 |
| **Interpretar objetivo: válidos** | `"300"`→300, `"1"`→1, `"007"`→7, `"10000"`→10000. | `interpretarObjetivo` | RF-1 (CA-1.1) |
| **Interpretar objetivo: inválidos** | `""`, `null`, `undefined`, `"0"`, `"-5"`, `"90,5"`, `"0,5"`, `"1e3"`, `"300 "`, `" 300"`, `"30a"`, `"3.5"` → `null` (nunca un número imposible). | `interpretarObjetivo` | RF-1 (CA-1.2), RF-7 (CA-7.3) |
| **Minutos semanales con «hoy» inyectado** | Sesión del lunes cuenta; del domingo anterior no; futura dentro de la semana no cuenta; misma semana pasada no cuenta; dos sesiones mismo día suman; minutos no finitos se ignoran. | `minutosDeEstaSemana` | RF-2 (CA-2.3, CA-2.4), RF-5 (CA-5.1) |
| **Hoy es lunes** | Con «hoy» lunes y sin sesiones, `minutosDeEstaSemana` → 0 y `calcularProgreso` arranca desde 0 sin heredar nada. | `minutosDeEstaSemana`, `calcularProgreso` | RF-2 (CA-2.2), RF-5 (CA-5.1) |
| **Progreso en curso** | Estudiado < objetivo → `faltan = objetivo - estudiados`, `cumplido=false`, `superadoEn=0`. Objetivo 1 min con 0 estudiados → falta 1 min. Objetivo 10000 → sin cifras rotas. | `calcularProgreso` | RF-2 (CA-2.1), RF-3 (CA-3.3) |
| **Cumplido exacto y superado** | Estudiado == objetivo → `cumplido=true`, `faltan=0`; el doble → `superado=true`, `superadoEn=estudiados-objetivo` (nunca negativo), estudiados = total real. | `calcularProgreso` | RF-3 (CA-3.1, CA-3.2) |
| **Tope de la barra** | `porcentajeBarra` ≤ 100 siempre (p. ej. el doble → 100); la proporción correcta a mitad (150 de 300 → 50). | `calcularProgreso` | RF-2 (CA-2.6) |
| **Una sola función semanal (CA-2.8)** | Con las mismas sesiones y «hoy», `calcularProgreso(...).estudiados === minutosDeEstaSemana(sesiones, hoy)`. | `calcularProgreso`, `minutosDeEstaSemana` | RF-2 (CA-2.8) |
| **Sin objetivo → `null`** | `objetivo` null, 0, negativo o no numérico → `null` (la interfaz muestra la invitación, nunca «te falta»). | `calcularProgreso` | RF-6 (CA-6.3), RF-7 (CA-7.2) |
| **Textos exactos en español** | «Te faltan 3 h 30 min», «Objetivo cumplido», «Superado en 1 h», cifras «1 h 30 min de 5 h», invitación, «Escribe un número entero de minutos mayor que 0.», «Objetivo guardado.» y el aviso de sesiones ilegibles; formato `formatearMinutosObjetivo` (45→«45 min», 60→«1 h», 90→«1 h 30 min»). Sin porcentaje en ningún texto. | funciones de texto, `formatearMinutosObjetivo` | RF-2 (CA-2.1, CA-2.5), RF-3, RF-6 (CA-6.2), RF-8 (RNF-6) |
| **No mutación de datos** | Las funciones no modifican el array de sesiones ni los objetos de entrada. | todas | RF-7 (CA-7.1), RNF-4 |

Lo que no cubre `node --test` (eventos, DOM, responsive, recálculo al guardar) se verifica
en navegador con Chrome DevTools (T8), como en 001.

## 8. Mapeo completo RF → elementos del plan

| RF | CA | Cobertura (archivos/funciones/interfaz) |
|---|---|---|
| RF-1 | 1.1–1.5 | `objetivo.js`: `interpretarObjetivo`, `textoValorInvalidoObjetivo`, `textoObjetivoGuardado`. `app.js`: `CLAVE_OBJETIVO`, `cargarObjetivo`, `guardarObjetivo`, mini-formulario. `index.html`: campo + botón. Tests: interpretar. |
| RF-2 | 2.1–2.9 | `objetivo.js`: `minutosDeEstaSemana` (pura), `calcularProgreso`, `textoCifrasProgreso`, `textoFaltanProgreso`, `formatearMinutosObjetivo`, `textoAvisoSesionesIlegibles`. `app.js`: `pintarObjetivo` con `legible`. `index.html`/CSS: cifras + barra. Tests: semana, progreso, topes, CA-2.8. |
| RF-3 | 3.1–3.3 | `objetivo.js`: `calcularProgreso` (cumplido/superado/faltan), `textoFaltanProgreso`. Tests: cumplido exacto y superado. |
| RF-4 | 4.1–4.2 | `app.js`: `pintar()` (ya llamado al guardar sesión) pinta también el objetivo con «hoy» nuevo. Verificación en navegador. |
| RF-5 | 5.1–5.3 | `objetivo.js`: `minutosDeEstaSemana` (ventana lunes→hoy), `calcularProgreso` (null sin objetivo). Tests: lunes y semana nueva. |
| RF-6 | 6.1–6.3 | `objetivo.js`: `textoInvitacionObjetivo`. `app.js`: estado sin objetivo (progreso oculto). `index.html`: `#objetivoInvitacion`. Tests: null → invitación, nada «incumplido». |
| RF-7 | 7.1–7.3 | `app.js`: solo escribe `diario-estudio-objetivo` con texto de dígitos; nunca la clave de sesiones. `objetivo.js`: interpretar tolerante. Tests: no mutación e inválidos. |
| RF-8 | 8.1–8.5 | `index.html`: `aria-live` en mensajes, `role="progressbar"` + `aria-valuenow/valuetext`, label. CSS: 16 px, 48 px, responsive. Verificación navegador a 375 px. |

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| La refactorización de `minutosDeEstaSemana(sesiones)` a `minutosDeEstaSemana(sesiones, hoy)` altere la cifra del Resumen (RNF-9) | Refactorización quirúrgica (mismo cuerpo, «hoy» como parámetro); test de equivalencia con «hoy» fijo; verificación en navegador comparando cifras antes/después. |
| Choque de nombres globales entre `heatmap.js`, `objetivo.js` y `app.js` (comparten ámbito) | Nombres nuevos propios (`interpretarObjetivo`, `calcularProgreso`, …); `minutosDeEstaSemana` se **mueve** (se borra de `app.js`, no se duplica); se reutilizan los de `heatmap.js` sin redeclararlos. |
| El renombrado `leerSesionesParaMapa` → `leerSesionesConEstado` rompa el mapa | Cambio de nombre conducta-neutro con verificación en navegador del aviso del mapa (JSON corrupto) y del estado sin datos. |
| Ocultar/mostrar bloques con `display` propio pisando `[hidden]` (error ya vivido) | La regla global `[hidden] { display: none !important; }` ya existe; verificar los cuatro estados en navegador. |
| Desbordamiento horizontal del campo + botón a 320/375 px | Disposición en fila que se apila bajo un ancho cercano al corte de 419 px ya usado; medición con `scrollWidth == clientWidth` a 320/375/512 px. |
| Zoom automático en iOS al enfocar el campo | Reutilizar `.campo` (16 px, 48 px de alto) = CA-8.5 sin estilos nuevos. |

## 10. Criterios de finalización (verificación)

- Spec y plan cumplen la Constitución (principios 1–6).
- Archivos: 2 creados (`objetivo.js`, `tests/objetivo.test.js`), 3 modificados
  (`index.html`, `styles.css`, `app.js`).
- `node --test` en verde cubriendo la tabla de la sección 7 (incluido CA-2.8 y el tope de
  la barra).
- Todos los CA verificados en navegador (Chrome DevTools), escritorio y 375 px; los CA de
  cambio de semana (CA-2.2, CA-5.1, CA-5.2) simulando la fecha local antes de recargar.
- Consola sin errores; sin desbordamiento a 320/375/512 px.
- `diario-estudio-sesiones` intacta byte a byte; el objetivo solo en
  `diario-estudio-objetivo`; sin migraciones (RNF-4, RNF-9).
- Interfaz y documentación en español; `MEMORY.md` actualizado al terminar (fuera de este
  plan, lo hace el implementador).
