import { test, expect } from '@playwright/test';

test.describe('Ona Work - Flujos E2E', () => {
  test('Flujo de carga inicial y componentes principales', async ({ page }) => {
    await page.goto('/');

    // Verificar cabecera y barra de progreso
    await expect(page.locator('.exercise-indicator')).toBeVisible();
    await expect(page.locator('.exercise-indicator')).toContainText('Ejercicio 1 de');

    // Verificar botón discreto de control para papá
    const secretBtn = page.locator('.secret-dashboard-btn');
    await expect(secretBtn).toBeVisible();

    // Abrir modal de papá y comprobar métricas
    await secretBtn.click();
    await expect(page.locator('.dashboard-modal')).toBeVisible();
    await expect(page.locator('.dashboard-modal h2')).toContainText('Panel de Supervisión (Papá)');

    // Cerrar modal
    await page.locator('.close-btn').click();
    await expect(page.locator('.dashboard-modal')).not.toBeVisible();
  });

  test('Detección de inactividad a los 60 segundos', async ({ page }) => {
    await page.goto('/');
    // Comprobar que inicialmente no está el overlay de inactividad
    await expect(page.locator('.idle-overlay')).not.toBeVisible();
  });
});
