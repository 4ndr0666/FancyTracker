// Bridge Content Script - Relays MAIN world data to BACKGROUND script
(function() {
    'use strict';
    if (window.FancyTrackerBridgeLoaded) return;
    window.FancyTrackerBridgeLoaded = true;

    // Inject the main tracker into the document head for MAIN world access
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('main.js');
    (document.head || document.documentElement).appendChild(script);
    script.onload = function() { this.remove(); };

    // Listen for data from the MAIN world (main.js)
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'POSTMESSAGE_TRACKER_DATA') {
            const detail = event.data.detail;
            
            // Automatic Asset Snatching (Race-Condition Mitigation)
            const rawData = JSON.stringify(detail.data || detail.listener || "");
            if (rawData.includes('.mp4') || rawData.includes('.webm')) {
                const urlMatch = rawData.match(/https?:\/\/[^"'\s]+\.(mp4|webm|m3u8)[^"'\s]*/gi);
                if (urlMatch) {
                    chrome.runtime.sendMessage({
                        action: 'ASSET_SNATCHED',
                        url: urlMatch[0].replace(/\\/g, '')
                    });
                }
            }

            // Standard relay to background
            chrome.runtime.sendMessage({
                action: 'LOG_MESSAGE',
                payload: detail
            });
        }
    });
})();
