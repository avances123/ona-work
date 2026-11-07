# Context & Domain Glossary: Ona Work

## Propósito del Proyecto

Plataforma educativa y entorno interactivo de estudio adaptado para Ona (1.º de Primaria / currículo clásico de 1.º de EGB). Su foco metodológico fundamental es el **esfuerzo sostenido**, la **atención continua** y la **memoria de trabajo**, midiendo con rigor el tiempo de foco efectivo sin penalizar la velocidad.

---

## Conceptos de Dominio (Glosario Canónico)

### 1. Sesión (`Session`)
- **Definición:** Bloque completo de trabajo planificado para un día.
- **Estructura:** Compuesta por un conjunto prefijado de $N$ ejercicios (`targetExercisesCount`).
- **Estado:** Se da por completada cuando se resuelve el último ejercicio de la tanda.
- **Persistencia:** Al finalizar, el registro consolidado de la sesión se guarda automáticamente en `LocalStorage` con marca temporal ISO.

### 2. Ejercicio (`Exercise`)
- **Definición:** Tarea interactiva atómica presentada a Ona.
- **Cronometraje hacia adelante:** Cada ejercicio mide en segundos el tiempo exacto que Ona tarda en resolverlo (`elapsedSeconds`).
- **Progreso:** La barra de progreso visual avanza de forma discreta a razón de $i / N$ ejercicios completados.

### 3. Foco Efectivo e Inactividad (`Focus & Idle Detection`)
- **Tiempo de Foco:** Tiempo en el que Ona está activamente resolviendo la tarea.
- **Pausa por Inactividad:** Si transcurren **60 segundos** sin interacción (sin pulsaciones ni clics), el cronómetro del ejercicio se **pausa automáticamente** y se muestra un aviso visual suave («¡Ánimo, seguimos!»). Al volver a interactuar, el cronómetro se reanuda.
- **Tiempo Ocioso (`idleSeconds`):** El tiempo en pausa no computa como foco de resolución del ejercicio.

### 4. Panel de Seguimiento («Vista Papá»)
- **Definición:** Pantalla de supervisión protegida/discreta (accesible por atajo o botón discreto) para Fabio.
- **Información mostrada:**
  - Histórico de sesiones completadas.
  - Tiempos de resolución por ejercicio individual.
  - Aciertos, reintentos e incidencias de inactividad registradas.

---

## Restricciones Arquitectónicas

- **Cero backend:** SPA estática en cliente puro (Angular 22) desplegada en GitHub Pages.
- **Almacenamiento:** `LocalStorage` de Chrome en el perfil de Ona.
- **Diseño visual:** Minimalista a pantalla completa (modo quiosco), tipografía de alta legibilidad, sin distracciones decorativas.
