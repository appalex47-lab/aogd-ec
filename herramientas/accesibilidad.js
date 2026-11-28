/* Accesibilidad compartida: teclado en elementos clicables, nombres accesibles, foco visible y movimiento reducido. */
(function () {
    const st = document.createElement('style');
    st.textContent = '[role="button"]:focus-visible,button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid #2563eb;outline-offset:2px;border-radius:6px}' +
        '@media (max-width:639px){.overflow-x-auto table th:first-child{position:sticky;left:0;z-index:2;background:#f8fafc}.overflow-x-auto table td:first-child{position:sticky;left:0;z-index:1;background:#fff;box-shadow:1px 0 0 #e2e8f0}}' +
        '@media (max-width:639px){nav.overflow-x-auto.fm-fade-der{-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 34px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 34px),transparent)}nav.overflow-x-auto.fm-fade-izq{-webkit-mask-image:linear-gradient(to left,#000 calc(100% - 34px),transparent);mask-image:linear-gradient(to left,#000 calc(100% - 34px),transparent)}nav.overflow-x-auto.fm-fade-der.fm-fade-izq{-webkit-mask-image:linear-gradient(to right,transparent,#000 30px,#000 calc(100% - 34px),transparent);mask-image:linear-gradient(to right,transparent,#000 30px,#000 calc(100% - 34px),transparent)}}' +
        '@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}';
    document.head.appendChild(st);

    const NATIVOS = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL|SUMMARY|OPTION)$/;
    function marcar(raiz) {
        if (!raiz || !raiz.querySelectorAll) return;
        raiz.querySelectorAll('[onclick]').forEach(el => {
            if (NATIVOS.test(el.tagName) || el.hasAttribute('role') || el.closest('[data-a11y-skip]')) return;
            el.setAttribute('role', 'button');
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        });
        raiz.querySelectorAll('button:not([aria-label]),a:not([aria-label])').forEach(el => {
            if (!el.textContent.trim() && el.title) el.setAttribute('aria-label', el.title);
        });
        raiz.querySelectorAll('#toast,#toast-notification,#nube-estado').forEach(el => {
            if (!el.hasAttribute('role')) { el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); }
        });
    }
    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = e.target;
        if (el && el.getAttribute && el.getAttribute('role') === 'button' && !NATIVOS.test(el.tagName)) { e.preventDefault(); el.click(); }
    });
    // Pestañas con scroll horizontal: pista visual (degradado) y la pestaña activa se centra al cambiar de vista
    function actualizarFade(nav) { const max = nav.scrollWidth - nav.clientWidth; nav.classList.toggle('fm-fade-der', max > 4 && nav.scrollLeft < max - 4); nav.classList.toggle('fm-fade-izq', nav.scrollLeft > 4); }
    function ajustarTabs() {
        document.querySelectorAll('header nav.overflow-x-auto').forEach(nav => {
            if (!nav._fade) { nav._fade = true; nav.addEventListener('scroll', () => actualizarFade(nav), { passive: true }); }
            const act = nav.querySelector('.border-blue-600'), clave = act ? act.textContent.trim() : '';
            if (act && nav._ultima !== clave) { nav._ultima = clave; nav.scrollLeft = act.offsetLeft - (nav.clientWidth - act.offsetWidth) / 2; }
            actualizarFade(nav);
        });
    }
    window.addEventListener('resize', ajustarTabs);
    let pend = false;
    function programar() { if (pend) return; pend = true; setTimeout(() => { pend = false; marcar(document.body); ajustarTabs(); }, 120); }
    function iniciar() { marcar(document.body); ajustarTabs(); new MutationObserver(programar).observe(document.body, { childList: true, subtree: true }); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
