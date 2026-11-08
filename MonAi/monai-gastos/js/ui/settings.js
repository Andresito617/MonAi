// Configuración: categorías, Gemini, CSV, borrar todo
function draw() {
  $('#catList').innerHTML = S.cats.map(c =>
    `<div class="cl"><span>${c.e}</span>${esc(c.n)}<small>${c.t == 'in' ? 'ingreso' : 'gasto'}</small><button data-del="${c.id}">✕</button></div>`).join('');
  $('#key').value = S.key; $('#model').value = S.model;
}

function exportCsv() {
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const rows = [['fecha','descripcion','monto','tipo','categoria','cuenta'],
    ...S.tx.map(x => [x.date, x.desc, x.amount, x.type == 'in' ? 'ingreso' : 'gasto', catOf(x.cat).n, accOf(x.acc).n])];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }));
  a.download = 'gastos.csv'; a.click();
}

function initSettings() {
  $('#setBtn').onclick = () => { draw(); $('#setS').classList.add('open'); };
  $('#catList').onclick = e => { const b = e.target.closest('[data-del]'); if (!b) return;
    if (confirm('¿Eliminar categoría? Sus movimientos quedarán sin categoría.')) { S.cats = S.cats.filter(c => c.id != b.dataset.del); save(); draw(); render(); } };
  $('#cadd').onclick = () => { const n = $('#cn').value.trim(); if (!n) return;
    S.cats.push({ id: Date.now(), e: $('#ce').value.trim() || '🏷️', n, t: $('#ct').value });
    save(); $('#cn').value = ''; $('#ce').value = ''; draw(); render(); };
  $('#key').oninput = e => { S.key = e.target.value.trim(); save(); };
  $('#model').oninput = e => { S.model = e.target.value.trim() || 'gemini-flash-latest'; save(); };
  $('#exp').onclick = exportCsv;
  $('#wipe').onclick = () => { if (confirm('¿Borrar todos los movimientos? No se puede deshacer.')) { S.tx = []; S.tr = []; save(); closeSheets(); render(); } };
}
