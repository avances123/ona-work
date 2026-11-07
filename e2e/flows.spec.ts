import { test, expect } from '@playwright/test';

test.describe('Ona Work - Flujos E2E y Modo Papá', () => {
  test('La tuerca visual está eliminada y el panel abre con atajo de teclado', async ({ page }) => {
    await page.goto('/');

    // 1. La tuerca ⚙️ ya NO debe existir en la interfaz visible
    await expect(page.locator('.secret-dashboard-btn')).toHaveCount(0);

    // 2. Al pulsar Alt+P se abre el panel de supervisión
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.dashboard-modal')).toBeVisible();
    await expect(page.locator('.dashboard-modal h2')).toContainText('Panel de Supervisión (Papá)');

    // 3. Verificar botones en el footer del modal
    const restartBtn = page.locator('button.restart-session-btn');
    const continueBtn = page.locator('button.continue-session-btn');
    const clearBtn = page.locator('button.clear-btn');

    await expect(restartBtn).toBeVisible();
    await expect(restartBtn).toContainText('Reiniciar Sesión');
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toContainText('Continuar Sesión');
    await expect(clearBtn).toBeVisible();

    // 4. Cerrar con Escape o botón cerrar
    await page.locator('.close-btn').click();
    await expect(page.locator('.dashboard-modal')).not.toBeVisible();
  });

  test('Reiniciar sesión genera una nueva tanda con los tipos seleccionados', async ({ page }) => {
    await page.goto('/');

    // Abrir panel con Alt+P
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.dashboard-modal')).toBeVisible();

    // Dejar marcado solo cálculo
    const checkboxes = page.locator('.type-checkbox-label input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const box = checkboxes.nth(i);
      const isChecked = await box.isChecked();
      const label = await page.locator('.type-checkbox-label').nth(i).innerText();
      if (!label.includes('Cálculo') && isChecked) {
        await box.click();
      }
    }

    // Pulsar Reiniciar Sesión
    await page.locator('button.restart-session-btn').click();
    await expect(page.locator('.dashboard-modal')).not.toBeVisible();

    // El ejercicio actual debe ser de tipo cálculo
    await expect(page.locator('.exercise-type-tag')).toContainText('Cálculo');
  });
});
