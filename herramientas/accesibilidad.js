/* Accesibilidad compartida: teclado en elementos clicables, nombres accesibles, foco visible y movimiento reducido. */
(function () {
    const st = document.createElement('style');
    st.textContent = '[role="button"]:focus-visible,button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid #2563eb;outline-offset:2px;border-radius:6px}' +
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
    let pend = false;
    function programar() { if (pend) return; pend = true; setTimeout(() => { pend = false; marcar(document.body); }, 120); }
    function iniciar() { marcar(document.body); new MutationObserver(programar).observe(document.body, { childList: true, subtree: true }); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
