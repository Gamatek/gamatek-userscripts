// ==UserScript==
// @name         YouTubeTimeoutBypass
// @description  Reduces YouTube setTimeout delays. (anti-adblock delay bypass)
// @icon         https://raw.githubusercontent.com/Gamatek/gamatek-userscripts/refs/heads/main/youtube-timeout-bypass/icon128.png
// @version      1.1.2

// @author       Gamatek
// @namespace    https://github.com/Gamatek
// @downloadURL  https://github.com/Gamatek/gamatek-userscripts/raw/refs/heads/main/youtube-timeout-bypass/youtube-timeout-bypass.user.js
// @updateURL    https://github.com/Gamatek/gamatek-userscripts/raw/refs/heads/main/youtube-timeout-bypass/youtube-timeout-bypass.user.js

// @match        https://*.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    const _setTimeout = window.setTimeout;

    const TARGET_DELAYS = new Set([5000, 10000, 17000, 18000, 19000, 20000, 30000]);
    const SUSPICIOUS_PATTERNS = /advancement|advancement_|advancement_ms|advancement_more|advancement_less|advancement_action|advancement_skip|adblock|enforce|penalty|warning|modal|overlay|popup|blocker/i;
    const CALLBACK_CACHE = new WeakMap();

    function isAdRelatedCallback(callback) {
        if (typeof callback !== "function") return false;

        if (CALLBACK_CACHE.has(callback)) {
            return CALLBACK_CACHE.get(callback);
        };

        let isAdRelated = false;

        try {
            const callbackStr = callback.toString();
            if (callbackStr.includes("[native code]")) {
                isAdRelated = true;
            } else {
                isAdRelated = SUSPICIOUS_PATTERNS.test(callbackStr);
            };
        } catch (error) {
            isAdRelated = true;
        };

        CALLBACK_CACHE.set(callback, isAdRelated);
        return isAdRelated;
    };

    window.setTimeout = function(callback, delay, ...args) {
        let newDelay = Number(delay) || 0

        if (TARGET_DELAYS.has(delay)) {
            newDelay = Math.max(1, Math.floor(delay * 0.001));
        } else if (delay >= 5000 && delay <= 35000 && isAdRelatedCallback(callback)) {
            newDelay = Math.max(1, Math.floor(delay * 0.001));
        };

        return _setTimeout.call(window, callback, newDelay, ...args);
    };

    Object.defineProperty(window.setTimeout, "toString", {
        value: function() {
            return _setTimeout.toString();
        },
        writable: false,
        configurable: false
    });

    Object.defineProperty(window.setTimeout, "name", {
        value: "setTimeout",
        writable: false,
        configurable: false
    });

    Object.setPrototypeOf(window.setTimeout, _setTimeout);
})();