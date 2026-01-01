// ==UserScript==
// @name         Github图片预览增强
// @name:en      Github Image Preview Plus
// @namespace    https://github.com/Re0XIAOPA/Github-Image-Preview-Plus
// @version      0.0.2
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

    // ==================== 1. 注入样式 ====================
    // 使用 insertAdjacentHTML 一次性注入所有 CSS，减少 DOM 操作
    document.head.insertAdjacentHTML('beforeend', `<style>
        /* 预览遮罩层 */
        #gh-img-preview-mask {
            position: fixed; inset: 0; background: rgba(0,0,0,0.95); backdrop-filter: blur(8px);
            z-index: 999999; display: none; align-items: center; justify-content: center;
            cursor: zoom-out; opacity: 0; transition: opacity .3s;
        }
        body.img-preview-active #gh-img-preview-mask { display: flex; opacity: 1; }

        /* 图片容器（支持拖拽和缩放） */
        #gh-img-preview-container { position: relative; cursor: move; will-change: transform; }

        /* 预览图片：自适应显示，保证完整可见 */
        #gh-img-preview-img {
            max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 8px;
            box-shadow: 0 20px 60px rgba(0,0,0,.7); opacity: 0; transition: opacity .4s;
            user-select: none; pointer-events: none;
        }
        #gh-img-preview-img.loaded { opacity: 1; }

        /* 右上角控制按钮组（下载 + 关闭） */
        #gh-img-preview-controls {
            position: fixed; top: 20px; right: 20px; display: flex; gap: 12px; z-index: 40;
        }
        #gh-img-preview-download, #gh-img-preview-close {
            width: 36px; height: 36px; background: rgba(0,0,0,.7); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            border: 2px solid rgba(255,255,255,.3); backdrop-filter: blur(4px);
            transition: all .25s;
        }
        #gh-img-preview-download:hover, #gh-img-preview-close:hover {
            transform: scale(1.15); border-color: #fff;
        }
        #gh-img-preview-close:hover { background: rgba(220,38,38,.9); }
        #gh-img-preview-controls svg { width: 18px; height: 18px; stroke: #fff; stroke-width: 2.5; fill: none; }

        /* 左右切换按钮（固定在屏幕两侧） */
        #gh-img-preview-prev, #gh-img-preview-next {
            position: fixed; top: 50%; transform: translateY(-50%);
            width: 56px; height: 56px; background: rgba(0,0,0,.6); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            opacity: .8; transition: all .25s; z-index: 30;
        }
        #gh-img-preview-prev { left: 30px; }
        #gh-img-preview-next { right: 30px; }
        #gh-img-preview-prev:hover, #gh-img-preview-next:hover {
            opacity: 1; background: rgba(0,0,0,.85); transform: translateY(-50%) scale(1.15);
        }
        #gh-img-preview-prev svg, #gh-img-preview-next svg {
            width: 30px; height: 30px; stroke: #fff; stroke-width: 3.5; fill: none;
        }
        #gh-img-preview-prev.disabled, #gh-img-preview-next.disabled { opacity: .3; cursor: not-allowed; }

        /* 移动端适配 */
        @media (max-width: 768px) {
            #gh-img-preview-controls { top: 12px; right: 12px; gap: 10px; }
            #gh-img-preview-download, #gh-img-preview-close { width: 32px; height: 32px; }
            #gh-img-preview-controls svg { width: 16px; height: 16px; }
            #gh-img-preview-prev, #gh-img-preview-next { width: 48px; height: 48px; }
            #gh-img-preview-prev { left: 15px; } #gh-img-preview-next { right: 15px; }
        }
    </style>`);

    // ==================== 2. 注入 DOM 结构 ====================
    document.body.insertAdjacentHTML('beforeend', `
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
        </div>`);

    // ==================== 3. 获取核心元素 ====================
    const mask       = document.getElementById('gh-img-preview-mask');
    const container  = document.getElementById('gh-img-preview-container');
    const img        = document.getElementById('gh-img-preview-img');
    const closeBtn   = document.getElementById('gh-img-preview-close');
    const downloadBtn= document.getElementById('gh-img-preview-download');
    const prevBtn    = document.getElementById('gh-img-preview-prev');
    const nextBtn    = document.getElementById('gh-img-preview-next');

    // ==================== 4. 状态变量 ====================
    let scale = 1, tx = 0, ty = 0;           // 缩放比例和平移量
    let dragging = false;                   // 是否正在拖拽
    let rafId = null;                       // requestAnimationFrame ID（拖拽优化用）
    let images = [];                        // 当前页面所有可预览图片数组
    let currentIdx = 0;                     // 当前预览图片索引
    let clickTimer = null;                  // 用于区分单击和双击的定时器

    // ==================== 5. 核心工具函数 ====================

    // 重置图片位置和缩放
    const reset = () => {
        scale = 1; tx = ty = 0;
        container.style.transform = 'translate(0px,0px) scale(1)';
        img.classList.remove('loaded');
    };

    // 关闭预览弹窗
    const close = () => {
        document.body.classList.remove('img-preview-active');
        document.body.style.overflow = '';
        setTimeout(reset, 300);  // 等待淡出动画完成再重置
    };

    // 下载当前预览图片
    const download = () => {
        const url = img.src;
        const name = url.split('/').pop().split('?')[0] || 'github-image.png';
        fetch(url)
            .then(r => r.blob())
            .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = name;
                a.click();
                URL.revokeObjectURL(a.href);
            });
    };

    // 更新左右切换按钮状态
    const updateNav = () => {
        prevBtn.classList.toggle('disabled', currentIdx === 0);
        nextBtn.classList.toggle('disabled', currentIdx === images.length - 1);
    };

    // 加载指定索引的图片
    const load = (idx) => {
        if (idx < 0 || idx >= images.length) return;
        currentIdx = idx;
        const el = images[idx];
        img.src = el.dataset.src || el.src;
        reset();
        img.onload = () => img.classList.add('loaded');
        updateNav();
    };

    // 打开预览（传入被点击的图片元素）
    const open = (clickedEl) => {
        // 重新收集当前页面所有可预览图片（支持动态加载）
        images = Array.from(document.querySelectorAll('.markdown-body img, .comment-body img, .blob-wrapper img'))
            .filter(el => el.src && !el.src.endsWith('.svg') && !el.closest('[data-lightbox]'));

        currentIdx = images.indexOf(clickedEl);
        if (currentIdx === -1) currentIdx = 0;

        load(currentIdx);
        document.body.classList.add('img-preview-active');
        document.body.style.overflow = 'hidden';
        updateNav();
    };

    // ==================== 6. 事件监听 ====================

    // 点击遮罩背景或关闭按钮 → 关闭预览
    mask.onclick = e => e.target === mask && close();
    closeBtn.onclick = close;

    // 下载按钮
    downloadBtn.onclick = download;

    // 左右切换
    prevBtn.onclick = () => load(currentIdx - 1);
    nextBtn.onclick = () => load(currentIdx + 1);

    // 键盘支持（Esc 关闭，左右箭头切换）
    document.onkeydown = e => {
        if (!document.body.classList.contains('img-preview-active')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') load(currentIdx - 1);
        if (e.key === 'ArrowRight') load(currentIdx + 1);
    };

    // 鼠标滚轮缩放（以鼠标位置为中心）
    container.onwheel = e => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const ox = e.clientX - rect.left - rect.width / 2;
        const oy = e.clientY - rect.top - rect.height / 2;
        const delta = e.deltaY < 0 ? 1.15 : 0.85;  // 向上滚轮放大
        const newScale = Math.max(0.3, Math.min(8, scale * delta));

        tx = e.clientX - rect.left - rect.width / 2 - (ox / scale) * newScale;
        ty = e.clientY - rect.top - rect.height / 2 - (oy / scale) * newScale;
        scale = newScale;

        container.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    };

    // 鼠标拖拽移动图片（使用 RAF 提高流畅度）
    container.onmousedown = e => {
        if (e.button !== 0) return;  // 只响应左键
        e.preventDefault();
        dragging = true;
        const startX = e.clientX - tx;
        const startY = e.clientY - ty;
        container.style.cursor = 'grabbing';

        const move = e => {
            tx = e.clientX - startX;
            ty = e.clientY - startY;
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                container.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
            });
        };

        const up = () => {
            dragging = false;
            container.style.cursor = 'move';
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    // 双击图片容器 → 复位到初始状态
    container.ondblclick = reset;

    // ==================== 7. 图片点击事件绑定 ====================
    const bind = () => {
        document.querySelectorAll('.markdown-body img, .comment-body img, .blob-wrapper img').forEach(el => {
            // 避免重复绑定、排除 SVG 和 GitHub 自带灯箱图片
            if (el.dataset.bound || el.src.endsWith('.svg') || el.closest('[data-lightbox]')) return;

            el.dataset.bound = '1';
            el.dataset.src = el.currentSrc || el.src;  // 优先使用高清 src

            el.onclick = e => {
                e.preventDefault();
                e.stopPropagation();

                // 如果短时间内点击两次 → 视为双击，跳转到原图页面
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    const link = el.closest('a');
                    window.location.href = link?.href || el.src;
                    return;
                }

                // 单击：延迟 300ms 后打开预览（给双击留出判断时间）
                clickTimer = setTimeout(() => {
                    clickTimer = null;
                    open(el);
                }, 300);
            };
        });
    };

    // ==================== 8. 动态监听新加载的图片 ====================
    new MutationObserver(bind).observe(document.body, { childList: true, subtree: true });

    // ==================== 9. 初始化 ====================
    bind();  // 页面加载完成立即绑定已有图片
})();