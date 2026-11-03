// Mi dinero: saldos por cuenta (efectivo, bancos), filtro, transferencias y gestión de cuentas
function drawCash() {
  const total = S.accounts.reduce((s, a) => s + balance(a.id), 0);
  $('#cashTotal').textContent = '$ ' + fmt(total);
  const cash = S.accounts.filter(a => a.t == 'cash').reduce((s, a) => s + balance(a.id), 0);
  const virtual = S.accounts.filter(a => a.t != 'cash').reduce((s, a) => s + balance(a.id), 0);
  $('#cashBreakdown').innerHTML = `<div class="cash-kind"><span>💵 Efectivo</span><b>$ ${fmt(cash)}</b></div><div class="cash-kind"><span>🏦 Dinero virtual</span><b>$ ${fmt(virtual)}</b></div>`;
  $('#accList').innerHTML =
    `<div class="ac ${!V.acc ? 'sel' : ''}" data-acc=""><span class="ai">💰</span><div class="nm"><b>Todas</b><small>Total disponible</small></div><span class="am">$ ${fmt(total)}</span></div>` +
    S.accounts.map(a => `<div class="ac ${V.acc == a.id ? 'sel' : ''}" data-acc="${a.id}"><span class="ai">${a.e}</span>
      <div class="nm"><b>${esc(a.n)}</b><small>${a.t == 'cash' ? 'Efectivo' : 'Banco / digital'}</small></div>
      <span class="am">$ ${fmt(balance(a.id))}</span><button class="mini" data-fix="${a.id}">✎</button><button class="mini" data-adel="${a.id}">✕</button></div>`).join('');
  $('#trList').innerHTML = S.tr.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5).map(t =>
    `<div class="cl" data-trid="${t.id}"><span>↔</span>${esc(accOf(t.from).n)} → ${esc(accOf(t.to).n)}<small>$ ${fmt(t.amount)} · ${dmy(t.date)}</small></div>`).join('')
    || '<p style="color:var(--mut);margin:0">Aún no hay transferencias</p>';
}
const openCash = () => { drawCash(); $('#cashS').classList.add('open'); };

function openTransfer() {
  const opts = S.accounts.map(a => `<option value="${a.id}">${a.e} ${esc(a.n)}</option>`).join('');
  $('#tf').innerHTML = opts; $('#tt').innerHTML = opts;
  if (S.accounts.length > 1) $('#tt').value = S.accounts[1].id;
  $('#tm').value = ''; $('#tdate').value = today();
  $('#trS').classList.add('open');
}

function doTransfer() {
  const from = +$('#tf').value, to = +$('#tt').value, amount = parseAmt($('#tm').value);
  if (from == to) return toast('Elige cuentas distintas');
  if (!amount) return toast('Escribe el monto');
  S.tr.push({ id: Date.now(), from, to, amount, date: $('#tdate').value || today() });
  save(); closeSheets(); render(); openCash(); toast('Transferencia registrada');
}

function initCash() {
  $('#scopeBtn').onclick = openCash;
  $('#trOpen').onclick = openTransfer;
  $('#trBtn').onclick = doTransfer;

  $('#accList').onclick = e => {
    const fix = e.target.closest('[data-fix]'), del = e.target.closest('[data-adel]'), row = e.target.closest('[data-acc]');
    if (fix) {                                           // corregir saldo: ajusta el saldo inicial para cuadrar
      const a = accOf(+fix.dataset.fix), v = prompt(`Saldo actual de ${a.n}:`, balance(a.id)); if (v === null) return;
      a.start = (a.start || 0) + (parseAmt(v) - balance(a.id)); save(); drawCash(); render();
    } else if (del) {
      const id = +del.dataset.adel;
      if (S.tx.some(x => x.acc == id) || S.tr.some(t => t.from == id || t.to == id)) return toast('Esa cuenta tiene movimientos');
      if (S.accounts.length < 2) return toast('Debe quedar al menos una cuenta');
      if (confirm('¿Eliminar cuenta?')) { S.accounts = S.accounts.filter(a => a.id != id); if (V.acc == id) V.acc = null; save(); drawCash(); render(); }
    } else if (row) {                                    // filtrar la pantalla principal por cuenta
      V.acc = row.dataset.acc ? +row.dataset.acc : null; V.cat = null; closeSheets(); render();
    }
  };
  $('#aadd').onclick = () => {
    const n = $('#an').value.trim(); if (!n) return;
    S.accounts.push({ id: Date.now(), e: $('#ae').value.trim() || '🏦', n, t: $('#at').value, start: parseAmt($('#as').value) });
    save(); $('#an').value = ''; $('#ae').value = ''; $('#as').value = ''; drawCash(); render();
  };
  $('#trList').onclick = e => { const b = e.target.closest('[data-trid]'); if (!b) return;
    if (confirm('¿Eliminar esta transferencia?')) { S.tr = S.tr.filter(t => t.id != b.dataset.trid); save(); drawCash(); render(); } };
}
