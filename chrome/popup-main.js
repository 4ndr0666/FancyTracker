// Main Controller for FancyTracker Ω Popup
document.addEventListener('DOMContentLoaded', async () => {
    let currentTab = 'listeners';

    const refreshData = async () => {
        chrome.runtime.sendMessage({ action: 'GET_STATE' }, (state) => {
            if (!state) return;

            PopupUI.updateStats({
                intercepts: state.intercepts || [],
                assets: state.snatchedAssets || []
            });

            if (currentTab === 'listeners') {
                PopupUI.render(state.listeners || [], 'listeners');
            } else if (currentTab === 'intercepts') {
                PopupUI.render(state.intercepts || [], 'intercepts');
            } else if (currentTab === 'assets') {
                PopupUI.render(state.snatchedAssets || [], 'assets');
            }
        });
    };

    // Tab Event Listeners
    const tabs = {
        'tab-listeners': 'listeners',
        'tab-intercepts': 'intercepts',
        'tab-assets': 'assets'
    };

    Object.keys(tabs).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = () => {
                currentTab = tabs[id];
                // Update CSS classes
                Object.keys(tabs).forEach(k => document.getElementById(k).classList.remove('active'));
                btn.classList.add('active');
                refreshData();
            };
        }
    });

    // Purge Logic
    const purgeBtn = document.getElementById('purge-btn');
    if (purgeBtn) {
        purgeBtn.onclick = async () => {
            if (confirm("Initiate total signal purge?")) {
                await PopupStorage.clear();
                refreshData();
            }
        };
    }

    // Polling refresh
    refreshData();
    const interval = setInterval(refreshData, 1500);

    // Cleanup on close
    window.onunload = () => clearInterval(interval);
});
