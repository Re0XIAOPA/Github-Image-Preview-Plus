// ==UserScript==
// @name         Github图片预览增强
// @name:en      Github Image Preview Plus
// @namespace    https://github.com/Re0XIAOPA/Github-Image-Preview-Plus
// @version      0.0.1
// @description  单击丝滑预览（完整自适应显示图片/缩放/拖拽/左右切换/下载）；双击跳转原图页面；移除全屏功能
// @author       Re0XIAOPA
// @license      MIT
// @match        *://github.com/*
// @grant        none
// @tag          Github
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDEuMEM1LjkyMyAxIDEgNS45MjMgMSAxMmMwIDQuODY3IDMuMTQ5IDguOTc5IDcuNTIxIDEwLjQzNi41NS4wOTYuNzU2LS4yMzMuNzU2LS41MjIgMC0uMjYyLS4wMTMtMS4xMjgtLjAxMy0yLjA0OS0yLjc2NC41MDktMy40NzktLjY3NC0zLjY5OS0xLjI5Mi0uMTI0LS4zMTctLjY2LTEuMjkzLTEuMTI3LTEuNTU0LS4zODUtLjIwNy0uOTM2LS43MTUtLjAxNC0uNzI5Ljg2Ni0uMDE0IDEuNDg1Ljc5NyAxLjY5MSAxLjEyOC45OSAxLjY2MyAyLjU3MSAxLjE5NiAzLjIwNC45MDcuMDk2LS43MTUuMzg1LTEuMTk2LjcwMS0xLjQ3MS0yLjQ0OC0uMjc1LTUuMDA1LTEuMjI0LTUuMDA1LTUuNDMyIDAtMS4xOTYuNDI2LTIuMTg2IDEuMTI4LTIuOTU2LS4xMTEtLjI3NS0uNDk2LTEuNDAyLjExLTIuOTE1IDAgMCAuOTIxLS4yODggMy4wMjQgMS4xMjhhMTAuMTkzIDEwLjE5MyAwIDAgMSAyLjc1LS4zNzFjLjkzNiAwIDEuODcxLjEyMyAyLjc1LjM3MSAyLjEwNC0xLjQzIDMuMDI1LTEuMTI4IDMuMDI1LTEuMTI4LjYwNSAxLjUxMy4yMjEgMi42NC4xMSAyLjkxNS43MDEuNzcgMS4xMjcgMS43NDcgMS4xMjcgMi45NTYgMCA0LjIyMi0yLjU3MSA1LjE1Ny01LjAxOSA1LjQzMi4zOTkuMzQ0Ljc0MyAxLjAwNC43NDMgMi4wMzUgMCAxLjQ3MS0uMDE0IDIuNjU0LS4wMTQgMy4wMjUgMCAuMjg5LjIwNi42MzIuNzU2LjUyMkMxOS44NTEgMjAuOTc5IDIzIDE2Ljg1NCAyMyAxMmMwLTYuMDc3LTQuOTIyLTExLTExLTExWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPg==
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 样式 ====================
    // 动态创建并添加预览相关的CSS样式
    const style = document.createElement('style');
    style.textContent = `
        // 图片预览遮罩层样式 - 全屏黑色半透明背景
        #gh-img-preview-mask {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.95);
            backdrop-filter: blur(8px);
            z-index: 999999;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: zoom-out;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        // 激活预览时的遮罩层样式
        body.img-preview-active #gh-img-preview-mask {
            display: flex;
            opacity: 1;
        }

        // 图片容器样式 - 用于缩放和拖拽变换
        #gh-img-preview-container {
            position: relative;
            cursor: move;
            will-change: transform;
        }

        /* 图片自适应：完整显示在屏幕内，不裁剪 */
        #gh-img-preview-img {
            max-width: 90vw;
            max-height: 90vh;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.7);
            opacity: 0;
            transition: opacity 0.4s ease;
            user-select: none;
            pointer-events: none;
        }
        // 图片加载完成后的样式
        #gh-img-preview-img.loaded {
            opacity: 1;
        }

        /* 右上角控制按钮：下载 + 关闭 */
        #gh-img-preview-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 12px;
            z-index: 40;
        }
        // 下载和关闭按钮基础样式
        #gh-img-preview-download, #gh-img-preview-close {
            width: 36px;
            height: 36px;
            background: rgba(0,0,0,0.7);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.25s ease;
            border: 2px solid rgba(255,255,255,0.3);
            backdrop-filter: blur(4px);
        }
        // 按钮悬停效果
        #gh-img-preview-download:hover, #gh-img-preview-close:hover {
            transform: scale(1.15);
            border-color: white;
        }
        // 关闭按钮悬停时的特殊样式
        #gh-img-preview-close:hover {
            background: rgba(220,38,38,0.9);
        }
        // SVG图标的样式
        #gh-img-preview-controls svg {
            width: 18px;
            height: 18px;
            stroke: white;
            stroke-width: 2.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
        }

        /* 左右切换按钮：固定在屏幕两侧 */
        #gh-img-preview-prev, #gh-img-preview-next {
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            width: 56px;
            height: 56px;
            background: rgba(0,0,0,0.6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.25s ease;
            opacity: 0.8;
            z-index: 30;
        }
        // 左右按钮位置
        #gh-img-preview-prev { left: 30px; }
        #gh-img-preview-next { right: 30px; }
        // 左右按钮悬停效果
        #gh-img-preview-prev:hover, #gh-img-preview-next:hover {
            opacity: 1;
            background: rgba(0,0,0,0.85);
            transform: translateY(-50%) scale(1.15);
        }
        // 左右切换按钮SVG图标样式
        #gh-img-preview-prev svg, #gh-img-preview-next svg {
            width: 30px;
            height: 30px;
            stroke: white;
            stroke-width: 3.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
        }
        // 禁用状态的按钮样式
        #gh-img-preview-prev.disabled, #gh-img-preview-next.disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        // 移动端适配样式
        @media (max-width: 768px) {
            #gh-img-preview-controls { top: 12px; right: 12px; gap: 10px; }
            #gh-img-preview-download, #gh-img-preview-close {
                width: 32px; height: 32px;
            }
            #gh-img-preview-controls svg { width: 16px; height: 16px; }
            #gh-img-preview-prev, #gh-img-preview-next { width: 48px; height: 48px; }
            #gh-img-preview-prev { left: 15px; }
            #gh-img-preview-next { right: 15px; }
        }
    `;
    document.head.appendChild(style);

    // ==================== DOM元素创建 ====================
    // 创建预览界面的HTML结构
    const overlayHTML = `
        <div id="gh-img-preview-mask">
            <div id="gh-img-preview-container">
                <img id="gh-img-preview-img" alt="预览图片">
            </div>
            <div id="gh-img-preview-controls">
                <div id="gh-img-preview-download" title="下载图片">
                    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                </div>
                <div id="gh-img-preview-close" title="关闭 (Esc)">
                    <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>
            </div>
            <div id="gh-img-preview-prev" title="上一张 (←)"><svg viewBox="0 0 24 24"><line x1="15" y1="18" x2="9" y2="12"/><line x1="15" y1="6" x2="9" y2="12"/></svg></div>
            <div id="gh-img-preview-next" title="下一张 (→)"><svg viewBox="0 0 24 24"><line x1="9" y1="18" x2="15" y2="12"/><line x1="9" y1="6" x2="15" y2="12"/></svg></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlayHTML);

    // 获取DOM元素引用
    const mask = document.getElementById('gh-img-preview-mask');
    const container = document.getElementById('gh-img-preview-container');
    const imgEl = document.getElementById('gh-img-preview-img');
    const closeBtn = document.getElementById('gh-img-preview-close');
    const downloadBtn = document.getElementById('gh-img-preview-download');
    const prevBtn = document.getElementById('gh-img-preview-prev');
    const nextBtn = document.getElementById('gh-img-preview-next');

    // ==================== 状态变量 ====================
    // 图片变换相关变量
    let scale = 1, tx = 0, ty = 0; // 缩放比例和位置偏移
    let dragging = false, startX, startY; // 拖拽状态
    let currentImages = [], currentIndex = 0; // 当前页面图片列表和索引
    let clickTimer = null; // 用于区分单击和双击的计时器

    // ==================== 核心功能函数 ====================
    // 重置图片变换状态（缩放和位置）
    function resetTransform() {
        scale = 1; tx = ty = 0;
        container.style.transform = 'translate(0px,0px) scale(1)';
        imgEl.classList.remove('loaded');
    }

    // 关闭预览功能
    function closePreview() {
        document.body.classList.remove('img-preview-active');
        document.body.style.overflow = '';
        setTimeout(resetTransform, 300);
    }

    // 下载当前预览图片
    function downloadImage() {
        const src = imgEl.src;
        const filename = src.split('/').pop().split('?')[0] || 'github-image.png';
        fetch(src).then(res => res.blob()).then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    }

    // 更新左右切换按钮的可用状态
    function updateButtons() {
        prevBtn.classList.toggle('disabled', currentIndex <= 0);
        nextBtn.classList.toggle('disabled', currentIndex >= currentImages.length - 1);
    }

    // 根据索引加载指定图片
    function loadImageByIndex(idx) {
        if (idx < 0 || idx >= currentImages.length) return;
        currentIndex = idx;
        const src = currentImages[idx].dataset.previewSrc || currentImages[idx].src;
        imgEl.src = src;
        resetTransform();
        imgEl.onload = () => imgEl.classList.add('loaded');
        updateButtons();
    }

    // 打开图片预览功能
    function openPreview(clickedImg) {
        // 获取当前页面所有有效的图片元素
        currentImages = Array.from(document.querySelectorAll('.markdown-body img, .comment-body img, .blob-wrapper img'))
            .filter(el => !el.src.endsWith('.svg') && !el.closest('[data-lightbox]') && el.src);

        // 确定当前点击图片在图片列表中的索引
        currentIndex = currentImages.indexOf(clickedImg);
        if (currentIndex === -1) currentIndex = 0;

        // 加载并显示当前图片
        loadImageByIndex(currentIndex);
        document.body.classList.add('img-preview-active');
        document.body.style.overflow = 'hidden';
        updateButtons();
    }

    // 为页面上的图片绑定点击事件
    function bindImages() {
        document.querySelectorAll('.markdown-body img, .comment-body img, .blob-wrapper img').forEach(el => {
            // 跳过已绑定事件的图片、SVG图片和已包含lightbox的图片
            if (el.dataset.previewBound || el.src.endsWith('.svg') || el.closest('[data-lightbox]')) return;

            // 标记图片为已绑定
            el.dataset.previewBound = 'true';
            el.dataset.previewSrc = el.currentSrc || el.src;

            // 绑定点击事件，实现单击预览、双击跳转功能
            el.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    // 双击：跳转到原生图片页面
                    const a = el.closest('a');
                    if (a && a.href) window.location.href = a.href;
                    else if (el.src) window.location.href = el.src;
                    return;
                }

                clickTimer = setTimeout(() => {
                    clickTimer = null;
                    openPreview(el); // 单击：自定义预览
                }, 300);
            });
        });
    }

    // ==================== 事件监听 ====================
    // 遮罩层点击关闭预览
    mask.addEventListener('click', e => e.target === mask && closePreview());
    closeBtn.addEventListener('click', closePreview);
    downloadBtn.addEventListener('click', downloadImage);
    prevBtn.addEventListener('click', () => loadImageByIndex(currentIndex - 1));
    nextBtn.addEventListener('click', () => loadImageByIndex(currentIndex + 1));

    // 键盘事件监听
    document.addEventListener('keydown', e => {
        if (!document.body.classList.contains('img-preview-active')) return;
        if (e.key === 'Escape') closePreview();
        if (e.key === 'ArrowLeft') loadImageByIndex(currentIndex - 1);
        if (e.key === 'ArrowRight') loadImageByIndex(currentIndex + 1);
    });

    // 鼠标滚轮缩放功能（以鼠标为中心）
    container.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const ox = e.clientX - (rect.left + rect.width / 2);
        const oy = e.clientY - (rect.top + rect.height / 2);
        const factor = e.deltaY < 0 ? 1.15 : 0.85;
        const newScale = Math.max(0.3, Math.min(8, scale * factor));
        tx = e.clientX - (rect.left + rect.width / 2) - (ox / scale) * newScale;
        ty = e.clientY - (rect.top + rect.height / 2) - (oy / scale) * newScale;
        scale = newScale;
        container.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }, { passive: false });

    // 图片拖拽功能
    container.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        e.preventDefault();
        dragging = true;
        startX = e.clientX - tx;
        startY = e.clientY - ty;
        container.style.cursor = 'grabbing';
    });

    // 拖拽过程中的位置更新
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        tx = e.clientX - startX;
        ty = e.clientY - startY;
        container.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    });

    // 结束拖拽
    document.addEventListener('mouseup', () => {
        if (dragging) {
            dragging = false;
            container.style.cursor = 'move';
        }
    });

    // 双击复位功能（重置缩放和位置）
    container.addEventListener('dblclick', () => {
        scale = 1; tx = ty = 0;
        container.style.transform = 'translate(0px,0px) scale(1)';
    });

    // ==================== 初始化 ====================
    // 使用MutationObserver监听DOM变化，动态为新添加的图片绑定事件
    const observer = new MutationObserver(bindImages);
    observer.observe(document.body, { childList: true, subtree: true });
    bindImages(); // 初始绑定页面上已存在的图片

})();