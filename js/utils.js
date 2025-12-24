/**
 * For Augenstern - Utils
 */
(function() {
    'use strict';
    
    window.Utils = {
        // =========================================================
        // DOM
        // =========================================================
        createElement: function(tag, className, innerHTML) {
            var el = document.createElement(tag);
            if (className) el.className = className;
            if (innerHTML) el.innerHTML = innerHTML;
            return el;
        },
        
        clearElement: function(el) {
            if (el) el.innerHTML = '';
        },
        
        addClass: function(el, className) {
            if (el) el.classList.add(className);
        },
        
        removeClass: function(el, className) {
            if (el) el.classList.remove(className);
        },
        
        hasClass: function(el, className) {
            return el ? el.classList.contains(className) : false;
        },
        
        // =========================================================
        // 事件绑定
        // =========================================================
        bindClick: function(el, callback) {
            if (!el) return;
            
            var handled = false;
            
            el.addEventListener('touchend', function(e) {
                e.preventDefault();
                if (!handled) {
                    handled = true;
                    callback(e);
                    setTimeout(function() { handled = false; }, 300);
                }
            }, { passive: false });
            
            el.addEventListener('click', function(e) {
                if (!handled) {
                    callback(e);
                }
            });
        },
        
        // =========================================================
        // 数学
        // =========================================================
        clamp: function(val, min, max) {
            return Math.max(min, Math.min(max, val));
        },
        
        lerp: function(a, b, t) {
            return a + (b - a) * t;
        },
        
        distance: function(x1, y1, x2, y2) {
            var dx = x2 - x1, dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        },
        
        randomRange: function(min, max) {
            return Math.random() * (max - min) + min;
        },
        
        randomInt: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        
        randomPick: function(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        },
        
        // =========================================================
        // 触觉反馈
        // =========================================================
        hapticLight: function() {
            if (navigator.vibrate) navigator.vibrate(10);
        },
        
        hapticMedium: function() {
            if (navigator.vibrate) navigator.vibrate(25);
        },
        
        hapticSuccess: function() {
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        },
        
        // =========================================================
        // 存储
        // =========================================================
        saveData: function(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (e) {
                console.warn('[Utils] 保存失败:', e);
                return false;
            }
        },
        
        loadData: function(key, defaultVal) {
            try {
                var data = localStorage.getItem(key);
                return data ? JSON.parse(data) : defaultVal;
            } catch (e) {
                console.warn('[Utils] 加载失败:', e);
                return defaultVal;
            }
        },
        
        removeData: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('[Utils] 删除失败:', e);
            }
        },
        
        // =========================================================
        // 日期
        // =========================================================
        formatDate: function(style) {
            var now = new Date();
            var y = now.getFullYear();
            var m = String(now.getMonth() + 1).padStart(2, '0');
            var d = String(now.getDate()).padStart(2, '0');
            
            if (style === 'short') {
                return y + '/' + m + '/' + d;
            }
            
            return y + '年' + m + '月' + d + '日';
        },
        
        // =========================================================
        // Canvas
        // =========================================================
        downloadCanvas: function(canvas, filename) {
            try {
                var link = document.createElement('a');
                link.download = filename || 'image.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (e) {
                console.error('[Utils] 下载失败:', e);
                alert('下载失败，请尝试截图保存');
            }
        },
        
        // =========================================================
        // 碰撞检测
        // =========================================================
        checkCollision: function(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        },
        
        isPointInRect: function(px, py, rect) {
            return px >= rect.x && px <= rect.x + rect.width &&
                   py >= rect.y && py <= rect.y + rect.height;
        },
        
        // =========================================================
        // 颜色
        // =========================================================
        hexToRgb: function(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        
        rgbToHex: function(r, g, b) {
            return '#' + [r, g, b].map(function(x) {
                var hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }
    };
    
})();
