// Punto de entrada: conecta los módulos y registra el service worker
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeSheets);
initHome(); initAddSheet(); initSettings(); initCash();

$('#mic').onclick = () => dictate(async texto => {
  toast('“' + texto + '”');
  const m = await interpret(texto);
  openAdd({ desc: m.desc, amount: m.amount || '', cat: m.cat, acc: m.acc });
});

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
