# 3. Catálogo de Ejercicios Procedurales, Fase de Observación y Modo Socrático

Date: 2026-11-08

## Status

Accepted

## Context

Con el armazón base de sesión operativo, se requiere modelar la generación de ejercicios para las sesiones diarias de Ona. El diseño pedagógico debe garantizar que no se memoricen fichas estáticas fijas, sino que se entrene la flexibilidad cognitiva, la memoria de trabajo y la autorregulación ante el fallo.

## Decision

1. **Generación procedural infinita:** Todos los ejercicios se computan algorítmicamente bajo restricciones del currículo de 1.º de EGB (tablas 1 a 4, mosaicos 3×3 de 3-5 celdas, series de forma y cantidad, y coordenadas ajedrecísticas 8×8).
2. **Sesión mixta balanceada:** Cada tanda de $N$ ejercicios distribuye equitativamente los cuatro bloques de aprendizaje.
3. **Fase de observación fija (5 segundos):** En ejercicios de memoria (mosaicos 3×3), el estímulo se visualiza durante 5 segundos bloqueado y se oculta antes de la fase de respuesta.
4. **Modo socrático escalonado:** Ante un fallo, no se salta el ejercicio ni se revela la respuesta directa; se activa una pista contextual (descarte en cálculo, destello en mosaicos, regla en series y eje en coordenadas).

## Consequences

- Sesiones siempre novedosas y no memorizables por repetición pasiva.
- Mayor demanda de memoria de trabajo e inhibición de respuestas impulsivas.
