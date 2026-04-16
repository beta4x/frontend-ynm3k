// ==UserScript==
// @name         知识星球帖子正文添加 pre 标签
// @namespace    http://tampermonkey.net/
// @version      2026-01-20
// @description  try to take over the world!
// @author       You
// @match        https://wx.zsxq.com/group/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 添加一个全局标记，用于防抖
    let isProcessing = false;

    function wrapContentWithPre() {
        // 保险1：如果正在处理中，直接退出，防止重叠执行
        if (isProcessing) {
            return;
        }
        isProcessing = true;

        console.log('[脚本] 执行 wrapContentWithPre');

        // 重要：此XPath需要你根据知识星球实际页面结构调整
        // 当前示例XPath意为：查找所有包含特定类的div，并且其内部包含段落(p)的容器
        let xpath = "//div[@class='talk-content-container']/div[@class='content']";
        let result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        let targetElement = result.singleNodeValue;

        // 保险2：如果没找到目标，或目标已经是PRE标签，则清理状态并退出
        if (!targetElement || targetElement.tagName === 'PRE') {
            console.log('[脚本] 未找到目标或目标已是PRE，退出');
            isProcessing = false;
            return;
        }

        // 保险3：检查该元素是否已经被我们处理过（通过自定义属性）
        if (targetElement.dataset.processedBy === 'myPreWrapper') {
            console.log('[脚本] 该元素已被处理过，退出');
            isProcessing = false;
            return;
        }

        let pre = document.createElement('pre');
        // 设置样式（略，与你原代码相同）
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-word';
        pre.style.fontFamily = 'inherit';
        pre.style.padding = '10px';
        pre.style.backgroundColor = '#f5f5f5';
        pre.style.borderLeft = '3px solid #4CAF50';

        // 将目标元素的内容和属性转移到新pre元素
        pre.innerHTML = targetElement.innerHTML;

        // 保险4：给新pre元素打上唯一标记，便于未来识别
        pre.dataset.processedBy = 'myPreWrapper';

        // 执行替换
        try {
            targetElement.parentNode.replaceChild(pre, targetElement);
            console.log('[脚本] 替换成功！');
        } catch (e) {
            console.error('[脚本] 替换失败:', e);
        }

        // 处理完成，释放锁
        isProcessing = false;
    }

    // 首次执行
    wrapContentWithPre();

    // *** 修改Observer：添加防抖 ***
    let wrapTimeout = null;
    const observer = new MutationObserver(function(mutations) {
        // 清除之前的定时器
        if (wrapTimeout) clearTimeout(wrapTimeout);
        // 设置一个新的定时器，延迟200毫秒执行
        wrapTimeout = setTimeout(wrapContentWithPre, 200);
    });

    // 启动监听，但缩小监听范围以减少触发频率
    // 假设你的目标元素在某个容器内，例如 id="app" 或 class="main"
    const containerToObserve = document.querySelector('div.talk-content-container') || document.body;
    observer.observe(containerToObserve, {
        childList: true,
        subtree: true // 仍然需要subtree，因为正文可能深层嵌套
    });
})();
