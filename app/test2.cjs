const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

    console.log('Navegando a http://localhost:5173...');
    await page.goto('http://localhost:5173');

    console.log('Esperando Torneo de Prueba...');
    await page.waitForSelector('text=Torneo de Prueba Automatizada');
    await page.click('text=Ver Torneo');

    console.log('Esperando tab Participantes...');
    await page.waitForSelector('text=Participantes');

    // Check if the tabs are aria tabs and click the participant one
    const pTab = await page.$('button[role="tab"]:has-text("Participantes")');
    if (pTab) await pTab.click();
    else await page.click('text=Participantes');

    console.log('En tab Participantes, clic a Agregar...');
    await page.waitForSelector('text=Agregar');
    const addButton = await page.$('button:has-text("Agregar")');
    if (addButton) await addButton.click();

    console.log('Esperando Dialog de Agregar Participante...');
    await page.waitForSelector('text=Agregar Participante');

    console.log('Llenando formulario de participante...');
    await page.fill('input[placeholder="Nombre del participante"]', 'Participante Script');

    console.log('Clic en boton de crear...');
    await page.waitForTimeout(1000);

    const elements = await page.$$('text=Agregar Participante');
    // Usually the last one is the button inside the modal dialog instead of the title
    if (elements.length > 1) await elements[elements.length - 1].click();

    await page.waitForTimeout(3000);

    console.log('Chequeando si hay un toast de extrito...');
    const body = await page.content();
    if (body.includes('Registrado correctamente') || body.includes('Participante agregado')) {
        console.log('¡Participante creado exitosamente!');
    } else {
        console.log('No se detectó el toast de éxito.');
    }

    await browser.close();
})();
