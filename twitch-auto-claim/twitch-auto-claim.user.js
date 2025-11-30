// ==UserScript==
// @name         AutoClaimTwitch
// @description  Will automatically click the button for claiming channel points on Twitch.
// @icon         https://raw.githubusercontent.com/Gamatek/gamatek-userscripts/refs/heads/main/twitch-auto-claim/icon128.png
// @version      1.0.0

// @author       Gamatek
// @namespace    https://github.com/Gamatek
// @updateURL    https://github.com/Gamatek/gamatek-userscripts/twitch-auto-claim/twitch-auto-claim.user.js
// @downloadURL  https://github.com/Gamatek/gamatek-userscripts/twitch-auto-claim/twitch-auto-claim.user.js

// @match        https://*.twitch.tv/*
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const summaryElems = document.getElementsByClassName("community-points-summary");

    let observers = [];
    let lastPointsSummarySection;
    let lastClick = 0;

    function log(...args) {
        console.log(
            "%c TwitchAutoClaim %c",
            "background: #00db84; color: #000000;", null,
            ...args
        );
    };

    function clickBonusButton() {
        if (!summaryElems[0]) return;
        const bonusBtn = summaryElems[0].querySelector(".community-points-summary > *:nth-child(2) button");
        if (bonusBtn && (Date.now() - lastClick) > (1000 + Math.random() * 1000)) {
            lastClick = Date.now();
            log("Claiming bonus", bonusBtn);
            bonusBtn.click();
        };
    };

    function observeBonus() {
        log("Creating mutation obvserver on points summary section", summaryElems[0]);
        lastPointsSummarySection = summaryElems[0];
        clickBonusButton();
        observers.push(
            new MutationObserver(() => {
                clickBonusButton();
            }).observe(summaryElems[0], { childList: true, subtree: true }),
        );
    };

    function createObservers() {
        if (summaryElems[0]) observeBonus();
        log("Creating document mutation observer");
        observers.push(
            new MutationObserver(() => {
                if (summaryElems[0] && summaryElems[0] !== lastPointsSummarySection) {
                    observeBonus();
                };
            }).observe(document.body, { subtree: true, childList: true }),
        );
    };

    createObservers();
})();