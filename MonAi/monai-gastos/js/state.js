// Estado de la app + persistencia en localStorage
const KEY = 'monai-gastos-v1';

const defaults = () => ({
  tx: [], tr: [], key: '', model: 'gemini-flash-latest',
  accounts: [ {id:1,e:'💵',n:'Efectivo',t:'cash',start:0}, {id:2,e:'🏦',n:'Cuenta',t:'bank',start:0} ],
  cats: [
    {id:1,e:'💵',n:'Salario',t:'in'}, {id:2,e:'🍔',n:'Comida fuera',t:'out'}, {id:3,e:'🧾',n:'Facturas',t:'out'},
    {id:4,e:'🚗',n:'Transporte',t:'out'}, {id:5,e:'🥑',n:'Mercado',t:'out'}, {id:6,e:'👖',n:'Ropa',t:'out'}, {id:7,e:'🏢',n:'Vivienda',t:'out'}
  ]
});
function load() {
  let d = null; try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  d = d || defaults();
  // migración: versiones anteriores no tenían cuentas ni transferencias
  if (!d.accounts) d.accounts = defaults().accounts;
  if (!d.tr) d.tr = [];
  d.tx.forEach(x => { if (!x.acc) x.acc = d.accounts[0].id; });
  return d;
}

const S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

const now = new Date();
const V = { m: now.getMonth(), y: now.getFullYear(), t: 'out', cat: null, q: '', acc: null };  // vista (acc = filtro de cuenta)
const F = { cat: null, acc: null };                                                            // formulario de agregar

const catOf = id => S.cats.find(c => c.id == id) || {e:'❔', n:'Sin categoría', t:'out'};
const accOf = id => S.accounts.find(a => a.id == id) || {e:'❔', n:'Sin cuenta', t:'bank'};
const monthTx = (m, y) => S.tx.filter(t => { const d = new Date(t.date + 'T00:00'); return d.getMonth() == m && d.getFullYear() == y; });
const scoped = (m, y) => monthTx(m, y).filter(x => !V.acc || x.acc == V.acc);   // mes + filtro de cuenta
const sum = (a, t) => a.filter(x => x.type == t).reduce((s, x) => s + x.amount, 0);
const net = a => sum(a, 'in') - sum(a, 'out');

// Saldo = saldo inicial + ingresos - gastos + transferencias recibidas - enviadas
const balance = id => {
  const a = S.accounts.find(a => a.id == id); if (!a) return 0;
  const mine = S.tx.filter(x => x.acc == id).reduce((s, x) => s + (x.type == 'in' ? x.amount : -x.amount), 0);
  const tin = S.tr.filter(x => x.to == id).reduce((s, x) => s + x.amount, 0);
  const tout = S.tr.filter(x => x.from == id).reduce((s, x) => s + x.amount, 0);
  return (a.start || 0) + mine + tin - tout;
};
