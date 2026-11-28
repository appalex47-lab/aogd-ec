/* Glosario único de términos, compartido por todos los tableros. Botón "?" flotante + ventana con búsqueda. */
(function () {
    const T = [
        ['Corte y día vencido', 'El corte es el último día incluido en el análisis. La información llega con un día de atraso, así que al abrir un tablero el corte es ayer.'],
        ['Venta, pedidos y ticket promedio', 'Venta = dinero vendido. Pedidos = número de compras. Ticket promedio (AOV) = venta ÷ pedidos.'],
        ['UPT', 'Unidades por pedido: cuántas piezas lleva en promedio cada pedido.'],
        ['AUR', 'Precio promedio por unidad: venta ÷ unidades.'],
        ['¿Qué movió la venta?', 'Venta = pedidos × UPT × AUR. El desglose reparte el cambio de la venta entre esos tres factores y suman exactamente el cambio total.'],
        ['Sesiones', 'Visitas al sitio o app (GA4). En Llamadas son llamadas y en WhatsApp son mensajes: cada canal mantiene su propio denominador.'],
        ['CR (conversión)', 'Pedidos ÷ sesiones (o llamadas, o mensajes según el canal). "Salen 30 pedidos por cada 1,000 sesiones" es el mismo dato expresado por millar.'],
        ['Interacciones', 'Suma auxiliar de sesiones, llamadas y mensajes. Sirve para ver volumen, no para calcular conversión.'],
        ['Plan', 'Meta diaria de venta, pedidos y tráfico por canal, cargada en la Revisión Diaria. Es la referencia de todos los cumplimientos.'],
        ['Cumplimiento y semáforo', 'Real ÷ plan. Verde: 98% o más. Ámbar: entre 90% y 98%. Rojo: menos de 90%. Gris: sin datos.'],
        ['Ritmo', 'Real ÷ plan de los días con dato. Un ritmo de 103% significa que se vende 3% por encima de lo planeado.'],
        ['Pacing mensual', 'Qué parte de la meta del mes ya se cumplió frente a la que debería llevarse al corte. Se compara en puntos porcentuales (pp).'],
        ['Captura parcial y plan equivalente', 'Si faltan canales o días por capturar, el real se compara contra el plan solo de lo capturado ("plan equivalente"), para no penalizar la ausencia como venta cero.'],
        ['Pronóstico de cierre', 'Venta real + estimación de días sin captura + días futuros, ambos al ritmo observado. Es provisional si hay captura parcial.'],
        ['Recuperación requerida', 'Venta diaria necesaria en los días restantes para cerrar al 100% de la meta del mes.'],
        ['Benchmark', 'Tu propio rendimiento de los 28 días anteriores a la ventana analizada. No es una meta ni un estándar externo; no corrige estacionalidad ni promociones.'],
        ['Pedidos perdidos', 'Lo que un segmento habría vendido de mantener su benchmark con el tráfico actual. Ordena las alertas por impacto.'],
        ['Impacto alto, medio, bajo', 'Se mide como pedidos perdidos (o venta perdida) ÷ el total del periodo a su ritmo normal. Los umbrales se ajustan en Configuración.'],
        ['Tráfico de baja intención', 'Fuentes que traen sesiones pero convierten menos de la mitad que el promedio.'],
        ['Ingreso por sesión', 'Venta de Comercial ÷ sesiones de Tráfico. Combina conversión y ticket: cuánto dinero deja cada visita.'],
        ['Cambio de mezcla por canal', 'Peso de una categoría dentro de la venta de un canal (venta de la categoría en el canal ÷ venta del canal). Si sube 3 semanas seguidas y se sale de su variación normal, la categoría empieza a moverse más en ese canal. Migración: el total de la categoría casi no cambia y otro canal pierde peso. Demanda nueva: el total crece sin que otro canal pierda.'],
        ['Cliente nuevo y recurrente', 'Recurrente: el cliente tiene una compra anterior en el historial de Comercial. Nuevo: es su primera compra registrada.'],
        ['Estrella y ancla', 'Productos que más aportan a la venta (estrellas) y productos que atraen tráfico o sostienen el ticket (anclas).'],
        ['Cross-selling', 'Productos que se compran juntos más de lo esperado; la adjunción es el % de pedidos que llevan el segundo producto.'],
        ['Sin movimiento', 'Productos que vendían y llevan 90 días o más sin venta.'],
        ['Integridad y cobertura', 'Verifica que haya datos de todos los días y canales hasta ayer, y que las fuentes cuadren entre sí (por ejemplo pedidos de GA4 vs Comercial).'],
        ['Provisional', 'Dato capturado a mano que se reemplaza cuando llega la carga oficial de Comercial o Tráfico.']
    ];
    const E = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    let previo = null;
    function pintarLista(q) {
        const n = norm(q || ''), l = T.filter(([a, b]) => !n || norm(a + ' ' + b).includes(n));
        document.getElementById('glo-lista').innerHTML = l.length ? l.map(([a, b]) => `<div class="py-2.5 border-b border-slate-100 last:border-0"><dt class="text-sm font-extrabold text-slate-900">${E(a)}</dt><dd class="text-sm text-slate-700 leading-relaxed mt-0.5">${E(b)}</dd></div>`).join('') : '<p class="text-sm text-slate-500 py-4">Sin resultados.</p>';
    }
    function cerrar() { const m = document.getElementById('glo-modal'); if (m) m.remove(); if (previo && previo.focus) previo.focus(); }
    function abrir() {
        if (document.getElementById('glo-modal')) return; previo = document.activeElement;
        const m = document.createElement('div'); m.id = 'glo-modal'; m.setAttribute('data-pdf-ocultar', 'true');
        m.className = 'fixed inset-0 z-[90] flex items-start sm:items-center justify-center bg-slate-900/50 p-3 overflow-y-auto';
        m.innerHTML = `<div role="dialog" aria-modal="true" aria-labelledby="glo-t" class="m-auto w-full max-w-xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl">
            <div class="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200"><h2 id="glo-t" class="text-base font-extrabold text-slate-900">Glosario</h2><button type="button" id="glo-x" aria-label="Cerrar glosario" class="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 text-lg leading-none">✕</button></div>
            <div class="px-5 pt-3"><input id="glo-q" type="search" placeholder="Buscar un término…" aria-label="Buscar en el glosario" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></div>
            <dl id="glo-lista" class="px-5 pb-4 overflow-y-auto"></dl></div>`;
        document.body.appendChild(m); pintarLista('');
        m.addEventListener('click', e => { if (e.target === m) cerrar(); });
        document.getElementById('glo-x').onclick = cerrar;
        const q = document.getElementById('glo-q'); q.oninput = () => pintarLista(q.value); q.focus();
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
    function boton() {
        if (document.getElementById('glo-btn')) return;
        const b = document.createElement('button'); b.id = 'glo-btn'; b.type = 'button'; b.textContent = '?'; b.setAttribute('aria-label', 'Abrir glosario de términos'); b.title = 'Glosario';
        b.setAttribute('data-pdf-ocultar', 'true');
        b.className = 'fixed bottom-20 right-4 z-40 w-9 h-9 rounded-full bg-slate-900 text-white text-sm font-extrabold shadow-lg hover:bg-slate-700';
        b.onclick = abrir; document.body.appendChild(b);
    }
    window.Glosario = { abrir };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boton); else boton();
})();
