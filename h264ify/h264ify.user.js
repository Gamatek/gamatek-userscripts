// ==UserScript==
// @name         h264ify
// @description  Disable AV1, VP9, and Opus to favor H.264/AAC.
// @icon         https://raw.githubusercontent.com/Gamatek/gamatek-userscripts/refs/heads/main/h264ify/icon128.png
// @version      1.0.0

// @author       Gamatek
// @namespace    https://github.com/Gamatek
// @downloadURL  https://github.com/Gamatek/gamatek-userscripts/raw/refs/heads/main/h264ify/h264ify.user.js
// @updateURL    https://github.com/Gamatek/gamatek-userscripts/raw/refs/heads/main/h264ify/h264ify.user.js

// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const blockedCodecPattern = /\b(av1|av01|vp9|vp09|opus|theora)\b/i;

    const isBlockedCodec = (value) => {
        if (!value) return false;
        return blockedCodecPattern.test(String(value));
    };

    const wrapCanPlayType = () => {
        if (!window.HTMLMediaElement || !HTMLMediaElement.prototype?.canPlayType) return;

        const originalCanPlayType = HTMLMediaElement.prototype.canPlayType;
        HTMLMediaElement.prototype.canPlayType = function (type) {
            if (isBlockedCodec(type)) {
                return "";
            };
            return originalCanPlayType.call(this, type);
        };
    };

    const wrapIsTypeSupported = () => {
        if (!window.MediaSource || typeof MediaSource.isTypeSupported !== "function") return;

        const originalIsTypeSupported = MediaSource.isTypeSupported;
        MediaSource.isTypeSupported = function (type) {
            if (isBlockedCodec(type)) {
                return false;
            };
            return originalIsTypeSupported.call(this, type);
        };
    };

    const wrapDecodingInfo = () => {
        const mediaCapabilities = navigator.mediaCapabilities;
        if (!mediaCapabilities || typeof mediaCapabilities.decodingInfo !== "function") return;

        const originalDecodingInfo = mediaCapabilities.decodingInfo.bind(mediaCapabilities);
        mediaCapabilities.decodingInfo = async function (configuration) {
            const videoContentType = configuration?.video?.contentType;
            const audioContentType = configuration?.audio?.contentType;

            if (isBlockedCodec(videoContentType) || isBlockedCodec(audioContentType)) {
                return {
                    powerEfficient: false,
                    smooth: false,
                    supported: false,
                };
            };

            return originalDecodingInfo(configuration);
        };
    };

    wrapCanPlayType();
    wrapIsTypeSupported();
    wrapDecodingInfo();
})();