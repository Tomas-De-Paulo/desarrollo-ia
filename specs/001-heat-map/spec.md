# Especificación 001 — Mapa de calor de los días estudiados

## Contexto y objetivo

El Diario de Estudio ya registra sesiones (fecha, tema, minutos) y muestra la racha actual,
la mejor racha, los minutos de la semana y los días del mes. Todas esas cifras resumen una
ventana corta y dicen «cuántos días» o «cuántos minutos», pero no dejan ver el **patrón**:
qué días de la semana fallas, con qué frecuencia vuelves y cómo ha evolucionado la constancia
en los últimos meses.

Objetivo: mostrar un **mapa de calor tipo GitHub** con las **últimas 12 semanas**, donde la
intensidad de color de cada día representa los minutos estudiados ese día. Cuantos más
minutos, más intenso el color. Es una vista de **solo lectura**: no crea, edita ni borra nada.

Por qué 12 semanas alineadas a lunes y hasta hoy: es la ventana que permite ver un trimestre
de hábito de un vistazo, con las semanas completas de lunes a domingo para que las columnas
signifiquen siempre lo mismo, incluida la semana en curso todavía a medio hacer.

## Usuarios

- **Estudiante habitual** (principal): usa el diario a diario o de vez en cuando y quiere ver
  su constancia de un vistazo, reconociendo de inmediato los días estudiados y los huecos.
- **Estudiante recién llegado**: aún no ha registrado ninguna sesión; no debe ver errores ni
  una interfaz rota.
- **Usuario de teclado o lector de pantalla**: no usa el ratón ni percibe el color como la
  única fuente de información.

## Historias de usuario

- **HU-1**: Como estudiante, quiero ver las últimas 12 semanas coloreadas según los minutos
  estudiados, para reconocer mis días de estudio y mis huecos de un vistazo.
- **HU-2**: Como estudiante, quiero consultar los minutos exactos de un día con el ratón, con
  el dedo o con el teclado, para comparar días concretos sin tener que adivinarlo por el color.
- **HU-3**: Como estudiante, quiero que el mapa se actualice al guardar una sesión, para ver
  reflejado enseguida el esfuerzo del día.
- **HU-4**: Como usuario de lector de pantalla, quiero que cada día tenga su fecha y sus
  minutos anunciados, para no depender del color.
- **HU-5**: Como usuario del diario, quiero que el mapa sea solo una vista de mis datos, para
  que no pueda perder ni alterar ninguna sesión existente.

## Requisitos funcionales

Criterios de aceptación en notación EARS. Formas usadas: **ubícuo** (sin desencadenante),
**CUANDO** (evento), **DADO QUE** (condición previa), **MIENTRAS** (estado persistente),
**SI … ENTONCES** (comportamiento no deseado).

### RF-1 — Ventana de 12 semanas alineada a lunes

El mapa es una rejilla de 12 semanas de días, de lunes a domingo, que termina en la semana en
curso. La última fila puede estar a medio hacer respecto a hoy. El mapa lleva un título en
español que indica que muestra las últimas 12 semanas.

- **CA-1.1 (ubícuo)**: El sistema debe mostrar una rejilla de 12 filas por 7 celdas en la que
  la primera celda corresponde a un lunes y las columnas siguen el orden lunes → domingo.
- **CA-1.2 (ubícuo)**: La última celda de la rejilla debe corresponder al domingo de la semana
  en curso, aunque la mayor parte de esa fila sea de días aún no ocurridos.
- **CA-1.3 (DADO QUE)**: DADO QUE hoy cae en un lunes, el sistema debe mostrar la semana en
  curso con la celda del lunes como única celda disponible y los seis días restantes marcados
  como no disponibles.

### RF-2 — Nivel de color según los minutos del día

Los minutos de un día son la **suma de los minutos de todas las sesiones** de ese día, y de
ellos se deriva su nivel: 1-30 → nivel 1, 31-60 → nivel 2, 61-120 → nivel 3, 121 o más →
nivel 4; sin sesiones → nivel 0 (sin color).

- **CA-2.1 (DADO QUE)**: DADO QUE un día de la ventana tiene una o varias sesiones, el sistema
  debe sumar sus minutos y asignar el nivel que corresponda a ese total.
- **CA-2.2 (SI … ENTONCES)**: SI un día suma exactamente 30, 60 o 120 minutos, ENTONCES el
  sistema debe asignarlo al nivel inferior (nivel 1, 2 y 3 respectivamente).
- **CA-2.3 (SI … ENTONCES)**: SI un día de la ventana no tiene ninguna sesión, ENTONCES el
  sistema debe mostrarlo en nivel 0, sin color.
- **CA-2.4 (SI … ENTONCES)**: SI una sesión tiene los minutos ausentes o no numéricos, ENTONCES
  el sistema debe ignorar esa sesión para el mapa **sin modificar ni borrar nada** de lo
  almacenado.

### RF-3 — Días futuros y días fuera de la ventana

- **CA-3.1 (SI … ENTONCES)**: SI la fecha de una celda es posterior a hoy, ENTONCES el sistema
  debe marcarla como no disponible y no asignarle nunca el nivel 1-4, aunque exista una sesión
  guardada con esa fecha.
- **CA-3.2 (SI … ENTONCES)**: SI una sesión es anterior al primer día de la ventana, ENTONCES
  el sistema no debe reflejarla en el mapa, y en ningún caso debe borrarla ni alterarla.

### RF-4 — Consulta del detalle de un día

El detalle de un día se muestra en un mensaje con su fecha y sus minutos totales, con el mismo
formato de minutos que el resto de la página (por ejemplo «1 h 30 min»), y siempre en español.

- **CA-4.1 (CUANDO)**: CUANDO el puntero del ratón se sitúa sobre una celda, el sistema debe
  mostrar ese mensaje con la fecha y los minutos del día.
- **CA-4.2 (CUANDO)**: CUANDO el usuario toca una celda en pantalla táctil, el sistema debe
  mostrar el mismo mensaje mientras dure el contacto.
- **CA-4.3 (CUANDO)**: CUANDO una celda recibe el foco con el teclado, el sistema debe mostrar
  el mismo mensaje.
- **CA-4.4 (MIENTRAS)**: MIENTRAS el puntero siga sobre la celda, la celda conserve el foco o
  el dedo siga encima, el sistema debe mantener el mensaje visible.
- **CA-4.5 (SI … ENTONCES)**: SI el puntero sale de la celda, la celda pierde el foco o el
  usuario toca otra celda, ENTONCES el sistema debe ocultar el mensaje anterior, de modo que
  nunca haya dos a la vez.
- **CA-4.6 (DADO QUE)**: DADO QUE el día está en nivel 0 y no tiene sesiones, el sistema debe
  indicar en el mensaje que ese día no hay sesiones, en vez de presentar «0 min» como si fuera
  un dato estudiado.

### RF-5 — Leyenda de la escala y cifra agregada

- **CA-5.1 (ubícuo)**: El sistema debe mostrar una leyenda con los cuatro niveles y el rango
  de minutos de cada uno, en español.
- **CA-5.2 (DADO QUE)**: DADO QUE la rejilla está toda en nivel 0, la leyenda debe mostrarse
  igualmente para explicar la escala.
- **CA-5.3 (ubícuo)**: El sistema debe mostrar una **cifra agregada** con el total de minutos
  (o horas y minutos) estudiados en las últimas 12 semanas, encima del mapa o junto a la
  leyenda, siempre en español y con el mismo formato de minutos que usa la página.

### RF-6 — Rotulación de la rejilla (días de semana y etiquetas de mes)

- **CA-6.1 (ubícuo)**: El sistema debe incluir la **rotulación de los días de la semana** (lun,
  mar, mié, jue, vie, sáb, dom o equivalentes en español abreviados) encima de las columnas de
  la rejilla.
- **CA-6.2 (ubícuo)**: El sistema debe incluir **etiquetas de mes** (mes y año, cuando cambie
  de mes) a un lado o encima de las filas para identificar claramente cada bloque de semanas,
  siempre en español.
- **CA-6.3 (ubícuo)**: Cada celda debe poder identificarse por su fecha sin mirar su color: al
  enfocarla o al leerla con un lector de pantalla debe anunciarse la fecha del día y sus
  minutos.

### RF-7 — Lectura sin depender del color

- **CA-7.1 (ubícuo)**: Cada celda debe poder identificarse por su fecha sin mirar su color: al
  enfocarla o al leerla con un lector de pantalla debe anunciarse la fecha del día y sus
  minutos.
- **CA-7.2 (SI … ENTONCES)**: SI un usuario no distingue los niveles de color, ENTONCES la
  leyenda, la cifra agregada y el mensaje de detalle deben permitirle saber el rango y los
  minutos exactos de cualquier día de la rejilla.

### RF-8 — Actualización al guardar una sesión

- **CA-8.1 (CUANDO)**: CUANDO el usuario guarda una sesión, el sistema debe refrescar el mapa
  para que ese día pase a mostrar su nuevo nivel, sin recargar la página.
- **CA-8.2 (SI … ENTONCES)**: SI la sesión guardada es de un día anterior a la ventana,
  ENTONCES el sistema debe dejar el mapa como estaba.

### RF-9 — Estado sin datos

- **CA-9.1 (DADO QUE)**: DADO QUE todavía no hay ninguna sesión registrada, el sistema debe
  mostrar la rejilla completa en nivel 0 junto con su leyenda, la rotulación de días de semana,
  las etiquetas de mes, la cifra agregada (0 min / 0 h) y **el texto «Aún no hay sesiones»**,
  sin mostrar ningún error.
- **CA-9.2 (ubícuo)**: El texto «Aún no hay sesiones» debe aparecer en español y ser visible
  junto al mapa o encima de este.

### RF-10 — Almacenamiento ilegible

- **CA-10.1 (SI … ENTONCES)**: SI el sistema no puede leer los datos de sesiones almacenados,
  ENTONCES debe mostrar un **mensaje breve en español** avisando de que no se han podido leer
  los datos, sin borrar nada del almacenamiento.
- **CA-10.2 (ubícuo)**: Mientras se muestre ese aviso, el mapa puede mostrarse en nivel 0,
  pero nunca debe sustituir el aviso por un estado silencioso que oculte el problema de lectura.
- **CA-10.3 (ubícuo)**: El resto de la página (listado, rachas, resumen) debe intentar seguir
  funcionando respetando su comportamiento actual; el aviso es específico del mapa.

### RF-11 — Solo lectura: el mapa no toca los datos

- **CA-11.1 (ubícuo)**: El mapa no debe permitir crear, editar ni borrar sesiones.
- **CA-11.2 (SI … ENTONCES)**: SI el usuario pulsa, mantiene pulsado o arrastra sobre una
  celda, ENTONCES el sistema solo debe mostrar u ocultar el mensaje de detalle (RF-4) y no
  debe modificar nada de lo almacenado.

## Requisitos no funcionales

- **RNF-1 — Lógica separada de la interfaz**: determinar la ventana de fechas, los minutos de
  cada día, su nivel y la cifra agregada de las últimas 12 semanas debe resolverse en funciones
  puras que reciben «hoy» como entrada y no acceden a la interfaz ni al almacenamiento
  (constitución, principio 3).
- **RNF-2 — Pruebas como puente**: esos cálculos deben estar cubiertos por pruebas
  automatizadas ejecutables con `node --test` sin instalar paquetes; no se considera avanzado
  con las pruebas en rojo (principio 4).
- **RNF-3 — Simplicidad primero**: sin dependencias externas ni paso de compilación; la página
  sigue funcionando abriéndola con doble clic (principio 1).
- **RNF-4 — Datos intactos**: no cambia el formato de las sesiones guardadas; las existentes
  siguen siendo válidas sin ninguna migración, y el mapa nunca escribe en el almacenamiento
  (principio 5).
- **RNF-5 — Fechas en hora local**: «hoy» y todos los días de la ventana se determinan en la
  zona horaria local del usuario. Un día siguiente al anterior se define por calendario, no
  por transcurso de horas: los cambios de horario no deben desplazar ni duplicar ningún día
  del mapa.
- **RNF-6 — Idioma**: todos los textos del mapa (título, leyenda, rotulación, etiquetas de mes,
  mensaje de detalle, cifra agregada, «Aún no hay sesiones» y el aviso de lectura de datos)
  van en español, con el mismo estilo que el resto de la interfaz y sin versalitas (principio 6).
- **RNF-7 — Accesibilidad**: el mapa debe ser usable con teclado y con lector de pantalla, la
  información no debe depender solo del color, y cada nivel debe tener contraste suficiente
  frente al fondo. No se pierde el nivel actual de accesibilidad de la página.
- **RNF-8 — Pantallas pequeñas**: a 375 px de ancho la página no debe tener desbordamiento
  horizontal; el mensaje de detalle debe funcionar con el dedo. Si hiciera falta desplazar la
  rejilla, ese desplazamiento debe ser interno a su sección y no de la página completa.
- **RNF-9 — Sin regresiones**: con los mismos datos, las cifras y comportamientos existentes
  (racha actual, mejor racha, resumen, lista y registro de sesiones) deben seguir dando exactamente
  el mismo resultado que ahora.

## Casos límite

| Situación | Comportamiento esperado |
|---|---|
| Primer uso, sin ninguna sesión | Rejilla completa en nivel 0 con su leyenda, rotulación, etiquetas de mes, cifra agregada (0 min / 0 h) y texto «Aún no hay sesiones» (RF-9). |
| La primera sesión es de hace más de 12 semanas | Esas sesiones no se muestran en el mapa y no se borran (CA-3.2). |
| La primera sesión es de hace menos de 12 semanas | Las celdas anteriores quedan en nivel 0. |
| Varias sesiones el mismo día | Se suman antes de asignar el nivel (RF-2). |
| Hoy sin estudiar todavía | Hoy aparece en nivel 0 aunque la racha siga viva desde ayer: el mapa y la racha responden a reglas distintas. |
| Sesión guardada con fecha futura | Esa celda sigue marcada como no disponible; nunca se colorea (CA-3.1). |
| Días posteriores a hoy en la última fila | Marcados como no disponibles, sin color (CA-1.2). |
| Día con muchos minutos (p. ej. 1000) | Nivel 4, sin efectos raros por los valores grandes. |
| Sesión con campos ausentes o fecha con otro formato | Se tiene en cuenta solo si es una fecha válida de la ventana; si no, se ignora sin borrar nada (CA-2.4). |
| El almacenamiento no se puede leer | Se muestra un mensaje breve en español avisando de que no se han podido leer los datos, sin borrar nada. El resto intenta seguir funcionando (RF-10). |
| La página está abierta al cruzar la medianoche | El mapa no se refresca solo; se actualiza al guardar una sesión o al recargar. Limitación aceptada, igual que el resto de cifras de la página. |
| Cambio de horario de verano | Los días no se desplazan ni se duplican (RNF-5). |
| Se borra una sesión desde las herramientas del navegador | El mapa refleja el cambio al recargar; el mapa en sí no ofrece borrado. |

## Fuera de alcance

- Crear, editar o borrar sesiones desde el mapa, o cualquier interacción que no sea consultar.
- Filtro por materia o tema, y mapa de una sola materia.
- Comparativas con periodos anteriores, objetivos, predicciones y gamificación añadida.
- Ventana configurable o de más de 12 semanas.
- Estadísticas derivadas: minutos por día de la semana, por hora del día, por materia.
- Exportar, compartir o imprimir el mapa.
- Cambiar el formato de los datos guardados o migrarlos.
- Temas de color configurables, modo oscuro propio del mapa y ajustes de intensidad.
- Modificar las cifras, tarjetas o el listado existentes; el mapa es una sección añadida.

## Criterios de finalización

- Todos los RF y sus CA verificados en el navegador con el MCP de Chrome DevTools, en
  escritorio y a 375 px, incluida la consulta con teclado y con el dedo.
- Pruebas `node --test` en verde cubriendo: la ventana de 12 semanas (incluidos los límites de
  lunes y domingo), la suma de minutos por día, los cuatro niveles y sus fronteras (30, 60,
  120), los días futuros ignorados, la cifra agregada de las 12 semanas, el estado sin datos
  con el texto «Aún no hay sesiones» y el aviso de almacenamiento ilegible, usando siempre un
  «hoy» inyectado como parámetro.
- Consola del navegador sin errores ni avisos.
- Sin desbordamiento horizontal de la página a 320, 375 y 512 px.
- El almacenamiento conserva su formato: las sesiones previas se siguen viendo iguales en la
  lista, la racha y el resumen (RNF-9).
- Todas las dudas abiertas respondidas con el usuario **antes de empezar a implementar**
  (constitución, principio 2).
- Interfaz y documentación en español; `MEMORY.md` actualizado con las decisiones tomadas.

## Sin dudas abiertas

Todas las ambigüedades planteadas han sido resueltas con las respuestas del usuario:
almacenamiento ilegible → mensaje breve; rotulación → días de semana y etiquetas de mes; total
de la ventana → cifra agregada; estado sin datos → rejilla, leyenda, rotulación, etiquetas de
mes, cifra agregada y texto «Aún no hay sesiones».
