# AGENTS.md

## Directrices de Desarrollo y Verificación

### Arranque local y pruebas E2E con Playwright
- **Servidor local:** La aplicación se arranca en local mediante `npm start` (escucha en `http://localhost:4300/`).
- **Pruebas End-to-End (E2E):** Toda funcionalidad o modificación de flujo en los ejercicios debe verificarse obligatoriamente ejecutando los tests de Playwright:
  ```bash
  npm run test:e2e
  ```
  O directamente:
  ```bash
  npx playwright test
  ```
  La suite e2e levanta automáticamente el servidor local mediante la configuración en `playwright.config.ts` y valida los flujos de interacción, progresión de ejercicios, modal de supervisión y control de inactividad.

---

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical five-role triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` at repo root, ADRs under `docs/adr/`). See `docs/agents/domain.md`.
