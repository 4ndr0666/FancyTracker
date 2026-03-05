// UI utilities for FancyTracker Ω
class PopupUI {
    constructor(storage) {
        this.storage = storage;
    }

    displaySnatched(assets) {
        const list = document.getElementById('listener-list');
        list.innerHTML = assets.map(a => `
            <div class="listener-entry" style="border-color:#FF00FF">
                <div style="color:#FF00FF; font-weight:bold; font-size:10px;">[SNATCHED_ASSET]</div>
                <div style="font-size:11px; margin:5px 0; word-break:break-all;">${a.url}</div>
                <div style="font-size:9px; color:#555;">${new Date(a.ts).toLocaleString()}</div>
            </div>
        `).join('');
    }
}
