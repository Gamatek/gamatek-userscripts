// ==UserScript==
// @name         NetflixHouseholdBypass
// @description  Blocks GraphQL on /watch, hides modal on /browse.
// @icon         https://raw.githubusercontent.com/Gamatek/gamatek-userscripts/refs/heads/main/netflix-household-bypass/icon128.png
// @version      1.0.0

// @author       Gamatek
// @namespace    https://github.com/Gamatek
// @downloadURL  https://github.com/Gamatek/gamatek-userscripts/raw/refs/heads/main/netflix-household-bypass/netflix-household-bypass.user.js
// @updateURL    https://github.com/Gamatek/gamatek-userscripts/raw/refs/heads/main/netflix-household-bypass/netflix-household-bypass.user.js

// @match        https://*.netflix.com/*
// @run-at       document-start
// ==/UserScript==

(function () {
    "use strict";

    const WATCH_PATH = "/watch/";
    const MODAL_SELECTOR = ".nf-modal.interstitial-full-screen";
    const BACKGROUND_SELECTOR = ".nf-modal-background[data-uia='nf-modal-background']";

    // --- GraphQL Blocking for /watch pages ---
    function blockGraphQLRequests() {
        if (!window.location.pathname.includes(WATCH_PATH)) {
            return;
        }

        console.log("[Netflix Bypass] Blocking GraphQL requests on /watch page");

        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            if (typeof url === "string" && url.includes("/graphql")) {
                console.log("[Netflix Bypass] Blocked fetch request to:", url);
                return Promise.reject(new Error("Blocked by Netflix Household Bypass"));
            }
            return originalFetch.apply(this, args);
        };

        // Intercept XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            if (typeof url === "string" && url.includes("/graphql")) {
                console.log("[Netflix Bypass] Blocked XMLHttpRequest to:", url);
                // Don"t call the original open, effectively blocking the request
                this.abort = function() {}; // Make abort a no-op
                this.send = function() {
                    // Trigger error event
                    const errorEvent = new Event("error");
                    this.dispatchEvent(errorEvent);
                };
                return;
            }
            return originalOpen.apply(this, [method, url, ...rest]);
        };
    }

    // --- Modal Hiding for non-/watch pages ---
    function hideHouseholdModal() {
        if (window.location.pathname.includes(WATCH_PATH)) {
            return;
        }

        console.log("[Netflix Bypass] Modal hiding active");

        function findAndRemoveModal(node) {
            // If the added node is a modal, remove it and its background
            if (node.matches && node.matches(MODAL_SELECTOR)) {
                console.log("[Netflix Bypass] Removing modal");
                node.remove();
                document.querySelector(BACKGROUND_SELECTOR)?.remove();
                return;
            }

            // If the added node contains modals, remove them
            if (node.querySelectorAll) {
                const modals = node.querySelectorAll(MODAL_SELECTOR);
                if (modals.length > 0) {
                    console.log("[Netflix Bypass] Removing", modals.length, "modal(s)");
                    modals.forEach(modal => modal.remove());
                }
                // Also try to remove the background if it was added in the same batch
                const background = node.querySelector(BACKGROUND_SELECTOR);
                if (background) {
                    console.log("[Netflix Bypass] Removing modal background");
                    background.remove();
                }
            }
        }

        // Initial cleanup when DOM is ready
        function initialCleanup() {
            const modals = document.querySelectorAll(MODAL_SELECTOR);
            if (modals.length > 0) {
                console.log("[Netflix Bypass] Initial cleanup: removing", modals.length, "modal(s)");
                modals.forEach(modal => modal.remove());
            }
            const background = document.querySelector(BACKGROUND_SELECTOR);
            if (background) {
                console.log("[Netflix Bypass] Initial cleanup: removing modal background");
                background.remove();
            }
        }

        // Wait for body to be available
        if (document.body) {
            initialCleanup();

            // Set up MutationObserver
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type !== "childList") continue;

                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            findAndRemoveModal(node);
                        }
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            // Wait for DOM to be ready
            document.addEventListener("DOMContentLoaded", () => {
                initialCleanup();

                const observer = new MutationObserver((mutationsList) => {
                    for (const mutation of mutationsList) {
                        if (mutation.type !== "childList") continue;

                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                findAndRemoveModal(node);
                            }
                        }
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            });
        }
    }

    // --- Handle SPA navigation ---
    let currentPath = window.location.pathname;

    function handleNavigation() {
        const newPath = window.location.pathname;
        if (newPath !== currentPath) {
            console.log("[Netflix Bypass] Navigation detected:", currentPath, "->", newPath);
            currentPath = newPath;

            // Re-apply appropriate logic based on new path
            if (newPath.includes(WATCH_PATH)) {
                blockGraphQLRequests();
            } else {
                hideHouseholdModal();
            }
        }
    }

    // Listen for SPA navigation (Netflix uses history API)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
        originalPushState.apply(this, args);
        handleNavigation();
    };

    history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        handleNavigation();
    };

    window.addEventListener("popstate", handleNavigation);

    // --- Initialize ---
    console.log("[Netflix Bypass] Userscript loaded on:", window.location.pathname);

    // Apply blocking immediately for /watch pages (needs to be before any requests)
    blockGraphQLRequests();

    // Set up modal hiding
    hideHouseholdModal();

})();