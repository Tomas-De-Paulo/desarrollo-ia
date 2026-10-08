const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.join(__dirname, '..');
const codigoHeatmap = fs.readFileSync(path.join(raiz, 'heatmap.js'), 'utf8');
const codigoObjetivo = fs.readFileSync(path.join(raiz, 'objetivo.js'), 'utf8');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');

// Mismo orden de carga real de la página: heatmap.js primero (objetivo.js reutiliza
// sus ayudantes de fecha) y después objetivo.js. Se carga una sola vez.
vm.runInThisContext(codigoHeatmap, { filename: 'heatmap.js' });
vm.runInThisContext(codigoObjetivo, { filename: 'objetivo.js' });

test('index.html carga heatmap.js, luego objetivo.js y al final app.js', () => {
  const posicionHeatmap = html.indexOf('src="heatmap.js"');
  const posicionObjetivo = html.indexOf('src="objetivo.js"');
  const posicionApp = html.indexOf('src="app.js"');

  assert.notEqual(posicionHeatmap, -1, 'falta el script de heatmap.js');
  assert.notEqual(posicionObjetivo, -1, 'falta el script de objetivo.js');
  assert.notEqual(posicionApp, -1, 'falta el script de app.js');
  assert.ok(posicionHeatmap < posicionObjetivo, 'heatmap.js debe cargarse antes que objetivo.js');
  assert.ok(posicionObjetivo < posicionApp, 'objetivo.js debe cargarse antes que app.js');
});

test('objetivo.js se carga sin error tras heatmap.js', () => {
  // Si ejecutar el código aquí arriba ha llegado hasta aquí, el fichero existe y se
  // interpreta como script clásico (sin módulos ES).
  assert.ok(codigoObjetivo.length > 0, 'objetivo.js no debe estar vacío');
});

test('objetivo.js no usa DOM, almacenamiento ni módulos ES', () => {
  assert.ok(!/document\./.test(codigoObjetivo), 'no debe usar document');
  assert.ok(!/localStorage\./.test(codigoObjetivo), 'no debe usar localStorage');
  assert.ok(!/sessionStorage\./.test(codigoObjetivo), 'no debe usar sessionStorage');
  assert.ok(!/\bimport\s/.test(codigoObjetivo), 'no debe usar import');
  assert.ok(!/\bexport\s/.test(codigoObjetivo), 'no debe usar export');
});

const {
  interpretarObjetivo,
  minutosDeEstaSemana,
  calcularProgreso,
  formatearMinutosObjetivo,
  textoCifrasProgreso,
  textoFaltanProgreso,
  textoInvitacionObjetivo,
  textoValorInvalidoObjetivo,
  textoObjetivoGuardado,
  textoAvisoSesionesIlegibles,
} = globalThis;

// --- T2: interpretarObjetivo ---

test('interpretarObjetivo convierte dígitos de un entero positivo a número', () => {
  assert.equal(interpretarObjetivo('300'), 300);
  assert.equal(interpretarObjetivo('007'), 7);
  assert.equal(interpretarObjetivo('1'), 1);
  assert.equal(interpretarObjetivo('10000'), 10000);
});

test('interpretarObjetivo rechaza vacío, cero, negativos y basura con null', () => {
  const entradasInvalidas = ['', null, '0', '-5', '90,5', '0,5', '1e3', '30a', ' 300'];

  for (const entrada of entradasInvalidas) {
    assert.equal(interpretarObjetivo(entrada), null,
      `debería devolver null con ${JSON.stringify(entrada)}`);
  }
});

test('interpretarObjetivo rechaza también undefined, sobrantes y decimales con punto', () => {
  const entradasInvalidas = [undefined, '300 ', '3.5'];

  for (const entrada of entradasInvalidas) {
    assert.equal(interpretarObjetivo(entrada), null,
      `debería devolver null con ${JSON.stringify(entrada)}`);
  }
});

test('interpretarObjetivo no modifica la entrada', () => {
  const valida = '300';
  const invalida = ' 300';

  interpretarObjetivo(valida);
  interpretarObjetivo(invalida);

  assert.equal(valida, '300', 'la entrada válida no debe cambiar');
  assert.equal(invalida, ' 300', 'la entrada inválida no debe cambiar');
});

// --- T3: minutosDeEstaSemana con «hoy» inyectado ---
// Miércoles 7 oct 2026: la semana en curso va del lunes 5 al domingo 11 de octubre.

const hoyMiercoles = new Date(2026, 9, 7);

test('minutosDeEstaSemana cuenta la sesión del lunes de esta semana', () => {
  const sesiones = [{ fecha: '2026-10-05', minutos: 45 }];

  assert.equal(minutosDeEstaSemana(sesiones, hoyMiercoles), 45);
});

test('minutosDeEstaSemana no cuenta la sesión del domingo anterior al lunes', () => {
  const sesiones = [{ fecha: '2026-10-04', minutos: 45 }];

  assert.equal(minutosDeEstaSemana(sesiones, hoyMiercoles), 0);
});

test('minutosDeEstaSemana no cuenta una sesión futura de esta misma semana', () => {
  const sesiones = [{ fecha: '2026-10-08', minutos: 45 }];

  assert.equal(minutosDeEstaSemana(sesiones, hoyMiercoles), 0);
});

test('minutosDeEstaSemana suma dos sesiones del mismo día', () => {
  const sesiones = [
    { fecha: '2026-10-06', minutos: 30 },
    { fecha: '2026-10-06', minutos: 40 },
  ];

  assert.equal(minutosDeEstaSemana(sesiones, hoyMiercoles), 70);
});

test('minutosDeEstaSemana no cuenta la semana pasada', () => {
  const sesiones = [
    { fecha: '2026-10-02', minutos: 45 },
    { fecha: '2026-09-28', minutos: 60 },
    { fecha: '2026-10-05', minutos: 10 },
  ];

  assert.equal(minutosDeEstaSemana(sesiones, hoyMiercoles), 10);
});

test('minutosDeEstaSemana con «hoy» lunes solo cuenta desde el lunes', () => {
  const hoyLunes = new Date(2026, 9, 5);
  const sesiones = [
    { fecha: '2026-10-04', minutos: 90 },
    { fecha: '2026-10-05', minutos: 20 },
  ];

  assert.equal(minutosDeEstaSemana(sesiones, hoyLunes), 20);
  assert.equal(minutosDeEstaSemana([], hoyLunes), 0, 'sin sesiones empieza en 0');
});

test('minutosDeEstaSemana ignora los minutos que no son números finitos', () => {
  const sesiones = [
    { fecha: '2026-10-05', minutos: 'abc' },
    { fecha: '2026-10-06', minutos: Infinity },
    { fecha: '2026-10-07', minutos: 30 },
  ];

  assert.equal(minutosDeEstaSemana(sesiones, hoyMiercoles), 30);
});

// --- T4: calcularProgreso y textos en español ---

test('calcularProgreso devuelve el progreso completo de una semana en curso', () => {
  const sesiones = [
    { fecha: '2026-10-06', minutos: 90 },
    { fecha: '2026-10-07', minutos: 60 },
  ];

  const progreso = calcularProgreso(sesiones, 360, hoyMiercoles);

  assert.deepEqual(progreso, {
    estudiados: 150,
    objetivo: 360,
    cumplido: false,
    superado: false,
    faltan: 210,
    superadoEn: 0,
    porcentajeBarra: 42,
  });
});

test('calcularProgreso en curso escribe «Te faltan 3 h 30 min» sin cifras negativas', () => {
  const sesiones = [
    { fecha: '2026-10-06', minutos: 90 },
    { fecha: '2026-10-07', minutos: 60 },
  ];

  const progreso = calcularProgreso(sesiones, 360, hoyMiercoles);

  assert.equal(textoFaltanProgreso(progreso), 'Te faltan 3 h 30 min');
  assert.ok(progreso.faltan >= 0, 'lo que falta nunca puede ser negativo');
  assert.ok(progreso.superadoEn >= 0, 'lo superado nunca puede ser negativo');
});

test('calcularProgreso con lo estudiado exactamente igual al objetivo lo marca cumplido', () => {
  const sesiones = [
    { fecha: '2026-10-05', minutos: 200 },
    { fecha: '2026-10-07', minutos: 100 },
  ];

  const progreso = calcularProgreso(sesiones, 300, hoyMiercoles);

  assert.deepEqual(progreso, {
    estudiados: 300,
    objetivo: 300,
    cumplido: true,
    superado: false,
    faltan: 0,
    superadoEn: 0,
    porcentajeBarra: 100,
  });
  assert.equal(textoFaltanProgreso(progreso), 'Objetivo cumplido');
});

test('calcularProgreso al superar muestra el total real, «Superado en 1 h» y la barra llena', () => {
  const sesiones = [
    { fecha: '2026-10-06', minutos: 180 },
    { fecha: '2026-10-07', minutos: 180 },
  ];

  const progreso = calcularProgreso(sesiones, 300, hoyMiercoles);

  assert.equal(progreso.estudiados, 360, 'el total real no se recorta al objetivo');
  assert.equal(progreso.cumplido, true, 'superar es un éxito');
  assert.equal(progreso.superado, true);
  assert.equal(progreso.faltan, 0, 'nunca una cifra negativa de lo que falta');
  assert.equal(progreso.superadoEn, 60);
  assert.equal(progreso.porcentajeBarra, 100, 'la barra se queda topada al 100 %');
  assert.equal(textoFaltanProgreso(progreso), 'Superado en 1 h');
});

test('porcentajeBarra está topada a 100 y refleja la proporción a mitad', () => {
  const mitad = calcularProgreso([{ fecha: '2026-10-06', minutos: 150 }], 300, hoyMiercoles);
  assert.equal(mitad.porcentajeBarra, 50);

  const justo = calcularProgreso([{ fecha: '2026-10-06', minutos: 300 }], 300, hoyMiercoles);
  assert.equal(justo.porcentajeBarra, 100);

  const pasado = calcularProgreso([{ fecha: '2026-10-06', minutos: 450 }], 300, hoyMiercoles);
  assert.equal(pasado.porcentajeBarra, 100, 'pasarse no puede pasar del 100 %');

  const casiNada = calcularProgreso([{ fecha: '2026-10-06', minutos: 1 }], 10000, hoyMiercoles);
  assert.ok(casiNada.porcentajeBarra <= 100, 'nunca por encima del 100');
});

test('objetivo de 1 minuto con 0 estudiados falta 1 min y no es un estado roto', () => {
  const progreso = calcularProgreso([], 1, hoyMiercoles);

  assert.deepEqual(progreso, {
    estudiados: 0,
    objetivo: 1,
    cumplido: false,
    superado: false,
    faltan: 1,
    superadoEn: 0,
    porcentajeBarra: 0,
  });
  assert.equal(textoFaltanProgreso(progreso), 'Te faltan 1 min');
});

test('objetivo muy grande (10000 min) no produce cifras rotas', () => {
  const progreso = calcularProgreso([{ fecha: '2026-10-05', minutos: 300 }], 10000, hoyMiercoles);

  assert.equal(progreso.estudiados, 300);
  assert.equal(progreso.faltan, 9700);
  assert.ok(progreso.porcentajeBarra <= 100);
});

test('calcularProgreso devuelve null con objetivo nulo o inválido', () => {
  const objetivosInvalidos = [null, undefined, 0, -5, 90.5, '300'];

  for (const objetivo of objetivosInvalidos) {
    assert.equal(calcularProgreso([], objetivo, hoyMiercoles), null,
      `debería devolver null con objetivo ${JSON.stringify(objetivo)}`);
  }
});

test('estudiados sale de minutosDeEstaSemana: una sola función semanal (CA-2.8)', () => {
  const sesiones = [
    { fecha: '2026-10-05', minutos: 45 },
    { fecha: '2026-10-07', minutos: 90 },
  ];

  const progreso = calcularProgreso(sesiones, 300, hoyMiercoles);

  assert.equal(progreso.estudiados, minutosDeEstaSemana(sesiones, hoyMiercoles));
  assert.equal(progreso.estudiados, 135);
});

test('con «hoy» lunes y sin sesiones el progreso arranca en 0 (CA-2.2, CA-5.1)', () => {
  const hoyLunes = new Date(2026, 9, 5);

  const progreso = calcularProgreso([], 300, hoyLunes);

  assert.equal(progreso.estudiados, 0, 'no hereda minutos de la semana anterior');
  assert.equal(progreso.faltan, 300);
  assert.equal(progreso.porcentajeBarra, 0);
  assert.equal(textoFaltanProgreso(progreso), 'Te faltan 5 h');
});

test('formatearMinutosObjetivo usa el formato de la página', () => {
  assert.equal(formatearMinutosObjetivo(0), '0 min');
  assert.equal(formatearMinutosObjetivo(45), '45 min');
  assert.equal(formatearMinutosObjetivo(60), '1 h');
  assert.equal(formatearMinutosObjetivo(90), '1 h 30 min');
  assert.equal(formatearMinutosObjetivo(150), '2 h 30 min');
});

test('textoCifrasProgreso escribe «1 h 30 min de 5 h» sin porcentaje', () => {
  const progreso = calcularProgreso([{ fecha: '2026-10-06', minutos: 90 }], 300, hoyMiercoles);

  const texto = textoCifrasProgreso(progreso);

  assert.equal(texto, '1 h 30 min de 5 h');
  assert.ok(!texto.includes('%'), 'las cifras no llevan porcentaje');
});

test('los textos fijos son exactamente los de la spec, en español', () => {
  assert.equal(
    textoInvitacionObjetivo(),
    'Aún no has fijado objetivo. Escribe cuántos minutos quieres estudiar esta semana y pulsa "Guardar".'
  );
  assert.equal(textoValorInvalidoObjetivo(), 'Escribe un número entero de minutos mayor que 0.');
  assert.equal(textoObjetivoGuardado(), 'Objetivo guardado.');
  assert.equal(
    textoAvisoSesionesIlegibles(),
    'No se puede calcular el progreso de esta semana: no se han podido leer las sesiones.'
  );
});

test('ningún texto de progreso lleva porcentaje ni cifra negativa', () => {
  const enCurso = calcularProgreso([{ fecha: '2026-10-06', minutos: 150 }], 360, hoyMiercoles);
  const cumplido = calcularProgreso([{ fecha: '2026-10-06', minutos: 360 }], 360, hoyMiercoles);
  const superado = calcularProgreso([{ fecha: '2026-10-06', minutos: 600 }], 360, hoyMiercoles);

  const textos = [
    textoCifrasProgreso(enCurso),
    textoFaltanProgreso(enCurso),
    textoFaltanProgreso(cumplido),
    textoFaltanProgreso(superado),
    textoInvitacionObjetivo(),
    textoValorInvalidoObjetivo(),
    textoObjetivoGuardado(),
    textoAvisoSesionesIlegibles(),
  ];

  for (const texto of textos) {
    assert.ok(!texto.includes('%'), `no debe haber porcentaje en «${texto}»`);
    assert.ok(!texto.includes('-'), `no debe haber cifra negativa en «${texto}»`);
  }
});

test('las funciones no modifican las sesiones ni el progreso de entrada', () => {
  const sesiones = [{ fecha: '2026-10-06', minutos: 30, tema: 'Matemáticas' }];
  const copia = JSON.parse(JSON.stringify(sesiones));

  const progreso = calcularProgreso(sesiones, 300, hoyMiercoles);
  textoCifrasProgreso(progreso);
  textoFaltanProgreso(progreso);

  assert.deepEqual(sesiones, copia, 'el array de sesiones no debe cambiar');
  assert.equal(progreso.estudiados, 30, 'el progreso no debe modificarse al formatearlo');
});
