import { test,expect } from '@playwright/test';
test('cuestionario, reanudación, informe y sellado desde navegador',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Tu mapa de obligaciones de IA.'})).toBeVisible();
  await page.screenshot({path:'test-results/home-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Nuevo diagnóstico',exact:true}).click();await page.getByLabel('Nombre del diagnóstico').fill('Prueba navegador');await page.getByLabel('Organización',{exact:true}).fill('Empresa ficticia');await page.getByRole('button',{name:'Crear diagnóstico',exact:true}).click();
  await page.getByRole('button',{name:'Añadir primer uso'}).click();await page.getByLabel('Nombre del uso').fill('Asistente de documentación');await page.getByRole('button',{name:'Añadir uso',exact:true}).click();
  await expect(page.getByRole('heading',{name:'¿Dónde está establecida tu organización?'})).toBeVisible();await page.getByRole('button',{name:'España',exact:true}).click();await page.getByRole('button',{name:'Guardar y continuar'}).click();
  await expect(page.getByRole('heading',{name:'¿Qué tipo de organización eres?'})).toBeVisible();await page.reload();await page.getByRole('button',{name:'Asistente de documentación',exact:false}).click();await expect(page.getByRole('heading',{name:'¿Qué tipo de organización eres?'})).toBeVisible();
  await page.getByRole('tab',{name:'Resultados',exact:true}).click();await expect(page.getByRole('heading',{name:'Lo que sabemos. Lo que falta.'})).toBeVisible();
  await page.getByRole('tab',{name:'Informes y revisiones'}).click();const download=page.waitForEvent('download');await page.getByRole('link',{name:'PDF Documento final'}).click();expect((await download).suggestedFilename()).toBe('report.pdf');
  await page.getByRole('button',{name:'Sellar revisión',exact:true}).click();await expect(page.getByRole('button',{name:'Revisión sellada',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Verificar reproducción'}).click();await expect(page.getByRole('status')).toContainText('Integridad y reproducción verificadas');
  await page.getByRole('button',{name:'Crear revisión',exact:true}).click();await expect(page.getByRole('heading',{name:'Prueba navegador — revisión'})).toBeVisible();
});
test('móvil, teclado y navegación de fuentes',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.getByRole('heading',{name:'Tu mapa de obligaciones de IA.'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/home-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Fuentes y cobertura',exact:true}).click();await expect(page.getByRole('heading',{name:'Fuentes y cobertura',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:/Reglamento.*2024/}).first()).toHaveAttribute('href',/eur-lex/);
  await page.getByRole('button',{name:'Usar con mi IA',exact:true}).click();await expect(page.getByRole('heading',{name:'Tu IA, con un proceso verificable.'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('servidor rechaza CSRF y hosts ajenos',async({request})=>{
  const bad=await request.post('/api/assessments',{data:{name:'No',evaluationDate:'2026-09-13'}});expect(bad.status()).toBe(403);
  const origin=await request.get('/api/assessments',{headers:{Origin:'https://malicious.example'}});expect(origin.status()).toBe(403);
  const host=await request.get('/api/assessments',{headers:{Host:'evil.example'}});expect(host.status()).toBe(403);
});
