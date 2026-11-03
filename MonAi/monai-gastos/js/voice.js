// Dictado por voz (Web Speech API)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function dictate(onText) {
  if (!SR) return toast('Este navegador no tiene dictado; usa el botón ＋');
  const r = new SR(); r.lang = 'es-CO';
  r.onresult = e => onText(e.results[0][0].transcript);
  r.onerror = () => toast('No pude escuchar');
  r.onend = () => $('#mic').classList.remove('rec');
  $('#mic').classList.add('rec'); r.start();
}
