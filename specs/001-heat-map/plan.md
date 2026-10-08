# Plan 001 — Mapa de calor de los días estudiados

## 1. Resumen

El mapa de calor añade una nueva sección de **solo lectura** al Diario de Estudio. Muestra las **últimas 12 semanas** alineadas a lunes, con intensidad por minutos del día (4 niveles), rotulación (días de semana y etiquetas de mes/año), cifra agregada de las 12 semanas, tooltip accesible (ratón/toque/teclado), estados diferenciados (nivel 0 vs días futuros "no disponibles"), aviso único para almacenamiento ilegible y texto «Aún no hay sesiones» cuando no hay datos.

El plan sigue estrictamente la Constitución: HTML/CSS/JS puros (sin dependencias, funciona con doble clic), **lógica separada de la interfaz** (funciones puras que reciben `hoy` como parámetro), **tests con `node --test`** para toda la lógica pura, fechas siempre en hora local, datos nunca se modifican y todos los textos en español.

## 2. Archivos a crear o modificar

| Archivo | Acción | Responsabilidad | RF cubiertos |
|---|---|---|---|
| `index.html` | Modificar | Añade la sección del mapa (`#mapa-calor`): título, rotulación de días de semana, etiquetas de mes, rejilla 12x7, leyenda de 4 niveles, cifra agregada, área de mensaje de detalle, texto `Aún no hay sesiones` y contenedor para aviso de almacenamiento ilegible. Mantiene estructura existente, sin alterar ids/cifras actuales. | RF-1 (CA-1.1–1.5), RF-5 (CA-5.1–5.3), RF-6 (CA-6.1–6.3), RF-7 (CA-7.1–7.2), RF-9 (CA-9.1–9.3), RF-10 (CA-10.1–10.4), RF-11 (CA-11.1–11.2) |
| `styles.css` | Modificar | Estilos para la rejilla, celdas por nivel (0–4), estados `no-disponible`, foco visible, rotulación, etiquetas de mes, leyenda, cifra agregada, tooltip/mensaje de detalle, aviso de error y estado sin datos. Respeta diseño existente, sin usar media queries para romper el layout. Garantiza **sin desbordamiento horizontal** a 320/375/512 px (con scroll interno solo si fuese estrictamente necesario para la sección). Cumple contraste suficiente y `prefers-reduced-motion` si se añaden transiciones (sin forzarlas). | RF-5–RF-7, RF-9–RF-10, RNF-6–RNF-8, RNF-9 |
| `app.js` | Modificar | Orquesta la interfaz: lee sesiones (sin escribir), calcula con lógica pura (importa/usa funciones de `heatmap.js`), renderiza el mapa (rejilla, rotulación, etiquetas, leyenda, cifra agregada, estados), gestiona eventos (mouseover/mouseout, touchstart/touchmove/touchend, focus/blur, key), actualiza mapa **sin recargar página** al guardar sesión (RF-8.1), controla visibilidad entre aviso/estado sin datos/mapa (RF-10) y no altera cifras/listado existentes. | RF-1–RF-11, RNF-3–RNF-9 |
| `heatmap.js` | **Crear** | Módulo de **lógica pura** para el mapa. Exporta funciones que reciben `hoy` como parámetro y arrays de sesiones (sin acceder a DOM/localStorage). Contiene toda la lógica testeable con `node --test`. | RF-1–RF-3, RF-5, RNF-1–RNF-2, RNF-4–RNF-5 |
| `tests/heatmap.test.js` | **Crear** | Pruebas unitarias con `node --test` que cubren cálculos puros (ventana 12x7, niveles/fronteras 30/60/120, suma con válidas/invalidas, días futuros vs nivel 0, cifra agregada, estado sin datos, casos de lectura/corrupción y casos límite). Usa `hoy` inyectado en todos los tests. | Criterios de finalización (tests), RNF-2, RF-1–RF-3, RF-5, RF-9–RF-10 |

> **Nota (constitución):** `app.js` no usa `type="module"` (debe funcionar con doble clic, `file://`, sin módulos ES). Por ello, `heatmap.js` se cargará con `<script src="heatmap.js"></script>` **antes** de `app.js` en `index.html`, exponiendo sus funciones globales. Esto cumple principio 1 (simplicidad, sin build). No se añade npm, frameworks ni dependencias.

## 3. Funciones puras de lógica (con `hoy` como parámetro)

Todas las funciones siguientes son **puras** (RNF-1): no leen DOM, no escriben en localStorage, no tienen efectos secundarios, devuelven nuevos objetos/arrays. Reciben `hoy` (objeto `Date` o fecha válida en hora local). Se implementan en `heatmap.js` y se prueban en `tests/heatmap.test.js`.

| Función | Firma (propuesta) | Descripción | RF cubiertos |
|---|---|---|---|
| `normalizarHoy(hoy)` | `(hoy: Date) => Date` | Normaliza `hoy` a medianoche en hora local (quita hora/min/seg/ms). Garantiza comparaciones por día calendario (RNF-5). | RNF-5, RF-1, RF-3 |
| `inicioSemanaLunes(fechaLocal)` | `(fechaLocal: Date) => Date` | Devuelve el **lunes** de la semana que contiene `fechaLocal`, a medianoche local. Define semana con inicio lunes (alineación GitHub). | RF-1 (CA-1.1–1.5), RNF-5 |
| `añadirDias(fechaLocal, n)` | `(fechaLocal: Date, n: number) => Date` | Suma/resta `n` días usando `setDate()` (nunca resta milisegundos). Evita errores con cambio de horario (RNF-5). | RF-1, RNF-5 |
| `esMismoDia(a,b)` | `(a: Date, b: Date) => boolean` | Compara año/mes/día en hora local. | RF-2–RF-3 |
| `esFechaFutura(dia, hoyNorm)` | `(dia: Date, hoyNorm: Date) => boolean` | `dia > hoyNorm` (por calendario). True solo para fechas posteriores a hoy (CA-3.1). | RF-3 (CA-3.1, CA-3.3) |
| `ventanaUltimas12Semanas(hoy)` | `(hoy: Date) => { inicio: Date, fin: Date, dias: Date[] }` | Calcula ventana de **exactamente 84 días** (12x7): `inicio = lunes(hace 11 semanas)` (lunes 11 semanas antes del lunes de semana en curso), `fin = domingo(semana en curso)`. Genera array `dias` ordenado cronológicamente (lunes→domingo por filas) con 84 fechas a medianoche local. Cubre CA-1.1–1.5 (incluye hoy lunes/domingo). | RF-1 (CA-1.1–1.5), RNF-1, RNF-5 |
| `sesionValida(s)` | `(s: any) => boolean` | Valida sesión para mapa (sin alterar almacenamiento): debe ser objeto con `fecha` parseable a fecha válida local y `minutos` numérico, **entero**, `> 0`. Ignora ausentes/no numéricos/no enteros/<=0 (CA-2.4). No modifica `s`. | RF-2 (CA-2.4–CA-2.5), RF-10 (lectura/corrupción), RNF-4 |
| `parseFechaLocal(aaaammdd)` | `(s: string) => Date | null` | Parsea `"AAAA-MM-DD"` en hora local (nunca `new Date("AAAA-MM-DD")` ni `toISOString()`). Devuelve `Date` a medianoche o `null` si inválido. | RF-2, RNF-5 |
| `minutosPorDia(sesiones, diasVentana, hoyNorm)` | `(sesiones: any[], diasVentana: Date[], hoyNorm: Date) => Map<string, number>` | Agrupa sesiones **válidas** (ver `sesionValida`) por clave `AAAA-MM-DD` del día: suma minutos de ese día. Solo considera sesiones con fecha **dentro de la ventana** o que caigan en algún `dia` de la ventana (no fuerza incluir fuera). No tiene en cuenta días futuros para sumar (aunque CA-3.1 impide colorearlos). | RF-2 (CA-2.1, CA-2.5), RF-3 (CA-3.2), RNF-1, RNF-4 |
| `nivelPorMinutos(minTotal)` | `(minTotal: number) => 0|1|2|3|4` | Asigna nivel por umbrales fijos: 0 si `minTotal <= 0` (sin sesiones válidas). 1 si `1 <= minTotal <= 30`. 2 si `31 <= minTotal <= 60`. 3 si `61 <= minTotal <= 120`. 4 si `minTotal >= 121`. Fronteras: 30→nivel 1, 60→nivel 2, 120→nivel 3 (CA-2.2). | RF-2 (CA-2.2–CA-2.3), RNF-1 |
| `estadoCelda(dia, hoyNorm, minutosMap)` | `(dia: Date, hoyNorm: Date) => { fecha: string, esFuturo: boolean, minutos: number, nivel: 0|1|2|3|4, tieneSesiones: boolean }` | Determina estado único de celda: clave `AAAA-MM-DD`, `esFuturo = dia > hoyNorm` (CA-3.1), `minutos = suma válida de ese día` (0 si ninguna). `nivel`: si `esFuturo` → **no aplica nivel color** (se trata como `noDisponible`). Si no futuro: `nivelPorMinutos(minutos)`. `tieneSesiones = minutos >= 1`. Diferencia explícita **nivel 0 (sin sesiones, día pasado/presente dentro de ventana)** vs **noDisponible (día futuro)** (CA-3.1, CA-3.3, CA-4.6–4.7). | RF-2–RF-4, RNF-1 |
| `cifraAgregada12Semanas(sesiones, ventana)` | `(sesiones: any[], ventana: {inicio:Date,fin:Date}) => number` | Suma **minutos totales válidos** de todas las sesiones cuya fecha esté **entre `inicio` y `fin` inclusive** (ventana 12 semanas). No incluye fuera de ventana. Retorna total en minutos (entero). Para presentación se formatea con mismo formato que resto de página («0 min», «45 min», «1 h 30 min»). CA-5.3. | RF-5 (CA-5.3), RNF-1 |
| `formatearMinutosMapa(totalMin)` | `(totalMin: number) => string` | Formatea minutos al formato usado en la página: usa `h` y `min` sin cambiar con número (mismo criterio que `formatearMinutos` existente). Ej.: 0→`"0 min"`, 45→`"45 min"`, 60→`"1 h"`, 90→`"1 h 30 min"`, 135→`"2 h 15 min"`. Garantiza coherencia con resto de interfaz (CA-5.3, RNF-6). | RF-5, RNF-6 |
| `formatearFechaDetalle(fechaLocal)` | `(fechaLocal: Date) => string` | Formatea fecha para mensaje de detalle en español, coherente con resto de interfaz (RF-4). Ej.: `lun, 5 oct 2026` o equivalente en español (día semana corto + día + mes corto). No usa `toISOString()`. | RF-4, RNF-6 |
| `textoDetalleCelda(estado)` | `(estado: {esFuturo:boolean, fecha:string, minutos:number, tieneSesiones:boolean}) => string` | Devuelve texto exacto del tooltip/detalle: si `esFuturo` → **`"Día futuro. No hay sesiones registradas."`** (CA-4.7). Si no futuro y `tieneSesiones` → `"lun, 5 oct 2026 · 1 h 30 min"` (fecha + `·` + minutos formateados con `formatearMinutosMapa`). Si no futuro y no tiene sesiones → **`"lun, 5 oct 2026 · No hay sesiones."`** (CA-4.6). Siempre en español. | RF-4 (CA-4.6–4.7), RNF-6 |
| `textoAvisoLecturaIlegible()` | `() => string` | Retorna texto **exacto**: `"No se han podido leer los datos del diario. El mapa de calor no se puede mostrar."` (CA-10.1). | RF-10 (CA-10.1), RNF-6 |
| `textoSinDatos()` | `() => string` | Retorna `"Aún no hay sesiones"` (CA-9.2). | RF-9 (CA-9.2), RNF-6 |
| `rotulacionDiasSemana()` | `() => string[]` | Array de etiquetas abreviadas en español para columnas lunes→domingo: `["lun","mar","mié","jue","vie","sáb","dom"]` (CA-6.1). | RF-6 (CA-6.1), RNF-6 |
| `etiquetasMesPorFilas(ventanaDias)` | `(ventanaDias: Date[]) => Array<{fila:number, texto:string} | null>` | Genera etiquetas de **mes y año** (`"octubre 2026"`, formato mes completo año) que aparecen **cuando cambia de mes** a lo largo de las 12 filas (agrupadas por semana/fila). Indica para cada fila (0–11) si debe mostrarse etiqueta de mes (o `null`). Cubre cruce diciembre→enero (CA-6.2). | RF-6 (CA-6.2), RNF-6 |

> **Separación clara (RNF-2):** todas las anteriores son **lógica pura** (testeables con `node --test`). La actualización del DOM, eventos (ratón/toque/teclado), foco, visibilidad y lectura de `localStorage` **no** forman parte de estas funciones.

## 4. Algoritmo del mapa (pseudocódigo)

Algoritmo determinista, usa `hoy` inyectado y fechas locales.

```text
1. ENTRADA: hoy (Date), sesiones (array crudo)
2. hoyN = normalizarHoy(hoy)
3. v = ventanaUltimas12Semanas(hoyN)  // {inicio,fin,dias: Date[84]} orden lunes→domingo
4. sesionesValidasMapa = filtrar sesiones con sesionValida(s) == true
5. minPorDiaMap = minutosPorDia(sesionesValidasMapa, v.dias, hoyN)  // Map AAAA-MM-DD -> totalMin
6. total12s = cifraAgregada12Semanas(sesionesValidasMapa, v)
7. filas = 12; cols = 7
8. Para cada índice i en 0..83:
   - d = v.dias[i]
   - k = clave AAAA-MM-DD(d)
   - esF = esFechaFutura(d, hoyN)
   - m = minPorDiaMap.get(k) o 0
   - tiene = (m >= 1)
   - si esF:
       estado = { fecha:k, esFuturo:true, minutos:0, nivel: null, tieneSesiones:false, disponible:false }
     si no:
       nv = nivelPorMinutos(m)  // 0|1|2|3|4
       estado = { fecha:k, esFuturo:false, minutos:m, nivel:nv, tieneSesiones:tiene, disponible:true }
   - guardar estadoCelda[i] = estado
9. Modelo de render: { ventana:v, estados: estadoCelda[84], total12s, rotDias: rotulacionDiasSemana(), etiqMes: etiquetasMesPorFilas(v.dias) }
```

Notas algoritmo:
- `esFuturo` tiene precedencia: nunca se asigna nivel 1–4 (CA-3.1). Diferencia explícita con nivel 0 (CA-3.3, CA-4.6–4.7).
- Ventana exacta 84 días (CA-1.3). Casos hoy lunes/domingo cubiertos (CA-1.4–1.5).
- Solo sesiones válidas suman (CA-2.4–2.5). Sesiones fuera de ventana no se incluyen en mapa/cifra (CA-3.2).
- Cifra agregada usa `inicio`–`fin` inclusive (RF-5.3).

## 5. Cómo se pinta en la interfaz

Renderizado **sin recargar página** (RF-8.1). DOM se actualiza desde `app.js` tras recalcular con funciones puras.

### 5.1 Estructura HTML (index.html)

Nueva sección:

```html
<section id="mapa-calor" aria-labelledby="titulo-mapa">
  <h2 id="titulo-mapa">Mapa de calor de los días estudiados</h2>
  <p id="mapa-subtitulo">Últimas 12 semanas (lunes a domingo)</p>

  <!-- Aviso almacenamiento ilegible (único cuando aplica) -->
  <div id="mapa-aviso-lectura" role="alert" hidden aria-live="assertive"></div>

  <!-- Encabezados -->
  <div id="mapa-rotulacion-dias" aria-hidden="true"></div>
  <div id="mapa-etiquetas-mes" aria-hidden="true"></div>

  <!-- Rejilla -->
  <div id="mapa-rejilla" role="grid" aria-label="Mapa de calor de las últimas 12 semanas, de lunes a domingo"></div>

  <!-- Leyenda + cifra agregada -->
  <div id="mapa-info">
    <div id="mapa-leyenda" aria-label="Leyenda de niveles de minutos por día"></div>
    <div id="mapa-cifra-agregada" aria-live="polite"></div>
  </div>

  <!-- Estado sin datos -->
  <p id="mapa-sin-datos" hidden></p>

  <!-- Mensaje de detalle (tooltip accesible) -->
  <div id="mapa-detalle" role="status" aria-live="polite" hidden></div>
</section>
```

Notas:
- Aviso con `role="alert"` y `aria-live="assertive"` (RF-10). Cuando visible → **mapa, rotulación, etiquetas, leyenda, cifra, sin-datos permanecen ocultos** (CA-10.2).
- Rejilla con `role="grid"` y `aria-label` descriptivo (accesibilidad). Cada celda será `role="gridcell"` con `tabindex` según foco.
- Detalle con `role="status"` `aria-live="polite"` (no interrumpe lectura agresiva).
- Rotulación y etiquetas de mes marcadas `aria-hidden="true"` (la información de fecha se anuncia vía celdas, CA-6.3/7.1).

### 5.2 Renderizado (app.js)

Orden de decisión de visibilidad (prioritario):

1. **Intentar leer sesiones**: obtener array de `localStorage.getItem("diario-estudio-sesiones")`. Si **no se puede leer/parsear** (JSON inválido, acceso fallido, estructura inesperada): 
   - mostrar `#mapa-aviso-lectura` con `textoAvisoLecturaIlegible()` 
   - ocultar: rejilla, rotulación, etiquetas, leyenda, cifra agregada, `#mapa-sin-datos`
   - **no renderizar mapa** (CA-10.1–10.4). Resto de página intenta seguir (CA-10.3).
2. Si **se lee correctamente**: ocultar aviso. 
   - Calcular modelo con funciones puras: `ventanaUltimas12Semanas(hoy)`, `minutosPorDia`, `estadoCelda[84]`, `cifraAgregada12Semanas`.
   - Renderizar **rotulación días semana** (lun→dom) en `#mapa-rotulacion-dias` (RF-6.1).
   - Renderizar **etiquetas de mes por filas** (cuando cambia mes) en `#mapa-etiquetas-mes` (RF-6.2), con alineación por fila.
   - Renderizar **rejilla 12x7**: por cada celda crear elemento con `role="gridcell"`, `data-fecha`, `data-es-futuro`, `data-tiene-sesiones`, `data-nivel` (0–4 o `null` si futuro), `tabindex="0"` para celdas enfocables (ver 5.3), clases CSS: `.celda`, `.nivel-0`, `.nivel-1`, `.nivel-2`, `.nivel-3`, `.nivel-4`, `.no-disponible` (para futuros). **No añadir eventos de modificación de datos** (RF-11).
   - Renderizar **leyenda** con 4 niveles y rangos: 0 (sin sesiones), nivel 1 (1–30), nivel 2 (31–60), nivel 3 (61–120), nivel 4 (121+) (CA-5.1). Siempre visible cuando no hay aviso.
   - Renderizar **cifra agregada**: `formatearMinutosMapa(total12s)` (CA-5.3). Siempre visible cuando no hay aviso.
   - Estado sin datos: si **no hay ninguna sesión registrada en total** (array vacío tras lectura válida) → mostrar `#mapa-sin-datos` con `textoSinDatos()` y **mostrar rejilla en nivel 0** con todos los elementos (leyenda, rotulación, etiquetas, cifra «0 min») (CA-9.1–9.3). Si hay **alguna sesión registrada** (aunque todas fuera de ventana) → ocultar texto sin datos, mostrar mapa (celdas fuera de ventana en nivel 0, dentro según estados).
3. **Actualización al guardar sesión** (RF-8.1): tras evento de guardado existente (formulario), recalcular **con `hoy` reevaluado** (`new Date()` normalizado) y volver a renderizar únicamente la sección del mapa (sin recargar página). Si la sesión guardada es anterior a ventana → mapa queda igual (CA-8.2). Lógica pura reutilizada (CA-8.3).

### 5.3 Accesibilidad y eventos (interacción solo lectura)

Cada celda `gridcell` debe ser accesible por teclado y anunciar fecha/estado (CA-6.3, RF-7):

- `tabindex="0"` en celdas (se recomienda enfocar celdas de días **pasados/presentes**; celdas futuras `no-disponible` pueden no recibir foco obligatorio, pero si reciben foco deben anunciar estado futuro — CA-4.7).
- **aria-label** dinámico por celda: usar `textoDetalleCelda(estado)` (contiene fecha + minutos o texto "No hay sesiones" o "Día futuro..."). Así lector de pantalla anuncia información sin depender del color (RF-6.3, RF-7).
- **Tooltip/estado visible** (`#mapa-detalle`): muestra mismo texto. Comportamiento:
  - `mouseover` (ratón): mostrar (CA-4.1)
  - `mouseout`: ocultar (CA-4.5)
  - `focus` / `blur`: teclado (CA-4.3, CA-4.5)
  - `touchstart`: mostrar mientras contacto (CA-4.2). `touchmove`: si se detecta deslizamiento → ocultar y **no bloquear scroll** (prioridad scroll interno, CA-4.2/4.5). `touchend`/`touchcancel`: ocultar (CA-4.5)
- **Prioridad scroll vs tooltip** (táctil): al detectar movimiento significativo en `touchmove`, se oculta detalle antes/dejando que el scroll interno de la sección continúe (CA-4.2). Esto cumple RNF-8.
- **Nunca modifica datos**: ningún handler crea/edita/borra sesiones (RF-11.1–11.2). Solo muestra/oculta `#mapa-detalle`.

### 5.4 Estados visuales (CSS)

Clases por nivel: `.nivel-0` (sin color/intensidad mínima neutra), `.nivel-1`, `.nivel-2`, `.nivel-3`, `.nivel-4`. `.no-disponible` para días futuros (distinto de `.nivel-0`) — bordes/opacidad o color para diferenciarlos (CA-3.3). Foco visible con contorno accesible. Rotulación/etiquetas con espaciado para evitar desbordamiento horizontal a 375 px (RNF-8). Scroll interno de la sección del mapa solo si estrictamente necesario (no de página completa).

## 6. Decisiones técnicas justificadas (y alternativas descartadas)

| Decisión | Justificación | Alternativa descartada |
|---|---|---|
| **Crear `heatmap.js` aparte y cargar por `<script>` global (sin `type="module"`)** | Principio 1: debe funcionar con doble clic `file://`. Módulos ES requieren servidor o `type=module` con ciertas restricciones y `fetch` local está prohibido. Globals mantienen simplicidad y compatibilidad. | Usar ES modules (`import/export`) → rompería funcionamiento `file://`. Descartado. |
| **Lógica pura 100% en `heatmap.js`, DOM solo en `app.js`** | Principio 3 (lógica separada de interfaz). Permite testear todo el cálculo con `node --test` (principio 4) y facilita reutilización (recalcular al guardar). | Mezclar cálculos y DOM en `app.js` → difícil testear, rompe separación. Descartado. |
| **Ventana exactamente 84 días (12x7) con inicio = lunes 11 semanas antes del lunes de semana en curso, fin = domingo semana en curso** | CA-1.1–1.5 definen alineación lunes→domingo y casos lunes/domingo. Garantiza rejilla fija 12 filas. Evita ambigüedad de conteo de semanas. | Calcular "últimas 12 semanas" contando desde hoy hacia atrás por semanas parciales → rejilla variable o última fila ambigua. Descartado. |
| **Diferenciar `esFuturo` vs `nivel 0` (estado explícito `no-disponible`)** | CA-3.1/3.3 y CA-4.6/4.7 exigen distinguir "día futuro" de "sin sesiones". Tooltip distinto y anuncio accesible distinto. Evita contradicción detectada. | Tratar días futuros como nivel 0 → confunde mensaje ("No hay sesiones") con día futuro. Descartado. |
| **Umbrales fijos 1–30/31–60/61–120/121+ con frontera inferior** | Especificación fija fronteras (30→nivel 1, 60→nivel 2, 120→nivel 3). Estables en el tiempo (no relativos al máximo). Coherente y predecible. | Umbrales relativos al máximo de ventana → colores cambian al añadir sesiones recientes (histórico pierde referencia). Descartado. |
| **Suma solo sesiones válidas (`sesionValida`) e ignorar inválidas sin modificar almacenamiento** | CA-2.4–2.5 y RNF-4 (datos intactos). Soporta corrupción parcial y protege integridad. | Rechazar mapa o modificar datos → contrario a RNF-4 y RF-10. Descartado. |
| **Aviso único de lectura ilegible: ocultar mapa completamente cuando visible** | CA-10.2 aclara que el aviso no debe sustituirse por estado silencioso. Ocultar mapa evita ambigüedad (no coexistir con nivel 0). CA-10.4: no mostrar "Aún no hay sesiones". | Mostrar mapa en nivel 0 junto a aviso → riesgo de interpretar error como "sin datos". Descartado. |
| **Texto detalle/avisos exactos (literales)** | Principio 2 (spec manda) y RNF-6. Elimina ambigüedad de redacción: `"Día futuro. No hay sesiones registradas."`, aviso de lectura exacto, `"Aún no hay sesiones"`, `"0 min"` para agregada con total 0. | Dejar textos libres → posibles variaciones. Descartado. |
| **Reevaluar `hoy` al guardar (RF-8.1) y mantenerlo inyectable** | Permite refresco correcto al cruzar medianoche (limitación aceptada pero comportamiento definido: se actualiza al guardar/recargar). Funciones puras con parámetro facilitan tests y cumplen RNF-5. | Fijar `hoy` solo en carga → mapa puede quedar desactualizado hasta recarga aunque se guarde tras medianoche. Descartado. |
| **Separación tests: lógica pura con `node --test`, interacción verificada en navegador** | RNF-2 aclara ambos ámbitos (corrige ambigüedad detectada). Principio 4: puerta para cálculos; interacción/accesibilidad/responsive se validan manualmente con Chrome DevTools (criterios de finalización). | Intentar testear eventos DOM con `node --test` (sin JSDOM añadido, sin dependencias) → inviable con simplicidad (principio 1). Descartado. |
| **Formato de etiquetas de mes `«mes año»` (mes completo) y alineación por fila** | CA-6.2 especifica mes y año cuando cambia mes, cubre cruce diciembre→enero. Mes completo en español mantiene coherencia con interfaz (RNF-6). | Abreviaturas (`oct 2026`) → menos claro en español. Descartado. |
| **Prioridad scroll táctil sobre tooltip (detectar deslizamiento)** | RNF-8: scroll interno si necesario, mensaje detalle debe funcionar con dedo. Evita que tooltip impida scroll en rejilla. | Mantener tooltip durante cualquier contacto → dificulta scroll en móvil. Descartado. |
| **Usar `setDate()` para aritmética de días, parsear `"AAAA-MM-DD"` local** | RNF-5: fechas en hora local, cambio de horario no desplaza días. Coincide con reglas existentes del proyecto (AGENTS.md). | Restas de milisegundos o `new Date("AAAA-MM-DD")`/`toISOString()` → riesgo de desplazamiento UTC/local. Descartado. |

## 7. Estrategia de tests con `node --test`

Los tests **solo** cubren funciones puras de `heatmap.js` (RNF-2). No requieren dependencias. Usan `hoy` inyectado en todos los casos. Se ejecutan con `node --test tests/heatmap.test.js`.

### 7.1 Datos de prueba y helpers

- Fechas como objetos `Date` a medianoche local (`normalizarHoy`).
- Sesiones de ejemplo con formato `{ fecha: "AAAA-MM-DD", minutos: N, ... }` (coincide con formato existente). Se usa `parseFechaLocal`.
- Helpers para crear `hoy` fijo (p.ej. `new Date(2026,9,7)` = 7 oct 2026, miércoles) para determinismo.

### 7.2 Cobertura obligatoria (criterios de finalización)

| Caso | Qué probar | Funciones | RF/CA |
|---|---|---|---|
| **Ventana 12x7 básica** | `ventanaUltimas12Semanas(hoy)` devuelve 84 días, `inicio` es lunes, `fin` es domingo semana en curso, orden cronológico, columnas lunes→domingo. | `ventanaUltimas12Semanas`, `inicioSemanaLunes`, `añadirDias` | RF-1 (CA-1.1–1.3) |
| **Hoy es lunes** | Con `hoy = lunes`, semana en curso: única celda lunes disponible, 6 siguientes marcadas `esFuturo`/no disponibles. Última celda = domingo semana en curso. | `ventanaUltimas12Semanas`, `estadoCelda` | RF-1 (CA-1.4) |
| **Hoy es domingo** | `hoy = domingo`, semana en curso completa (7 celdas), última celda = ese domingo. | `ventanaUltimas12Semanas`, `estadoCelda` | RF-1 (CA-1.5) |
| **Cruce de año** | Ventana que cruza diciembre→enero: `etiquetasMesPorFilas` devuelve etiquetas con mes y año correctos (`diciembre 2026` → `enero 2027`) y alineadas por cambio de mes. | `etiquetasMesPorFilas` | RF-6 (CA-6.2), caso límite cruce año |
| **Suma por día (varias sesiones)** | Dos/tres sesiones mismo día → suma total. | `minutosPorDia`, `sesionValida` | RF-2 (CA-2.1, CA-2.5) |
| **Sesiones válidas/invalidas mezcladas** | Día con sesiones válidas+inválidas (minutos 0, negativos, no enteros, ausentes, no numéricos) → solo válidas suman, inválidas ignoradas (sin alterar datos). | `sesionValida`, `minutosPorDia` | RF-2 (CA-2.4–2.5) |
| **Niveles y fronteras** | minTotal 0→0; 1–30→1 (30→1); 31–60→2 (60→2); 61–120→3 (120→3); 121+→4 (p.ej. 1000→4). | `nivelPorMinutos` | RF-2 (CA-2.2–2.3) |
| **Días futuros vs nivel 0** | Celda futura (`dia > hoyN`): `esFuturo=true`, `nivel=null`, `disponible=false`, `tieneSesiones=false`. Celda pasado/sin sesiones: `esFuturo=false`, `nivel=0`, `tieneSesiones=false`. Diferenciación explícita. | `estadoCelda`, `esFechaFutura` | RF-3 (CA-3.1, CA-3.3), RF-4 (CA-4.6–4.7) |
| **Sesión anterior a ventana** | Sesión < `inicio` ventana → no aparece en `minutosPorDia` ni afecta mapa; no se borra (lógica pura no modifica). | `minutosPorDia` | RF-3 (CA-3.2) |
| **Texto detalle** | Futuro → `"Día futuro. No hay sesiones registradas."`. Sin sesiones (pasado) → `"lun, 5 oct 2026 · No hay sesiones."`. Con sesiones → incluye fecha + `·` + minutos formateados. | `textoDetalleCelda`, `formatearFechaDetalle`, `formatearMinutosMapa` | RF-4 (CA-4.6–4.7), RNF-6 |
| **Cifra agregada 12 semanas** | Suma solo sesiones válidas dentro de [inicio,fin]. Total 0 → `"0 min"`. Varios valores → formato coherente (`45 min`, `1 h`, `1 h 30 min`, `2 h 15 min`). | `cifraAgregada12Semanas`, `formatearMinutosMapa` | RF-5 (CA-5.3) |
| **Rotulación y etiquetas mes** | `rotulacionDiasSemana()` = ["lun","mar","mié","jue","vie","sáb","dom"]. `etiquetasMesPorFilas` devuelve cambios de mes con formato `«mes año»` (completo). | `rotulacionDiasSemana`, `etiquetasMesPorFilas` | RF-6 (CA-6.1–6.2) |
| **Estado sin datos** | Array sesiones vacío: modelo coherente (total12s 0, todos estados nivel 0 o futuros según ventana), `textoSinDatos() = "Aún no hay sesiones"`. | `textoSinDatos`, `cifraAgregada12Semanas` | RF-9 (CA-9.1–9.3) |
| **Almacenamiento ilegible/corrupto** | `sesionValida` rechaza elementos inválidos; parseo fecha inválida → `null`. Casos JSON corrupto/estructura inesperada se gestionan en capa interfaz (RF-10) — tests cubren validación y cálculos con datos corruptos/parciales. `textoAvisoLecturaIlegible()` devuelve texto exacto. | `sesionValida`, `parseFechaLocal`, `textoAvisoLecturaIlegible` | RF-10 (CA-10.1, CA-10.4) |
| **Fechas locales y setDate()** | Aritmética con `añadirDias` (setDate). Parse `"AAAA-MM-DD"` local. `normalizarHoy` a medianoche. Cambio de horario no altera días (smoke tests con fechas límite). | `normalizarHoy`, `añadirDias`, `parseFechaLocal`, `esMismoDia` | RNF-5 |
| **Sin modificación de datos** | Ninguna función pura muta array/sesiones de entrada (devuelve nuevos valores). Verificado conceptualmente en tests (objetos originales no cambian). | Todas puras | RNF-4 |

### 7.3 Ejecución y criterio de paso

- Comando: `node --test` (sin paquetes instalados). 
- Todos los tests deben pasar en verde. No se avanza con tests en rojo (principio 4).
- Cobertura: ventana, suma, niveles/fronteras, futuros vs nivel 0, cifra agregada, estado sin datos, aviso ilegible y casos límite (lunes/domingo, cruce año). Interacción queda fuera de `node --test` (verificado en navegador, RNF-2).

## 8. Mapeo completo RF → elementos del plan

| RF | CA | Cobertura (archivos/funciones/interfaz) |
|---|---|---|
| RF-1 | 1.1–1.5 | `heatmap.js`: `ventanaUltimas12Semanas`, `inicioSemanaLunes`, `añadirDias`, `normalizarHoy`. `index.html`: rejilla 12x7, título/subtítulo. `app.js`: render. Tests ventana + lunes/domingo. |
| RF-2 | 2.1–2.5 | `heatmap.js`: `sesionValida`, `minutosPorDia`, `nivelPorMinutos`, `parseFechaLocal`. Tests suma, válidas/invalidas, fronteras 30/60/120. |
| RF-3 | 3.1–3.3 | `heatmap.js`: `esFechaFutura`, `estadoCelda`. CSS `.no-disponible`. Interfaz anuncia estado futuro. Tests futuros vs nivel 0. |
| RF-4 | 4.1–4.7 | `heatmap.js`: `textoDetalleCelda`, `formatearFechaDetalle`, `formatearMinutosMapa`. `app.js`: eventos mouse/touch/focus/blur con prioridad scroll. `index.html`: `#mapa-detalle`. Tests textos detalle (incluye "Día futuro..."). |
| RF-5 | 5.1–5.3 | `heatmap.js`: `cifraAgregada12Semanas`, `formatearMinutosMapa`. `index.html`: leyenda + cifra agregada. Tests agregada y formato. |
| RF-6 | 6.1–6.3 | `heatmap.js`: `rotulacionDiasSemana`, `etiquetasMesPorFilas`. `index.html`: rotulación + etiquetas. `app.js`: aria-label por celda. Tests rotulación y cruce año. |
| RF-7 | 7.1–7.2 | CSS foco, contraste. `app.js`: aria-label, anuncio accesible. `heatmap.js`: textos detalle/leyenda coherentes. Verificación navegador. |
| RF-8 | 8.1–8.3 | `app.js`: recalcular con `hoy` reevaluado al guardar, sin recargar. `heatmap.js`: funciones puras reutilizables (inyectable). |
| RF-9 | 9.1–9.3 | `heatmap.js`: `textoSinDatos`. `index.html`: `#mapa-sin-datos`. Lógica visibilidad (sin aviso). Tests estado sin datos. |
| RF-10 | 10.1–10.4 | `heatmap.js`: `textoAvisoLecturaIlegible`. `app.js`: lectura segura de localStorage (try/catch/parse), visibilidad exclusiva (oculta mapa). Tests texto exacto y validación. |
| RF-11 | 11.1–11.2 | `app.js`: handlers solo muestran/ocultan detalle, sin llamadas a escritura de sesiones. |

## 9. Criterios de finalización (verificación)

- Spec y plan cumplen Constitución (principios 1–6).
- Archivos: 1 creado (`heatmap.js`), 1 creado (`tests/heatmap.test.js`), 3 modificados (`index.html`, `styles.css`, `app.js`).
- Toda lógica crítica cubierta por funciones puras con `hoy` inyectado.
- `node --test` en verde con cobertura indicada.
- Interfaz cumple RNF-6–RNF-9 (español, accesible, sin desbordamiento horizontal a 320/375/512 px, sin regresiones a cifras existentes).
- Sin dudas abiertas (resueltas en spec).