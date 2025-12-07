// ==UserScript==
// @name         TwitchNoSubs
// @description  Show sub only VOD on Twitch.
// @icon         https://raw.githubusercontent.com/Gamatek/gamatek-userscripts/refs/heads/main/twitch-no-subs/icon128.png
// @version      1.0.0

// @author       Gamatek
// @namespace    https://github.com/Gamatek
// @updateURL    https://github.com/Gamatek/gamatek-userscripts/raw/refs/heads/main/raw/refs/heads/main/youtube-timeout-bypass/youtube-timeout-bypass.user.js
// @downloadURL  https://github.com/Gamatek/gamatek-userscripts/raw/refs/heads/main/raw/refs/heads/main/youtube-timeout-bypass/youtube-timeout-bypass.user.js

// @match        https://*.twitch.tv/*
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    if (window.__TNS_USERSCRIPT_INSTALLED__) return;
    window.__TNS_USERSCRIPT_INSTALLED__ = true;

    const patch_url = "https://cdn.jsdelivr.net/gh/besuper/TwitchNoSub@master/src/patch_amazonworker.js";

    // From vaft script (https://github.com/pixeltris/TwitchAdSolutions/blob/master/vaft/vaft.user.js#L299)
    function getWasmWorkerJs(twitchBlobUrl) {
        var req = new XMLHttpRequest();
        req.open("GET", twitchBlobUrl, false);
        req.overrideMimeType("text/javascript");
        req.send();
        return req.responseText;
    };

    const oldWorker = window.Worker;

    try {
        window.Worker = class Worker extends oldWorker {
            constructor(twitchBlobUrl) {
                var workerString = getWasmWorkerJs(`${twitchBlobUrl.replaceAll("'", "%27")}`);

                const blobUrl = URL.createObjectURL(new Blob([
                    `importScripts(\n                '${patch_url}',\n            );\n            ${workerString}`
                ]));

                super(blobUrl);
            };
        };
    } catch (_) { };

    class RestrictionRemover {
        constructor() {
            this.observer = null;
            this.removeExistingRestrictions();
            this.createObserver();
        };

        removeExistingRestrictions() {
            try {
                document.querySelectorAll(".video-preview-card-restriction").forEach((el) => el.remove());
            } catch (_) { };
        };

        createObserver() {
            this.observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node && node.nodeType === Node.ELEMENT_NODE) {
                            this.processNode(node);
                        };
                    };
                };
            });

            const start = () => {
                try {
                    this.observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: false,
                        characterData: false,
                    });
                } catch (_) { };
            };

            if (document.body) start();
            else document.addEventListener("DOMContentLoaded", start, { once: true });
        };

        processNode(node) {
            try {
                if (node.classList && node.classList.contains("video-preview-card-restriction")) {
                    node.remove();
                    return;
                };
                if (node)  node.querySelectorAll(".video-preview-card-restriction").forEach((r) => r.remove());
            } catch (_) { };
        };
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => new RestrictionRemover(), { once: true });
    } else {
        new RestrictionRemover();
    };
})();