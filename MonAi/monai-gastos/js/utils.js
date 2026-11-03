const $ = s => document.querySelector(s);
const MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const nf = new Intl.NumberFormat('es-CO');
const fmt = n => nf.format(Math.round(n));
const short = n => n >= 1e6 ? (n/1e6).toFixed(2).replace(/\.?0+$/,'').replace('.',',') + 'M'
                        : n >= 1e4 ? Math.round(n/1e3) + 'K' : fmt(n);

const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset()*6e4).toISOString().slice(0,10); };
const dmy = d => { const [y,m,x] = d.split('-'); return `${x}/${m}/${y.slice(2)}`; };

function toast(t) {
  const e = $('#toast'); e.textContent = t; e.classList.add('on');
  clearTimeout(toast.h); toast.h = setTimeout(() => e.classList.remove('on'), 2600);
}
const closeSheets = () => document.querySelectorAll('.sheet').forEach(s => s.classList.remove('open'));
