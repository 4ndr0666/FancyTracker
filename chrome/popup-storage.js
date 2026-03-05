// Storage management for FancyTracker Ω
class PopupStorage {
    constructor() {
        this.snatchedAssets = [];
    }

    async init() {
        const result = await chrome.storage.local.get(['snatched_assets']);
        this.snatchedAssets = result.snatched_assets || [];
    }

    async clearAll() {
        await chrome.storage.local.clear();
        this.snatchedAssets = [];
    }
}
