# 📓 Diario de Estudio

Web para registrar sesiones de estudio y motivarse con la racha de días seguidos.
Proyecto hecho con un flujo de agentes de IA (spec → plan → tareas → validación),
inspirado en el [curso gratuito de desarrollo con IA de Brais Moure y BIG school](https://thebigschool.com/sp/curso-desarrollo-ia-nuevo-programador-eg/).

## Características

- **Sesiones**: cargar fecha, tema y minutos de cada estudio.
- **Racha 🔥 y mejor racha 🏆**: días consecutivos con estudio, terminando hoy.
- **Resumen**: minutos de la semana (lunes a hoy) y días del mes.
- **Objetivo semanal**: meta de minutos por semana con barra de progreso.
- **Lista**: todas las sesiones cargadas, de la más reciente a la más vieja.
- **Mapa de calor**: las últimas 12 semanas pintadas según lo estudiado cada día.

## Cómo usarlo

1. Cloná o descargá el repo:
   `git clone https://github.com/Tomas-De-Paulo/desarrollo-ia.git`
2. Abrí `index.html` con doble clic. No hace falta servidor, instalación ni build.

Los datos se guardan en `localStorage` de tu navegador: nada viaja a un servidor.
Para empezar de cero, borrá la clave `diario-estudio-sesiones` (y `diario-estudio-objetivo`)
desde las DevTools del navegador.

## Tecnologías

HTML, CSS y JavaScript puros. Sin frameworks, sin dependencias, sin paso de build.

## Tests

60 tests de la lógica pura (fechas, racha, mapa de calor y objetivo):

```bash
node --test
```

## Estructura

| Archivo | Qué contiene |
|---|---|
| `index.html` / `styles.css` | Estructura y estilos |
| `app.js` | Lógica de la página y almacenamiento |
| `heatmap.js` / `objetivo.js` | Lógica pura del mapa y del objetivo |
| `tests/` | Tests (`node --test`) |
| `specs/001-heat-map/`, `specs/002-weekly-goal/` | Specs, planes y tareas de cada función |
| `AGENTS.md`, `docs/constitution.md` | Reglas del proyecto para los agentes |
| `.opencode/` | Agentes (coordinator, planner, implementer, reviewer) y comandos SDD |

## Cómo se construyó

Cada función pasó por Spec-Driven Development: spec aprobada → plan → tareas de a una
con tests primero → validación requisito por requisito, con agentes separados
(planificador, implementador y revisor) y un coordinador humano que aprueba cada paso.

## Créditos

Idea de los streams de [Brais Moure (MoureDev)](https://www.youtube.com/@BraisMoure) y su
curso gratuito de desarrollo con IA con BIG school.
