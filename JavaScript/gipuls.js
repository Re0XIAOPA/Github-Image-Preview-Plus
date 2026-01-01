// ==UserScript==
// @name         Github图片预览增强
// @name:en      Github Image Preview Plus
// @namespace    https://github.com/Re0XIAOPA/Github-Image-Preview-Plus
// @version      1.0.0
// @description  单击丝滑预览（完整自适应显示图片/缩放/拖拽/左右切换/下载）；双击跳转原图页面；移除全屏功能
// @author       Re0XIAOPA
// @license      MIT
// @match        *://github.com/*
// @grant        none
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDEuMEM1LjkyMyAxIDEgNS45MjMgMSAxMmMwIDQuODY3IDMuMTQ5IDguOTc5IDcuNTIxIDEwLjQzNi41NS4wOTYuNzU2LS4yMzMuNzU2LS41MjIgMC0uMjYyLS4wMTMtMS4xMjgtLjAxMy0yLjA0OS0yLjc2NC41MDktMy40NzktLjY3NC0zLjY5OS0xLjI5Mi0uMTI0LS4zMTctLjY2LTEuMjkzLTEuMTI3LTEuNTU0LS4zODUtLjIwNy0uOTM2LS43MTUtLjAxNC0uNzI5Ljg2Ni0uMDE0IDEuNDg1Ljc5NyAxLjY5MSAxLjEyOC45OSAxLjY2MyAyLjU3MSAxLjE5NiAzLjIwNC45MDcuMDk2LS43MTUuMzg1LTEuMTk2LjcwMS0xLjQ3MS0yLjQ0OC0uMjc1LTUuMDA1LTEuMjI0LTUuMDA1LTUuNDMyIDAtMS4xOTYuNDI2LTIuMTg2IDEuMTI4LTIuOTU2LS4xMTEtLjI3NS0uNDk2LTEuNDAyLjExLTIuOTE1IDAgMCAuOTIxLS4yODggMy4wMjQgMS4xMjhhMTAuMTkzIDEwLjE5MyAwIDAgMSAyLjc1LS4zNzFjLjkzNiAwIDEuODcxLjEyMyAyLjc1LjM3MSAyLjEwNC0xLjQzIDMuMDI1LTEuMTI4IDMuMDI1LTEuMTI4LjYwNSAxLjUxMy4yMjEgMi42NC4xMSAyLjkxNS43MDEuNzcgMS4xMjcgMS43NDcgMS4xMjcgMi45NTYgMCA0LjIyMi0yLjU3MSA1LjE1Ny01LjAxOSA1LjQzMi4zOTkuMzQ0Ljc0MyAxLjAwNC43NDMgMi4wMzUgMCAxLjQ3MS0uMDE0IDIuNjU0LS4wMTQgMy4wMjUgMCAuMjg5LjIwNi42MzIuNzU2LjUyMkMxOS44NTEgMjAuOTc5IDIzIDE2Ljg1NCAyMyAxMmMwLTYuMDc3LTQuOTIyLTExLTExLTExWiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPg==
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 样式 ====================
    const style = document.createElement('style');
    style.textContent = `
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
        body.img-preview-active #gh-img-preview-mask {
            display: flex;
            opacity: 1;
        }

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
        #gh-img-preview-download:hover, #gh-img-preview-close:hover {
            transform: scale(1.15);
            border-color: white;
        }
        #gh-img-preview-close:hover {
            background: rgba(220,38,38,0.9);
        }
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
        #gh-img-preview-prev { left: 30px; }
        #gh-img-preview-next { right: 30px; }
        #gh-img-preview-prev:hover, #gh-img-preview-next:hover {
            opacity: 1;
            background: rgba(0,0,0,0.85);
            transform: translateY(-50%) scale(1.15);
        }
        #gh-img-preview-prev svg, #gh-img-preview-next svg {
            width: 30px;
            height: 30px;
            stroke: white;
            stroke-width: 3.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
        }
        #gh-img-preview-prev.disabled, #gh-img-preview-next.disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

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

    // ==================== DOM ====================
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

    const mask = document.getElementById('gh-img-preview-mask');
    const container = document.getElementById('gh-img-preview-container');
    const imgEl = document.getElementById('gh-img-preview-img');
    const closeBtn = document.getElementById('gh-img-preview-close');
    const downloadBtn = document.getElementById('gh-img-preview-download');
    const prevBtn = document.getElementById('gh-img-preview-prev');
    const nextBtn = document.getElementById('gh-img-preview-next');

    let scale = 1, tx = 0, ty = 0, dragging = false, startX, startY;
    let currentImages = [], currentIndex = 0;
    let clickTimer = null;

    function resetTransform() {
        scale = 1; tx = ty = 0;
        container.style.transform = 'translate(0px,0px) scale(1)';
        imgEl.classList.remove('loaded');
    }

    function closePreview() {
        document.body.classList.remove('img-preview-active');
        document.body.style.overflow = '';
        setTimeout(resetTransform, 300);
    }

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

    function updateButtons() {
        prevBtn.classList.toggle('disabled', currentIndex <= 0);
        nextBtn.classList.toggle('disabled', currentIndex >= currentImages.length - 1);
    }

    function loadImageByIndex(idx) {
        if (idx < 0 || idx >= currentImages.length) return;
        currentIndex = idx;
        const src = currentImages[idx].dataset.previewSrc || currentImages[idx].src;
        imgEl.src = src;
        resetTransform();
        imgEl.onload = () => imgEl.classList.add('loaded');
        updateButtons();
    }

    function openPreview(clickedImg) {
        currentImages = Array.from(document.querySelectorAll('.markdown-body img, .comment-body img, .blob-wrapper img'))
            .filter(el => !el.src.endsWith('.svg') && !el.closest('[data-lightbox]') && el.src);

        currentIndex = currentImages.indexOf(clickedImg);
        if (currentIndex === -1) currentIndex = 0;

        loadImageByIndex(currentIndex);
        document.body.classList.add('img-preview-active');
        document.body.style.overflow = 'hidden';
        updateButtons();
    }

    function bindImages() {
        document.querySelectorAll('.markdown-body img, .comment-body img, .blob-wrapper img').forEach(el => {
            if (el.dataset.previewBound || el.src.endsWith('.svg') || el.closest('[data-lightbox]')) return;

            el.dataset.previewBound = 'true';
            el.dataset.previewSrc = el.currentSrc || el.src;

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

    // ==================== 事件 ====================
    mask.addEventListener('click', e => e.target === mask && closePreview());
    closeBtn.addEventListener('click', closePreview);
    downloadBtn.addEventListener('click', downloadImage);
    prevBtn.addEventListener('click', () => loadImageByIndex(currentIndex - 1));
    nextBtn.addEventListener('click', () => loadImageByIndex(currentIndex + 1));

    document.addEventListener('keydown', e => {
        if (!document.body.classList.contains('img-preview-active')) return;
        if (e.key === 'Escape') closePreview();
        if (e.key === 'ArrowLeft') loadImageByIndex(currentIndex - 1);
        if (e.key === 'ArrowRight') loadImageByIndex(currentIndex + 1);
    });

    // 缩放（以鼠标为中心）
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

    // 拖拽
    container.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        e.preventDefault();
        dragging = true;
        startX = e.clientX - tx;
        startY = e.clientY - ty;
        container.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        tx = e.clientX - startX;
        ty = e.clientY - startY;
        container.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    });

    document.addEventListener('mouseup', () => {
        if (dragging) {
            dragging = false;
            container.style.cursor = 'move';
        }
    });

    // 双击复位
    container.addEventListener('dblclick', () => {
        scale = 1; tx = ty = 0;
        container.style.transform = 'translate(0px,0px) scale(1)';
    });

    // ==================== 初始化 ====================
    const observer = new MutationObserver(bindImages);
    observer.observe(document.body, { childList: true, subtree: true });
    bindImages();

})();