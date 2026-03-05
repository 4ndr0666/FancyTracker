// Background Service Worker - FancyTracker Ω-ULTIMATE
const STATE = {
    listeners: [],
    intercepts: [],
    snatchedAssets: []
};

// Persistence Logic
const saveToStorage = () => {
    chrome.storage.local.set({
        'tab_listeners': STATE.listeners,
        'tab_intercepts': STATE.intercepts,
        'snatched_assets': STATE.snatchedAssets
    });
};

// Initialize State from Storage
chrome.storage.local.get(['tab_listeners', 'tab_intercepts', 'snatched_assets'], (res) => {
    STATE.listeners = res.tab_listeners || [];
    STATE.intercepts = res.tab_intercepts || [];
    STATE.snatchedAssets = res.snatched_assets || [];
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const tabId = sender.tab ? sender.tab.id : 'popup';

    if (message.action === 'LOG_MESSAGE') {
        const detail = message.payload;
        detail.tabId = tabId;
        if (detail.listener) {
            STATE.listeners.push(detail);
            if (STATE.listeners.length > 1000) STATE.listeners.shift();
        } else {
            STATE.intercepts.push(detail);
            if (STATE.intercepts.length > 1000) STATE.intercepts.shift();
        }
        saveToStorage();
    }

    if (message.action === 'ASSET_SNATCHED') {
        const exists = STATE.snatchedAssets.some(a => a.url === message.url);
        if (!exists) {
            STATE.snatchedAssets.push({ ts: Date.now(), url: message.url, tabId: tabId });
            if (STATE.snatchedAssets.length > 100) STATE.snatchedAssets.shift();
            saveToStorage();
        }
    }

    if (message.action === 'GET_STATE') {
        sendResponse(STATE);
    }

    if (message.action === 'PURGE_STATE') {
        STATE.listeners = [];
        STATE.intercepts = [];
        STATE.snatchedAssets = [];
        chrome.storage.local.clear(() => {
            saveToStorage();
            sendResponse({ status: 'purged' });
        });
    }

    return true; 
});
