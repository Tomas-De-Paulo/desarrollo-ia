// Lógica pura del mapa de calor: sin interfaz ni almacenamiento, y siempre con «hoy»
// como parámetro. Se carga como script normal (sin módulos) para funcionar con doble clic.

// Devuelve «hoy» a medianoche en hora local, sin tocar el objeto de entrada.
function normalizarHoy(hoy) {
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
}

// Parsea "AAAA-MM-DD" en hora local. Nunca con new Date("AAAA-MM-DD") ni toISOString(),
// que interpretarían la fecha en UTC y podrían desplazar el día. Devuelve null si es basura.
function parseFechaLocal(texto) {
  if (typeof texto !== 'string') return null;
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return null;
  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const fecha = new Date(anio, mes - 1, dia);
  // Comprobación de vuelta: "2026-02-30" crea un Date, pero no cuadra en calendario.
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return null;
  }
  return fecha;
}

// Suma o resta n días con setDate(), nunca restas de milisegundos (con horario de verano
// hay días de 23 h o 25 h y el cálculo se desplazaría).
function añadirDias(fecha, n) {
  const copia = new Date(fecha.getTime());
  copia.setDate(copia.getDate() + n);
  return copia;
}

// Lunes de la semana que contiene la fecha (lunes = 0 ... domingo = 6).
function inicioSemanaLunes(fecha) {
  const desfase = (fecha.getDay() + 6) % 7;
  return añadirDias(normalizarHoy(fecha), -desfase);
}

// Ventana del mapa: exactamente 84 días (12 semanas), del lunes de hace 11 semanas
// al domingo de la semana en curso, en orden cronológico lunes→domingo por filas.
function ventanaUltimas12Semanas(hoy) {
  const hoyN = normalizarHoy(hoy);
  const lunesDeEstaSemana = inicioSemanaLunes(hoyN);
  const inicio = añadirDias(lunesDeEstaSemana, -77);
  const fin = añadirDias(lunesDeEstaSemana, 6);
  const dias = [];
  for (let i = 0; i < 84; i++) {
    dias.push(añadirDias(inicio, i));
  }
  return { inicio, fin, dias };
}

// Clave "AAAA-MM-DD" de una fecha local. Se llama claveDiaMapa y no claveFecha para no
// pisar la función homónima de app.js (los dos scripts comparten el ámbito global).
function claveDiaMapa(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// --- Sesiones, minutos por día y niveles ---

// Una sesión sirve para el mapa si tiene fecha "AAAA-MM-DD" válida y minutos enteros > 0.
// Las inválidas se ignoran sin modificar el objeto de entrada.
function sesionValida(sesion) {
  if (!sesion || typeof sesion !== 'object') return false;
  if (typeof sesion.minutos !== 'number') return false;
  if (!Number.isInteger(sesion.minutos) || sesion.minutos <= 0) return false;
  return parseFechaLocal(sesion.fecha) !== null;
}

// Suma de minutos válidos por día ("AAAA-MM-DD") de la ventana. Solo cuentan días de la
// ventana que no sean futuros: una sesión con fecha futura nunca colorea una celda.
function minutosPorDia(sesiones, diasVentana, hoyNorm) {
  const mapa = new Map();
  if (!Array.isArray(sesiones)) return mapa;
  const hoyN = normalizarHoy(hoyNorm);
  const clavesVentana = new Set(diasVentana.map(claveDiaMapa));
  for (const sesion of sesiones) {
    if (!sesionValida(sesion)) continue;
    const fecha = parseFechaLocal(sesion.fecha);
    if (fecha.getTime() > hoyN.getTime()) continue;
    const clave = claveDiaMapa(fecha);
    if (!clavesVentana.has(clave)) continue;
    mapa.set(clave, (mapa.get(clave) || 0) + sesion.minutos);
  }
  return mapa;
}

// Niveles fijos: 1-30 → 1, 31-60 → 2, 61-120 → 3, 121 o más → 4. Sin minutos → 0.
function nivelPorMinutos(minTotal) {
  if (!(minTotal > 0)) return 0;
  if (minTotal <= 30) return 1;
  if (minTotal <= 60) return 2;
  if (minTotal <= 120) return 3;
  return 4;
}

function esFechaFutura(dia, hoyNorm) {
  return normalizarHoy(dia).getTime() > normalizarHoy(hoyNorm).getTime();
}

// Estado de una celda: los días futuros nunca llevan nivel (esFuturo manda aunque exista
// una sesión con esa fecha); el resto recibe su nivel según los minutos del día.
function estadoCelda(dia, hoyNorm, minutosMap) {
  const clave = claveDiaMapa(normalizarHoy(dia));
  if (esFechaFutura(dia, hoyNorm)) {
    return { fecha: clave, esFuturo: true, minutos: 0, nivel: null, tieneSesiones: false, disponible: false };
  }
  const minutos = (minutosMap && minutosMap.get(clave)) || 0;
  return {
    fecha: clave,
    esFuturo: false,
    minutos,
    nivel: nivelPorMinutos(minutos),
    tieneSesiones: minutos >= 1,
    disponible: true,
  };
}

// --- Agregados y textos ---

// Total de minutos válidos dentro de la ventana (inclusive). El formato de salida lo
// decide formatearMinutosMapa, igual que el resto de la página.
function cifraAgregada12Semanas(sesiones, ventana) {
  if (!Array.isArray(sesiones)) return 0;
  const inicio = normalizarHoy(ventana.inicio).getTime();
  const fin = normalizarHoy(ventana.fin).getTime();
  let total = 0;
  for (const sesion of sesiones) {
    if (!sesionValida(sesion)) continue;
    const fecha = parseFechaLocal(sesion.fecha).getTime();
    if (fecha >= inicio && fecha <= fin) {
      total += sesion.minutos;
    }
  }
  return total;
}

// Mismo formato que formatearMinutos de app.js: "0 min", "45 min", "1 h", "1 h 30 min".
// Está duplicada a propósito: cada script se carga por separado (sin módulos) y así
// heatmap.js no depende de que app.js declare su versión.
function formatearMinutosMapa(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
}

// "lun, 5 oct 2026". Se usan listas fijas en vez de toLocaleDateString para que el texto
// sea siempre igual, sin depender de la versión de ICU del navegador o de Node.
function formatearFechaDetalle(fecha) {
  const diasCortos = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const mesesCortos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${diasCortos[fecha.getDay()]}, ${fecha.getDate()} ${mesesCortos[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// Texto exacto del mensaje de detalle según el estado de la celda.
function textoDetalleCelda(estado) {
  if (estado.esFuturo) return 'Día futuro. No hay sesiones registradas.';
  const fecha = parseFechaLocal(estado.fecha);
  const fechaTexto = fecha ? formatearFechaDetalle(fecha) : estado.fecha;
  if (estado.tieneSesiones) return `${fechaTexto} · ${formatearMinutosMapa(estado.minutos)}`;
  return `${fechaTexto} · No hay sesiones.`;
}

function textoAvisoLecturaIlegible() {
  return 'No se han podido leer los datos del diario. El mapa de calor no se puede mostrar.';
}

function textoSinDatos() {
  return 'Aún no hay sesiones';
}

function rotulacionDiasSemana() {
  return ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
}

const MESES_COMPLETOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Una etiqueta por fila (o null): aparece en la fila que contiene el día 1 de un mes,
// es decir, donde empieza ese mes dentro de la rejilla. La primera fila se rotula siempre
// con el mes de su último día, que coincide con el de su primera salvo cruce de mes.
function etiquetasMesPorFilas(ventanaDias) {
  const etiquetas = [];
  let mesAnterior = null;
  let anioAnterior = null;
  for (let fila = 0; fila * 7 < ventanaDias.length; fila++) {
    const ultimaPosicion = Math.min(fila * 7 + 6, ventanaDias.length - 1);
    const ultimoDia = ventanaDias[ultimaPosicion];
    const mes = ultimoDia.getMonth();
    const anio = ultimoDia.getFullYear();
    if (fila === 0 || mes !== mesAnterior || anio !== anioAnterior) {
      etiquetas.push({ fila, texto: `${MESES_COMPLETOS[mes]} ${anio}` });
    } else {
      etiquetas.push(null);
    }
    mesAnterior = mes;
    anioAnterior = anio;
  }
  return etiquetas;
}

globalThis.normalizarHoy = normalizarHoy;
globalThis.parseFechaLocal = parseFechaLocal;
globalThis.añadirDias = añadirDias;
globalThis.inicioSemanaLunes = inicioSemanaLunes;
globalThis.ventanaUltimas12Semanas = ventanaUltimas12Semanas;
globalThis.claveDiaMapa = claveDiaMapa;
globalThis.sesionValida = sesionValida;
globalThis.minutosPorDia = minutosPorDia;
globalThis.nivelPorMinutos = nivelPorMinutos;
globalThis.esFechaFutura = esFechaFutura;
globalThis.estadoCelda = estadoCelda;
globalThis.cifraAgregada12Semanas = cifraAgregada12Semanas;
globalThis.formatearMinutosMapa = formatearMinutosMapa;
globalThis.formatearFechaDetalle = formatearFechaDetalle;
globalThis.textoDetalleCelda = textoDetalleCelda;
globalThis.textoAvisoLecturaIlegible = textoAvisoLecturaIlegible;
globalThis.textoSinDatos = textoSinDatos;
globalThis.rotulacionDiasSemana = rotulacionDiasSemana;
globalThis.etiquetasMesPorFilas = etiquetasMesPorFilas;
