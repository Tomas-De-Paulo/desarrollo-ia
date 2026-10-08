const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.join(__dirname, '..');
const codigoHeatmap = fs.readFileSync(path.join(raiz, 'heatmap.js'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');

// Se carga una sola vez: declarar las mismas funciones otra vez daría error de redeclaración.
vm.runInThisContext(codigoHeatmap, { filename: 'heatmap.js' });
const {
  normalizarHoy,
  parseFechaLocal,
  añadirDias,
  inicioSemanaLunes,
  ventanaUltimas12Semanas,
  sesionValida,
  minutosPorDia,
  nivelPorMinutos,
  esFechaFutura,
  estadoCelda,
  cifraAgregada12Semanas,
  formatearMinutosMapa,
  formatearFechaDetalle,
  textoDetalleCelda,
  textoAvisoLecturaIlegible,
  textoSinDatos,
  rotulacionDiasSemana,
  etiquetasMesPorFilas,
} = globalThis;

// Helpers en español
const esMedianocheLocal = (f) =>
  f.getHours() === 0 && f.getMinutes() === 0 && f.getSeconds() === 0 && f.getMilliseconds() === 0;
const igualDia = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const enElFuturo = (dia, hoy) => dia.getTime() > hoy.getTime();

test('heatmap.js expone ventanaUltimas12Semanas como función global', () => {
  assert.equal(typeof ventanaUltimas12Semanas, 'function');
  assert.equal(typeof globalThis.ventanaUltimas12Semanas, 'function');
});

test('index.html carga heatmap.js antes que app.js', () => {
  const posicionHeatmap = html.indexOf('src="heatmap.js"');
  const posicionApp = html.indexOf('src="app.js"');
  assert.notEqual(posicionHeatmap, -1, 'falta el script de heatmap.js');
  assert.notEqual(posicionApp, -1, 'falta el script de app.js');
  assert.ok(posicionHeatmap < posicionApp, 'heatmap.js debe cargarse antes que app.js');
});

test('la lógica no accede al DOM ni al almacenamiento', () => {
  assert.ok(!/document\./.test(codigoHeatmap), 'no debe usar document');
  assert.ok(!/localStorage\./.test(codigoHeatmap), 'no debe usar localStorage');
  assert.ok(!/sessionStorage\./.test(codigoHeatmap), 'no debe usar sessionStorage');
});

test('heatmap.js no usa módulos ES', () => {
  assert.ok(!/\bimport\s/.test(codigoHeatmap), 'no debe usar import');
  assert.ok(!/\bexport\s/.test(codigoHeatmap), 'no debe usar export');
});

// --- Fase 1: fechas y ventana ---

test('normalizarHoy devuelve medianoche local sin tocar el original', () => {
  const hoyConHora = new Date(2026, 9, 7, 13, 45, 30, 123);
  const normalizada = normalizarHoy(hoyConHora);

  assert.ok(esMedianocheLocal(normalizada), 'debe ser medianoche local');
  assert.ok(igualDia(normalizada, hoyConHora), 'debe ser el mismo día de calendario');
  // El original no se modifica (función pura)
  assert.equal(hoyConHora.getHours(), 13);
  assert.equal(hoyConHora.getMilliseconds(), 123);
});

test('parseFechaLocal da Date local a medianoche, no UTC', () => {
  const fecha = parseFechaLocal('2026-10-07');

  assert.ok(fecha instanceof Date);
  assert.ok(esMedianocheLocal(fecha), 'debe ser medianoche en hora local');
  assert.equal(fecha.getFullYear(), 2026);
  assert.equal(fecha.getMonth(), 9);
  assert.equal(fecha.getDate(), 7);
});

test('parseFechaLocal devuelve null con basura o fechas imposibles', () => {
  assert.equal(parseFechaLocal('basura'), null);
  assert.equal(parseFechaLocal(''), null);
  assert.equal(parseFechaLocal('2026-10-07T00:00:00'), null);
  assert.equal(parseFechaLocal('07/10/2026'), null);
  assert.equal(parseFechaLocal('2026-13-01'), null);
  assert.equal(parseFechaLocal('2026-02-30'), null);
  assert.equal(parseFechaLocal(null), null);
  assert.equal(parseFechaLocal(undefined), null);
  assert.equal(parseFechaLocal(20261007), null);
});

test('inicioSemanaLunes: miércoles, domingo y sábado llevan al lunes de su semana', () => {
  const miercoles = new Date(2026, 9, 7);   // mié 7 oct 2026
  const domingo = new Date(2026, 9, 11);    // dom 11 oct 2026
  const sabado = new Date(2026, 9, 10);     // sáb 10 oct 2026
  const lunesEsperado = new Date(2026, 9, 5); // lun 5 oct 2026

  for (const fecha of [miercoles, domingo, sabado]) {
    const lunes = inicioSemanaLunes(fecha);
    assert.ok(igualDia(lunes, lunesEsperado), `fallo con ${fecha.toDateString()}`);
    assert.equal(lunes.getDay(), 1, 'debe ser lunes');
    assert.ok(esMedianocheLocal(lunes));
  }
});

test('inicioSemanaLunes con un lunes devuelve el mismo día', () => {
  const lunes = new Date(2026, 9, 5, 18, 30);
  const resultado = inicioSemanaLunes(lunes);

  assert.ok(igualDia(resultado, lunes));
  assert.ok(esMedianocheLocal(resultado));
});

test('añadirDias resta semanas completas manteniendo el día de la semana', () => {
  const lunes = new Date(2026, 9, 5);
  const semanaPrevia = añadirDias(lunes, -7);

  assert.ok(igualDia(semanaPrevia, new Date(2026, 8, 28)));
  assert.equal(semanaPrevia.getDay(), 1, 'sigue siendo lunes');
  // Recorrido de vuelta: +7 días devuelve al lunes original
  assert.ok(igualDia(añadirDias(semanaPrevia, 7), lunes));
  // No muta la entrada
  assert.ok(igualDia(lunes, new Date(2026, 9, 5)));
});

test('ventanaUltimas12Semanas: 84 días, de lunes a domingo de la semana en curso', () => {
  const hoy = new Date(2026, 9, 7, 9, 15); // miércoles 7 oct 2026
  const ventana = ventanaUltimas12Semanas(hoy);

  assert.equal(ventana.dias.length, 84, 'exactamente 84 días');
  assert.equal(ventana.inicio.getDay(), 1, 'empieza en lunes');
  assert.ok(igualDia(ventana.inicio, new Date(2026, 6, 20)), 'lunes hace 11 semanas');
  assert.equal(ventana.fin.getDay(), 0, 'termina en domingo');
  assert.ok(igualDia(ventana.fin, new Date(2026, 9, 11)), 'domingo de la semana en curso');
  // El último día es el fin y todo es cronológico
  assert.ok(igualDia(ventana.dias[83], ventana.fin));
  for (let i = 0; i < 83; i++) {
    assert.ok(añadirDias(ventana.dias[i], 1).getTime() === ventana.dias[i + 1].getTime(),
      `el día ${i + 1} debe seguir al ${i}`);
  }
  // Orden por filas: cada columna 0 es lunes y la 6 es domingo
  for (let i = 0; i < 84; i += 7) {
    assert.equal(ventana.dias[i].getDay(), 1, `la fila ${i / 7} empieza en lunes`);
    assert.equal(ventana.dias[i + 6].getDay(), 0, `la fila ${i / 7} termina en domingo`);
  }
  // Todos a medianoche local
  assert.ok(ventana.dias.every(esMedianocheLocal));
});

test('hoy lunes: solo el lunes de la última fila está disponible', () => {
  const hoy = new Date(2026, 9, 5); // lunes 5 oct 2026
  const ventana = ventanaUltimas12Semanas(hoy);
  const ultimaFila = ventana.dias.slice(77);

  assert.ok(igualDia(ultimaFila[0], hoy), 'la primera celda de la última fila es hoy');
  for (let i = 1; i < 7; i++) {
    assert.ok(enElFuturo(ultimaFila[i], hoy), `la celda ${i} de la última fila es futura`);
  }
  // Antes de la última fila nada es futuro
  assert.ok(ventana.dias.slice(0, 77).every((d) => !enElFuturo(d, hoy)));
  // Y la última celda de todas sigue siendo el domingo de la semana en curso
  assert.ok(igualDia(ventana.dias[83], new Date(2026, 9, 11)));
});

test('hoy domingo: ese domingo es la última celda de la rejilla', () => {
  const hoy = new Date(2026, 9, 11); // domingo 11 oct 2026
  const ventana = ventanaUltimas12Semanas(hoy);

  assert.ok(igualDia(ventana.dias[83], hoy), 'la última celda es el domingo de hoy');
  assert.equal(ventana.dias[83].getDay(), 0);
  // Con hoy domingo no queda ningún día futuro en la ventana
  assert.ok(ventana.dias.every((d) => !enElFuturo(d, hoy)));
});

// --- Fase 2: sesiones, minutos por día y niveles ---

test('sesionValida rechaza minutos ausentes, no numéricos, <= 0 y no enteros', () => {
  const conFecha = { fecha: '2026-10-07' };
  assert.equal(sesionValida({ ...conFecha }), false, 'minutos ausentes');
  assert.equal(sesionValida({ ...conFecha, minutos: '45' }), false, 'minutos no numéricos');
  assert.equal(sesionValida({ ...conFecha, minutos: undefined }), false, 'minutos undefined');
  assert.equal(sesionValida({ ...conFecha, minutos: 0 }), false, 'minutos a cero');
  assert.equal(sesionValida({ ...conFecha, minutos: -10 }), false, 'minutos negativos');
  assert.equal(sesionValida({ ...conFecha, minutos: 45.5 }), false, 'minutos no enteros');
  assert.equal(sesionValida({ ...conFecha, minutos: NaN }), false, 'minutos NaN');
  // También se rechaza sin fecha válida
  assert.equal(sesionValida({ fecha: 'basura', minutos: 45 }), false, 'fecha inválida');
  assert.equal(sesionValida(null), false, 'nulo');
  assert.equal(sesionValida('texto'), false, 'no objeto');
});

test('sesionValida acepta una sesión válida y no modifica el objeto', () => {
  const sesion = { fecha: '2026-10-07', tema: 'JavaScript', minutos: 45, creado: 1770000000000 };
  const copia = { ...sesion };

  assert.equal(sesionValida(sesion), true);
  assert.deepEqual(sesion, copia, 'la sesión de entrada debe quedar intacta');
});

test('minutosPorDia suma varias sesiones del mismo día', () => {
  const hoy = new Date(2026, 9, 7);
  const ventana = ventanaUltimas12Semanas(hoy);
  const sesiones = [
    { fecha: '2026-10-06', minutos: 10 },
    { fecha: '2026-10-06', minutos: 20 },
    { fecha: '2026-10-06', minutos: 15 },
  ];

  const mapa = minutosPorDia(sesiones, ventana.dias, hoy);

  assert.equal(mapa.get('2026-10-06'), 45, 'tres sesiones del mismo día suman 45');
  assert.equal(mapa.size, 1, 'solo ese día aparece en el mapa');
});

test('minutosPorDia cuenta solo la sesión válida de un día mezclado', () => {
  const hoy = new Date(2026, 9, 7);
  const ventana = ventanaUltimas12Semanas(hoy);
  const sesiones = [
    { fecha: '2026-10-07', minutos: 30 },
    { fecha: '2026-10-07', minutos: '30' },   // no numérico
    { fecha: '2026-10-07', minutos: -15 },    // negativo
    { fecha: '2026-10-07', minutos: 12.5 },   // no entero
    { fecha: '2026-10-07' },                  // ausente
  ];

  const mapa = minutosPorDia(sesiones, ventana.dias, hoy);

  assert.equal(mapa.get('2026-10-07'), 30, 'solo la válida suma');
});

test('minutosPorDia ignora sesiones anteriores a la ventana', () => {
  const hoy = new Date(2026, 9, 7);
  const ventana = ventanaUltimas12Semanas(hoy);
  const sesiones = [
    { fecha: '2026-07-13', minutos: 60 },  // lunes anterior al inicio (20 jul)
    { fecha: '2026-07-20', minutos: 25 },  // primer día de la ventana
    { fecha: '2026-07-19', minutos: 99 },  // domingo previo
  ];

  const mapa = minutosPorDia(sesiones, ventana.dias, hoy);

  assert.equal(mapa.has('2026-07-13'), false, 'antes del inicio no cuenta');
  assert.equal(mapa.has('2026-07-19'), false, 'antes del inicio no cuenta');
  assert.equal(mapa.get('2026-07-20'), 25, 'el primer día de la ventana sí cuenta');
  assert.equal(mapa.size, 1);
});

test('nivelPorMinutos respeta las fronteras 30, 60 y 120', () => {
  assert.equal(nivelPorMinutos(0), 0);
  assert.equal(nivelPorMinutos(1), 1);
  assert.equal(nivelPorMinutos(30), 1, 'la frontera 30 queda en el nivel inferior');
  assert.equal(nivelPorMinutos(31), 2);
  assert.equal(nivelPorMinutos(60), 2, 'la frontera 60 queda en el nivel inferior');
  assert.equal(nivelPorMinutos(61), 3);
  assert.equal(nivelPorMinutos(120), 3, 'la frontera 120 queda en el nivel inferior');
  assert.equal(nivelPorMinutos(121), 4);
  assert.equal(nivelPorMinutos(1000), 4, 'valores grandes sin efectos raros');
  assert.equal(nivelPorMinutos(-5), 0, 'negativos');
  assert.equal(nivelPorMinutos(45.5), 2, 'un valor fraccionario sigue el tramo que le toca');
});

test('estadoCelda: futuro esFuturo=true sin nivel, pasado sin sesiones nivel 0', () => {
  const hoy = new Date(2026, 9, 7); // miércoles 7 oct
  const mapaConSesionFutura = new Map([['2026-10-09', 90]]);
  const mapaVacio = new Map();

  const futura = estadoCelda(new Date(2026, 9, 9), hoy, mapaConSesionFutura);
  const pasadaSinSesiones = estadoCelda(new Date(2026, 9, 5), hoy, mapaVacio);

  // Futura: nunca nivel 1-4 aunque exista sesión con esa fecha
  assert.equal(futura.esFuturo, true);
  assert.equal(futura.nivel, null, 'sin nivel asignado');
  assert.equal(futura.minutos, 0, 'los minutos futuros no se reflejan');
  assert.equal(futura.tieneSesiones, false);
  assert.equal(futura.disponible, false);
  assert.equal(futura.fecha, '2026-10-09');

  // Pasada sin sesiones: nivel 0, distinto del estado futuro
  assert.equal(pasadaSinSesiones.esFuturo, false);
  assert.equal(pasadaSinSesiones.nivel, 0);
  assert.equal(pasadaSinSesiones.minutos, 0);
  assert.equal(pasadaSinSesiones.tieneSesiones, false);
  assert.equal(pasadaSinSesiones.disponible, true);

  assert.notDeepEqual(futura, pasadaSinSesiones, 'los dos estados deben diferir');
});

test('estadoCelda: un día pasado con minutos recibe su nivel', () => {
  const hoy = new Date(2026, 9, 7);
  const mapa = new Map([['2026-10-06', 90], ['2026-10-05', 30]]);

  const con90 = estadoCelda(new Date(2026, 9, 6), hoy, mapa);
  const con30 = estadoCelda(new Date(2026, 9, 5), hoy, mapa);
  const hoySinEstudio = estadoCelda(hoy, hoy, new Map());

  assert.equal(con90.nivel, 3);
  assert.equal(con90.tieneSesiones, true);
  assert.equal(con30.nivel, 1, '30 minutos queda en el nivel 1');
  assert.equal(hoySinEstudio.esFuturo, false, 'hoy no es futuro');
  assert.equal(hoySinEstudio.nivel, 0);
});

test('esFechaFutura distingue hoy de mañana por calendario', () => {
  const hoy = new Date(2026, 9, 7, 23, 30);

  assert.equal(esFechaFutura(new Date(2026, 9, 7), hoy), false, 'hoy nunca es futuro');
  assert.equal(esFechaFutura(new Date(2026, 9, 6), hoy), false, 'ayer no es futuro');
  assert.equal(esFechaFutura(new Date(2026, 9, 8), hoy), true, 'mañana sí es futuro');
});

// --- Fase 3: agregados y textos ---

test('formatearMinutosMapa usa el formato de la página', () => {
  assert.equal(formatearMinutosMapa(0), '0 min');
  assert.equal(formatearMinutosMapa(45), '45 min');
  assert.equal(formatearMinutosMapa(60), '1 h');
  assert.equal(formatearMinutosMapa(90), '1 h 30 min');
  assert.equal(formatearMinutosMapa(135), '2 h 15 min');
  assert.equal(formatearMinutosMapa(120), '2 h');
});

test('cifraAgregada12Semanas suma solo las sesiones dentro de la ventana', () => {
  const hoy = new Date(2026, 9, 7);
  const ventana = ventanaUltimas12Semanas(hoy);
  const sesiones = [
    { fecha: '2026-07-20', minutos: 45 },   // primer día de la ventana
    { fecha: '2026-10-11', minutos: 15 },   // último día de la ventana
    { fecha: '2026-10-06', minutos: 60 },   // dentro
    { fecha: '2026-07-19', minutos: 100 },  // antes de la ventana
    { fecha: '2026-10-12', minutos: 200 },  // domingo pasado, fuera
    { fecha: '2026-10-06', minutos: -50 },  // inválida
  ];

  assert.equal(cifraAgregada12Semanas(sesiones, ventana), 120);
  assert.equal(cifraAgregada12Semanas([], ventana), 0, 'sin sesiones → 0');
});

test('cifraAgregada12Semanas con total 0 se formatea como «0 min»', () => {
  const ventana = ventanaUltimas12Semanas(new Date(2026, 9, 7));
  const total = cifraAgregada12Semanas([], ventana);

  assert.equal(formatearMinutosMapa(total), '0 min');
});

test('formatearFechaDetalle escribe la fecha en español con año', () => {
  assert.equal(formatearFechaDetalle(new Date(2026, 9, 5)), 'lun, 5 oct 2026');
  assert.equal(formatearFechaDetalle(new Date(2027, 0, 1)), 'vie, 1 ene 2027');
});

test('textoDetalleCelda: futuro, con sesiones y sin sesiones', () => {
  const hoy = new Date(2026, 9, 7);

  const futuro = estadoCelda(new Date(2026, 9, 9), hoy, new Map([['2026-10-09', 90]]));
  assert.equal(textoDetalleCelda(futuro), 'Día futuro. No hay sesiones registradas.');

  const conSesiones = estadoCelda(new Date(2026, 9, 5), hoy, new Map([['2026-10-05', 90]]));
  assert.equal(textoDetalleCelda(conSesiones), 'lun, 5 oct 2026 · 1 h 30 min');

  const sinSesiones = estadoCelda(new Date(2026, 9, 6), hoy, new Map());
  assert.equal(textoDetalleCelda(sinSesiones), 'mar, 6 oct 2026 · No hay sesiones.');
});

test('textos literales del aviso y del estado sin datos', () => {
  assert.equal(textoAvisoLecturaIlegible(), 'No se han podido leer los datos del diario. El mapa de calor no se puede mostrar.');
  assert.equal(textoSinDatos(), 'Aún no hay sesiones');
});

test('rotulacionDiasSemana lista lun a dom en orden de columnas', () => {
  assert.deepEqual(rotulacionDiasSemana(), ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']);
});

test('etiquetasMesPorFilas: mes y año cuando cambia el mes, con cruce diciembre→enero', () => {
  const hoy = new Date(2027, 0, 6); // miércoles 6 ene 2027
  const ventana = ventanaUltimas12Semanas(hoy);
  const etiquetas = etiquetasMesPorFilas(ventana.dias);

  assert.equal(etiquetas.length, 12, 'una entrada por fila');
  assert.deepEqual(etiquetas[0], { fila: 0, texto: 'octubre 2026' });
  assert.deepEqual(etiquetas[1], { fila: 1, texto: 'noviembre 2026' });
  assert.deepEqual(etiquetas[6], { fila: 6, texto: 'diciembre 2026' }, 'fila con el 1 de diciembre');
  assert.deepEqual(etiquetas[10], { fila: 10, texto: 'enero 2027' }, 'fila con el 1 de enero, año nuevo');
  // Las filas que no cambian de mes no llevan etiqueta
  assert.equal(etiquetas[2], null);
  assert.equal(etiquetas[7], null);
  assert.equal(etiquetas[11], null);
});

test('etiquetasMesPorFilas con la ventana de hoy', () => {
  const ventana = ventanaUltimas12Semanas(new Date(2026, 9, 7));
  const etiquetas = etiquetasMesPorFilas(ventana.dias);

  assert.equal(etiquetas.length, 12);
  assert.equal(etiquetas[0].texto, 'julio 2026');
  assert.equal(etiquetas[1].texto, 'agosto 2026', 'fila con el 1 de agosto');
  assert.equal(etiquetas[6].texto, 'septiembre 2026', 'fila con el 1 de septiembre');
  assert.equal(etiquetas[10].texto, 'octubre 2026', 'fila con el 1 de octubre');
  assert.equal(etiquetas[3], null);
  assert.ok(etiquetas.every((e, i) => e === null || e.fila === i), 'la fila indicada coincide con su posición');
});
