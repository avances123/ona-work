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

  test('La cuenta atrás de memorización en mosaicos es de 10 segundos', async ({ page }) => {
    await page.goto('/');

    // 1. Abrir panel con Alt+P
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.dashboard-modal')).toBeVisible();

    // 2. Dejar únicamente marcado Mosaicos
    const checkboxes = page.locator('.type-checkbox-label input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const box = checkboxes.nth(i);
      const isChecked = await box.isChecked();
      const label = await page.locator('.type-checkbox-label').nth(i).innerText();
      if (!label.includes('Mosaicos') && isChecked) {
        await box.click();
      } else if (label.includes('Mosaicos') && !isChecked) {
        await box.click();
      }
    }

    // 3. Reiniciar sesión
    await page.locator('button.restart-session-btn').click();
    await expect(page.locator('.dashboard-modal')).not.toBeVisible();

    // 4. Verificar que está en fase de memorización y el contador inicia en 10s (o 9s si ha corrido 1 tick)
    const countdown = page.locator('.mosaic-countdown');
    await expect(countdown).toBeVisible();
    const text = await countdown.innerText();
    expect(text).toMatch(/Memoriza: (10|9)s/);
  });

  test('El ejercicio de Lectura (Detectives) muestra historia, pista socrática y avanza de ejercicio', async ({ page }) => {
    await page.goto('/');

    // 1. Abrir panel con Alt+P y filtrar solo Lectura (Detectives)
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.dashboard-modal')).toBeVisible();

    const checkboxes = page.locator('.type-checkbox-label input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const box = checkboxes.nth(i);
      const isChecked = await box.isChecked();
      const label = await page.locator('.type-checkbox-label').nth(i).innerText();
      if (!label.includes('Lectura') && isChecked) {
        await box.click();
      } else if (label.includes('Lectura') && !isChecked) {
        await box.click();
      }
    }

    await page.locator('button.restart-session-btn').click();
    await expect(page.locator('.dashboard-modal')).not.toBeVisible();

    // 2. Verificar historia, selector de 60 relatos y preguntas
    await expect(page.locator('.exercise-type-tag')).toContainText('Lectura de Detectives');
    await expect(page.locator('.reading-case-title')).toBeVisible();
    const storySelect = page.locator('.reading-story-select');
    await expect(storySelect).toBeVisible();
    await expect(storySelect.locator('option')).toHaveCount(60);

    // Cambiar de relato desde el menú selector
    await storySelect.selectOption('30');
    await expect(page.locator('.reading-case-title')).toContainText('Caso 31:');

    const sentenceCount = await page.locator('.story-sentence').count();
    expect(sentenceCount).toBeGreaterThanOrEqual(10);

    // 3. Resolver las 3 pistas del caso (probando opciones hasta acertar todas)
    for (let q = 0; q < 3; q++) {
      await expect(page.locator('.reading-question-header')).toContainText(`Pista ${q + 1} de 3`, { ignoreCase: true });
      for (let attempt = 0; attempt < 3; attempt++) {
        const prevDisabled = await page.locator('.reading-option-btn:disabled').count();
        const enabledBtns = page.locator('.reading-option-btn:not(:disabled)');
        await enabledBtns.first().click();

        let didAdvance = false;
        await expect(async () => {
          const disabledNow = await page.locator('.reading-option-btn:disabled').count();
          const nextBtnVisible = await page.locator('.reading-next-btn').isVisible();
          const headerVisible = await page.locator('.reading-question-header').isVisible();
          const header = headerVisible ? (await page.locator('.reading-question-header').innerText()).toLowerCase() : '';
          didAdvance = (q < 2 && header.includes(`pista ${q + 2} de 3`)) || (q === 2 && nextBtnVisible);
          expect(disabledNow > prevDisabled || didAdvance).toBe(true);
        }).toPass({ timeout: 5000 });

        if (didAdvance) {
          break;
        }
        await expect(page.locator('.error-notice')).toBeVisible();
        await expect(page.locator('.story-sentence.clue-highlight')).toHaveCount(1);
      }
    }

    // 4. Verificar que NO avanza automáticamente y que el botón permite avanzar
    await expect(page.locator('.exercise-indicator')).toContainText('Ejercicio 1 de');
    await expect(page.locator('.reading-next-btn')).toBeVisible();
    await page.locator('.reading-next-btn').click();
    await expect(page.locator('.exercise-indicator')).toContainText('Ejercicio 2 de');
  });

  test('Exportar e importar datos de supervisión restaura configuración e historial', async ({ page }) => {
    await page.goto('/');

    // 1. Abrir panel y cambiar configuración antes de exportar
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.dashboard-modal')).toBeVisible();

    const countInput = page.locator('input.exercise-count-input');
    await countInput.fill('7');
    await countInput.dispatchEvent('change');

    // Exportar JSON y verificar contenido descargado
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button.export-btn').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^ona-work-backup-\d{4}-\d{2}-\d{2}\.json$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const exportedJson = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    expect(exportedJson.version).toBe(1);
    expect(exportedJson.exerciseCount).toBe(7);

    // 2. Importar un respaldo con historial y otra configuración (simula otro navegador)
    const backupPayload = {
      version: 1,
      exportedAt: '2026-11-15T20:00:00.000Z',
      exerciseCount: 12,
      enabledTypes: ['crypto', 'reading'],
      sessions: [
        {
          id: 'backup-session-1',
          startedAt: '2026-11-15T18:00:00.000Z',
          completedAt: '2026-11-15T18:10:00.000Z',
          totalExercises: 2,
          totalFocusSeconds: 180,
          exercises: [
            {
              exerciseId: 'ex-1',
              type: 'crypto',
              title: 'Código Secreto',
              elapsedSeconds: 90,
              attemptsCount: 1,
              idlePausesCount: 0,
            },
          ],
        },
      ],
    };

    await page.locator('input.import-file-input').setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backupPayload)),
    });

    await expect(page.locator('.transfer-status')).toContainText('Datos importados (1 sesiones)');
    await expect(countInput).toHaveValue('12');
    await expect(page.locator('.metrics-summary')).toContainText('3 min');
    await expect(page.locator('.session-item')).toHaveCount(1);

    // 3. Reiniciar sesión y comprobar que aplica la configuración importada
    await page.locator('button.restart-session-btn').click();
    await expect(page.locator('.exercise-indicator')).toContainText('de 12');
  });

  test('Vocabulario: captura palabra única en relato, 3 definiciones, y se elimina tras 3 aciertos seguidos', async ({ page }) => {
    // Interceptar LLM gratuito para test determinista sin depender de rate-limit ni red
    await page.route('https://text.pollinations.ai/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: JSON.stringify({
          correct: 'Tira de tela que se ata en la cintura.',
          distractors: ['Plato muy caliente de sopa.', 'Animal volador con plumas.'],
        }),
      });
    });

    await page.goto('/');

    // 1. Sin palabras guardadas, aunque solo esté marcado Vocabulario no debe salir Vocabulario
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.dashboard-modal')).toBeVisible();
    await expect(page.locator('.vocab-config')).toContainText('Vocabulario en Práctica (0)');

    const checkboxes = page.locator('.type-checkbox-label input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      const box = checkboxes.nth(i);
      const isChecked = await box.isChecked();
      const label = await page.locator('.type-checkbox-label').nth(i).innerText();
      if (!label.includes('Lectura') && isChecked) {
        await box.click();
      } else if (label.includes('Lectura') && !isChecked) {
        await box.click();
      }
    }
    await page.locator('button.restart-session-btn').click();

    // 2. Ir al Caso 31 y probar selección de dos palabras (no debe abrir popup)
    await page.locator('.reading-story-select').selectOption('30');
    await expect(page.locator('.reading-case-title')).toContainText('Caso 31:');

    await page.evaluate(() => {
      const span = document.querySelector('.story-sentence');
      if (!span || !span.firstChild) return;
      const text = span.firstChild.textContent || '';
      const idx = text.indexOf('miércoles por');
      const range = document.createRange();
      range.setStart(span.firstChild, idx);
      range.setEnd(span.firstChild, idx + 'miércoles por'.length);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
    await page.locator('.reading-story-box').dispatchEvent('mouseup');
    await expect(page.locator('.vocab-selection-popup')).toHaveCount(0);

    // 3. Seleccionar una sola palabra ("cinturón") -> aparece popup y se guarda
    await page.evaluate(() => {
      const spans = document.querySelectorAll('.story-sentence');
      for (const span of spans) {
        const node = span.firstChild;
        const text = node?.textContent || '';
        const idx = text.indexOf('cinturón');
        if (node && idx >= 0) {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + 'cinturón'.length);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          break;
        }
      }
    });
    await page.locator('.reading-story-box').dispatchEvent('mouseup');
    await expect(page.locator('.vocab-selection-popup')).toBeVisible();
    await expect(page.locator('.vocab-add-btn')).toContainText('Acabo de aprender esta palabra');
    await page.locator('.vocab-add-btn').click();
    await expect(page.locator('.vocab-saved-badge')).toBeVisible();

    // 4. Configurar sesión solo de Vocabulario (3 ejercicios) y acertar 3 veces seguidas
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.vocab-config')).toContainText('Vocabulario en Práctica (1)');
    await expect(page.locator('.vocab-config')).toContainText('cinturón');

    await page.locator('input.exercise-count-input').fill('3');
    // Primero marcar Vocabulario para que no quede 0 tipos seleccionados al desmarcar Lectura
    for (let i = 0; i < count; i++) {
      const box = checkboxes.nth(i);
      const label = await page.locator('.type-checkbox-label').nth(i).innerText();
      if (label.includes('Vocabulario') && !(await box.isChecked())) {
        await box.click();
      }
    }
    for (let i = 0; i < count; i++) {
      const box = checkboxes.nth(i);
      const label = await page.locator('.type-checkbox-label').nth(i).innerText();
      if (!label.includes('Vocabulario') && (await box.isChecked())) {
        await box.click();
      }
    }
    await page.locator('button.restart-session-btn').click();

    // Con 1 palabra y solo Vocabulario marcado, la sesión debe tener 1 ejercicio (no se repite en la misma sesión)
    for (let step = 0; step < 3; step++) {
      await expect(page.locator('.exercise-indicator')).toContainText('Ejercicio 1 de 1');
      await expect(page.locator('.exercise-type-tag')).toContainText('Vocabulario');
      await expect(page.locator('.vocab-word-text')).toHaveText('cinturón');
      await expect(page.locator('.vocab-streak-pill')).toContainText(`Racha: ${step} / 3`);
      await expect(page.locator('.vocab-option-btn')).toHaveCount(3);
      await expect(page.locator('.vocab-options')).toContainText('Plato muy caliente de sopa.');
      await expect(page.locator('.vocab-options')).toContainText('Animal volador con plumas.');
      await page.locator('.vocab-option-btn', { hasText: 'Tira de tela' }).click();
      await expect(page.locator('.finished-card')).toBeVisible();
      if (step < 2) {
        await page.locator('button.restart-btn').click();
      }
    }

    // 5. Palabra eliminada del listado (aprendida)
    await page.keyboard.press('Alt+KeyP');
    await expect(page.locator('.vocab-config')).toContainText('Vocabulario en Práctica (0)');

    // 6. Al reiniciar solo con Vocabulario sin palabras, no sale Vocabulario
    await page.locator('button.restart-session-btn').click();
    await expect(page.locator('.exercise-type-tag')).not.toContainText('Vocabulario');
  });
});
