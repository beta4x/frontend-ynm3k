// ==UserScript==
// @name         知识星球复制、剪藏助手（顶呱呱版）
// @namespace    http://tampermonkey.net/
// @version      2026-04-20
// @description  功能：解除复制限制；解决用网页剪藏工具剪藏时，换行符丢失的问题。上述两项功能，列表页、详情页都支持。
// @author       beta4x
// @license      AGPL-3.0-only; https://www.gnu.org/licenses/agpl-3.0.en.html
// @copyright    2026, beta4x (https://github.com/beta4x)
// @match        https://wx.zsxq.com/group/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zsxq.com
// @grant        none
// ==/UserScript==

// GitHub
// 项目地址：https://github.com/beta4x/frontend-ynm3k/blob/main/js/zsxq-tamper-content.js
// 使用帮助：https://github.com/beta4x/frontend-ynm3k/blob/main/md/zsxq-tamper-content.md


(function () {
    'use strict';

    const CONFIG = {
        observerContainerSelector: 'body',
        targetAncestorSelector: 'div.topic-container, div.topic-detail-panel',
        // enable copy
        disabledCopySelector: 'div.disabled-copy',
        disabledCopyClassName: 'disabled-copy',
        enabledCopyClassName: 'enabled-copy',
        // wrap content with pre tag
        preTargetSelector: 'div.talk-content-container, div.answer-content-container',
        preStyleId: 'zsxq-content-pre-style',
        preStyleClass: 'content-pre-wrapper',
        debounceDelay: 400,
        debug: false
    };

    function injectStyle() {
        if (document.getElementById(CONFIG.preStyleId)) return;
        const style = document.createElement('style');
        style.id = CONFIG.preStyleId;
        style.textContent = `
.${CONFIG.enabledCopyClassName} {
    user-select: auto !important;
    -webkit-user-select: auto !important;
}

pre.${CONFIG.preStyleClass} {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    margin: 0;
}
`.trim();
        document.head.appendChild(style);
    }

    function getSelectorContainer(selector) {
        return document.querySelector(selector) || document.body;
    }

    function getSelectorContainers(selector) {
        const containers = document.querySelectorAll(selector);
        return containers.length > 0 ? containers : [document.body];
    }

    function debugLog(logLevel, fnName, message) {
        const method = console[logLevel] || console.log;
        if (CONFIG.debug) method(`[${fnName}] ${message}`);
    }

    // 知识星球是否允许复制，是由星主设置的；如果本来就允许复制，不会真正执行 class name 替换操作。
    function enableCopy(container) {
        const fnName = enableCopy.name;
        const target = container.querySelector(CONFIG.disabledCopySelector);
        if (target) {
            target.classList.replace(CONFIG.disabledCopyClassName, CONFIG.enabledCopyClassName);
            debugLog('log', fnName, 'success!');
        }
    }

    function wrapContentWithPre(container) {
        const fnName = wrapContentWithPre.name;
        const target = container.querySelector(CONFIG.preTargetSelector);
        if (target) {
            if (target.childNodes.length === 0 || (target.firstElementChild?.tagName === 'PRE' && target.firstElementChild?.classList.contains(CONFIG.preStyleClass))) return;
            try {
                const pre = document.createElement('pre');
                pre.classList.add(CONFIG.preStyleClass);
                pre.replaceChildren(...target.childNodes);
                target.replaceChildren(pre);
                debugLog('log', fnName, 'success!');
            } catch (e) {
                debugLog('error', fnName, `failed! ${e.message}`);
            }
        }
    }

    function tamperContent() {
        const fnName = tamperContent.name;
        debugLog('log', fnName, 'begin...');

        // 先找到 target ancestor container，再找到 target container。能提高性能，但也可能属于过度设计。
        const containers = getSelectorContainers(CONFIG.targetAncestorSelector);
        containers.forEach(container => {
            enableCopy(container);
            wrapContentWithPre(container);
        });
    }

    let observer = null;
    function safeTamperContent() {
        observer?.disconnect();
        try {
            tamperContent();
        } finally {
            startObserver();
        }
    }

    function debounce(fn, delay) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        }
    }

    const debouncedTamperContent = debounce(safeTamperContent, CONFIG.debounceDelay);
    observer = new MutationObserver(debouncedTamperContent);

    function startObserver() {
        observer.disconnect();
        const observerContainer = getSelectorContainer(CONFIG.observerContainerSelector);
        // 没有设置 {attributes: true}，因此 setAttribute() 或 classList.replace() 都不会触发回调。
        observer.observe(observerContainer, { childList: true, subtree: true });
    }

    injectStyle();
    safeTamperContent();
})();
