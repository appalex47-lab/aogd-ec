/* Eventos comerciales y registro de descargas de clientes, compartidos por Tráfico y Conversión y Comercial.
   Cada página llama a Seguimiento.init({ cfg: () => S.config, guardar: () => { persistirEstado(); renderTodo(); } }). */
window.Seguimiento = (function () {
    let H = { cfg: () => ({}), guardar: () => {} };
    const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const corta = iso => { const [, m, d] = String(iso || '').split('-'); return d ? `${d}/${m}` : '—'; };
    const suma = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
    const lista = () => Array.isArray(H.cfg().eventos) ? H.cfg().eventos : [];
    const eventoEn = f => lista().find(e => e.desde && f >= e.desde && f <= (e.hasta || e.desde)) || null;
    function nombresEn(ini, fin) { const s = new Set(); for (let f = ini; f <= fin; f = suma(f, 1)) { const e = eventoEn(f); if (e) s.add(e.nombre); } return [...s]; }
    function diasExcluidos(bIni, bFin) { let n = 0; for (let f = bIni; f <= bFin; f = suma(f, 1)) if (eventoEn(f)) n++; return n; }
    return {
        init(h) { H = h; },
        eventoEn,
        // Aviso para el resumen: el periodo toca un evento y/o el benchmark dejó fuera días de eventos
        aviso(ini, fin, bIni, bFin) {
            const n = nombresEn(ini, fin), x = diasExcluidos(bIni, bFin); if (!n.length && !x) return '';
            return `<p class="text-xs text-violet-800 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1.5">${n.length ? `Este periodo incluye ${esc(n.join(', '))}: sus días pueden ser atípicos. ` : ''}${x ? `El benchmark no usa ${x} día${x === 1 ? '' : 's'} de eventos anteriores.` : ''}</p>`;
        },
        htmlEventos() {
            const L = [...lista()].sort((a, b) => (a.desde || '').localeCompare(b.desde || ''));
            return `<div class="rounded-2xl bg-white border border-slate-200 p-4 space-y-3"><h3 class="text-sm font-extrabold text-slate-900">Eventos comerciales</h3>
                <p class="text-xs text-slate-600 leading-relaxed">Los días de un evento (Buen Fin, Hot Sale, una campaña fuerte) no se usan en el benchmark contra el que se compara el periodo, para que no distorsionen las alertas. El resumen avisa cuando el periodo toca un evento. Estos eventos se comparten con Demanda y los demás tableros que los usan.</p>
                <form onsubmit="Seguimiento.agregar(event)" class="flex flex-wrap items-end gap-2 text-xs">
                    <label class="flex flex-col gap-0.5 font-bold text-slate-600">Evento<input id="ev-nombre" required maxlength="60" placeholder="Buen Fin" class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-normal w-44"></label>
                    <label class="flex flex-col gap-0.5 font-bold text-slate-600">Desde<input id="ev-desde" type="date" required class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-normal"></label>
                    <label class="flex flex-col gap-0.5 font-bold text-slate-600">Hasta<input id="ev-hasta" type="date" required class="rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-normal"></label>
                    <button type="submit" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">Agregar</button></form>
                <ul class="divide-y divide-slate-100">${L.length ? L.map(e => `<li class="py-2 flex items-center justify-between gap-3 text-sm"><span><strong class="text-slate-900">${esc(e.nombre)}</strong> <span class="text-xs text-slate-500">${corta(e.desde)} – ${corta(e.hasta || e.desde)} · ${(e.desde || '').slice(0, 4)}</span></span><button type="button" onclick="Seguimiento.quitar('${esc(e.id)}')" aria-label="Quitar ${esc(e.nombre)}" class="px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:border-rose-400 hover:text-rose-700">Quitar</button></li>`).join('') : '<li class="py-3 text-xs text-slate-500">Aún no hay eventos. Agrega las fechas de Buen Fin, Hot Sale o campañas.</li>'}</ul></div>`;
        },
        agregar(e) {
            e.preventDefault(); const n = document.getElementById('ev-nombre').value.trim(), d = document.getElementById('ev-desde').value, h = document.getElementById('ev-hasta').value;
            if (!n || !d || !h || h < d) { alert('Revisa las fechas: "Hasta" no puede ser anterior a "Desde".'); return; }
            H.cfg().eventos = [...lista(), { id: 'e' + Date.now().toString(36), nombre: n, desde: d, hasta: h }]; H.guardar();
        },
        quitar(id) { H.cfg().eventos = lista().filter(e => e.id !== id); H.guardar(); },
        // ---- Descargas de listas con identificadores de clientes ----
        confirmarClientes() { return confirm('Este archivo contiene identificadores de clientes (Cliente_ID) y pedidos. Úsalo solo para análisis o seguimiento internos; la descarga queda registrada. ¿Continuar?'); },
        usuario() {
            try { let u = localStorage.getItem('aogd_usuario'); if (!u) { u = (prompt('¿Quién descarga? Tu nombre quedará en el registro de descargas de clientes (se recuerda en este navegador).') || '').trim().slice(0, 40); if (u) localStorage.setItem('aogd_usuario', u); } return u || 'Sin nombre'; } catch (e) { return 'Sin nombre'; }
        },
        registrarDescarga(que, n) { const c = H.cfg(), l = Array.isArray(c.descargas) ? c.descargas : []; l.unshift({ f: new Date().toISOString(), por: this.usuario(), que, n }); c.descargas = l.slice(0, 200); H.guardar(); },
        htmlDescargas() {
            const L = Array.isArray(H.cfg().descargas) ? H.cfg().descargas : [];
            return `<div class="rounded-2xl bg-white border border-slate-200 p-4 space-y-3"><h3 class="text-sm font-extrabold text-slate-900">Descargas de archivos con clientes</h3>
                <p class="text-xs text-slate-600 leading-relaxed">Los archivos con Cliente_ID y pedido (machote completo) quedan registrados aquí: fecha, quién y qué. Se guardan las últimas 200. Úsalos solo para análisis o seguimiento internos y no los compartas fuera del equipo.</p>
                <div class="overflow-x-auto"><table class="w-full text-left text-xs num-tabular"><thead class="bg-slate-50 uppercase text-slate-500"><tr><th class="px-3 py-2">Fecha</th><th class="px-2 py-2">Quién</th><th class="px-2 py-2">Qué</th><th class="px-2 py-2 text-right">Filas</th></tr></thead><tbody>${L.length ? L.slice(0, 50).map(d => `<tr class="border-t border-slate-100"><td class="px-3 py-2 whitespace-nowrap">${esc(new Date(d.f).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }))}</td><td class="px-2 py-2 font-semibold">${esc(d.por)}</td><td class="px-2 py-2">${esc(d.que)}</td><td class="px-2 py-2 text-right">${new Intl.NumberFormat('es-MX').format(d.n)}</td></tr>`).join('') : '<tr><td colspan="4" class="px-3 py-4 text-slate-500">Todavía no se ha descargado ningún archivo con clientes.</td></tr>'}</tbody></table></div></div>`;
        }
    };
})();
