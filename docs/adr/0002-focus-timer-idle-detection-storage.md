# 2. Mecánica Temporal, Detección de Inactividad y Persistencia Local

Date: 2026-11-08

## Status

Accepted

## Context

El objetivo pedagógico central de `ona-work` no es la velocidad de respuesta, sino entrenar el foco sostenido y la concentración en tareas estructuradas de 1.º de EGB. Se requiere medir el esfuerzo real sin distorsiones por distracciones y sin requerir infraestructura backend.

## Decision

1. **Estructura por cuota de ejercicios:** La sesión se parametriza por un número fijo de ejercicios $N$. Una barra de progreso discreta refleja el avance ($i / N$).
2. **Cronometraje individual hacia adelante:** Cada ejercicio cronometra en segundos el tiempo invertido hasta su resolución.
3. **Control de foco por inactividad:** Tras **60 segundos** sin pulsaciones de teclado o interacción con el ratón, el cronómetro activo se detiene y se despliega un mensaje motivador suave. La reanudación requiere interacción explícita.
4. **Persistencia local y vista de supervisión:** Métricas guardadas en el `LocalStorage` del navegador del portátil. Se implementa una vista accesible de forma discreta para inspeccionar tiempos por ejercicio, fallos y fechas de cada sesión.

## Consequences

- No se penaliza a la niña por tomarse tiempo para pensar, pero se desacopla el tiempo de distracción del tiempo de trabajo efectivo.
- La aplicación es 100% autónoma y offline en su navegador.
