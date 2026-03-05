// Main popup script for FancyTracker Ω
class PopupMain {
    constructor() {
        this.storage = new PopupStorage();
        this.ui = new PopupUI(this.storage);
        this.currentTab = 'listeners';
    }

    async init() {
        await this.storage.init();
        this.setupTabs();
        this.refreshData();
        
        // Setup real-time updates via Port
        const port = chrome.runtime.connect({ name: "FancyTracker" });
        port.onMessage.addListener((msg) => {
            if (msg.action === 'NEW_ASSET') this.refreshData();
        });
    }

    setupTabs() {
        document.getElementById('btn-assets').onclick = () => {
            this.currentTab = 'assets';
            this.refreshData();
        };
        // Add other tab listeners...
    }

    async refreshData() {
        chrome.runtime.sendMessage({ action: 'GET_DATA' }, (data) => {
            if (this.currentTab === 'assets') {
                this.ui.displaySnatched(data.assets);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new PopupMain();
    app.init();
});
