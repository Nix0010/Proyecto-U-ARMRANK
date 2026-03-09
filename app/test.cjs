const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    console.log('Navegando a http://localhost:5173...');
    await page.goto('http://localhost:5173');

    console.log('Esperando cargar botones...');
    // Click on "Nuevo Torneo"
    await page.waitForSelector('text=Nuevo Torneo');
    await page.click('text=Nuevo Torneo');

    console.log('Llenando formulario de torso...');
    await page.fill('input[placeholder="Ej: Copa Nacional de Pulso 2024"]', 'Torneo de Prueba Automatizada');

    console.log('Clic en siguiente...');
    await page.click('text=Siguiente');

    console.log('Clic en Crear Torneo...');
    await page.click('text=Crear Torneo');

    // Wait a bit to observe consequences
    await page.waitForTimeout(3000);

    console.log('Chequeando si hay un toast de error...');
    const body = await page.content();
    if (body.includes('Error al crear el torneo')) {
        console.log('¡Se detectó un toast de error en el HTML!');
    } else if (body.includes('Torneo creado exitosamente')) {
        console.log('¡Torneo creado exitosamente detectado en el HTML!');
    } else {
        console.log('No se detectó el toast de error ni el de éxito en el HTML.');
    }

    await browser.close();
})();
