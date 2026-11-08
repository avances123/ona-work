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

    // 4. Verificar configuración de número de ejercicios por sesión
    const countInput = page.locator('input.exercise-count-input');
    await expect(countInput).toBeVisible();
    await expect(countInput).toHaveValue('10');

    // 5. Cerrar con el botón cerrar
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

  test('Cambiar el número de ejercicios por sesión se aplica al reiniciar', async ({ page }) => {
    await page.goto('/');

    // Abrir panel con Alt+P
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.dashboard-modal')).toBeVisible();

    // Cambiar el contador a 5 ejercicios
    const countInput = page.locator('input.exercise-count-input');
    await countInput.fill('5');

    // Pulsar Reiniciar Sesión
    await page.locator('button.restart-session-btn').click();
    await expect(page.locator('.dashboard-modal')).not.toBeVisible();

    // La barra debe indicar "de 5"
    await expect(page.locator('.exercise-indicator')).toContainText('de 5');
  });

  test('Flujo completo de Criptograma (código secreto) con tabla y pistas socráticas', async ({ page }) => {
    await page.goto('/');

    // 1. Abrir panel con Alt+P
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.dashboard-modal')).toBeVisible();

    // 2. Dejar únicamente marcado Criptogramas
    const checkboxes = page.locator('.type-checkbox-label input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const box = checkboxes.nth(i);
      const isChecked = await box.isChecked();
      const label = await page.locator('.type-checkbox-label').nth(i).innerText();
      if (!label.includes('Criptogramas') && isChecked) {
        await box.click();
      } else if (label.includes('Criptogramas') && !isChecked) {
        await box.click();
      }
    }

    // 3. Reiniciar sesión
    await page.locator('button.restart-session-btn').click();
    await expect(page.locator('.dashboard-modal')).not.toBeVisible();

    // 4. Verificar que se renderiza el ejercicio de Código Secreto
    await expect(page.locator('.exercise-type-tag')).toContainText('Código Secreto');
    await expect(page.locator('.code-table')).toBeVisible();
    await expect(page.locator('.code-pair')).toHaveCount(3); // 3 pares de clave/valor
    await expect(page.locator('.crypto-expression')).toBeVisible();

    // 5. Debe haber 3 opciones de respuesta numéricas
    const optionBtns = page.locator('.crypto-block .option-btn');
    await expect(optionBtns).toHaveCount(3);

    // Leer los valores de los botones
    const val0 = await optionBtns.nth(0).innerText();
    const val1 = await optionBtns.nth(1).innerText();
    const val2 = await optionBtns.nth(2).innerText();

    // 6. Probar feedback socrático pulsando una opción: si falla, una opción incorrecta queda deshabilitada
    // Pulsamos la primera opción
    await optionBtns.nth(0).click();

    // Si acertó a la primera o falló, comprobamos el estado
    const socraticFeedback = page.locator('.socratic-feedback');
    const isError = await socraticFeedback.isVisible();
    if (isError) {
      // Debe haber deshabilitado una de las opciones erróneas
      const disabledCount = await page.locator('.crypto-block .option-btn:disabled').count();
      expect(disabledCount).toBeGreaterThanOrEqual(1);

      // Ahora pulsamos una opción habilitada restante
      const enabledBtns = page.locator('.crypto-block .option-btn:not(:disabled)');
      const remainingCount = await enabledBtns.count();
      for (let i = 0; i < remainingCount; i++) {
        await enabledBtns.nth(0).click();
        const stillError = await page.locator('.socratic-feedback').isVisible();
        if (!stillError) break;
      }
    }

    // El ejercicio avanza o muestra éxito
    const indicator = page.locator('.exercise-indicator');
    await expect(indicator).toBeVisible();
  });
});
