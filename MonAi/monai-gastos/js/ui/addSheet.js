// Hoja para agregar un movimiento
function drawCats() {
  $('#facc').innerHTML = S.accounts.map(a => `<button class="chip ${F.acc == a.id ? 'on' : ''}" data-a="${a.id}">${a.e} ${esc(a.n)}</button>`).join('');
  $('#fcats').innerHTML = S.cats.map(c => `<button class="chip ${F.cat == c.id ? 'on' : ''}" data-k="${c.id}">${c.e} ${esc(c.n)}</button>`).join('');
}

function openAdd(p = {}) {
  $('#fd').value = today(); $('#fdesc').value = p.desc || ''; $('#famt').value = p.amount || '';
  F.cat = p.cat || null;
  F.acc = p.acc || (S.accounts.some(a => a.id == F.acc) ? F.acc : V.acc || S.accounts[0].id);  // recuerda la última usada
  drawCats();
  $('#addS').classList.add('open'); setTimeout(() => $('#fdesc').focus(), 300);
}

function openAccountChoice() {
  const groups = [
    { type: 'cash', title: '💵 Físico · efectivo' },
    { type: 'bank', title: '🏦 Virtual · cuentas y bancos' }
  ];
  $('#accountChoices').innerHTML = groups.map(g => {
    const accounts = S.accounts.filter(a => g.type == 'cash' ? a.t == 'cash' : a.t != 'cash');
    return accounts.length ? `<h3>${g.title}</h3><div class="choice-list">${accounts.map(a => `<button class="account-choice" data-choice-acc="${a.id}"><span>${a.e}</span><b>${esc(a.n)}</b><i>›</i></button>`).join('')}</div>` : '';
  }).join('') || '<p class="choice-hint">Primero crea una cuenta en Mi dinero.</p>';
  $('#accountChoiceS').classList.add('open');
}

async function guardar() {
  let desc = $('#fdesc').value.trim(), amt = parseAmt($('#famt').value);
  if (!amt || !F.cat) {                       // falta algo: intenta interpretar el texto
    const r = await interpret(desc + ' ' + $('#famt').value);
    desc = r.desc || desc; amt = amt || r.amount; F.cat = F.cat || r.cat;
  }
  if (!amt || !F.cat) { drawCats(); return toast('Falta el monto o la categoría'); }
  const c = catOf(F.cat);
  S.tx.push({ id: Date.now(), desc: desc || c.n, amount: amt, type: c.t, cat: c.id, acc: F.acc, date: $('#fd').value || today() });
  save(); V.t = c.t; V.cat = null; closeSheets(); render();
}

function initAddSheet() {
  $('#addBtn').onclick = openAccountChoice;
  $('#chatBtn').onclick = () => openAdd();
  $('#accountChoices').onclick = e => {
    const b = e.target.closest('[data-choice-acc]'); if (!b) return;
    closeSheets(); openAdd({ acc: +b.dataset.choiceAcc });
  };
  $('#facc').onclick = e => { const b = e.target.closest('[data-a]'); if (b) { F.acc = +b.dataset.a; drawCats(); } };
  $('#fcats').onclick = e => { const b = e.target.closest('[data-k]'); if (b) { F.cat = +b.dataset.k; drawCats(); } };
  $('#saveBtn').onclick = guardar;
}
