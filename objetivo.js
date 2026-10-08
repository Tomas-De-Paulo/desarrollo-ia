// Lógica pura del objetivo semanal de estudio.
// Se carga como script clásico tras heatmap.js (reutiliza sus ayudantes de fecha y
// formatearMinutosMapa) y antes de app.js, sin módulos ES, para funcionar abriendo
// index.html con doble clic. Sin DOM ni localStorage: todo recibe «hoy» o los datos
// como parámetro, y la interfaz (app.js) solo consume estas funciones.

// Minutos estudiados de la semana en curso (lunes → hoy) con «hoy» inyectado:
// es LA fuente de la cifra semanal, la comparten el Resumen (app.js) y el objetivo,
// así las dos cifras no pueden divergir (CA-2.8). Mismo cuerpo que la versión que
// vivía en app.js, pero pura: no lee el reloj. Compara claves "AAAA-MM-DD" como texto
// (cronológico gracias al formato con ceros), ignora minutos no finitos y excluye lo
// anterior al lunes y lo posterior a hoy.
function minutosDeEstaSemana(sesiones, hoy) {
  const hoyN = normalizarHoy(hoy);

  const desde = claveDiaMapa(inicioSemanaLunes(hoyN));
  const hasta = claveDiaMapa(hoyN);

  let total = 0;

  sesiones.forEach(function (sesion) {
    if (sesion.fecha >= desde && sesion.fecha <= hasta) {
      const minutos = Number(sesion.minutos);
      if (Number.isFinite(minutos)) {
        total = total + minutos;
      }
    }
  });

  return total;
}

// Interpreta el valor escrito o guardado como objetivo: devuelve el número solo si
// es texto con dígitos de un entero mayor que 0 ("300" → 300, "007" → 7).
// Cualquier otra cosa (vacío, null, "0", "-5", "90,5", "1e3", "30a", " 300"…)
// devuelve null = «sin objetivo» (RF-1, RF-7). No modifica la entrada.
function interpretarObjetivo(texto) {
  if (typeof texto !== 'string' || !/^\d+$/.test(texto)) {
    return null;
  }
  const minutos = Number(texto);
  // isFinite evita devolver Infinity con dígitos absurdos: eso no sería un objetivo posible.
  return Number.isFinite(minutos) && minutos > 0 ? minutos : null;
}

// --- Progreso del objetivo frente a la semana en curso ---

// Compara lo estudiado de la semana con el objetivo. La cifra estudiados sale SIEMPRE
// de minutosDeEstaSemana (la misma del Resumen, CA-2.8) y «hoy» entra como parámetro
// (RNF-1). Si el objetivo no es un entero mayor que 0 devuelve null = «sin objetivo»
// (RF-6, RF-7) y la interfaz muestra la invitación. Nunca produce cifras negativas:
// faltan y superadoEn se quedan en 0 y porcentajeBarra nace topada al 100 (CA-2.6),
// mientras las cifras siguen mostrando el total real (CA-3.2).
function calcularProgreso(sesiones, objetivo, hoy) {
  if (!Number.isInteger(objetivo) || objetivo <= 0) {
    return null;
  }

  const estudiados = minutosDeEstaSemana(sesiones, hoy);

  return {
    estudiados,
    objetivo,
    cumplido: estudiados >= objetivo,
    superado: estudiados > objetivo,
    faltan: Math.max(0, objetivo - estudiados),
    superadoEn: Math.max(0, estudiados - objetivo),
    porcentajeBarra: Math.min(100, Math.round((estudiados / objetivo) * 100)),
  };
}

// Mismo formato que formatearMinutos de app.js («0 min», «45 min», «1 h», «1 h 30 min»).
// Delega en formatearMinutosMapa de heatmap.js, que se carga antes y ya tiene esa misma
// conducta: así objetivo.js solo depende de heatmap.js, nunca de app.js (sin módulos ES).
function formatearMinutosObjetivo(minutos) {
  return formatearMinutosMapa(minutos);
}

// Cifras del progreso: «1 h 30 min de 5 h». Sin porcentaje (CA-2.1): la proporción
// la percibe la barra.
function textoCifrasProgreso(progreso) {
  const estudiados = formatearMinutosObjetivo(progreso.estudiados);
  const objetivo = formatearMinutosObjetivo(progreso.objetivo);
  return `${estudiados} de ${objetivo}`;
}

// Estado del objetivo en uno de tres textos (RF-3): superado → «Superado en 1 h» (el
// exceso sobre el objetivo, nunca una cifra negativa), cumplido exacto → «Objetivo
// cumplido» y en curso → «Te faltan 3 h 30 min», sin mensajes de fracaso.
function textoFaltanProgreso(progreso) {
  if (progreso.superado) {
    return `Superado en ${formatearMinutosObjetivo(progreso.superadoEn)}`;
  }
  if (progreso.cumplido) {
    return 'Objetivo cumplido';
  }
  return `Te faltan ${formatearMinutosObjetivo(progreso.faltan)}`;
}

// Invitación cuando todavía no hay objetivo guardado (CA-6.2).
function textoInvitacionObjetivo() {
  return 'Aún no has fijado objetivo. Escribe cuántos minutos quieres estudiar esta semana y pulsa "Guardar".';
}

// Rechazo de un valor inválido al guardar (CA-1.2), en el mensaje propio del campo.
function textoValorInvalidoObjetivo() {
  return 'Escribe un número entero de minutos mayor que 0.';
}

// Confirmación tras guardar un objetivo válido.
function textoObjetivoGuardado() {
  return 'Objetivo guardado.';
}

// Aviso cuando el objetivo es válido pero las sesiones no se pueden leer (CA-2.9):
// en vez de un «te falta X» calculado sobre 0 estudiados.
function textoAvisoSesionesIlegibles() {
  return 'No se puede calcular el progreso de esta semana: no se han podido leer las sesiones.';
}
