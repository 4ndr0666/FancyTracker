// Bridge Content Script - Handles communication between MAIN world and background
if (typeof window.FancyTrackerBridgeLoaded === 'undefined') {
    window.FancyTrackerBridgeLoaded = true;

    (function() {
        'use strict';
        
        // Safe message sending
        function sendMessageSafely(message) {
            if (!chrome.runtime || !chrome.runtime.id) return;
            
            try {
                chrome.runtime.sendMessage(message, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('FancyTracker: Bridge runtime error:', chrome.runtime.lastError.message);
                    }
                });
            } catch (error) {
                console.error('FancyTracker: Bridge exception:', error);
            }
        }

        // Listen for messages from the MAIN world content script
        window.addEventListener('message', function(event) {
            if (event.source === window && 
                event.data && 
                event.data.type === 'POSTMESSAGE_TRACKER_DATA') {
                
                sendMessageSafely(event.data.detail);
            }
        });

        // Track page changes
        window.addEventListener('beforeunload', function() {
            sendMessageSafely({changePage: true});
        });
        
        console.log('FancyTracker: Bridge initialized');

        // Request the kill switch state from the background script
        // Note: We're not using sendMessageSafely here because we need the response.
        if (chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({ action: 'getKillSwitchState' }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("FancyTracker Bridge: Could not get kill switch state.", chrome.runtime.lastError.message);
                    return;
                }
                // Relay the state to the MAIN world
                window.postMessage({
                    type: 'FANCYTRACKER_KILL_SWITCH_STATE',
                    enabled: response.killSwitchEnabled
                }, '*');
            });
        }
    })();
}