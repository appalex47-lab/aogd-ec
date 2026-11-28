/* Configuración e integridad de datos · componentes compartidos por Comercial, Tráfico y Conversión y Revisión Diaria.
   Cada tablero calcula un "modelo" y este módulo lo pinta (cobertura, verificaciones, conciliación y ajustes).
   Modelo: { kpis:[[etiqueta, valor, subtítulo, tono]],
             cobertura:{ titulo, nota, meses:[], canales:[], datos:{mes:[días por canal]|null}, esperados:mes=>n, faltan:[{id,mes,canal,faltan,fechas:[]}], sobran:[hallazgo] , vacio },
             verificaciones:[hallazgo], conciliacion:{ titulo, nota, filas:[{medida,canal,a,b,dif,tono,estado,detalle}], hallazgos:[hallazgo] },
             ajustes:[{k,etiqueta,desc,valor,unidad,tipo}] }
   Hallazgo: { id?, tono:'ok'|'warn'|'bad'|'info', titulo, detalle, acciones:[{t:'fechas',lista}|{t:'csv',nombre,filas}|{t:'ack'}|{t:'accion',titulo,detalle}|{t:'ir',fn,arg}] }
   Ganchos (H): { reconocidos(): {id:{f}}, reconocer(id), quitarReconocido(id), crearAccion({titulo,detalle}), guardarAjustes(obj), restablecer(), descargarCSV(nombre, filas) } */
window.Integridad = (function () {
    const E = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ICONO = { ok: ['✓', 'bg-emerald-100 text-emerald-700'], warn: ['!', 'bg-amber-100 text-amber-700'], bad: ['✕', 'bg-rose-100 text-rose-700'], info: ['i', 'bg-blue-100 text-blue-700'] };
    const CHIP = { ok: 'bg-emerald-100 text-emerald-700', warn: 'bg-amber-100 text-amber-700', bad: 'bg-rose-100 text-rose-700', info: 'bg-blue-100 text-blue-700' };
    const SUBS = ['Cobertura', 'Verificaciones', 'Conciliación', 'Ajustes', 'Respaldo'];
    const RESP_KEY = 'aogd_ultimo_respaldo';
    const RESP_TABLAS = [['tablero_estado', ['id']], ['trafico_estado', ['id']], ['trafico_registros', ['fecha', 'canal', 'fuente', 'dispositivo', 'campana']], ['comercial_estado', ['id']], ['comercial_dia', ['fecha', 'canal']], ['demanda_estado', ['id']], ['demanda_negados', ['fecha', 'sku', 'sucursal']]];
    const ultimoResp = () => { try { return localStorage.getItem(RESP_KEY); } catch (e) { return null; } };
    const BTN = 'px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-700 hover:border-blue-500 hover:text-blue-700 cursor-pointer';
    let sub = 'Cobertura', M = null, H = null, el = null, reg = [];

    const rec = id => (H && H.reconocidos() || {})[id];
    const tonoDe = h => h.id && rec(h.id) ? 'ok' : h.tono;

    function resumen(modelo, ganchos) {
        const r = ganchos.reconocidos() || {}; let peor = 'ok', n = 0; const orden = { ok: 0, info: 0, warn: 1, bad: 2 };
        const lista = [...(modelo.verificaciones || []), ...((modelo.conciliacion && modelo.conciliacion.hallazgos) || [])];
        lista.forEach(h => { if (h.id && r[h.id]) return; if (orden[h.tono] > 0) { n++; if (orden[h.tono] > orden[peor]) peor = h.tono; } });
        const faltan = ((modelo.cobertura && modelo.cobertura.faltan) || []).filter(x => !r[x.id]);
        if (faltan.length && peor === 'ok') { peor = 'warn'; }
        if (faltan.length) n++;
        return { tono: peor, n };
    }
    function pintarChip(chip, modelo, ganchos) {
        if (!chip) return; const r = resumen(modelo, ganchos);
        chip.className = chip.className.replace(/\bbg-(emerald|amber|rose|slate)-\d+\b|\btext-(emerald|amber|rose|slate)-\d+\b|\bborder-(emerald|amber|rose|slate)-\d+\b/g, '').trim() + ' ' + (r.tono === 'bad' ? 'bg-rose-100 text-rose-700 border-rose-300' : r.tono === 'warn' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-emerald-100 text-emerald-700 border-emerald-300');
        chip.textContent = r.tono === 'ok' ? '🩺 Datos ✓' : `🩺 Datos: ${r.n} ${r.n === 1 ? 'aviso' : 'avisos'}`; chip.classList.remove('hidden');
    }
    function kpis(l) { return `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">${l.map(([e, n, s, t]) => `<div class="rounded-2xl bg-white border border-slate-200 p-4"><div class="text-[11px] font-bold uppercase tracking-wide text-slate-500">${E(e)}</div><div class="text-2xl font-extrabold text-slate-900 mt-0.5">${E(n)}</div><span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${CHIP[t || 'info']}">${E(s)}</span></div>`).join('')}</div>`; }
    function accion(a) { reg.push(a); const i = reg.length - 1;
        if (a.t === 'fechas') return `<button type="button" class="${BTN}" onclick="Integridad.verFechas(${i}, this)">${E(a.etiqueta || 'Ver fechas')}</button>`;
        const tx = { csv: 'Descargar lista CSV', ack: a.quitar ? 'Quitar “correcto”' : 'Marcar como correcto', accion: 'Crear acción', ir: a.etiqueta || 'Abrir' }[a.t];
        return `<button type="button" class="${BTN}" onclick="Integridad.run(${i})">${E(tx)}</button>`; }
    function fila(h) {
        const r = h.id && rec(h.id), t = r ? 'ok' : h.tono, ic = ICONO[t];
        const acts = (h.acciones || []).filter(a => !(a.t === 'ack' && r)).map(a => a.t === 'ack' ? accion({ ...a, id: h.id }) : accion(a)).join('') + (r ? accion({ t: 'ack', id: h.id, quitar: true }) : '');
        const lf = (h.acciones || []).find(a => a.t === 'fechas'); const ver = lf ? `<div class="hidden flex-wrap gap-1 mt-2" data-fechas data-lista="${E(JSON.stringify(lf.lista))}"></div>` : '';
        return `<div class="flex gap-3 py-3 border-b border-slate-100 last:border-0"><span class="shrink-0 w-6 h-6 rounded-full grid place-items-center text-xs font-black ${ic[1]}">${ic[0]}</span><div class="min-w-0 flex-1"><div class="text-sm font-bold text-slate-900">${E(h.titulo)}</div><div class="text-xs text-slate-500">${r ? `Marcado como correcto el ${E(r.f)}. ` : ''}${E(h.detalle || '')}</div>${acts ? `<div data-acts><div class="mt-2 flex flex-wrap gap-1.5">${acts}</div>${ver}</div>` : ''}</div></div>`;
    }
    function matriz(c) {
        if (!c.meses.length) return '<p class="text-sm text-slate-500">Todavía no hay datos cargados.</p>';
        const r = H.reconocidos() || {};
        const th = c.meses.map(m => `<th class="font-bold text-slate-500 px-0.5">${m.slice(2, 4)}/${m.slice(5)}</th>`).join('');
        const cuerpo = c.canales.map((cn, i) => `<tr><th class="text-left font-bold text-slate-600 pr-2 whitespace-nowrap">${E(cn)}</th>${c.meses.map(m => {
            const d = c.datos[m] ? c.datos[m][i] : null; if (d === null || d === undefined) return '<td><div class="rounded-md text-center py-1.5 border border-dashed border-slate-300 text-slate-400 font-bold">—</div></td>';
            const e = c.esperados(m), falt = Math.max(0, e - d), ack = r[`cob|${m}|${cn}`];
            const k = falt === 0 || ack ? 'bg-emerald-100 text-emerald-700' : falt / e <= 0.1 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
            return `<td><div class="rounded-md text-center py-1.5 font-extrabold min-w-[34px] ${k}" title="${d} de ${e} días${ack ? ' · marcado como correcto' : ''}">${falt === 0 || ack ? '✓' : '−' + falt}</div></td>`; }).join('')}</tr>`).join('');
        return `<div class="overflow-x-auto"><table class="text-[11px] border-separate" style="border-spacing:3px;width:${c.meses.length < 10 ? (c.meses.length * 58 + 100) + 'px' : '100%'}"><tr><th></th>${th}</tr>${cuerpo}</table></div>
            <div class="flex flex-wrap gap-4 mt-2 text-[11px] text-slate-500"><span><i class="inline-block w-3 h-3 rounded bg-emerald-100 align-[-2px] mr-1"></i>Completo</span><span><i class="inline-block w-3 h-3 rounded bg-amber-100 align-[-2px] mr-1"></i>Faltan ≤10% de los días</span><span><i class="inline-block w-3 h-3 rounded bg-rose-100 align-[-2px] mr-1"></i>Faltan más</span><span>“−8” = faltan 8 días</span></div>`;
    }
    function cobertura() {
        const c = M.cobertura, r = H.reconocidos() || {}; const hoy = new Date(), corte7 = new Date(hoy.getTime() - 8 * 864e5).toISOString().slice(0, 10);
        const todos = (c.faltan || []).filter(x => !r[x.id]);
        // Pendientes recientes (últimos 8 días): lo primero que hay que cargar. El resto va ordenado de mayor a menor.
        const recientes = todos.map(x => ({ ...x, rec: x.fechas.filter(f => f >= corte7) })).filter(x => x.rec.length).sort((a, b) => b.rec[b.rec.length - 1] < a.rec[a.rec.length - 1] ? -1 : 1);
        const idsRec = new Set(recientes.map(x => x.id)), resto = todos.filter(x => !idsRec.has(x.id)).sort((a, b) => b.faltan - a.faltan);
        const filaT = (x, fechasTxt) => { const i = (reg.push({ t: 'fechas', lista: x.fechas }), reg.length - 1), j = (reg.push({ t: 'ack', id: x.id }), reg.length - 1);
            return `<tr class="border-b border-slate-100"><td class="py-2 pr-2 whitespace-nowrap">${E(x.mes)}</td><td class="pr-2">${E(x.canal)}</td><td class="text-right pr-2 tabular-nums font-bold whitespace-nowrap">${fechasTxt || (x.faltan + (x.faltan === 1 ? ' día' : ' días'))}</td><td class="text-right whitespace-nowrap" data-acts><button type="button" class="${BTN}" onclick="Integridad.verFechas(${i}, this)">Ver fechas</button> <button type="button" class="${BTN}" onclick="Integridad.run(${j})">Es correcto</button><div class="hidden flex-wrap gap-1 mt-1.5 justify-end" data-fechas></div></td></tr>`; };
        const fmtF = f => f.slice(8) + '/' + f.slice(5, 7);
        const filasRec = recientes.map(x => filaT(x, x.rec.map(fmtF).join(', '))).join('');
        const filasResto = resto.map((x, k) => filaT(x).replace('<tr ', `<tr ${k >= 6 ? 'data-mas class="hidden border-b border-slate-100" ' : ''}`).replace('class="border-b border-slate-100"', k >= 6 ? '' : 'class="border-b border-slate-100"')).join('');
        const csv = (reg.push({ t: 'csv', nombre: 'Faltantes_' + (M.nombre || 'datos') + '.csv', filas: [['Mes', 'Canal', 'Fecha_faltante'], ...todos.flatMap(x => x.fechas.map(f => [x.mes, x.canal, f]))] }), reg.length - 1);
        const bloqueFalta = todos.length ? `${recientes.length ? `<div class="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"><div class="text-[11px] font-extrabold uppercase tracking-wide text-amber-800">Pendiente de cargar (últimos 8 días)</div><table class="w-full text-xs mt-1"><tbody>${filasRec}</tbody></table></div>` : ''}
            ${resto.length ? `<div class="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mt-3">Huecos anteriores (${resto.length})</div><table class="w-full text-xs mt-1"><tbody>${filasResto}</tbody></table>${resto.length > 6 ? `<button type="button" class="${BTN} mt-2" onclick="Integridad.verMas(this)">Ver las ${resto.length} combinaciones</button>` : ''}` : ''}
            <div class="mt-2 text-[11px] text-slate-500"><button type="button" class="${BTN}" onclick="Integridad.run(${csv})">Descargar lista CSV</button></div>` : '<p class="text-xs text-slate-500 mt-2">No falta ningún día en el periodo cubierto.</p>';
        return kpis(M.kpis) + `<div class="rounded-2xl bg-white border border-slate-200 p-4 mt-3"><h3 class="text-sm font-extrabold text-slate-900">${E(c.titulo || 'Cobertura por mes y canal')}</h3><p class="text-xs text-slate-500 mt-0.5 mb-2">${E(c.nota || '')}</p>${matriz(c)}</div>
        <div class="grid lg:grid-cols-2 gap-3 mt-3"><div class="rounded-2xl bg-white border border-slate-200 p-4"><h3 class="text-sm font-extrabold text-slate-900">Lo que falta</h3>${bloqueFalta}${(c.faltantes_extra || []).map(fila).join('')}</div>
        <div class="rounded-2xl bg-white border border-slate-200 p-4"><h3 class="text-sm font-extrabold text-slate-900">Lo que sobra</h3>${(c.sobran || []).map(fila).join('') || '<p class="text-xs text-slate-500 mt-2">Nada fuera de lugar.</p>'}</div></div>`;
    }
    function verificaciones() { return `<div class="rounded-2xl bg-white border border-slate-200 p-4"><h3 class="text-sm font-extrabold text-slate-900">Verificaciones</h3>${(M.verificaciones || []).map(fila).join('') || '<p class="text-xs text-slate-500 mt-2">Sin verificaciones.</p>'}</div>`; }
    function conciliacion() {
        const c = M.conciliacion || { filas: [] };
        const t = c.filas.length ? `<div class="overflow-x-auto mt-2"><table class="w-full text-xs"><thead><tr class="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200"><th class="py-1.5 pr-2">Medida</th><th class="pr-2">Canal</th><th class="text-right pr-2">${E(c.colA || 'Este tablero')}</th><th class="text-right pr-2">${E(c.colB || 'Otra fuente')}</th><th class="text-right pr-2">Dif.</th><th>Estado</th></tr></thead><tbody>${c.filas.map(f => `<tr class="border-b border-slate-100"><td class="py-2 pr-2">${E(f.medida)}</td><td class="pr-2">${E(f.canal)}</td><td class="text-right pr-2 tabular-nums">${E(f.a)}</td><td class="text-right pr-2 tabular-nums">${E(f.b)}</td><td class="text-right pr-2 tabular-nums font-bold">${E(f.dif)}</td><td><span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${CHIP[f.tono]}">${E(f.estado)}</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="text-xs text-slate-500 mt-2">No hay periodos en común para comparar todavía.</p>';
        return `<div class="rounded-2xl bg-white border border-slate-200 p-4"><h3 class="text-sm font-extrabold text-slate-900">${E(c.titulo || 'Conciliación')}</h3><p class="text-xs text-slate-500 mt-0.5">${E(c.nota || '')}</p>${t}</div>
        <div class="rounded-2xl bg-white border border-slate-200 p-4 mt-3">${(c.hallazgos || []).map(fila).join('') || '<p class="text-xs text-slate-500">Sin hallazgos.</p>'}</div>`;
    }
    function ajustes() {
        return `<div class="rounded-2xl bg-white border border-slate-200 p-4"><h3 class="text-sm font-extrabold text-slate-900">Umbrales y reglas</h3>${M.ajustes.map(a => `<div class="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0"><div class="min-w-0"><div class="text-xs font-bold text-slate-800">${E(a.etiqueta)}</div><div class="text-[11px] text-slate-500">${E(a.desc)}</div></div><div class="shrink-0 flex items-center gap-1.5"><input id="ig-aj-${E(a.k)}" type="${a.tipo || 'number'}" step="any" value="${E(a.valor)}" class="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm text-right"><span class="text-[11px] text-slate-500 w-10">${E(a.unidad || '')}</span></div></div>`).join('')}
            <div class="mt-3 flex gap-2"><button type="button" onclick="Integridad.guardar()" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">Guardar</button><button type="button" onclick="Integridad.restablecer()" class="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700">Restablecer</button></div></div>
            ${M.notaAjustes ? `<div class="mt-3 rounded-xl border-l-4 border-blue-500 bg-blue-50 px-3 py-2 text-xs text-slate-700">${E(M.notaAjustes)}</div>` : ''}`;
    }
    function respaldo() {
        const u = ultimoResp(), dias = u ? Math.floor((Date.now() - new Date(u).getTime()) / 86400000) : null;
        const tono = u === null ? 'warn' : dias > 30 ? 'warn' : 'ok';
        const estado = u === null ? 'Nunca se ha descargado un respaldo desde este navegador.' : `Último respaldo descargado desde este navegador: ${new Date(u).toLocaleDateString('es-MX')} (hace ${dias} día${dias === 1 ? '' : 's'}).`;
        return `<div class="rounded-2xl bg-white border border-slate-200 p-4 space-y-3"><h3 class="text-sm font-extrabold text-slate-900">Respaldo de los datos</h3>
            <p class="text-xs text-slate-600 leading-relaxed">Descarga un archivo con el estado y los datos agregados de los tableros: Revisión Diaria (plan y capturas), Tráfico (registros y acciones), Comercial (venta por día y acciones), y Demanda (acciones y negados). No incluye las líneas de venta por pedido de Comercial (son muchas y se vuelven a cargar desde tu archivo original).</p>
            <div class="rounded-xl border px-3 py-2 text-xs ${tono === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-900'}">${E(estado)}${tono === 'warn' ? ' Se recomienda un respaldo al menos una vez al mes.' : ''}</div>
            <button type="button" id="ig-resp-btn" onclick="Integridad.respaldar()" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">Descargar respaldo completo (.json)</button>
            <p id="ig-resp-msg" class="text-xs text-slate-500" role="status"></p></div>`;
    }
    async function respaldar() {
        const btn = document.getElementById('ig-resp-btn'), msg = document.getElementById('ig-resp-msg');
        const cl = (typeof NUBE !== 'undefined') ? NUBE.client : null;
        if (!cl || !NUBE.activo) { if (msg) msg.textContent = 'Sin conexión a la nube: no hay datos que respaldar desde aquí.'; return; }
        btn.disabled = true; const sal = { generado: new Date().toISOString(), version: 1, tablas: {} };
        try {
            for (const [t, orden] of RESP_TABLAS) {
                if (msg) msg.textContent = `Descargando ${t}…`;
                const filas = []; for (let pg = 0; ; pg++) {
                    let q = cl.from(t).select('*'); orden.forEach(o => { q = q.order(o); });
                    const { data, error } = await q.range(pg * 1000, pg * 1000 + 999); if (error) throw new Error(`${t}: ${error.message}`);
                    filas.push(...data); if (data.length < 1000) break;
                }
                sal.tablas[t] = filas;
            }
            const blob = new Blob([JSON.stringify(sal)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `respaldo_tableros_${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
            try { localStorage.setItem(RESP_KEY, new Date().toISOString()); } catch (e) {}
            pintar(); const m2 = document.getElementById('ig-resp-msg'); if (m2) m2.textContent = `Respaldo descargado (${Object.entries(sal.tablas).map(([k, v]) => `${k}: ${v.length}`).join(' · ')}).`;
        } catch (e) { console.error(e); if (msg) msg.textContent = 'No se pudo completar el respaldo: ' + e.message; btn.disabled = false; }
    }
    function pintar() {
        if (!el || !M) return; reg = [];
        const tabs = SUBS.map(s => `<button type="button" onclick="Integridad.ir('${s}')" class="shrink-0 px-1 py-2 text-xs font-bold border-b-[3px] ${s === sub ? 'text-slate-900 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}">${s}</button>`).join('');
        const cuerpo = sub === 'Cobertura' ? cobertura() : sub === 'Verificaciones' ? verificaciones() : sub === 'Conciliación' ? conciliacion() : sub === 'Respaldo' ? respaldo() : ajustes();
        el.innerHTML = `<div class="flex items-center gap-4 border-b border-slate-200 mb-3 overflow-x-auto"><span class="text-xs text-slate-400 shrink-0">⚙ Configuración e integridad ›</span>${tabs}<span class="flex-1"></span><button type="button" onclick="Integridad.recalcular()" class="${BTN} shrink-0">↻ Revisar ahora</button></div>${cuerpo}`;
    }
    return {
        resumen, pintarChip, respaldar,
        montar(contenedor, modelo, ganchos) { el = contenedor; M = modelo; H = ganchos; pintar(); },
        ir(s) { sub = s; pintar(); },
        verMas(btn) { const t = btn.previousElementSibling; t.querySelectorAll('[data-mas]').forEach(tr => { tr.classList.toggle('hidden'); }); const abierto = !t.querySelector('[data-mas]').classList.contains('hidden'); btn.textContent = abierto ? 'Ver menos' : 'Ver las ' + t.querySelectorAll('tr').length + ' combinaciones'; },
        verFechas(i, btn) { const box = btn.closest('[data-acts]').querySelector('[data-fechas]'); if (!box.dataset.listo) { const l = box.dataset.lista ? JSON.parse(box.dataset.lista) : (reg[i] ? reg[i].lista : []); box.innerHTML = l.map(f => `<span class="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-semibold text-slate-700">${E(f)}</span>`).join(''); box.dataset.listo = '1'; } box.classList.toggle('hidden'); box.classList.toggle('flex'); },
        run(i) { const a = reg[i]; if (!a) return;
            if (a.t === 'csv') H.descargarCSV(a.nombre, a.filas);
            else if (a.t === 'ack') { a.quitar ? H.quitarReconocido(a.id) : H.reconocer(a.id); }
            else if (a.t === 'accion') H.crearAccion({ titulo: a.titulo, detalle: a.detalle });
            else if (a.t === 'ir') window[a.fn](a.arg); },
        guardar() { const o = {}; M.ajustes.forEach(a => { const v = document.getElementById('ig-aj-' + a.k).value; o[a.k] = (a.tipo === 'date' || a.tipo === 'text') ? v : Number(v); }); H.guardarAjustes(o); },
        restablecer() { H.restablecer(); },
        recalcular() { if (H.recalcular) H.recalcular(); },
        repintar() { pintar(); }
    };
})();
