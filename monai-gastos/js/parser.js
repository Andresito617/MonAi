// Interpretación local ("almuerzo 25 mil"), sin IA
const NUM = /(\d+(?:[.,]\d+)*)\s*(millones|millón|millon|mil|k)?/i;

function parseAmt(s) {
  const m = String(s).match(NUM); if (!m) return 0;
  const t = m[1];
  let v = /^\d{1,3}([.,]\d{3})+$/.test(t) ? parseFloat(t.replace(/[.,]/g, '')) : parseFloat(t.replace(',', '.'));
  const u = (m[2] || '').toLowerCase();
  if (u.startsWith('mill')) v *= 1e6; else if (u == 'mil' || u == 'k') v *= 1e3;
  return Math.round(v) || 0;
}

// Palabras clave por nombre de categoría (modo básico, sin IA). Edítalas a tu gusto.
const KEYWORDS = {
  'comida fuera': ['almuerzo','cena','desayuno','comida','restaurante','café','cafe','pizza','hamburguesa','domicilio','helado'],
  'transporte': ['taxi','uber','bus','gasolina','pasaje','metro','moto','parqueadero'],
  'mercado': ['mercado','supermercado','frutas','verduras','tienda','carne'],
  'facturas': ['factura','luz','agua','internet','gas','celular','plan'],
  'ropa': ['ropa','zapatos','camisa','pantalón','pantalon','jean','tenis'],
  'vivienda': ['arriendo','alquiler','renta','administración','administracion'],
  'salario': ['salario','sueldo','nómina','nomina','consignación','consignacion']
};

function localParse(text) {
  const low = text.toLowerCase();
  const r = { amount: parseAmt(text), desc: text.replace(NUM, '').trim() };
  const hit = S.cats.find(c => low.includes(c.n.toLowerCase()))
    || S.cats.find(c => (KEYWORDS[c.n.toLowerCase()] || []).some(k => low.includes(k)));
  if (hit) r.cat = hit.id;
  const acc = S.accounts.find(a => low.includes(a.n.toLowerCase()))
    || (/efectivo|cash/.test(low) && S.accounts.find(a => a.t == 'cash'));
  if (acc) r.acc = acc.id;
  return r;
}
