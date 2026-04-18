// ==UserScript==
// @name         知识星球复制、剪藏助手（顶呱呱版）
// @namespace    http://tampermonkey.net/
// @version      2026-04-18
// @description  功能：解除复制限制；解决用网页剪藏工具剪藏时，换行符丢失的问题。上述两项功能，列表页、详情页都支持。
// @author       beta4x
// @match        https://wx.zsxq.com/group/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zsxq.com
// @grant        none
// ==/UserScript==


(function () {
    'use strict';

    const CONFIG = {
        observerContainerSelector: 'div.topic-container, div.topic-detail-panel',
        // enable copy
        disabledCopySelector: 'div.disabled-copy',
        disabledCopyAttribute: 'disabled-copy',
        disabledCopyReplaceAttribute: 'enabled-copy',
        // wrap content with pre tag
        preTargetSelector: 'div.talk-content-container, div.answer-content-container',
        preProcessedMark: 'myPreWrapper',
        debounceDelay: 400,
        debug: false
    };

    function getObserverContainer() {
        return document.querySelector(CONFIG.observerContainerSelector) || document.body;
    }

    function getObserverContainers() {
        const containers = document.querySelectorAll(CONFIG.observerContainerSelector);
        return containers.length > 0 ? containers : [document.body];
    }

    function enableCopy(container) {
        const functionName = enableCopy.name;
        const targets = container.querySelectorAll(CONFIG.disabledCopySelector);
        targets.forEach(target => {
            target.classList.replace(CONFIG.disabledCopyAttribute, CONFIG.disabledCopyReplaceAttribute);
            if (CONFIG.debug) console.log(`[${functionName}] success!`);
        });
    }

    function wrapContentWithPre(container) {
        const functionName = wrapContentWithPre.name;
        const targets = container.querySelectorAll(CONFIG.preTargetSelector);
        targets.forEach(target => {
            if (target.firstElementChild?.tagName === 'PRE'
                && target.firstElementChild?.dataset.processedBy === CONFIG.preProcessedMark) return;

            const pre = document.createElement('pre');
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.wordBreak = 'break-word';
            pre.style.fontFamily = 'inherit';
            pre.replaceChildren(...target.childNodes);
            pre.dataset.processedBy = CONFIG.preProcessedMark;
            try {
                target.replaceChildren(pre);
                if (CONFIG.debug) console.log(`[${functionName}] success!`);
            } catch (e) {
                if (CONFIG.debug) console.error(`[${functionName}] failed!`, e);
            }
        });
    }

    function tamperContent() {
        const functionName = tamperContent.name;
        if (CONFIG.debug) console.log(`[${functionName}] begin...`);

        const containers = getObserverContainers();
        containers.forEach(container => {
            enableCopy(container);
            wrapContentWithPre(container);
        });
    }

    function debounce(fn, delay) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    const debouncedWrap = debounce(tamperContent, CONFIG.debounceDelay);
    const observer = new MutationObserver(debouncedWrap);

    function startObserver() {
        observer.disconnect();
        getObserverContainers().forEach(container => {
            // 没有设置 {attributes: true}，因此 setAttribute() 或 classList.replace() 都不会触发回调。
            observer.observe(container, { childList: true, subtree: true });
        });
    }

    tamperContent();
    startObserver();
})();
