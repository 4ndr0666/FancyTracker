// Main World Content Script - Enhanced PostMessage Tracker Ω-ULTIMATE
(function() {
    'use strict';
    
    if (window.__FANCYTRACKER_ULTIMATE_ACTIVE__) return;
    window.__FANCYTRACKER_ULTIMATE_ACTIVE__ = true;

    var loaded = false;
    var originalFunctionToString = Function.prototype.toString;
    
    // Store original APIs
    var originalAddEventListener = Window.prototype.addEventListener;
    var originalPushState = History.prototype.pushState;
    var originalMessagePortAddEventListener = MessagePort.prototype.addEventListener;
    
    // Extension identifier for our own listeners
    var EXTENSION_MARKER = '__FANCYTRACKER_INTERNAL__';
    
    // Extension blacklist - known extension patterns
    var extension_blacklist = [
        'wappalyzer',
        'react-devtools',
        'vue-devtools',
        'domlogger',
        'bitwarden-webauthn',
        'POSTMESSAGE_TRACKER_DATA',
        'FancyTracker:',
        '__postmessagetrackername__'
    ];
    
    function isFromExtension(listener, stack) {
        try {
            var listenerStr = listener.toString();
            var stackStr = stack || '';
            var combined = listenerStr + ' ' + stackStr;
            for (var i = 0; i < extension_blacklist.length; i++) {
                if (combined.includes(extension_blacklist[i])) return true;
            }
        } catch(e) {}
        return false;
    }

    function isFromIgnoredExtension(data) {
        if (!data) return false;
        if (data.type === 'POSTMESSAGE_TRACKER_DATA') return true;
        if (typeof data === 'object') {
            if (typeof data.ext === 'string') {
                var extLower = data.ext.toLowerCase();
                for (var i = 0; i < extension_blacklist.length; i++) {
                    if (extLower.includes(extension_blacklist[i].toLowerCase())) return true;
                }
            }
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var keyLower = key.toLowerCase();
                    for (var i = 0; i < extension_blacklist.length; i++) {
                        if (keyLower.includes(extension_blacklist[i].toLowerCase())) return true;
                    }
                }
            }
            var senderFields = ['SENDER', 'sender', 'source', 'from', 'origin', 'extension', 'ext_id'];
            for (var j = 0; j < senderFields.length; j++) {
                var fieldValue = data[senderFields[j]];
                if (typeof fieldValue === 'string' && extension_blacklist.some(p => fieldValue.toLowerCase().includes(p.toLowerCase()))) return true;
            }
        }
        return false;
    }
    
    var transmit = function(detail) {
        // High-fidelity exfiltration: Snatch video URLs immediately
        var raw = JSON.stringify(detail.data || "");
        if (raw.includes('.mp4')) {
            console.log("%cΨ-SNATCHED_SIGNAL: " + h(detail.source), "color:#00E5FF; font-weight:bold; background:#000; padding:2px;");
        }
        window.postMessage({
            type: 'POSTMESSAGE_TRACKER_DATA',
            detail: detail
        }, '*');
    };

    var m = function(detail) { transmit(detail); };
    
    var h = function(p) {
        var hops = "";
        try {
            if (!p) p = window;
            if (p.top != p && p.top == window.top) {
                var w = p;
                while (top != w) { 
                    var x = 0; 
                    for (var i = 0; i < w.parent.frames.length; i++) { if (w == w.parent.frames[i]) x = i; }
                    hops = "frames[" + x + "]" + (hops.length ? '.' : '') + hops; 
                    w = w.parent; 
                }
                hops = "top" + (hops.length ? '.' + hops : '');
            } else { hops = p.top == window.top ? "top" : "diffwin"; }
        } catch(e) { hops = "unknown"; }
        return hops;
    };
    
    var jq = function(instance) {
        if (!instance || !instance.message || !instance.message.length) return;
        var j = 0, e;
        while (e = instance.message[j++]) {
            var listener = e.handler; 
            if (!listener || isFromExtension(listener, '')) continue;
            transmit({
                window: window.top == window ? 'top' : window.name,
                hops: h(),
                domain: document.domain,
                stack: 'jQuery',
                listener: listener.toString()
            });
        }
    };
    
    var l = function(listener, pattern_before, additional_offset) {
        var offset = 3 + (additional_offset || 0);
        var stack, fullstack;
        try { throw new Error(''); } catch (error) { stack = error.stack || ''; }
        stack = stack.split('\n').map(function (line) { return line.trim(); });
        fullstack = stack.slice();
        if (isFromExtension(listener, fullstack.join(' '))) return;
        
        if (pattern_before) {
            var nextitem = false;
            stack = stack.filter(function(e) {
                if (nextitem) { nextitem = false; return true; }
                if (e.match && e.match(pattern_before)) nextitem = true;
                return false;
            });
            stack = stack[0];
        } else { stack = stack[offset]; }
        
        transmit({
            window: window.top == window ? 'top' : window.name,
            hops: h(),
            domain: document.domain,
            stack: stack,
            fullstack: fullstack,
            listener: listener.__postmessagetrackername__ || listener.toString()
        });
    };
    
    var jqc = function(key) {
        if (typeof window[key] == 'function' && typeof window[key]._data == 'function') {
            var ev = window[key]._data(window, 'events');
            if (ev) jq(ev);
        } else if (window[key] && window[key].expando) {
            var expando = window[key].expando, i = 1, instance;
            while (instance = window[expando + i++]) { if (instance.events) jq(instance.events); }
        } else if (window[key] && window[key].events) { jq(window[key].events); }
    };
    
    var j = function() {
        var all = Object.getOwnPropertyNames(window);
        for (var i = 0; i < all.length; i++) { if (all[i].indexOf('jQuery') !== -1) jqc(all[i]); }
        loaded = true;
    };
    
    History.prototype.pushState = function(state, title, url) {
        transmit({pushState: true});
        return originalPushState.apply(this, arguments);
    };
    
    try {
        var original_setter = window.__lookupSetter__('onmessage');
        if (original_setter) {
            window.__defineSetter__('onmessage', function(listener) {
                if (listener && !isFromExtension(listener, '')) l(listener, null, 0);
                original_setter(listener);
            });
        }
    } catch(e) {}
    
    var c = function(listener) {
        try {
            var listener_str = originalFunctionToString.apply(listener);
            if (listener_str.match(/\.deep.*apply.*captureException/s)) return 'raven';
            else if (listener_str.match(/arguments.*(start|typeof).*err.*finally.*end/s) && listener["nr@original"]) return 'newrelic';
            else if (listener_str.match(/rollbarContext.*rollbarWrappedError/s) && listener._isWrap) return 'rollbar';
            else if (listener_str.match(/autoNotify.*(unhandledException|notifyException)/s) && typeof listener.bugsnag == "function") return 'bugsnag';
            else if (listener_str.match(/call.*arguments.*typeof.*apply/s) && typeof listener.__sentry_original__ == "function") return 'sentry';
            else if (listener_str.match(/function.*function.*\.apply.*arguments/s) && typeof listener.__trace__ == "function") return 'bugsnag2';
            return false;
        } catch(error) { return false; }
    };

    var onmsgport = function(e) {
        if (isFromIgnoredExtension(e.data)) return;
        var p = (e.ports && e.ports.length ? '%cport' + e.ports.length + '%c ' : '');
        var msg = '%cport%c→%c' + h(e.source) + '%c ' + p + (typeof e.data == 'string' ? e.data : 'j ' + JSON.stringify(e.data));
        console.log(msg, "color: blue", '', "color: red", '', p.length ? "color: blue" : '', p.length ? '' : '');
    };
    
    var onmsg = function(e) {
        if (isFromIgnoredExtension(e.data)) return;
        var isTarget = JSON.stringify(e.data).includes('.mp4');
        var color = isTarget ? '#FF00FF' : '#00E5FF';
        var p = (e.ports && e.ports.length ? '%cport' + e.ports.length + '%c ' : '');
        var msg = '%c' + h(e.source) + '%c→%c' + h() + '%c ' + p + (typeof e.data == 'string' ? e.data : 'j ' + JSON.stringify(e.data));
        console.log(msg, `color:${color}`, '', "color: green", '', p.length ? "color: blue" : '', p.length ? '' : '');
        transmit({ type: 'MESSAGE_INTERCEPTED', data: e.data, source: e.source });
    };
    
    onmsg[EXTENSION_MARKER] = true;
    onmsgport[EXTENSION_MARKER] = true;
    
    MessagePort.prototype.addEventListener = function(type, listener, useCapture) {
        if (!this.__postmessagetrackername__) {
            this.__postmessagetrackername__ = true;
            this.addEventListener('message', onmsgport);
        }
        return originalMessagePortAddEventListener.apply(this, arguments);
    };

    Window.prototype.addEventListener = function(type, listener, useCapture) {
        if (type == 'message') {
            if (listener && (listener[EXTENSION_MARKER] || isFromExtension(listener, ''))) return originalAddEventListener.apply(this, arguments);
            var pattern_before = false, offset = 0;
            if (listener && listener.toString().indexOf('event.dispatch.apply') !== -1) {
                pattern_before = /init\.on|init\..*on\]/;
                if (loaded) setTimeout(j, 100);
            }
            var unwrap = function(listener) {
                var found = c(listener);
                if (found == 'raven') {
                    var ff = 0, f = null;
                    for (var key in listener) { if (typeof listener[key] == "function") { ff++; f = listener[key]; } }
                    if (ff == 1 && f) { offset++; listener = unwrap(f); }
                } else if (found == 'newrelic') { offset++; listener = unwrap(listener["nr@original"]); }
                else if (found == 'sentry') { offset++; listener = unwrap(listener["__sentry_original__"]); }
                else if (found == 'rollbar') { offset += 2; listener = unwrap(listener._wrapped || listener._rollbar_wrapped); }
                else if (found == 'bugsnag' || found == 'bugsnag2') { offset++; }
                if (listener && listener.name && listener.name.indexOf('bound ') === 0) listener.__postmessagetrackername__ = listener.name;
                return listener;
            };
            if (typeof listener == "function") { listener = unwrap(listener); l(listener, pattern_before, offset); }
        }
        return originalAddEventListener.apply(this, arguments);
    };
    
    window.addEventListener('load', j);
    window.addEventListener('message', onmsg);
    console.log(`%c[Ψ-FANCYTRACKER] ENGINE ARMED: ${h()}`, 'color:#00E5FF;font-weight:bold');
})();
