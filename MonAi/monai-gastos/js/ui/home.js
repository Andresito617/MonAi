// Pantalla principal
function render() {
  const tx = scoped(V.m, V.y), n = net(tx);
  $('#scopeBtn').textContent = V.acc ? accOf(V.acc).e + ' ' + accOf(V.acc).n : '💰 Mi dinero';

  $('#periods').innerHTML = [-1, 0, 1].map(dm => {
    const d = new Date(V.y, V.m + dm, 1);
    return `<button class="per ${dm ? '' : 'on'}" data-dm="${dm}"><b>${MES[d.getMonth()]}</b><span>$ ${fmt(net(scoped(d.getMonth(), d.getFullYear())))}</span></button>`;
  }).join('');

  $('#total').innerHTML = `<i class="sg ${n < 0 ? 'neg' : 'pos'}">${n < 0 ? '−' : '+'}</i><span>${fmt(Math.abs(n))}</span><small>$</small>`;

  $('#seg').innerHTML = ['out', 'in'].map(t =>
    `<button data-t="${t}" class="${V.t == t ? 'on' : ''}"><i class="sg s ${t == 'out' ? 'neg' : 'pos'}">${t == 'out' ? '−' : '+'}</i>${fmt(sum(tx, t))}</button>`).join('');

  const cs = S.cats.filter(c => c.t == V.t)
    .map(c => ({ c, v: tx.filter(x => x.cat == c.id).reduce((s, x) => s + x.amount, 0) }))
    .sort((a, b) => b.v - a.v);
  const mx = Math.max(1, ...cs.map(x => x.v));
  $('#cats').innerHTML = cs.map(({ c, v }) =>
    `<button class="ct ${V.cat == c.id ? 'sel' : ''}" data-c="${c.id}" style="height:${70 + (v ? 90 * v / mx : 0)}px"><span>${c.e}</span><b>${short(v)}</b></button>`).join('');

  let L = V.q
    ? S.tx.filter(x => (!V.acc || x.acc == V.acc) && (x.desc + ' ' + catOf(x.cat).n).toLowerCase().includes(V.q.toLowerCase()))
    : tx.filter(x => x.type == V.t && (!V.cat || x.cat == V.cat));
  L = L.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const g = {}; L.forEach(x => (g[x.date] = g[x.date] || []).push(x));

  $('#list').innerHTML = Object.keys(g).sort().reverse().map(d =>
    `<div class="day"><span>${dmy(d)}</span><span>$ ${fmt(g[d].reduce((s, x) => s + x.amount, 0))}</span></div>` +
    g[d].map(x => { const c = catOf(x.cat);
      return `<div class="tx" data-id="${x.id}"><div class="ic ${x.type}">${c.e}</div><div class="nm"><small>${esc(c.n)}${!V.acc && S.accounts.length > 1 ? ' · ' + esc(accOf(x.acc).n) : ''}</small><b>${esc(x.desc)}</b></div><span class="am">$ ${fmt(x.amount)}</span></div>`;
    }).join('')).join('') || `<p class="empty">${tx.length || V.q ? 'Nada por aquí' : 'Nuevo mes, empieza ahora'}</p>`;
}

function initHome() {
  $('#periods').onclick = e => { const b = e.target.closest('[data-dm]'); if (!b) return;
    const x = new Date(V.y, V.m + (+b.dataset.dm), 1); V.m = x.getMonth(); V.y = x.getFullYear(); V.cat = null; render(); };
  $('#seg').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; V.t = b.dataset.t; V.cat = null; render(); };
  $('#cats').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; V.cat = V.cat == +b.dataset.c ? null : +b.dataset.c; render(); };
  $('#list').onclick = e => { const b = e.target.closest('.tx'); if (!b) return;
    if (confirm('¿Eliminar este movimiento?')) { S.tx = S.tx.filter(x => x.id != b.dataset.id); save(); render(); } };

  $('#todayBtn').onclick = () => { V.m = now.getMonth(); V.y = now.getFullYear(); V.cat = null; render(); };
  $('#sBtn').onclick = () => { const q = $('#q'), on = q.style.display == 'block';
    q.style.display = on ? 'none' : 'block'; if (on) { q.value = ''; V.q = ''; render(); } else q.focus(); };
  $('#q').oninput = e => { V.q = e.target.value.trim(); render(); };
}
