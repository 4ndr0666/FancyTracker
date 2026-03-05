// Bridge Content Script - Relays MAIN world data to BACKGROUND script
(function() {
    'use strict';
    if (window.__FANCY_BRIDGE_LOADED__) return;
    window.__FANCY_BRIDGE_LOADED__ = true;

    // Inject main.js into the MAIN world
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('main.js');
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => script.remove();

    // Listen for data from the MAIN world (main.js)
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'POSTMESSAGE_TRACKER_DATA') {
            const detail = event.data.detail;
            
            // Heuristic Snatching in the Bridge Layer
            const rawData = JSON.stringify(detail.data || "");
            if (rawData.includes('.mp4')) {
                const urlMatch = rawData.match(/https?:\/\/[^"'\s]+\.(mp4|webm|m3u8)[^"'\s]*/gi);
                if (urlMatch) {
                    chrome.runtime.sendMessage({
                        action: 'ASSET_SNATCHED',
                        url: urlMatch[0].replace(/\\/g, '')
                    });
                }
            }

            chrome.runtime.sendMessage({
                action: 'LOG_MESSAGE',
                payload: detail
            });
        }
    });
})();
