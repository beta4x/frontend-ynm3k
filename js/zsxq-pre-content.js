// ==UserScript==
// @name         给知识星球帖子正文添加 pre 标签
// @namespace    http://tampermonkey.net/
// @version      2026-01-20
// @description  将知识星球帖子正文用 pre 标签包裹，这样在用一些网页剪藏工具剪藏时能保持原始样式。
// @author       You
// @match        https://wx.zsxq.com/group/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        observerContainerSelector: 'div.disabled-copy',
        targetSelector: 'div[class$=-content-container]',
        processedMark: 'myPreWrapper',
        debounceDelay: 200
    };

    function debounce(fn, delay) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function wrapContentWithPre() {
        const functionName = wrapContentWithPre.name;
        console.log(`[${functionName}] begin...`);
        const target = document.querySelector(CONFIG.targetSelector);
        if (!target) return;
        if (target.firstChild.tagName === 'PRE') return;
        if (target.dataset.processedBy === CONFIG.processedMark) return;

        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-word';
        pre.style.fontFamily = 'inherit';
        pre.replaceChildren(...target.childNodes);
        pre.dataset.processedBy = CONFIG.processedMark;

        try {
            target.replaceChildren(pre);
            console.log(`[${functionName}] success!`);
        } catch (e) {
            console.error(`[${functionName}] failed!`, e);
        }
    }

    const debouncedWrap = debounce(wrapContentWithPre, CONFIG.debounceDelay);

    const observer = new MutationObserver(debouncedWrap);

    function startObserver() {
        observer.disconnect();
        const container = document.querySelector(CONFIG.observerContainerSelector) || document.body;
        observer.observe(container, { childList: true, subtree: true });
    }

    wrapContentWithPre();
    startObserver();
})();