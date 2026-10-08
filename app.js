const CLAVE_ALMACEN = "diario-estudio-sesiones";
// Objetivo semanal: clave propia, separada de las sesiones. La de sesiones no se toca
// nunca desde esta feature (RF-7, RNF-4).
const CLAVE_OBJETIVO = "diario-estudio-objetivo";

const formulario = document.getElementById("formulario");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const listaSesiones = document.getElementById("lista");
const elementoRacha = document.getElementById("rachaNumero");
const elementoMejorRacha = document.getElementById("mejorNumero");
const elementoMinutosSemana = document.getElementById("minutosSemana");
const elementoDiasMes = document.getElementById("diasMes");
const elementoMensaje = document.getElementById("mensaje");
const formularioObjetivo = document.getElementById("formularioObjetivo");
const campoObjetivo = document.getElementById("objetivoMinutos");
const elementoMensajeObjetivo = document.getElementById("objetivoMensaje");
const elementoInvitacionObjetivo = document.getElementById("objetivoInvitacion");
const elementoProgresoObjetivo = document.getElementById("objetivoProgreso");
const elementoEstudiadoObjetivo = document.getElementById("objetivoEstudiado");
const elementoFaltanObjetivo = document.getElementById("objetivoFaltan");
const elementoBarraObjetivo = document.getElementById("objetivoBarra");
const elementoRellenoObjetivo = document.getElementById("objetivoRelleno");
const elementoAvisoObjetivo = document.getElementById("objetivoAviso");
const elementoAvisoMapa = document.getElementById("mapa-aviso-lectura");
const elementoCuerpoMapa = document.getElementById("mapa-cuerpo");
const elementoRotulacionMapa = document.getElementById("mapa-rotulacion-dias");
const elementoEtiquetasMapa = document.getElementById("mapa-etiquetas-mes");
const elementoRejillaMapa = document.getElementById("mapa-rejilla");
const elementoInfoMapa = document.getElementById("mapa-info");
const elementoCifraMapa = document.getElementById("mapa-cifra-agregada");
const elementoLeyendaMapa = document.getElementById("mapa-leyenda");
const elementoSinDatosMapa = document.getElementById("mapa-sin-datos");
const elementoDetalleMapa = document.getElementById("mapa-detalle");

function claveFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

function fechaDesdeClave(clave) {
  const partes = clave.split("-");
  const anio = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const dia = Number(partes[2]);
  return new Date(anio, mes, dia);
}

function fechaDeHoy() {
  return claveFecha(new Date());
}

function cargarSesiones() {
  const textoGuardado = localStorage.getItem(CLAVE_ALMACEN);
  if (!textoGuardado) {
    return [];
  }
  try {
    const sesiones = JSON.parse(textoGuardado);
    return Array.isArray(sesiones) ? sesiones : [];
  } catch (error) {
    return [];
  }
}

function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(sesiones));
}

function ordenarSesiones(sesiones) {
  return sesiones.slice().sort(function (a, b) {
    if (a.fecha !== b.fecha) {
      return a.fecha < b.fecha ? 1 : -1;
    }
    return b.creado - a.creado;
  });
}

function calcularRacha(sesiones) {
  const diasConSesion = new Set(sesiones.map(function (sesion) { return sesion.fecha; }));

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let diaActual = hoy;
  if (!diasConSesion.has(claveFecha(diaActual))) {
    diaActual.setDate(diaActual.getDate() - 1);
    if (!diasConSesion.has(claveFecha(diaActual))) {
      return 0;
    }
  }

  let racha = 0;
  while (diasConSesion.has(claveFecha(diaActual))) {
    racha = racha + 1;
    diaActual.setDate(diaActual.getDate() - 1);
  }
  return racha;
}

function esDiaSiguiente(diaAnterior, dia) {
  const siguiente = new Date(diaAnterior);
  siguiente.setDate(siguiente.getDate() + 1);
  return claveFecha(siguiente) === claveFecha(dia);
}

function calcularMejorRacha(sesiones) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diasConSesion = new Set();
  sesiones.forEach(function (sesion) {
    const fecha = fechaDesdeClave(sesion.fecha);
    if (fecha.getTime() <= hoy.getTime()) {
      diasConSesion.add(sesion.fecha);
    }
  });

  let mejor = 0;
  let actual = 0;
  let diaAnterior = null;

  Array.from(diasConSesion).sort().forEach(function (clave) {
    const dia = fechaDesdeClave(clave);
    if (diaAnterior && esDiaSiguiente(diaAnterior, dia)) {
      actual = actual + 1;
    } else {
      actual = 1;
    }
    if (actual > mejor) {
      mejor = actual;
    }
    diaAnterior = dia;
  });

  return mejor;
}

function inicioMes(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

function diasEstudiadosEsteMes(sesiones) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const desde = claveFecha(inicioMes(hoy));
  const hasta = claveFecha(hoy);

  const dias = new Set();
  sesiones.forEach(function (sesion) {
    if (sesion.fecha >= desde && sesion.fecha <= hasta) {
      dias.add(sesion.fecha);
    }
  });

  return dias.size;
}

function formatearMinutos(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) {
    return resto + " min";
  }
  if (resto === 0) {
    return horas + " h";
  }
  return horas + " h " + resto + " min";
}

function formatearDias(dias) {
  return dias === 1 ? "1 día" : dias + " días";
}

function formatearFecha(clave) {
  const fecha = fechaDesdeClave(clave);
  const texto = fecha.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function mostrarMensaje(texto, esError) {
  elementoMensaje.textContent = texto;
  elementoMensaje.className = esError ? "mensaje error" : "mensaje exito";
}

// Objetivo guardado: solo se acepta texto de dígitos de un entero > 0; cualquier otra
// cosa guardada (corrupta o imposible) se trata como «sin objetivo» en silencio (RF-7).
function cargarObjetivo() {
  return interpretarObjetivo(localStorage.getItem(CLAVE_OBJETIVO));
}

// Mensaje propio del campo del objetivo (éxito o rechazo): vive en #objetivoMensaje con
// aria-live y jamás en #mensaje, que es del formulario de sesiones (CA-1.2).
function mostrarMensajeObjetivo(texto, esError) {
  elementoMensajeObjetivo.textContent = texto;
  elementoMensajeObjetivo.className = esError ? "mensaje error" : "mensaje exito";
}

// Rellena el campo con el objetivo guardado; sin objetivo (o guardado corrupto) el
// campo queda vacío y la invitación explica cómo fijarlo.
function rellenarCampoObjetivo() {
  const objetivo = cargarObjetivo();
  campoObjetivo.value = objetivo === null ? "" : String(objetivo);
}

function pintarRacha(sesiones) {
  elementoRacha.textContent = calcularRacha(sesiones);
}

function pintarMejorRacha(sesiones) {
  elementoMejorRacha.textContent = calcularMejorRacha(sesiones);
}

function pintarMinutosSemana(sesiones, hoy) {
  elementoMinutosSemana.textContent = formatearMinutos(minutosDeEstaSemana(sesiones, hoy));
}

function pintarDiasMes(sesiones) {
  elementoDiasMes.textContent = formatearDias(diasEstudiadosEsteMes(sesiones));
}

function pintarLista(sesiones) {
  listaSesiones.textContent = "";

  if (sesiones.length === 0) {
    const mensajeVacio = document.createElement("li");
    mensajeVacio.className = "vacio";
    mensajeVacio.textContent = "Aún no hay sesiones. Rellena el formulario de arriba para registrar la primera.";
    listaSesiones.appendChild(mensajeVacio);
    return;
  }

  sesiones.forEach(function (sesion) {
    const item = document.createElement("li");
    item.className = "item";

    const fecha = document.createElement("span");
    fecha.className = "item-fecha";
    fecha.textContent = formatearFecha(sesion.fecha);

    const tema = document.createElement("span");
    tema.className = "item-tema";
    tema.textContent = sesion.tema;

    const minutos = document.createElement("span");
    minutos.className = "item-minutos";
    minutos.textContent = formatearMinutos(sesion.minutos);

    item.appendChild(fecha);
    item.appendChild(tema);
    item.appendChild(minutos);
    listaSesiones.appendChild(item);
  });
}

// Pinta el bloque del objetivo en sus cuatro estados mutuamente excluyentes
// (el campo del mini-formulario siempre visible y editable):
//  1. Sin objetivo (o valor guardado corrupto, en silencio, RF-7/CA-7.2) → invitación,
//     con progreso y aviso ocultos: nunca «Te faltan…» (CA-6.3).
//  2. Objetivo válido pero sesiones ilegibles → aviso de progreso no calculable y
//     sin cifras ni barra: jamás un «te falta X» calculado sobre 0 (CA-2.9).
//  3/4. Datos sanos → cifras «X de Y», estado (Te faltan / cumplido / superado) y barra
//     con aria-valuenow (porcentaje topado) y aria-valuetext legibles (CA-2.6, CA-8.3).
function pintarObjetivo(sesiones, legible, hoy) {
  const objetivo = cargarObjetivo();

  if (objetivo === null) {
    elementoInvitacionObjetivo.textContent = textoInvitacionObjetivo();
    elementoInvitacionObjetivo.hidden = false;
    elementoProgresoObjetivo.hidden = true;
    elementoAvisoObjetivo.hidden = true;
    return;
  }

  if (!legible) {
    elementoInvitacionObjetivo.hidden = true;
    elementoProgresoObjetivo.hidden = true;
    elementoAvisoObjetivo.textContent = textoAvisoSesionesIlegibles();
    elementoAvisoObjetivo.hidden = false;
    return;
  }

  // Objetivo siempre es un entero > 0 aquí (cargarObjetivo), así que calcularProgreso
  // nunca devuelve null: la cifra estudiados sale de minutosDeEstaSemana (CA-2.8).
  const progreso = calcularProgreso(sesiones, objetivo, hoy);
  const cifras = textoCifrasProgreso(progreso);
  const estado = textoFaltanProgreso(progreso);

  elementoEstudiadoObjetivo.textContent = cifras;
  elementoFaltanObjetivo.textContent = estado;
  elementoRellenoObjetivo.style.width = progreso.porcentajeBarra + "%";
  elementoBarraObjetivo.setAttribute("aria-valuenow", String(progreso.porcentajeBarra));
  elementoBarraObjetivo.setAttribute("aria-valuetext", cifras + ". " + estado);

  elementoInvitacionObjetivo.hidden = true;
  elementoAvisoObjetivo.hidden = true;
  elementoProgresoObjetivo.hidden = false;
}

// Lee el almacén distinguiendo «no se pudo leer» de «no hay datos» para el mapa y para
// el aviso del objetivo. No escribe nunca nada (RF-11) y no toma prestado
// cargarSesiones(): esa devuelve [] también cuando el JSON está roto y estos dos
// estados necesitan saberlo (RF-10, CA-2.9).
function leerSesionesConEstado() {
  try {
    const texto = localStorage.getItem(CLAVE_ALMACEN);
    if (!texto) {
      return { legible: true, sesiones: [] };
    }
    const datos = JSON.parse(texto);
    if (!Array.isArray(datos)) {
      return { legible: false, sesiones: [] };
    }
    return { legible: true, sesiones: datos };
  } catch (error) {
    return { legible: false, sesiones: [] };
  }
}

function pintarRotulacionMapa() {
  elementoRotulacionMapa.textContent = "";
  rotulacionDiasSemana().forEach(function (texto) {
    const etiqueta = document.createElement("span");
    etiqueta.textContent = texto;
    elementoRotulacionMapa.appendChild(etiqueta);
  });
}

function pintarEtiquetasMapa(dias) {
  elementoEtiquetasMapa.textContent = "";
  etiquetasMesPorFilas(dias).forEach(function (etiqueta) {
    const caja = document.createElement("div");
    caja.className = "mapa-etiqueta";
    if (etiqueta) {
      caja.textContent = etiqueta.texto;
    }
    elementoEtiquetasMapa.appendChild(caja);
  });
}

function pintarRejillaMapa(dias, hoy, minutos) {
  elementoRejillaMapa.textContent = "";

  for (let i = 0; i < dias.length; i += 7) {
    const fila = document.createElement("div");
    fila.className = "mapa-fila";
    fila.setAttribute("role", "row");

    for (let j = i; j < i + 7; j++) {
      const estado = estadoCelda(dias[j], hoy, minutos);
      const texto = textoDetalleCelda(estado);
      const celda = document.createElement("div");
      celda.className = "mapa-celda";
      celda.setAttribute("role", "gridcell");
      celda.tabIndex = 0;
      celda.dataset.fecha = estado.fecha;
      celda.dataset.esFuturo = String(estado.esFuturo);
      celda.dataset.tieneSesiones = String(estado.tieneSesiones);
      celda.dataset.nivel = estado.esFuturo ? "null" : String(estado.nivel);
      celda.dataset.detalle = texto;
      // El lector de pantalla anuncia fecha y minutos sin depender del color (CA-6.3, CA-7.1).
      // En futuro el texto literal no lleva fecha, así que se antepone para poder identificar
      // la celda por su fecha, como exige RF-6.
      celda.setAttribute(
        "aria-label",
        estado.esFuturo ? formatearFechaDetalle(dias[j]) + " · " + texto : texto
      );
      celda.classList.add(estado.esFuturo ? "no-disponible" : "nivel-" + estado.nivel);
      fila.appendChild(celda);
    }

    elementoRejillaMapa.appendChild(fila);
  }
}

function pintarCifraMapa(total) {
  const valor = document.createElement("span");
  valor.className = "mapa-cifra-valor";
  valor.textContent = formatearMinutosMapa(total);

  const etiqueta = document.createElement("span");
  etiqueta.className = "mapa-cifra-etiqueta";
  etiqueta.textContent = "estudiados en las últimas 12 semanas";

  elementoCifraMapa.textContent = "";
  elementoCifraMapa.appendChild(valor);
  elementoCifraMapa.appendChild(etiqueta);
}

function pintarLeyendaMapa() {
  const niveles = [
    { nivel: 1, texto: "1-30 min" },
    { nivel: 2, texto: "31-60 min" },
    { nivel: 3, texto: "61-120 min" },
    { nivel: 4, texto: "121+ min" },
  ];

  elementoLeyendaMapa.textContent = "";
  niveles.forEach(function (rango) {
    const item = document.createElement("span");
    item.className = "mapa-leyenda-item";

    const muestra = document.createElement("span");
    muestra.className = "mapa-muestra nivel-" + rango.nivel;
    muestra.setAttribute("aria-hidden", "true");

    const texto = document.createElement("span");
    texto.textContent = rango.texto;

    item.appendChild(muestra);
    item.appendChild(texto);
    elementoLeyendaMapa.appendChild(item);
  });
}

// Pinta el mapa completo. Se recalcula «hoy» en cada llamada, así que al guardar una
// sesión se refresca sin recargar la página (RF-8).
function pintarMapa() {
  const lectura = leerSesionesConEstado();
  ocultarDetalle();

  if (!lectura.legible) {
    // Con el aviso visible no se muestra ni el mapa ni el estado sin datos (CA-10.2/10.4)
    elementoAvisoMapa.textContent = textoAvisoLecturaIlegible();
    elementoCuerpoMapa.hidden = true;
    elementoInfoMapa.hidden = true;
    elementoSinDatosMapa.hidden = true;
    return;
  }

  elementoAvisoMapa.textContent = "";
  const sesiones = lectura.sesiones;
  const hoy = normalizarHoy(new Date());
  const ventana = ventanaUltimas12Semanas(hoy);
  const minutos = minutosPorDia(sesiones, ventana.dias, hoy);

  pintarRotulacionMapa();
  pintarEtiquetasMapa(ventana.dias);
  pintarRejillaMapa(ventana.dias, hoy, minutos);
  pintarCifraMapa(cifraAgregada12Semanas(sesiones, ventana));
  pintarLeyendaMapa();

  elementoCuerpoMapa.hidden = false;
  elementoInfoMapa.hidden = false;
  // El estado «sin datos» es para quien no ha registrado nada aún (CA-9.1)
  elementoSinDatosMapa.textContent = textoSinDatos();
  elementoSinDatosMapa.hidden = sesiones.length !== 0;
}

// --- Detalle de la celda activa: ratón, teclado o dedo (RF-4, RF-7) ---
// Los manejores solo escriben en #mapa-detalle: el mapa nunca toca lo guardado (RF-11).
let celdaDetalle = null; // celda que describe el mensaje actual (solo puede haber uno)
let origenDetalle = null; // "raton", "teclado" o "dedo": manda el último en llegar
let ultimoToque = 0;
let inicioToqueX = 0;
let inicioToqueY = 0;
let deslizando = false;

function celdaDelEvento(evento) {
  return evento.target.closest(".mapa-celda");
}

function mostrarDetalle(celda, origen) {
  celdaDetalle = celda;
  origenDetalle = origen;
  elementoDetalleMapa.textContent = celda.dataset.detalle;
}

function ocultarDetalle() {
  celdaDetalle = null;
  origenDetalle = null;
  elementoDetalleMapa.textContent = "";
}

// Tras un toque, el navegador emite también ratón y foco simulados: si no se ignoran unos
// instantes, el detalle se volvería a abrir al levantar el dedo (CA-4.2, CA-4.5).
function recienteToque() {
  return Date.now() - ultimoToque < 700;
}

elementoRejillaMapa.addEventListener("mouseover", function (evento) {
  if (recienteToque()) return;
  const celda = celdaDelEvento(evento);
  if (celda) {
    mostrarDetalle(celda, "raton");
  }
});

elementoRejillaMapa.addEventListener("mouseout", function (evento) {
  const celda = celdaDelEvento(evento);
  if (!celda || celda !== celdaDetalle || origenDetalle !== "raton") return;
  if (celda === document.activeElement) {
    origenDetalle = "teclado"; // sigue enfocada: mientras dure el foco se mantiene (CA-4.4)
    return;
  }
  ocultarDetalle();
});

elementoRejillaMapa.addEventListener("focusin", function (evento) {
  if (recienteToque()) return;
  const celda = celdaDelEvento(evento);
  if (celda) {
    mostrarDetalle(celda, "teclado");
  }
});

elementoRejillaMapa.addEventListener("focusout", function (evento) {
  const celda = celdaDelEvento(evento);
  if (celda === celdaDetalle && origenDetalle === "teclado") {
    ocultarDetalle();
  }
});

elementoRejillaMapa.addEventListener(
  "touchstart",
  function (evento) {
    ultimoToque = Date.now();
    const celda = celdaDelEvento(evento);
    if (!celda) return;
    const toque = evento.touches[0];
    inicioToqueX = toque.clientX;
    inicioToqueY = toque.clientY;
    deslizando = false;
    mostrarDetalle(celda, "dedo");
  },
  { passive: true }
);

elementoRejillaMapa.addEventListener(
  "touchmove",
  function (evento) {
    if (origenDetalle !== "dedo") return;
    const toque = evento.touches[0];
    const distancia = Math.max(
      Math.abs(toque.clientX - inicioToqueX),
      Math.abs(toque.clientY - inicioToqueY)
    );
    if (distancia > 8 && !deslizando) {
      deslizando = true;
      ocultarDetalle(); // el dedo desliza: gana el scroll (seguimos sin cancelar el evento)
    }
  },
  { passive: true }
);

function terminarToque() {
  if (origenDetalle === "dedo") {
    ocultarDetalle();
  }
}
elementoRejillaMapa.addEventListener("touchend", terminarToque);
elementoRejillaMapa.addEventListener("touchcancel", terminarToque);

function pintar() {
  // Una sola lectura para Resumen, lista y objetivo: todos ven exactamente el mismo
  // array y el mismo estado «legible» (CA-2.8). El mapa lee por su cuenta, como antes.
  const lectura = leerSesionesConEstado();
  const sesiones = ordenarSesiones(lectura.sesiones);
  const hoy = new Date();
  pintarRacha(sesiones);
  pintarMejorRacha(sesiones);
  pintarMinutosSemana(sesiones, hoy);
  pintarDiasMes(sesiones);
  pintarLista(sesiones);
  pintarObjetivo(sesiones, lectura.legible, hoy);
  pintarMapa();
}

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  if (!fecha) {
    mostrarMensaje("Elige una fecha.", true);
    return;
  }
  if (!tema) {
    mostrarMensaje("Escribe el tema de la sesión.", true);
    return;
  }
  if (!Number.isFinite(minutos) || minutos <= 0) {
    mostrarMensaje("Los minutos tienen que ser un número mayor que 0.", true);
    return;
  }

  const sesiones = cargarSesiones();
  sesiones.push({ fecha: fecha, tema: tema, minutos: minutos, creado: Date.now() });
  guardarSesiones(sesiones);

  formulario.reset();
  campoFecha.value = fechaDeHoy();
  campoTema.focus();
  mostrarMensaje("Sesión guardada.", false);

  pintar();
});

// Guardar el objetivo: botón «Guardar» o Intro (el submit del mini-formulario cubre
// ambos, CA-1.5). Solo escribe en CLAVE_OBJETIVO con texto de dígitos normalizado
// ("007" → "7"); la clave de sesiones no se toca (RNF-4).
formularioObjetivo.addEventListener("submit", function (evento) {
  evento.preventDefault();

  // Sin trim: " 300" y "300 " son inválidos según RF-1/CA-1.2 y se rechazan tal cual.
  const valor = interpretarObjetivo(campoObjetivo.value);

  if (valor === null) {
    // Rechazo junto al campo, nunca en #mensaje (CA-1.2): se conserva lo escrito en el
    // campo y sigue vigente el objetivo guardado, sin escribir nada en el almacén (CA-1.4).
    mostrarMensajeObjetivo(textoValorInvalidoObjetivo(), true);
    return;
  }

  localStorage.setItem(CLAVE_OBJETIVO, String(valor));
  campoObjetivo.value = String(valor);
  mostrarMensajeObjetivo(textoObjetivoGuardado(), false);
  pintar();
});

campoFecha.value = fechaDeHoy();
rellenarCampoObjetivo();
pintar();
