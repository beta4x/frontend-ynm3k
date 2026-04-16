// ==UserScript==
// @name         知识星球帖子正文添加 pre 标签
// @namespace    http://tampermonkey.net/
// @version      2026-01-20
// @description  将知识星球帖子正文用 pre 标签包裹，保持原始样式
// @author       You
// @match        https://wx.zsxq.com/group/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 配置项
    const CONFIG = {
        // 目标元素的XPath选择器
        targetXPath: "//div[@class='talk-content-container']/div[@class='content']",
        // 处理标记
        processedMark: 'myPreWrapper',
        // 防抖延迟(毫秒)
        debounceDelay: 200,
        // 监听容器选择器
        observerContainerSelector: 'div.talk-content-container'
    };

    function wrapContentWithPre() {
        // const functionName = arguments.callee.toString();
        const functionName = wrapContentWithPre.name;

        console.log(`[${functionName}] begin...`);

        let result = document.evaluate(CONFIG.targetXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        let targetElement = result.singleNodeValue;

        // 未找到目标元素则跳过（SPA 场景下元素可能尚未加载）
        if (!targetElement) return;
        // 已经是 PRE 则跳过（防御性检查）
        if (targetElement.tagName === 'PRE') return;
        // 已处理过则跳过
        if (targetElement.dataset.processedBy === CONFIG.processedMark) return;

        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-word';
        pre.style.fontFamily = 'inherit';
        pre.innerHTML = targetElement.innerHTML;
        pre.dataset.processedBy = CONFIG.processedMark;

        try {
            targetElement.parentNode.replaceChild(pre, targetElement);
            console.log(`[${functionName}] success!`);
        } catch (e) {
            console.error(`[${functionName}] failed!`, e);
        }
    }

    // 首次执行
    wrapContentWithPre();

    // 防抖 Observer，监听整个 body 以应对 SPA 动态加载
    let wrapTimeout = null;
    const observer = new MutationObserver(function () {
        // 清除之前的定时器
        if (wrapTimeout) clearTimeout(wrapTimeout);
        // 设置一个新的定时器，延迟执行
        wrapTimeout = setTimeout(wrapContentWithPre, CONFIG.debounceDelay);
    });

    // 启动监听，尽可能缩小监听范围
    const containerToObserve = document.querySelector(CONFIG.observerContainerSelector) || document.body;
    observer.observe(containerToObserve, {
        childList: true,
        subtree: true // 仍然需要subtree，因为正文可能深层嵌套
    });
})();
