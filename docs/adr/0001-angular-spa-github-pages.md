# 1. Elección de Stack y Despliegue en GitHub Pages

Date: 2026-11-07

## Status

Accepted

## Context

Se requiere una plataforma interactiva accesible desde el portátil de Ona (`fa-ona`) con baja fricción de mantenimiento, ejecución ligera en cliente y despliegue automatizado.

## Decision

- Desarrollar la aplicación como una SPA estática con **Angular 22** (standalone components, sin SSR).
- Desplegar automáticamente mediante **GitHub Actions** en **GitHub Pages** (`https://avances123.github.io/ona-work/`) con base href `/ona-work/`.

## Consequences

- Cero coste de infraestructura de servidor backend.
- Facilidad de consumo local y actualización instantánea en cada commit a `main`.
