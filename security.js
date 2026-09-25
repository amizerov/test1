(() => {
    'use strict';

    const REDIRECT_URL = new URL('./main.html', window.location.href).href;
    const HORIZONTAL_GAP = 50;
    const VERTICAL_GAP = 200;
    const CHECK_INTERVAL = 250;
    const WORKER_PAUSE_LIMIT = 150;
    let redirectStarted = false;
    let workerProbeRunning = false;

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

    // A debugger statement on the main thread blocks the redirect itself.
    // Run it in a dedicated worker instead: when DevTools pauses the worker,
    // the page's main thread remains free to perform the redirect.
    function probeDevToolsInWorker() {
        if (workerProbeRunning || redirectStarted ||
            typeof Worker !== 'function' || typeof Blob !== 'function') {
            return;
        }

        workerProbeRunning = true;
        const source = `
            self.postMessage('ready');
            debugger;
            self.postMessage('continued');
            self.close();
        `;
        const objectUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        let worker;
        let watchdog;

        function cleanup() {
            window.clearTimeout(watchdog);
            if (worker) worker.terminate();
            URL.revokeObjectURL(objectUrl);
            workerProbeRunning = false;
        }

        try {
            worker = new Worker(objectUrl);
        } catch {
            cleanup();
            return;
        }

        worker.addEventListener('message', (event) => {
            if (event.data === 'ready') {
                watchdog = window.setTimeout(() => {
                    redirectToMain();
                    cleanup();
                }, WORKER_PAUSE_LIMIT);
                return;
            }

            if (event.data === 'continued') {
                cleanup();
            }
        });
        worker.addEventListener('error', cleanup, { once: true });
    }

    function checkDevTools() {
        if (redirectStarted) {
            return;
        }

        if (hasOpenDevTools()) {
            redirectToMain();
            return;
        }

        probeDevToolsInWorker();
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
