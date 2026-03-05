// UI Rendering Logic for FancyTracker Ω
const PopupUI = {
    render: (data, type) => {
        const list = document.getElementById('list');
        if (!list) return;
        
        if (!data || data.length === 0) {
            list.innerHTML = `<div style="text-align:center; opacity:0.3; margin-top:20px;">NO ${type.toUpperCase()} CAPTURED</div>`;
            return;
        }

        list.innerHTML = data.map(item => {
            if (type === 'assets') {
                return `
                    <div class="entry" style="border-color:#FF00FF">
                        <div style="color:#FF00FF; font-weight:bold; margin-bottom:5px;">[SNATCHED_ASSET]</div>
                        <div style="word-break:break-all">${item.url}</div>
                        <div style="opacity:0.4; font-size:9px; margin-top:5px;">Captured: ${new Date(item.ts).toLocaleTimeString()}</div>
                    </div>
                `;
            }
            return `
                <div class="entry">
                    <div style="color:#00E5FF; font-weight:bold; margin-bottom:5px;">[${type === 'listeners' ? 'LISTENER' : 'SIGNAL'}]</div>
                    <div style="word-break:break-all; font-family:monospace;">${type === 'listeners' ? item.listener.substring(0, 150) + '...' : JSON.stringify(item.data).substring(0, 150) + '...'}</div>
                    <div style="opacity:0.5; font-size:9px; margin-top:5px;">Path: ${item.hops || 'top'}</div>
                </div>
            `;
        }).join('');
    },

    updateStats: (data) => {
        document.getElementById('signal-count').textContent = data.intercepts ? data.intercepts.length : 0;
        document.getElementById('asset-count').textContent = data.assets ? data.assets.length : 0;
    }
};
