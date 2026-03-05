// Storage Abstraction for FancyTracker Ω
const PopupStorage = {
    get: (keys) => {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, (result) => {
                resolve(result);
            });
        });
    },
    clear: () => {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'PURGE_STATE' }, (response) => {
                resolve(response);
            });
        });
    }
};
