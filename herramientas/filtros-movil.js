/* Filtros en móvil: hoja inferior con "Listo", etiquetas tocables en la línea de resumen y punto de aviso cuando hay filtros distintos al predeterminado.
   Compartido por Revisión Diaria, Tráfico y Conversión y Comercial. Reutiliza los mismos selectores de la página (sin duplicar ids). */
(function () {
    const MAPAS = [{ corte: 'sel-corte', canal: 'sel-canal', vent: 'sel-ventana' }, { corte: 'selector-fecha-corte', canal: 'selector-canal-barra', vent: 'selector-ventana-barra' }];
    let ID = null, fondo = null, previo = null;
    const g = id => document.getElementById(id);
    const css = document.createElement('style');
    css.textContent = '#hdr-filtros .fm-cab{display:none}@media (max-width:639px){header{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' +
        '#hdr-filtros.fm-abierto{display:flex!important;flex-direction:column;align-items:stretch;flex-wrap:nowrap;position:fixed;left:0;right:0;bottom:0;z-index:60;background:#fff;border-radius:18px 18px 0 0;box-shadow:0 -12px 32px rgba(15,23,42,.28);padding:14px 16px 18px;max-height:80vh;overflow:auto;gap:12px}' +
        '#hdr-filtros .fm-cab{display:flex;align-items:center;justify-content:space-between}#hdr-filtros #filtros{display:flex;flex-direction:column;align-items:stretch;gap:10px}#hdr-filtros #filtros select,#hdr-filtros #filtros input[type=search]{width:100%}#hdr-filtros #filtros label{margin-left:0!important}' +
        '#hdr-filtros.fm-abierto>*{flex-shrink:0}#hdr-filtros.fm-abierto{padding-bottom:calc(18px + env(safe-area-inset-bottom,0px))}' +
        '#hdr-filtros label{display:flex!important;justify-content:space-between;align-items:center;gap:12px;font-size:12px}#hdr-filtros select{min-width:58%;padding-top:8px;padding-bottom:8px}' +
        '#hdr-filtros .fm-et{display:block;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b}' +
        '#hdr-filtros>div:not(.fm-cab){width:100%}#hdr-filtros details>div{position:static!important;width:100%!important;box-shadow:none!important;margin-top:8px;border-width:1px}' +
        '#hdr-filtros summary{display:block;text-align:center;padding:9px 12px}' +
        'body:has(#hdr-filtros.fm-abierto) #glo-btn{display:none}' +
        '#fm-fondo{display:none;position:fixed;inset:0;z-index:29;background:rgba(15,23,42,.45)}#fm-fondo.fm-abierto{display:block}}';
    document.head.appendChild(css);

    function ayerISO() { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function textoSel(id) { const x = g(id); return x && x.selectedOptions && x.selectedOptions[0] ? x.selectedOptions[0].textContent.trim() : ''; }
    function distintoDelPredeterminado() {
        if (!ID) return [];
        const c = g(ID.canal), k = g(ID.corte), l = [];
        if (c && c.selectedIndex > 0) l.push('canal ' + textoSel(ID.canal));
        if (k && k.value && k.value.slice(0, 7) === ayerISO().slice(0, 7) && k.value !== ayerISO()) l.push('corte ' + k.value);
        return l;
    }
    window.resumenFiltros = window.resumenFiltros || function () {
        const el = g('hdr-resumen'); if (!ID || !el) return;
        const k = g(ID.corte), corte = k && k.value ? k.value.split('-').reverse().slice(0, 2).join('/') : '—';
        const et = [['Corte ' + corte, ID.corte], [textoSel(ID.canal), ID.canal], [textoSel(ID.vent), ID.vent]].filter(x => x[0]);
        el.innerHTML = et.map(([t, id]) => `<button type="button" onclick="abrirFiltros('${id}')" class="shrink-0 px-2 py-0.5 rounded-full border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700">${t.replace(/</g, '&lt;')}</button>`).join('');
        const dif = distintoDelPredeterminado(), p = g('fm-punto');
        if (p) { p.classList.toggle('hidden', !dif.length); }
        const b = g('btn-filtros'); if (b) b.title = dif.length ? 'Filtros distintos al predeterminado: ' + dif.join(', ') : 'Filtros';
    };
    function abierto() { const p = g('hdr-filtros'); return !!p && p.classList.contains('fm-abierto'); }
    window.alternarFiltros = function (forzar) {
        const p = g('hdr-filtros'), b = g('btn-filtros'); if (!p || !b) return;
        const abrir = typeof forzar === 'boolean' ? forzar : !abierto();
        p.classList.toggle('max-sm:hidden', !abrir); p.classList.toggle('fm-abierto', abrir); if (fondo) fondo.classList.toggle('fm-abierto', abrir);
        b.setAttribute('aria-expanded', String(abrir)); const f = g('btn-filtros-flecha'); if (f) f.textContent = abrir ? '▴' : '▾';
        if (abrir) { previo = document.activeElement; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-label', 'Filtros');
            if (typeof forzar !== 'string') setTimeout(() => { const f = p.querySelector('select,input,button:not(.fm-cab button),summary'); if (f && !p.contains(document.activeElement)) f.focus(); }, 60); }
        else { p.removeAttribute('role'); p.removeAttribute('aria-modal'); p.removeAttribute('aria-label'); }
        if (abrir) {} else { resumenFiltros(); if (previo && previo.focus && window.innerWidth < 640) previo.focus(); }
    };
    window.abrirFiltros = function (foco) {
        alternarFiltros(true);
        const el = foco && g(foco); if (el) setTimeout(() => { el.focus(); try { if (el.showPicker && el.type === 'date') el.showPicker(); } catch (e) {} }, 60);
    };
    function iniciar() {
        ID = MAPAS.find(m => g(m.corte) && g(m.canal) && g(m.vent)) || null; const p = g('hdr-filtros'); if (!p) return;   // sin ID: modo genérico (la página define resumenFiltros)
        const cab = document.createElement('div'); cab.className = 'fm-cab'; cab.innerHTML = '<strong class="text-sm text-slate-900">Filtros</strong><button type="button" class="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold" onclick="alternarFiltros(false)">Listo</button>';
        p.insertBefore(cab, p.firstChild);
        // Selectores sin etiqueta visible (Revisión Diaria): se rotulan solo dentro de la hoja
        if (ID) [[ID.vent, 'Ventana'], [ID.canal, 'Canal']].forEach(([id, t]) => { const s = g(id); if (s && !s.closest('label')) { const sp = document.createElement('span'); sp.className = 'fm-et sm:hidden'; sp.textContent = t; s.parentNode.insertBefore(sp, s); s.style.width = '100%'; } });
        fondo = document.createElement('div'); fondo.id = 'fm-fondo'; fondo.setAttribute('data-pdf-ocultar', 'true'); fondo.onclick = () => alternarFiltros(false); document.body.appendChild(fondo);
        const b = g('btn-filtros'); if (b && !g('fm-punto')) { const d = document.createElement('span'); d.id = 'fm-punto'; d.className = 'hidden inline-block w-2 h-2 rounded-full bg-blue-600'; d.setAttribute('aria-hidden', 'true'); b.insertBefore(d, b.firstChild); }
        document.addEventListener('keydown', e => {
            if (!abierto()) return;
            if (e.key === 'Escape') { alternarFiltros(false); return; }
            if (e.key === 'Tab') { const q = [...p.querySelectorAll('select,input,button,summary,a[href]')].filter(x => x.offsetParent !== null); if (!q.length) return;
                const ini = q[0], fin = q[q.length - 1]; if (e.shiftKey && document.activeElement === ini) { e.preventDefault(); fin.focus(); } else if (!e.shiftKey && document.activeElement === fin) { e.preventDefault(); ini.focus(); } }
        });
        if (ID) document.addEventListener('change', e => { if (e.target && [ID.corte, ID.canal, ID.vent].includes(e.target.id)) setTimeout(resumenFiltros, 0); });
        window.addEventListener('resize', () => { if (window.innerWidth >= 640 && abierto()) alternarFiltros(false); });
        resumenFiltros();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(iniciar, 0)); else setTimeout(iniciar, 0);
})();
