(() => {
    'use strict';

    const REDIRECT_URL = new URL('main.html', document.baseURI).href;
    const DEVTOOLS_GAP = 160;
    const CHECK_INTERVAL = 500;
    let redirectStarted = false;

    function redirectToMain() {
        if (redirectStarted || window.location.href === REDIRECT_URL) {
            return;
        }

        redirectStarted = true;
        window.location.replace(REDIRECT_URL);
    }

    // Docked DevTools reduces the viewport while the outer window keeps its size.
    function hasDockedDevTools() {
        const horizontalGap = Math.max(0, window.outerWidth - window.innerWidth);
        const verticalGap = Math.max(0, window.outerHeight - window.innerHeight);

        return horizontalGap > DEVTOOLS_GAP || verticalGap > DEVTOOLS_GAP;
    }

    // For undocked DevTools, execution pauses here while a debugger is attached.
    function wasDebuggerPaused() {
        const startedAt = performance.now();

        debugger; // eslint-disable-line no-debugger

        return performance.now() - startedAt > 100;
    }

    function checkDevTools() {
        if (redirectStarted) {
            return;
        }

        if (hasDockedDevTools() || wasDebuggerPaused()) {
            redirectToMain();
        }
    }

    // With this script first in <head>, the check runs before page content parses.
    checkDevTools();

    window.addEventListener('resize', checkDevTools, { passive: true });
    window.addEventListener('focus', checkDevTools, { passive: true });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkDevTools();
        }
    });

    window.setInterval(checkDevTools, CHECK_INTERVAL);
})();
