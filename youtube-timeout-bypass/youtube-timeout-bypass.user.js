// ==UserScript==
// @name         YouTubeTimeoutBypass
// @description  Reduces YouTube setTimeout delays. (anti-adblock delay bypass)
// @icon         https://raw.githubusercontent.com/Gamatek/gamatek-userscripts/refs/heads/main/youtube-timeout-bypass/icon128.png
// @version      1.0

// @author       Gamatek
// @namespace    https://github.com/Gamatek
// @downloadURL  https://github.com/Gamatek/gamatek-userscripts/youtube-timeout-bypass/youtube-timeout-bypass.user.js
// @updateURL    https://github.com/Gamatek/gamatek-userscripts/youtube-timeout-bypass/youtube-timeout-bypass.user.js

// @match        https://*.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(function() {
    "use strict";

    const originalSetTimeout = window.setTimeout;

    function isAdRelatedCallback(callback) {
        if (typeof callback !== "function") return false;

        const callbackStr = callback.toString();
        const suspiciousPatterns = [
            "advancement",
            "advancement_",
            "advancement_ms",
            "advancement_more_ms",
            "advancement_less_ms",
            "advancement_action_",
            "advancement_more_action_",
            "advancement_less_action_",
            "advancement_skip_"
        ];

        if (callbackStr.includes("[native code]")) {
            return true;
        };

        return suspiciousPatterns.some((pattern) => callbackStr.toLowerCase().includes(pattern.toLowerCase()));
    };

    window.setTimeout = function(callback, delay, ...args) {
        let newDelay = delay;

        const isTargetDelay = [17000, 18000, 19000, 20000, 30000, 5000, 10000].includes(delay);
        const isSuspiciousDelay = delay >= 5000 && delay <= 35000;

        if (isTargetDelay || (isSuspiciousDelay && isAdRelatedCallback(callback))) {
            newDelay = Math.max(1, Math.floor(delay * 0.001));
        };

        return originalSetTimeout.call(window, callback, newDelay, ...args);
    };

    window.setTimeout.toString = function() {
        return originalSetTimeout.toString();
    };
})();