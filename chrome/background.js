// Background script for FancyTracker Ω-ULTIMATE
// Persists listener data, intercepted signals, and snatched assets.
const STORAGE_KEYS = {
    LISTENERS: 'tab_listeners',
    INTERCEPTS: 'tab_intercepts',
    SNATCHED: 'snatched_assets',
    DEDUPE_ENABLED: 'dedupeEnabled',
    BLOCKED_REGEX: 'blockedRegex'
};

var tab_listeners = {};
var tab_intercepts = {};
var snatched_assets = [];
var connectedPorts = [];

// Initialize State from Storage
async function loadState() {
    const result = await chrome.storage.local.get([
        STORAGE_KEYS.LISTENERS, 
        STORAGE_KEYS.INTERCEPTS, 
        STORAGE_KEYS.SNATCHED
    ]);
    tab_listeners = result[STORAGE_KEYS.LISTENERS] || {};
    tab_intercepts = result[STORAGE_KEYS.INTERCEPTS] || {};
    snatched_assets = result[STORAGE_KEYS.SNATCHED] || [];
    console.log('FancyTracker: Ω-State Loaded');
}

// Save State to Storage
async function saveState() {
    await chrome.storage.local.set({
        [STORAGE_KEYS.LISTENERS]: tab_listeners,
        [STORAGE_KEYS.INTERCEPTS]: tab_intercepts,
        [STORAGE_KEYS.SNATCHED]: snatched_assets
    });
}

// Handle Messages from Bridge
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const tabId = sender.tab ? sender.tab.id : (message.tabId || 'global');

    if (message.action === 'LOG_MESSAGE') {
        const detail = message.payload;
        if (detail.listener) {
            if (!tab_listeners[tabId]) tab_listeners[tabId] = [];
            tab_listeners[tabId].push(detail);
        } else {
            if (!tab_intercepts[tabId]) tab_intercepts[tabId] = [];
            tab_intercepts[tabId].push(detail);
        }
        saveState();
    }

    if (message.action === 'ASSET_SNATCHED') {
        snatched_assets.push({ ts: Date.now(), url: message.url, tabId: tabId });
        if (snatched_assets.length > 100) snatched_assets.shift();
        saveState();
        // Broadcast to popup if open
        connectedPorts.forEach(port => port.postMessage({ action: 'NEW_ASSET', asset: message.url }));
    }

    if (message.action === 'GET_DATA') {
        sendResponse({
            listeners: tab_listeners[message.tabId] || [],
            intercepts: tab_intercepts[message.tabId] || [],
            assets: snatched_assets
        });
    }
    return true;
});

// Port Communication for Real-time Popup Updates
chrome.runtime.onConnect.addListener((port) => {
    connectedPorts.push(port);
    port.onDisconnect.addListener(() => {
        connectedPorts = connectedPorts.filter(p => p !== port);
    });
});

loadState();
