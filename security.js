(() => {
    'use strict';

    const REDIRECT_URL = new URL('./main.html', window.location.href).href;
    const HORIZONTAL_GAP = 50;
    const VERTICAL_GAP = 200;
    const CHECK_INTERVAL = 250;
    let redirectStarted = false;

    function redirectToMain() {
        if (redirectStarted || window.location.href === REDIRECT_URL) {
            return;
        }

        redirectStarted = true;
        window.location.replace(REDIRECT_URL);
    }

    // Docked DevTools reduces the page viewport but not the browser window.
    // Separate limits are used because the browser toolbar is included in the
    // normal vertical difference. A small horizontal limit also covers mobile
    // device emulation in Chrome DevTools.
    function hasOpenDevTools() {
        const horizontalGap = Math.max(0, window.outerWidth - window.innerWidth);
        const verticalGap = Math.max(0, window.outerHeight - window.innerHeight);

        return horizontalGap > HORIZONTAL_GAP || verticalGap > VERTICAL_GAP;
    }

    function checkDevTools() {
        if (redirectStarted) {
            return;
        }

        if (hasOpenDevTools()) {
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
