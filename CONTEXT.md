# Context & Domain Glossary: Ona Work

## Propósito del Proyecto

Plataforma educativa y entorno interactivo de estudio adaptado para Ona (1.º de Primaria / currículo clásico de 1.º de EGB). Su foco metodológico fundamental es el **esfuerzo sostenido**, la **atención continua** y la **memoria de trabajo**, midiendo con rigor el tiempo de foco efectivo sin penalizar la velocidad ni generar presión.

---

## Conceptos de Dominio (Glosario Canónico)

### 1. Sesión (`Session`)
- **Definición:** Bloque completo de trabajo planificado para un día.
- **Estructura Mixta Balanceada:** Compuesta por $N$ ejercicios procedurales que combinan los cuatro bloques de aprendizaje del currículo (Cálculo, Mosaicos de memoria, Series lógicas y Coordenadas).
- **Estado:** Se da por completada cuando se resuelve el último ejercicio de la tanda.
- **Persistencia:** Al finalizar, el registro consolidado de la sesión se guarda automáticamente en `LocalStorage` con marca temporal ISO.

### 2. Ejercicio (`Exercise`)
- **Definición:** Tarea interactiva atómica presentada a Ona generada de forma algorítmica/aleatoria bajo reglas pedagógicas fijas.
- **Cronometraje hacia adelante:** Mide en segundos el tiempo invertido en resolverlo (`elapsedSeconds`).
- **Invisibilidad del reloj:** El cronómetro **no es visible para Ona** para evitar estrés o impulsividad por velocidad.
- **Progreso:** La barra de progreso visual avanza de forma discreta a saltos ($i / N$).

### 3. Catálogo de Bloques de Aprendizaje

#### A. Cálculo Formal (`CalculationExercise`)
- **Reglas:** Sumas (con llevada elemental hasta 20), restas (hasta 10) y multiplicaciones verticales/horizontales (tablas del 1, 2, 3 y 4).
- **Interacción:** Opciones múltiples.

#### B. Mosaicos de Memoria Visual (`MosaicMemoryExercise`)
- **Reglas:** Cuadrícula de 3×3 con un patrón aleatorio de 3 a 5 casillas negras.
- **Fase de Observación:** El modelo se muestra durante **5 segundos fijos** (bloqueado para clic) y luego se oculta.
- **Fase de Reproducción:** Cuadrícula vacía interactiva donde Ona hace clic en las casillas para reproducir el patrón recordado.

#### C. Series Lógicas Visuales (`VisualSeriesExercise`)
- **Reglas:** Secuencias geométricas procedurales combinando alternancia de forma y variación de cantidad (ej. $\square, \bigcirc, \square\square, \bigcirc\bigcirc, \dots$).
- **Interacción:** Opciones para completar el siguiente elemento de la serie.

#### D. Orientación Espacial / Coordenadas (`CoordinatesExercise`)
- **Reglas:** Tablero bidimensional 8×8 (letras a-h, números 1-8 vinculado a notación de ajedrez) donde se pide identificar la casilla objetivo.
- **Interacción:** Clic directo sobre la celda del tablero.

### 4. Modo Socrático y Asistencia ante Fallo (`Socratic Hinting`)
- Al fallar un intento, la aplicación **no da la solución** ni salta el ejercicio. Aplica una pista pedagógica específica antes del segundo intento:
  - **Cálculo:** Se descarta una opción distractora incorrecta.
  - **Mosaicos:** Destello breve del modelo original durante 1 segundo.
  - **Series:** Resaltado visual de la regla activa que cambia (forma o cantidad).
  - **Coordenadas:** Iluminación sutil de la fila o columna correspondiente.

### 5. Foco Efectivo e Inactividad (`Focus & Idle Detection`)
- **Tiempo de Foco:** Tiempo en el que Ona está activamente resolviendo la tarea.
- **Pausa por Inactividad:** Si transcurren **60 segundos** sin interacción, el cronómetro interno se detiene y aparece un overlay suave («¡Ánimo, seguimos concentradas!»). Se reanuda al volver a interactuar.

### 6. Panel de Supervisión («Vista Papá»)
- Modal discreto (`⚙️`) que expone el historial completo de sesiones, tiempos por tipo de ejercicio, fallos e intervenciones del modo socrático.
