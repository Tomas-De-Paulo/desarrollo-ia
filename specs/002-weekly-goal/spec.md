# Especificación 002 — Objetivo semanal de estudio

**Estado: aprobada** (aprobada por el usuario tras la revisión QA «APTA»; las cinco dudas
del borrador y los 15 hallazgos menores de la revisión están incorporados en esta versión;
ver «Sin dudas abiertas» al final. Plan en `plan.md` y tareas en `tasks.md`).

## Contexto y objetivo

El Diario de Estudio ya registra sesiones y muestra, en el Resumen, los minutos estudiados
esta semana junto a los días del mes. Esa cifra es solo informativa: no hay una **meta** que
perseguir, así que estudiar más o menos da exactamente la misma sensación de éxito.

Objetivo: permitir **fijar un objetivo de minutos por semana** y **ver el progreso de la
semana en curso** frente a ese objetivo, para que el estudiante se motive a completarlo.

Por qué la semana en curso: la semana (lunes → hoy) ya es la unidad con la que trabaja el
Resumen, y es el plazo más corto en el que se nota el esfuerzo sin esperar al mes. El
progreso se apoya en la cifra de minutos de la semana que ya existe, de modo que el
objetivo y el Resumen nunca pueden discrepar.

## Usuarios

- **Estudiante habitual** (principal): quiere una meta semanal concreta para esforzarse y
  comprobar si va camino de cumplirla.
- **Estudiante recién llegado**: todavía no ha fijado ningún objetivo ni registrado
  sesiones; no debe ver errores ni una interfaz rota.
- **Usuario de teclado o lector de pantalla**: no depende del color ni del ratón para saber
  cuánto lleva y cuánto le falta.

## Historias de usuario

- **HU-1**: Como estudiante, quiero fijar cuántos minutos quiero estudiar esta semana, para
  tener una meta clara que perseguir.
- **HU-2**: Como estudiante, quiero ver cuánto llevo y cuánto me falta del objetivo, para
  saber enseguida si voy bien.
- **HU-3**: Como estudiante, quiero que el progreso se actualice al guardar una sesión, para
  ver recompensado el esfuerzo del día.
- **HU-4**: Como estudiante, quiero que al llegar el lunes el progreso tenga sentido con el
  objetivo fijado, para no encontrar cifras anticuadas o engañosas.
- **HU-5**: Como usuario del diario, quiero poder cambiar mi objetivo cuando quiera, para
  adaptarlo a semanas más exigentes o más tranquilas.

## Requisitos funcionales

Criterios de aceptación en notación EARS. Formas usadas: **ubícuo** (sin desencadenante),
**CUANDO** (evento), **DADO QUE** (condición previa), **MIENTRAS** (estado persistente),
**SI … ENTONCES** (comportamiento no deseado).

### RF-1 — Fijar y cambiar el objetivo

El objetivo es un número de **minutos enteros positivos** que el estudiante elige. Se guarda
en la clave **`diario-estudio-objetivo`**, separada de las sesiones, con el valor escrito
como texto de dígitos de un entero mayor que 0 (p. ej. `"300"`); cualquier contenido que no
sea eso se trata como «sin objetivo» (RF-6, RF-7). La clave `diario-estudio-sesiones` y su
formato `{ fecha, tema, minutos, creado }` quedan intactos y no hace falta ninguna
migración.

El campo para fijarlo o editarlo está **dentro de la sección «Resumen», justo después de la
fila «estudiado esta semana» y antes de la fila «estudiados este mes»**, y está **visible
siempre**: se puede editar en cualquier momento, no solo al empezar la semana. La interfaz
lo identifica en español («objetivo de la semana» o equivalente) y deja claro que se puede
cambiar.

El progreso **se recalcula al cargar la página y tras cada guardado válido** (del objetivo
o de una sesión), al instante y sin recargar; mientras el usuario teclea no se recalcula. Y
si el guardado es inválido, el campo **conserva el texto escrito** y el mensaje de rechazo
queda visible para que el usuario lo corrija, mientras el objetivo guardado sigue en vigor.

- **CA-1.1 (CUANDO)**: CUANDO el usuario guarda un objetivo válido, el sistema debe
  conservarlo en las visitas futuras, sin recargar la página y sin perderlo al cerrar y
  volver a abrir el navegador, escribiéndolo en la clave `diario-estudio-objetivo` sin tocar
  las sesiones.
- **CA-1.2 (SI … ENTONCES)**: SI el valor introducido está vacío, no es un entero positivo
  legible (se rechazan expresamente los decimales como `90,5` u `0,5`, la notación `1e3` y
  los textos no numéricos) o es menor o igual que 0, ENTONCES el sistema debe rechazarlo
  con un mensaje breve en español **en un mensaje propio junto al campo del objetivo**
  (nunca en `#mensaje`, que pertenece al formulario de sesiones), anunciado a los lectores
  de pantalla con `aria-live` o `role="status"`, sin modificar el objetivo guardado y
  conservando en el campo el texto escrito.
- **CA-1.3 (ubícuo)**: El usuario debe poder cambiar el objetivo en cualquier momento
  (también a mitad de semana y varias veces) y, **al pulsar «Guardar» o Intro**, el
  progreso debe recalcularse con el nuevo valor al instante, sin recargar la página.
- **CA-1.4 (MIENTRAS)**: MIENTRAS el usuario tenga en el campo un valor inválido, el
  objetivo previamente guardado debe seguir visible y en vigor, y el progreso debe seguir
  calculándose con ese objetivo guardado.
- **CA-1.5 (ubícuo)**: Guardar el objetivo debe poder hacerse con una acción explícita
  visible (un botón «Guardar») y con la tecla Intro, usable tanto con el teclado como con
  el dedo.

### RF-2 — Progreso de la semana en curso

El progreso compara los minutos estudiados de la semana en curso (lunes → hoy) con el
objetivo, y usa **exactamente la misma cifra de minutos semanales que muestra el Resumen**:
la fuente es **una sola función** —la misma que pinta el Resumen,
`minutosDeEstaSemana()`, refactorizada a versión pura que recibe «hoy» como parámetro si
hace falta—, de modo que la cifra del Resumen y la del objetivo no pueden divergir. Se
muestra **en la sección «Resumen», en la posición indicada en RF-1**, y **no se añade
ninguna tarjeta ni ningún elemento `.tarjeta` nuevo**: el progreso vive dentro de la sección
«Resumen» existente.

- **CA-2.1 (ubícuo)**: El sistema debe mostrar a la vez el objetivo, lo estudiado hasta hoy
  y **lo que falta**, de modo que sin hacer cuentas se vea si se cumple. No se muestra
  ninguna cifra de porcentaje: la proporción se percibe con la barra (CA-2.6). Cuando lo
  estudiado alcanza o supera el objetivo, en el lugar de «lo que falta» aparece el indicador
  de cumplido y, si se supera, «superado en X min» (RF-3); nunca una cifra negativa.
- **CA-2.2 (DADO QUE)**: DADO QUE hoy es lunes y todavía **no hay ninguna sesión en la
  semana en curso**, al cargar (o recargar) la página el progreso debe empezar en 0
  minutos, sin blanco, sin errores y sin mostrar datos de la semana anterior: los valores
  solo se recalculan al cargar y al guardar (limitación aceptada).
- **CA-2.3 (SI … ENTONCES)**: SI una sesión tiene fecha posterior a hoy, ENTONCES no debe
  contar en el progreso aunque caiga dentro de esta semana, igual que no cuenta en el total
  semanal del Resumen.
- **CA-2.4 (SI … ENTONCES)**: SI una sesión es anterior al lunes de esta semana, ENTONCES no
  debe contar en el progreso de esta semana.
- **CA-2.5 (ubícuo)**: Los minutos del progreso deben mostrarse con el mismo formato que el
  resto de la página (por ejemplo «1 h 30 min») y en español.
- **CA-2.6 (ubícuo)**: Junto a las cifras debe mostrarse una **barra de progreso** que
  refleje lo estudiado respecto al objetivo; la barra se llena como máximo al 100 % (si el
  estudiante se pasa, queda llena) mientras las cifras siguen mostrando el total real.
- **CA-2.7 (ubícuo)**: Las cifras y la barra deben leerse sin depender solo del color: lo
  estudiado, el objetivo y lo que falta van escritos en texto.
- **CA-2.8 (ubícuo)**: La cifra de minutos que se muestra en la fila «estudiado esta
  semana» y la que se usa para calcular el progreso del objetivo deben proceder de la
  misma función, de modo que ambas cifras no puedan divergir nunca.
- **CA-2.9 (SI … ENTONCES)**: SI el objetivo es válido pero las sesiones guardadas no se
  pueden leer, ENTONCES el progreso no debe presentarse como un «te falta X» calculado
  sobre 0 estudiados, sino mostrar un aviso breve y específico en español de que el
  progreso de esta semana no puede calcularse, sin impedir el resto de la página.

### RF-3 — Semana cumplida o superada

- **CA-3.1 (DADO QUE)**: DADO QUE lo estudiado iguala el objetivo, el sistema debe indicar
  de forma clara y en español que el objetivo está cumplido.
- **CA-3.2 (DADO QUE)**: DADO QUE lo estudiado supera el objetivo, el sistema debe seguir
  indicando que está cumplido y mostrar el total real estudiado, sin ocultarlo ni
  recortarlo al objetivo; en el lugar de «lo que falta» debe mostrarse «superado en X min»
  (el exceso sobre el objetivo), nunca una cifra negativa de lo que falta. Superar el
  objetivo es un **éxito**: nada debe presentarse como fracaso ni como error.
- **CA-3.3 (SI … ENTONCES)**: SI lo estudiado es menor que el objetivo, ENTONCES el sistema
  debe mostrar lo que falta, sin mensajes de fracaso.

### RF-4 — Actualización al guardar una sesión

- **CA-4.1 (CUANDO)**: CUANDO el usuario guarda una sesión, el sistema debe refrescar el
  progreso para que se vea reflejado al instante, sin recargar la página.
- **CA-4.2 (SI … ENTONCES)**: SI la sesión guardada es de una fecha anterior al lunes de
  esta semana o posterior a hoy, ENTONCES el progreso de la semana no debe cambiar.

### RF-5 — Cambio de semana

Hay **un solo objetivo persistido que se repite cada semana**: no se guarda ligado a
ninguna semana concreta ni hay historial de objetivos por semana.

- **CA-5.1 (ubícuo)**: Al empezar una semana nueva (lunes), el progreso debe contar desde 0
  minutos estudiados, porque los minutos de la semana anterior ya no son de esta semana.
- **CA-5.2 (ubícuo)**: Cada lunes el progreso se compara con ese mismo objetivo guardado, y
  el estudiante no tiene que fijarlo de nuevo: si el objetivo sigue guardado, sigue vigente.
- **CA-5.3 (SI … ENTONCES)**: SI el estudiante no ha fijado objetivo (ni ahora ni antes),
  ENTONCES el sistema debe mostrar un estado comprensible en español y no debe presentar
  como incumplido un objetivo que nadie ha fijado.

### RF-6 — Estado sin objetivo fijado

No hay ningún valor por defecto: hasta que el estudiante fija un objetivo, la página no
muestra ninguna cifra de progreso **frente al objetivo**, ni porcentaje, ni barra (la cifra
de «estudiado esta semana» sigue apareciendo, que es informativa y no depende del objetivo).

- **CA-6.1 (DADO QUE)**: DADO QUE todavía no se ha fijado ningún objetivo, la página debe
  seguir mostrando el resto de cifras y formularios con normalidad, sin errores en consola.
- **CA-6.2 (ubícuo)**: Mientras no haya objetivo, el sistema debe mostrar en español una
  invitación breve del tipo «aún no has fijado objetivo», explicando cómo fijarlo con el
  campo de la sección «Resumen», sin presentar un progreso vacío ni una cifra engañosa.
- **CA-6.3 (SI … ENTONCES)**: SI todavía no hay objetivo, ENTONCES no debe mostrarse nada
  como «incumplido», «pendiente» ni «te falta»: esas etiquetas solo aparecen cuando existe
  objetivo guardado.

### RF-7 — Los datos de las sesiones quedan intactos

- **CA-7.1 (ubícuo)**: El objetivo no debe crear, editar ni borrar ninguna sesión, y el
  formato de las sesiones ya guardadas no debe cambiar: siguen apareciendo iguales en la
  lista, la racha, el Resumen y el mapa.
- **CA-7.2 (SI … ENTONCES)**: SI lo guardado en `diario-estudio-objetivo` no se puede
  leer o no es un texto de dígitos de un entero mayor que 0, ENTONCES el sistema debe
  tratarlo como «sin objetivo» (RF-6) **en silencio, sin ningún aviso, igual que en el
  estado sin objetivo —así es intencionado—**, sin borrar nada del almacenamiento y sin
  impedir el resto de la página.
- **CA-7.3 (SI … ENTONCES)**: SI lo guardado del objetivo es un número que no corresponde
  a un objetivo válido (p. ej. negativo, 0, un decimal o notación `1e3`), ENTONCES debe
  tratarse como «sin objetivo» en vez de mostrar un progreso imposible de cumplir.

### RF-8 — Accesibilidad, idioma y pantalla

- **CA-8.1 (ubícuo)**: Todos los textos del objetivo y del progreso van en español, con el
  mismo estilo que el resto de la interfaz.
- **CA-8.2 (ubícuo)**: El progreso debe poder leerse sin depender solo del color: el valor
  objetivo, lo estudiado y lo que falta deben estar escritos.
- **CA-8.3 (ubícuo)**: Fijar o cambiar el objetivo debe poderse hacer con teclado y con el
  dedo, y el lector de pantalla debe anunciar el objetivo y el progreso: el mensaje de valor
  inválido (CA-1.2) vive en un contenedor con `aria-live` o `role="status"`, y si la barra
  se implementa con `role="progressbar"` (o con `<progress>`) debe llevar `aria-valuenow` y
  `aria-valuetext` (o el equivalente) para que el lector anuncie la proporción.
- **CA-8.4 (ubícuo)**: A 375 px de ancho la página no debe tener desbordamiento horizontal
  ni solaparse el texto del objetivo con el resto de cifras.
- **CA-8.5 (ubícuo)**: El campo del objetivo debe tener un `font-size` de al menos 16 px y
  un área táctil de al menos 44 px, para que en iOS a 375 px no provoque zoom automático al
  enfocarlo y se pueda pulsar cómodamente con el dedo.

## Requisitos no funcionales

- **RNF-1 — Lógica separada de la interfaz**: calcular el progreso, el cumplimiento y lo que
  falta debe resolverse en funciones puras que reciben «hoy» como entrada y no acceden a la
  interfaz ni al almacenamiento (constitución, principio 3). La cifra semanal debe salir de
  **una sola función** —la misma que pinta el Resumen, refactorizada a versión pura que
  recibe «hoy» como parámetro si hace falta— para que Resumen y objetivo no puedan divergir
  (CA-2.8).
- **RNF-2 — Pruebas como puente**: esos cálculos deben estar cubiertos por pruebas
  automatizadas ejecutables con `node --test` sin instalar paquetes; no se considera
  avanzado con las pruebas en rojo (principio 4). *Nota: `AGENTS.md` dice todavía «No hay
  tests automáticos» y está desactualizado en este punto; manda la constitución (principio
  4) y esta spec sí exige `node --test`. Actualizar `AGENTS.md` queda para proponérselo al
  usuario después de esta feature (fuera del alcance de la spec).*
- **RNF-3 — Simplicidad primero**: sin dependencias externas ni paso de compilación; la
  página sigue funcionando abriéndola con doble clic (principio 1).
- **RNF-4 — Datos intactos**: el objetivo se guarda en la clave `diario-estudio-objetivo`
  con el valor como texto de dígitos de un entero mayor que 0 (p. ej. `"300"`); la clave
  `diario-estudio-sesiones` y su formato `{ fecha, tema, minutos, creado }` no cambian ni
  se migran (principio 5).
- **RNF-5 — Fechas en hora local**: «hoy», el lunes de la semana y el cambio de semana se
  determinan en la zona horaria local del usuario; los cambios de horario no deben desplazar
  el inicio de semana ni duplicar ni perder un día.
- **RNF-6 — Idioma**: textos de interfaz y documentación en español; nombres de funciones y
  comentarios descriptivos. El código existente está en español (p. ej.
  `minutosDeEstaSemana()`, `formatearMinutos()`) y esta feature lo sigue, sin renombrar nada
  ni introducir otro idioma en el proyecto.
- **RNF-7 — Accesibilidad**: el objetivo y el progreso se usan con teclado y con lector de
  pantalla, sin información solo por color; no se pierde el nivel actual de accesibilidad de
  la página.
- **RNF-8 — Pantallas pequeñas**: a 375 px de ancho la sección del objetivo se ve completa
  y usable con el dedo; el campo del objetivo mide al menos 16 px de texto y 44 px de área
  táctil para no provocar zoom en iOS (CA-8.5).
- **RNF-9 — Sin regresiones**: con los mismos datos, las cifras y comportamientos existentes
  (racha actual, mejor racha, resumen, días del mes, lista, mapa y registro de sesiones)
  deben seguir dando exactamente el mismo resultado que ahora.

## Casos límite

| Situación | Comportamiento esperado |
|---|---|
| Primer uso, sin objetivo y sin sesiones | Página normal, sin errores, con una forma clara de fijar el primer objetivo (RF-6). |
| Objetivo fijado y la semana empieza hoy (lunes) | Progreso en 0 min, objetivo visible, sin heredar minutos de la semana anterior (CA-2.2, CA-5.1). |
| Lunes con el objetivo ya guardado la semana pasada | El mismo objetivo sigue vigente sin tener que fijarlo de nuevo; solo el progreso vuelve a 0 (CA-5.2). |
| Sin objetivo en una semana nueva | Invitación a fijarlo; nada se presenta como incumplido (CA-5.3, CA-6.3). |
| Sesión con fecha futura dentro de la semana | No cuenta en el progreso (CA-2.3). |
| Sesión del domingo pasado | No cuenta en el progreso de esta semana (CA-2.4). |
| Varias sesiones el mismo día | Todas suman en el progreso, igual que en el total semanal. |
| Lo estudiado es exactamente el objetivo | Indicado como cumplido (CA-3.1). |
| Lo estudiado supera el objetivo (p. ej. el doble) | Cumplido, mostrando el total real, «superado en X min» en lugar de «lo que falta» y la barra llena al 100 % como máximo, sin recortarlo ni mostrar cifras negativas (CA-3.2, CA-2.1, CA-2.6). |
| Objetivo de 1 minuto con 0 estudiados | Falta 1 min; no es un error ni un estado roto. |
| Objetivo muy grande (p. ej. 10000 min) | Se muestra completo, sin desbordes ni cifras rotas. |
| Valor no numérico, vacío, 0 o negativo al guardar | Rechazado con mensaje breve junto al campo (no en `#mensaje`), anunciado al lector de pantalla; el campo conserva lo escrito y el objetivo anterior sigue vigente (CA-1.2, CA-7.3). |
| Objetivo con decimales o notación (`90,5`, `0,5`, `1e3`) al guardar | Rechazado como valor inválido: solo se aceptan enteros mayores que 0 (CA-1.2). |
| El objetivo almacenado está corrupto o ilegible | Tratado como «sin objetivo» y en silencio, sin aviso, como en el estado sin objetivo; sin borrar nada (CA-7.2). |
| Objetivo válido pero las sesiones guardadas están corruptas o ilegibles | Aviso breve y específico de que el progreso de esta semana no puede calcularse; nunca un «te falta X» calculado sobre 0 (CA-2.9). |
| Sesión guardada con fecha de la semana pasada o futura | El progreso de la semana no cambia (CA-4.2). |
| El objetivo se cambia a mitad de semana | Al pulsar «Guardar» o Intro, el progreso se recalcula al instante con el nuevo valor (CA-1.3). |
| La página está abierta al cruzar la medianoche o el lunes | Limitación aceptada: los valores solo se recalculan al cargar y al guardar. Tras recargar (o al guardar), la semana ya no muestra datos de la semana anterior y el progreso empieza de nuevo (CA-2.2, CA-5.1). |
| Cambio de horario de verano | El lunes no se desplaza ni se duplica (RNF-5). |

## Fuera de alcance

- Objetivos por materia o tema, o varios objetivos simultáneos.
- Objetivos diarios o mensuales; solo el semanal.
- Un objetivo distinto por semana: hay un único objetivo que se repite cada semana.
- Historial de objetivos fijados, historial o estadísticas de semanas anteriores
  (cumplidas o no), comparativas y récords de cumplimiento.
- Eliminar el objetivo una vez fijado y volver al estado «sin objetivo»; solo se puede
  reemplazar por otro válido.
- Avisos, notificaciones o recordatorios; gamificación añadida más allá del indicador de
  cumplimiento.
- Calcular automáticamente un objetivo sugerido en función del historial.
- Cambiar el formato de las sesiones guardadas o migrarlas.
- Modificar las cifras existentes (racha, mejor racha, días del mes, mapa); el objetivo se
  apoya en la cifra de minutos de la semana que ya existe.
- Exportar, compartir o imprimir el objetivo.

## Criterios de finalización

- Todos los RF y sus CA verificados en el navegador con el MCP de Chrome DevTools, en
  escritorio y a 375 px, incluida la edición del objetivo con teclado y con el dedo.
- Pruebas `node --test` en verde cubriendo: el cálculo de lo estudiado, de lo que falta y
  del «superado en X min» con un «hoy» inyectado como parámetro; que la cifra del Resumen y
  la del objetivo proceden de la misma función (CA-2.8); el tope de la barra al 100 %; los
  límites del lunes y del domingo; el corte de fechas futuras y de la semana anterior; el
  cumplimiento exacto y el superado; los valores de objetivo ausentes, corruptos, 0,
  negativos o no enteros (`90,5`, `0,5`, `1e3`); y el aviso cuando las sesiones no se
  pueden leer con el objetivo válido (CA-2.9). El uso de `node --test` se mantiene por la
  constitución (RNF-2), pese a lo que dice todavía `AGENTS.md`.
- Los CA que dependen de cruzar el medianoche o el lunes (p. ej. CA-2.2, CA-5.1, CA-5.2)
  se verifican **simulando el cambio de semana parcheando la fecha local antes de cargar la
  página, con Chrome DevTools**, sin esperar a un lunes real.
- Consola del navegador sin errores ni avisos.
- Sin desbordamiento horizontal de la página a 320, 375 y 512 px.
- El almacenamiento de sesiones conserva su formato: las sesiones previas se siguen viendo
  iguales en la lista, la racha, el Resumen y el mapa, y el objetivo vive en la clave
  `diario-estudio-objetivo` sin ninguna migración (RNF-4, RNF-9).
- **Ficheros nuevos autorizados**: esta feature requiere ficheros nuevos (lógica pura
  testeable y sus pruebas de `node --test`); su creación queda **ya autorizada por el
  usuario en este flujo SDD**, así que el implementador no debe pararse a preguntarla
  (regla «Pregunta antes: crear archivos nuevos» de `AGENTS.md`).
- Todas las dudas abiertas respondidas con el usuario **antes de empezar a implementar**
  (constitución, principio 2); no queda ninguna duda nueva tras la revisión QA.
- Interfaz y documentación en español; `MEMORY.md` actualizado con las decisiones tomadas.

## Sin dudas abiertas

Las cinco dudas del borrador están resueltas con las respuestas del usuario:

1. **Dónde se guarda** → clave `diario-estudio-objetivo`, con el valor como texto de dígitos
   de un entero mayor que 0 (p. ej. `"300"`); la clave `diario-estudio-sesiones` y su
   formato `{ fecha, tema, minutos, creado }` quedan intactos, sin migraciones (RF-1,
   RNF-4).
2. **Sin objetivo fijado** → no hay valor por defecto: invitación «aún no has fijado
   objetivo» con la forma de fijarlo; nada se presenta como incumplido (RF-6).
3. **Fijar/editar** → campo dentro de la sección «Resumen», justo después de «estudiado
   esta semana» y antes de «estudiados este mes»; visible siempre y editable en cualquier
   momento, con recálculo tras cada guardado válido (RF-1).
4. **Cambio de semana** → un único objetivo persistido que se repite cada semana; cada
   lunes el progreso vuelve a 0 y se compara con ese mismo objetivo; sin historial de
   objetivos por semana (RF-5).
5. **Dónde y cómo se muestra** → en «Resumen», en la posición descrita en el punto 3: cifras
   (estudiado/objetivo y lo que falta) más barra de progreso, sin añadir ninguna tarjeta ni
   elemento `.tarjeta` nuevo; si se supera el objetivo se muestra como éxito («superado en
   X min») y sigue contando el total real (RF-2, RF-3).

Decisiones menores resueltas por sentido común dentro del alcance: la barra se llena como
máximo al 100 % mientras las cifras muestran el total real (CA-2.6); el guardado es una
acción explícita usable con teclado y con el dedo (CA-1.5); y eliminar el objetivo para
volver al estado «sin objetivo» queda fuera de alcance.

Correcciones de la revisión QA (15 hallazgos, «APTA») incorporadas todas; las de criterio
se resolvieron así: solo enteros mayores que 0 (sin decimales ni `1e3`); recálculo al cargar
y tras cada guardado válido, conservando el texto escrito si el guardado falla; mensaje de
valor inválido en campo propio junto al objetivo, anunciado con `aria-live`; «lo que falta»
obligatorio y sin porcentaje numérico, sustituido por «superado en X min» al superarlo; una
única función para la cifra semanal; aviso específico si las sesiones no se leen con el
objetivo válido; y creación de los ficheros nuevos ya autorizada en este flujo SDD. La
exigencia `node --test` se mantiene (constitución) y `AGENTS.md` sigue desactualizado en ese
punto: proponer su actualización al usuario después de esta feature.
