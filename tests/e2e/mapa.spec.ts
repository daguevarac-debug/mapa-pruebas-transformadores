import { test, expect } from '@playwright/test';

// Procedure used across multiple tests — must exist in src/data/pruebas.ts
const TEST_CODE = 'T50-02386';
const TEST_NAME = 'Resistencia de devanados';
const TEST_FAMILY = 'Devanados, relación y respuesta mecánica';

test.describe('Mapa de pruebas de transformadores', () => {

  // ── 1. Carga inicial de la página ──────────────────────────────────────────
  test('carga la página con el título y el catálogo visibles', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /Mapa de pruebas de transformadores/i })).toBeVisible();
    await expect(page.getByLabel('Buscar una prueba')).toBeVisible();

    // El modo inicial es "Explorar pruebas"
    const exploreBtn = page.getByRole('button', { name: 'Explorar pruebas' });
    await expect(exploreBtn).toHaveAttribute('aria-pressed', 'true');

    // El catálogo muestra al menos una tarjeta de procedimiento
    await expect(page.getByRole('heading', { name: /Catálogo de procedimientos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(TEST_CODE) }).first()).toBeVisible();
  });

  // ── 2. Cambiar entre Explorar y Mapa ──────────────────────────────────────
  test('cambia entre vista Explorar y vista Mapa', async ({ page }) => {
    await page.goto('/');

    const exploreBtn = page.getByRole('button', { name: 'Explorar pruebas' });
    const mapBtn = page.getByRole('button', { name: 'Mapa de relaciones' });

    // Estado inicial: Explorar activo
    await expect(exploreBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(mapBtn).toHaveAttribute('aria-pressed', 'false');

    // Cambiar a Mapa
    await mapBtn.click();
    await expect(mapBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(exploreBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('region', { name: 'Lienzo del mapa de relaciones' })).toBeVisible();

    // Volver a Explorar
    await exploreBtn.click();
    await expect(exploreBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('region', { name: 'Lienzo del mapa de relaciones' })).not.toBeVisible();
  });

  // ── 3. Seleccionar un nodo desde el catálogo (Explorar) ───────────────────
  test('seleccionar una prueba en el catálogo abre el panel lateral', async ({ page }) => {
    await page.goto('/');

    const card = page.getByRole('button', { name: new RegExp(TEST_CODE) }).first();
    await card.click();

    // El panel lateral debe mostrar el nombre de la prueba
    const aside = page.getByRole('complementary');
    await expect(aside.getByText(TEST_CODE, { exact: true }).first()).toBeVisible();
    await expect(aside.getByRole('heading', { name: TEST_NAME })).toBeVisible();
  });

  // ── 4. Seleccionar un nodo en el Mapa ─────────────────────────────────────
  test('clic en un nodo del mapa activa el panel lateral con su ficha', async ({ page }) => {
    await page.goto('/');

    // Ir a la vista Mapa
    await page.getByRole('button', { name: 'Mapa de relaciones' }).click();

    const canvas = page.getByRole('region', { name: 'Lienzo del mapa de relaciones' });
    await expect(canvas).toBeVisible();

    // Los nodos usan title="${code} · ${name}"
    const node = canvas.getByTitle(`${TEST_CODE} · ${TEST_NAME}`);
    await expect(node).toBeVisible();
    await node.click();

    // El panel lateral debe actualizarse con la ficha
    const aside = page.getByRole('complementary');
    await expect(aside.getByText(TEST_CODE, { exact: true }).first()).toBeVisible();
  });

  // ── 5. Usar filtros de familia técnica ────────────────────────────────────
  test('aplicar un filtro de familia reduce las pruebas del catálogo', async ({ page }) => {
    await page.goto('/');

    // Contar tarjetas sin filtros
    const allCards = page.getByRole('button', { name: /T50-/ });
    const totalBefore = await allCards.count();

    // Activar el filtro de familia
    const familyBtn = page.getByRole('button', { name: TEST_FAMILY, exact: true });
    await familyBtn.click();

    await expect(familyBtn).toHaveAttribute('aria-pressed', 'true');

    // El contador de coincidencias debe disminuir
    const countIndicator = page.locator('[aria-live="polite"]').filter({ hasText: 'pruebas coinciden' });
    await expect(countIndicator).toBeVisible();
    const countText = await countIndicator.textContent();
    const filtered = parseInt(countText?.match(/(\d+) de/)?.[1] ?? '999');
    expect(filtered).toBeLessThan(totalBefore);

    // Quitar el filtro con el chip de borrado
    const clearBtn = page.getByRole('button', { name: `Quitar filtro ${TEST_FAMILY}` });
    await clearBtn.click();
    await expect(familyBtn).toHaveAttribute('aria-pressed', 'false');
  });

  // ── 6. Zoom en el mapa sin alterar el tamaño de la página ─────────────────
  test('el zoom no modifica la altura de la página', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Mapa de relaciones' }).click();

    const canvas = page.getByRole('region', { name: 'Lienzo del mapa de relaciones' });
    await expect(canvas).toBeVisible();

    // Altura del documento antes del zoom
    const heightBefore = await page.evaluate(() => document.documentElement.scrollHeight);

    // Zoom in usando el botón accesible de ReactFlow Controls
    const zoomInBtn = page.getByLabel('Controles de zoom del mapa').getByRole('button', { name: /zoom in/i });
    if (await zoomInBtn.count() > 0) {
      await zoomInBtn.click();
      await zoomInBtn.click();
      await zoomInBtn.click();
    } else {
      // Fallback: rueda del ratón sobre el lienzo
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, -300);
      }
    }

    const heightAfter = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(heightAfter).toBe(heightBefore);
  });

  // ── 7. Desplazar el lienzo (pan) ───────────────────────────────────────────
  test('arrastrar el lienzo desplaza el contenido sin cambiar el tamaño de la página', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Mapa de relaciones' }).click();

    const canvas = page.getByRole('region', { name: 'Lienzo del mapa de relaciones' });
    await expect(canvas).toBeVisible();

    const heightBefore = await page.evaluate(() => document.documentElement.scrollHeight);
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Drag horizontal sobre el lienzo
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 - 100, box!.y + box!.height / 2, { steps: 10 });
    await page.mouse.up();

    const heightAfter = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(heightAfter).toBe(heightBefore);
  });

  // ── 8. Abrir el panel lateral (sidebar) ──────────────────────────────────
  test('el panel lateral muestra un mensaje de ayuda antes de seleccionar', async ({ page }) => {
    await page.goto('/');

    const aside = page.getByRole('complementary');
    await expect(aside.getByRole('heading', { name: 'Detalle de la prueba' })).toBeVisible();
    await expect(aside.getByText(/Selecciona una prueba/i)).toBeVisible();
  });

  test('el panel lateral muestra la ficha completa tras seleccionar una prueba', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: new RegExp(TEST_CODE) }).first().click();

    const aside = page.getByRole('complementary');
    await expect(aside.getByRole('heading', { name: TEST_NAME })).toBeVisible();
    await expect(aside.getByText(TEST_FAMILY, { exact: true })).toBeVisible();

    // La sección didáctica debe estar visible para una prueba "studied"
    await expect(aside.getByText(/El ensayo, en una mirada/i)).toBeVisible();
    await expect(aside.getByText(/Relaciones documentadas/i)).toBeVisible();
  });

  // ── 9. Búsqueda filtra las tarjetas ──────────────────────────────────────
  test('el campo de búsqueda filtra las pruebas por código', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.getByLabel('Buscar una prueba');
    await searchInput.fill(TEST_CODE);

    // Debe aparecer sólo la tarjeta correspondiente (los botones de tarjeta contienen un <h3>)
    const cards = page.getByRole('button').filter({ has: page.locator('h3') });
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText(TEST_CODE);

    // Limpiar la búsqueda con el chip
    const clearChip = page.getByRole('button', { name: new RegExp(`Quitar filtro.*${TEST_CODE}`) });
    await clearChip.click();

    // El input debe vaciarse
    await expect(searchInput).toHaveValue('');
  });

});
