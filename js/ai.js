// Gemini: elige categoría, monto y descripción. Si falla, queda el resultado local.
const API = 'https://generativelanguage.googleapis.com/v1beta/models';

async function askGemini(text) {
  const cats = S.cats.map(c => `${c.id}=${c.n} (${c.t == 'in' ? 'ingreso' : 'gasto'})`).join(', ');
  const accs = S.accounts.map(a => `${a.id}=${a.n}`).join(', ');
  const prompt = `Categorías: ${cats}.\nCuentas: ${accs}.\nTexto: "${text}"\nDevuelve JSON {"desc": descripción corta, "amount": número en pesos colombianos ("25 mil" = 25000), "cat": id de la categoría más adecuada, "acc": id de la cuenta solo si el texto la menciona}.`;
  const res = await fetch(`${API}/${S.model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': S.key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } })
  });
  if (!res.ok) throw new Error(res.status);
  return JSON.parse((await res.json()).candidates[0].content.parts[0].text);
}

async function interpret(text) {
  const r = localParse(text);
  if (!S.key || !text.trim()) return r;
  try {
    const j = await askGemini(text);
    if (j.amount) r.amount = Math.round(+j.amount);
    if (j.desc) r.desc = j.desc;
    if (S.cats.some(c => c.id == j.cat)) r.cat = +j.cat;
    if (S.accounts.some(a => a.id == j.acc)) r.acc = +j.acc;
  } catch (e) { toast('La IA no respondió; usé el modo básico'); }
  return r;
}
