/**
 * Tree Scene - 圣诞树装饰场景
 * 核心交互：点击礼物→预览照片→挂到树上→点击回看
 */
(function() {
    'use strict';
    
    window.TreeScene = {
        name: 'tree',
        
        // 状态
        photos: [],           // 所有照片数据
        hungPhotos: [],       // 已挂在树上的照片
        isLit: false,         // 树是否已点亮
        lightProgress: 0,     // 点亮进度 0-1
        isLighting: false,    // 正在点亮动画中
        
        // 拖拽状态
        isDragging: false,
        dragPhoto: null,      // 正在拖拽的照片
        dragX: 0,
        dragY: 0,
        nearestAnchor: null,  // 最近的锚点
        
        // 动画
        time: 0,
        snowflakes: [],
        lightBulbs: [],       // 灯泡数据
        
        // UI状态
        previewPhoto: null,   // 正在预览的照片
        viewingMemory: null,  // 正在查看的回忆
        
        // 照片缓存
        photoCache: {},
        
        // =========================================================
        // 生命周期
        // =========================================================
        enter: function() {
            var self = this;
            
            // 加载数据
            this.photos = GameConfig.PHOTOS.slice();
            var save = Utils.loadData(GameConfig.STORAGE_KEYS.SAVE_DATA, {});
            this.hungPhotos = save.hungPhotos || [];
            this.isLit = save.treeLit || false;
            this.lightProgress = this.isLit ? 1 : 0;
            
            this.time = 0;
            this.previewPhoto = null;
            this.viewingMemory = null;
            this.isDragging = false;
            this.dragPhoto = null;
            
            this.preloadPhotos();
            this.initSnowflakes();
            this.initLightBulbs();
            this.createUI();
            
            // 绑定输入
            Input.onTap = function(x, y) { self.handleTap(x, y); };
            Input.onDragStart = function(x, y) { self.handleDragStart(x, y); };
            Input.onDragMove = function(x, y) { self.handleDragMove(x, y); };
            Input.onDragEnd = function(x, y) { self.handleDragEnd(x, y); };
            
            // 触发引导
            if (typeof TutorialSystem !== 'undefined') {
                TutorialSystem.checkStep('open_gift');
            }
        },
        
        exit: function() {
            Utils.clearElement(document.getElementById('ui-layer-game'));
            Utils.clearElement(document.getElementById('ui-layer-popup'));
        },
        
        // =========================================================
        // UI 创建
        // =========================================================
        createUI: function() {
            var self = this;
            var gameLayer = document.getElementById('ui-layer-game');
            Utils.clearElement(gameLayer);
            
            // 返回按钮
            var backBtn = Utils.createElement('button', 'back-btn', '←');
            backBtn.id = 'back-btn';
            Utils.bindClick(backBtn, function() {
                Utils.hapticLight();
                Game.changeScene('hub');
            });
            gameLayer.appendChild(backBtn);
            
            // 左侧礼物列表
            var giftList = Utils.createElement('div', 'gift-list');
            giftList.id = 'gift-list';
            
            this.photos.forEach(function(photo, index) {
                var isHung = self.isPhotoHung(photo.id);
                var item = Utils.createElement('div', 'gift-item' + (isHung ? ' hung' : ''));
                item.id = 'gift-' + photo.id;
                item.dataset.id = photo.id;
                item.innerHTML = 
                    '<span class="gift-icon">' + photo.icon + '</span>' +
                    '<span class="gift-title">' + photo.title + '</span>';
                
                if (!isHung) {
                    Utils.bindClick(item, function() {
                        self.openPhotoPreview(photo);
                    });
                }
                giftList.appendChild(item);
            });
            gameLayer.appendChild(giftList);
            
            // 点亮按钮
            var lightBtn = Utils.createElement('button', 'light-btn' + (this.isLit ? ' lit' : ''));
            lightBtn.id = 'light-btn';
            lightBtn.innerHTML = this.isLit ? '✨ 已点亮' : '🎄 点亮圣诞树';
            if (!this.isLit) {
                Utils.bindClick(lightBtn, function() {
                    self.startLightCeremony();
                });
            }
            gameLayer.appendChild(lightBtn);
            
            // 提示文字
            var hint = Utils.createElement('div', 'tree-hint');
            hint.id = 'tree-hint';
            hint.textContent = '点击左侧礼物，把照片挂到树上';
            if (this.hungPhotos.length > 0) {
                hint.style.opacity = '0';
            }
            gameLayer.appendChild(hint);
        },
        
        // =========================================================
        // 照片预览弹窗
        // =========================================================
        openPhotoPreview: function(photo) {
            var self = this;
            this.previewPhoto = photo;
            
            var popupLayer = document.getElementById('ui-layer-popup');
            Utils.clearElement(popupLayer);
            
            var popup = Utils.createElement('div', 'photo-preview-popup');
            popup.id = 'photo-preview';
            
            // 照片卡片
            var card = Utils.createElement('div', 'preview-card');
            
            // 照片区域（使用placeholder或真实图片）
            var photoFrame = Utils.createElement('div', 'preview-photo-frame ' + photo.frameStyle);
            var img = new Image();
            img.className = 'preview-photo';
            img.onload = function() {
                photoFrame.appendChild(img);
            };
            img.onerror = function() {
                // 加载失败时显示emoji占位
                var placeholder = Utils.createElement('div', 'preview-placeholder');
                placeholder.innerHTML = photo.icon;
                photoFrame.appendChild(placeholder);
            };
            img.src = photo.src;
            card.appendChild(photoFrame);
            
            // 标题
            var title = Utils.createElement('h3', 'preview-title');
            title.textContent = photo.title;
            card.appendChild(title);
            
            // 回忆文字
            var message = Utils.createElement('p', 'preview-message');
            message.textContent = photo.message;
            card.appendChild(message);
            
            // 按钮区
            var buttons = Utils.createElement('div', 'preview-buttons');
            
            var hangBtn = Utils.createElement('button', 'preview-btn primary');
            hangBtn.id = 'hang-btn';
            hangBtn.textContent = '挂到树上';
            Utils.bindClick(hangBtn, function() {
                self.startDragFromPreview(photo);
            });
            buttons.appendChild(hangBtn);
            
            var closeBtn = Utils.createElement('button', 'preview-btn secondary');
            closeBtn.textContent = '关闭';
            Utils.bindClick(closeBtn, function() {
                self.closePhotoPreview();
            });
            buttons.appendChild(closeBtn);
            
            card.appendChild(buttons);
            popup.appendChild(card);
            
            // 点击背景关闭
            Utils.bindClick(popup, function(e) {
                if (e.target === popup) {
                    self.closePhotoPreview();
                }
            });
            
            popupLayer.appendChild(popup);
            
            // 动画入场
            setTimeout(function() {
                Utils.addClass(popup, 'show');
            }, 10);
            
            Utils.hapticLight();
            
            // 触发引导
            if (typeof TutorialSystem !== 'undefined') {
                TutorialSystem.checkStep('hang_photo');
            }
        },
        
        closePhotoPreview: function() {
            var popup = document.getElementById('photo-preview');
            if (popup) {
                Utils.removeClass(popup, 'show');
                setTimeout(function() {
                    popup.remove();
                }, 300);
            }
            this.previewPhoto = null;
        },
        
        // =========================================================
        // 拖拽挂件到树上
        // =========================================================
        startDragFromPreview: function(photo) {
            this.closePhotoPreview();
            
            // 创建拖拽提示
            var hint = document.getElementById('tree-hint');
            if (hint) {
                hint.textContent = '拖动照片到树上松手';
                hint.style.opacity = '1';
                Utils.addClass(hint, 'highlight');
            }
            
            // 设置拖拽状态
            this.dragPhoto = photo;
            this.dragX = 100;
            this.dragY = GameConfig.LOGICAL_HEIGHT / 2;
            this.isDragging = true;
            
            Utils.hapticMedium();
            
            // 触发引导
            if (typeof TutorialSystem !== 'undefined') {
                TutorialSystem.checkStep('drag_to_tree');
            }
        },
        
        handleTap: function(x, y) {
            // 如果正在拖拽，忽略点击
            if (this.isDragging) return;
            
            // 检查是否点击了已挂的照片
            for (var i = this.hungPhotos.length - 1; i >= 0; i--) {
                var hung = this.hungPhotos[i];
                if (Utils.distance(x, y, hung.x, hung.y) < 35) {
                    this.showMemoryCard(hung);
                    return;
                }
            }
        },
        
        handleDragStart: function(x, y) {
            if (this.dragPhoto) {
                this.dragX = x;
                this.dragY = y;
            }
        },
        
        handleDragMove: function(x, y) {
            if (this.isDragging && this.dragPhoto) {
                this.dragX = x;
                this.dragY = y;
                
                // 查找最近的锚点
                this.nearestAnchor = this.findNearestAnchor(x, y);
            }
        },
        
        handleDragEnd: function(x, y) {
            if (!this.isDragging || !this.dragPhoto) return;
            
            var bounds = GameConfig.TREE_BOUNDS;
            var inTreeArea = x >= bounds.left && x <= bounds.right && 
                            y >= bounds.top && y <= bounds.bottom;
            
            if (inTreeArea && this.nearestAnchor) {
                // 成功挂到树上
                this.placePhotoOnTree(this.dragPhoto, this.nearestAnchor);
            } else {
                // 未进入树区域，回弹
                this.cancelDrag();
            }
            
            this.isDragging = false;
            this.dragPhoto = null;
            this.nearestAnchor = null;
            
            // 恢复提示
            var hint = document.getElementById('tree-hint');
            if (hint) {
                Utils.removeClass(hint, 'highlight');
                if (this.hungPhotos.length > 0) {
                    hint.style.opacity = '0';
                } else {
                    hint.textContent = '点击左侧礼物，把照片挂到树上';
                }
            }
        },
        
        findNearestAnchor: function(x, y) {
            var anchors = GameConfig.TREE_ANCHOR_POINTS;
            var nearest = null;
            var minDist = Infinity;
            var self = this;
            
            for (var i = 0; i < anchors.length; i++) {
                var anchor = anchors[i];
                
                // 检查是否已被占用
                var occupied = this.hungPhotos.some(function(h) {
                    return Utils.distance(h.x, h.y, anchor.x, anchor.y) < 30;
                });
                if (occupied) continue;
                
                var dist = Utils.distance(x, y, anchor.x, anchor.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = anchor;
                }
            }
            
            return minDist < 100 ? nearest : null;
        },
        
        placePhotoOnTree: function(photo, anchor) {
            // 添加到已挂列表
            this.hungPhotos.push({
                id: photo.id,
                title: photo.title,
                icon: photo.icon,
                message: photo.message,
                src: photo.src,
                frameStyle: photo.frameStyle,
                x: anchor.x,
                y: anchor.y,
                swingPhase: Math.random() * Math.PI * 2
            });
            
            // 保存
            var save = Utils.loadData(GameConfig.STORAGE_KEYS.SAVE_DATA, {});
            save.hungPhotos = this.hungPhotos;
            Utils.saveData(GameConfig.STORAGE_KEYS.SAVE_DATA, save);
            
            // 更新左侧列表
            var item = document.getElementById('gift-' + photo.id);
            if (item) {
                Utils.addClass(item, 'hung');
            }
            
            AudioManager.playSfx('ding');
            Utils.hapticSuccess();
            
            // 触发引导下一步
            if (typeof TutorialSystem !== 'undefined') {
                TutorialSystem.checkStep('light_tree');
            }
        },
        
        cancelDrag: function() {
            // 显示提示
            var hint = document.getElementById('tree-hint');
            if (hint) {
                hint.textContent = '请拖到树上哦~';
                setTimeout(function() {
                    hint.textContent = '点击左侧礼物，把照片挂到树上';
                }, 1500);
            }
            Utils.hapticLight();
        },
        
        isPhotoHung: function(photoId) {
            return this.hungPhotos.some(function(h) { return h.id === photoId; });
        },
        
        // =========================================================
        // 回忆卡片（点击已挂照片）
        // =========================================================
        showMemoryCard: function(photo) {
            var self = this;
            this.viewingMemory = photo;
            
            var popupLayer = document.getElementById('ui-layer-popup');
            Utils.clearElement(popupLayer);
            
            var popup = Utils.createElement('div', 'memory-popup');
            popup.id = 'memory-popup';
            
            var card = Utils.createElement('div', 'memory-card ' + photo.frameStyle);
            
            // 照片
            var photoFrame = Utils.createElement('div', 'memory-photo-frame');
            var img = new Image();
            img.className = 'memory-photo';
            img.onload = function() { photoFrame.appendChild(img); };
            img.onerror = function() {
                var placeholder = Utils.createElement('div', 'memory-placeholder');
                placeholder.innerHTML = photo.icon;
                photoFrame.appendChild(placeholder);
            };
            img.src = photo.src;
            card.appendChild(photoFrame);
            
            // 文字
            var title = Utils.createElement('h3', 'memory-title');
            title.textContent = photo.title;
            card.appendChild(title);
            
            var message = Utils.createElement('p', 'memory-message');
            message.textContent = photo.message;
            card.appendChild(message);
            
            // 关闭按钮
            var closeBtn = Utils.createElement('button', 'memory-close');
            closeBtn.textContent = '关闭';
            Utils.bindClick(closeBtn, function() {
                self.closeMemoryCard();
            });
            card.appendChild(closeBtn);
            
            popup.appendChild(card);
            
            Utils.bindClick(popup, function(e) {
                if (e.target === popup) self.closeMemoryCard();
            });
            
            popupLayer.appendChild(popup);
            setTimeout(function() { Utils.addClass(popup, 'show'); }, 10);
            
            Utils.hapticLight();
        },
        
        closeMemoryCard: function() {
            var popup = document.getElementById('memory-popup');
            if (popup) {
                Utils.removeClass(popup, 'show');
                setTimeout(function() { popup.remove(); }, 300);
            }
            this.viewingMemory = null;
        },
        
        // =========================================================
        // 点亮仪式
        // =========================================================
        startLightCeremony: function() {
            if (this.isLit || this.isLighting) return;
            
            this.isLighting = true;
            this.lightProgress = 0;
            
            AudioManager.playSfx('magic');
            Utils.hapticSuccess();
            
            // 更新按钮
            var btn = document.getElementById('light-btn');
            if (btn) {
                btn.textContent = '✨ 点亮中...';
                Utils.addClass(btn, 'lighting');
            }
        },
        
        completeLighting: function() {
            this.isLit = true;
            this.isLighting = false;
            
            // 保存状态
            var save = Utils.loadData(GameConfig.STORAGE_KEYS.SAVE_DATA, {});
            save.treeLit = true;
            Utils.saveData(GameConfig.STORAGE_KEYS.SAVE_DATA, save);
            
            // 同步到Hub
            if (typeof HubScene !== 'undefined') {
                HubScene.isTreeLit = true;
            }
            
            // 更新按钮
            var btn = document.getElementById('light-btn');
            if (btn) {
                btn.textContent = '✨ 已点亮';
                Utils.removeClass(btn, 'lighting');
                Utils.addClass(btn, 'lit');
            }
            
            Utils.hapticSuccess();
            
            // 触发引导
            if (typeof TutorialSystem !== 'undefined') {
                TutorialSystem.checkStep('go_aurora');
            }
        },
        
        // =========================================================
        // 预加载照片
        // =========================================================
        preloadPhotos: function() {
            var self = this;
            this.photos.forEach(function(photo) {
                self.generatePlaceholderImage(photo);
                
                if (photo.src) {
                    var img = new Image();
                    img.onload = function() {
                        self.photoCache[photo.id] = img;
                    };
                    img.src = photo.src;
                }
            });
        },
        
        generatePlaceholderImage: function(photo) {
            var canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            var ctx = canvas.getContext('2d');
            
            var colors = photo.frameStyle === 'gold' ? 
                ['#3a2a1a', '#5a4a3a'] : ['#2a1a1a', '#4a2a2a'];
            var grad = ctx.createLinearGradient(0, 0, 200, 200);
            grad.addColorStop(0, colors[0]);
            grad.addColorStop(1, colors[1]);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 200, 200);
            
            ctx.font = '70px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(photo.icon, 100, 90);
            
            ctx.font = 'bold 18px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(photo.title, 100, 160);
            
            var img = new Image();
            img.src = canvas.toDataURL();
            this.photoCache[photo.id] = img;
        },
        
        // =========================================================
        // 初始化
        // =========================================================
        initSnowflakes: function() {
            this.snowflakes = [];
            for (var i = 0; i < 60; i++) {
                this.snowflakes.push({
                    x: Utils.randomRange(0, GameConfig.LOGICAL_WIDTH),
                    y: Utils.randomRange(-50, GameConfig.LOGICAL_HEIGHT),
                    size: Utils.randomRange(2, 6),
                    speed: Utils.randomRange(1, 3),
                    wobble: Utils.randomRange(0, Math.PI * 2),
                    isFront: i < 20  // 前20个是前景大雪
                });
            }
        },
        
        initLightBulbs: function() {
            this.lightBulbs = [];
            var colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc65fe', '#ff9ff3'];
            for (var i = 0; i < 60; i++) {
                var t = i / 60;
                var angle = t * Math.PI * 7;
                var radius = 30 + t * 180;
                this.lightBulbs.push({
                    x: 360 + Math.cos(angle) * radius,
                    y: 100 + t * 520,
                    color: colors[i % colors.length],
                    phase: Math.random() * Math.PI * 2,
                    size: 4 + Math.random() * 2
                });
            }
        },
        
        // =========================================================
        // 更新
        // =========================================================
        update: function(dt) {
            this.time += dt * 0.001;
            
            // 点亮动画
            if (this.isLighting) {
                this.lightProgress += dt * 0.0008;  // 约1.2秒完成
                if (this.lightProgress >= 1) {
                    this.lightProgress = 1;
                    this.completeLighting();
                }
            }
            
            // 雪花
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            for (var i = 0; i < this.snowflakes.length; i++) {
                var s = this.snowflakes[i];
                s.y += s.speed * (s.isFront ? 1.5 : 1);
                s.wobble += 0.03;
                s.x += Math.sin(s.wobble) * (s.isFront ? 1 : 0.5);
                if (s.y > H + 20) {
                    s.y = -20;
                    s.x = Utils.randomRange(0, W);
                }
            }
        },
        
        // =========================================================
        // 渲染
        // =========================================================
        render: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            // 背景
            this.drawBackground(ctx, W, H);
            
            // 背景雪（小雪）
            this.drawSnowflakes(ctx, false);
            
            // 圣诞树
            this.drawTree(ctx);
            
            // 灯串
            this.drawLights(ctx);
            
            // 已挂照片
            this.drawHungPhotos(ctx);
            
            // 拖拽中的照片
            if (this.isDragging && this.dragPhoto) {
                this.drawDraggingPhoto(ctx);
            }
            
            // 前景雪（大雪）
            this.drawSnowflakes(ctx, true);
        },
        
        drawBackground: function(ctx, W, H) {
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#0a1628');
            grad.addColorStop(0.5, '#132743');
            grad.addColorStop(1, '#1a3a5c');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            
            // 星星
            ctx.fillStyle = '#fff';
            for (var i = 0; i < 50; i++) {
                var sx = (i * 137) % W;
                var sy = (i * 73) % (H * 0.4);
                var twinkle = 0.3 + Math.sin(this.time * 2 + i) * 0.3;
                ctx.globalAlpha = twinkle;
                ctx.beginPath();
                ctx.arc(sx, sy, 1 + (i % 3), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        },
        
        drawTree: function(ctx) {
            var x = 360, y = 80;
            
            // 树干阴影
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(x, 640, 100, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 树干
            ctx.fillStyle = '#4a3728';
            ctx.fillRect(x - 25, 580, 50, 70);
            
            // 树身 - 多层三角形
            var layers = [
                { width: 80, height: 100, y: 40, darkColor: '#0f3320', lightColor: '#1a5535' },
                { width: 140, height: 110, y: 120, darkColor: '#0f3320', lightColor: '#1a5535' },
                { width: 200, height: 120, y: 210, darkColor: '#0d2d1a', lightColor: '#165a38' },
                { width: 260, height: 130, y: 310, darkColor: '#0d2d1a', lightColor: '#165a38' },
                { width: 320, height: 140, y: 420, darkColor: '#0a2515', lightColor: '#134d30' },
                { width: 380, height: 150, y: 540, darkColor: '#0a2515', lightColor: '#134d30' }
            ];
            
            for (var i = 0; i < layers.length; i++) {
                var l = layers[i];
                
                // 左侧暗部
                ctx.fillStyle = l.darkColor;
                ctx.beginPath();
                ctx.moveTo(x, y + l.y - 20);
                ctx.lineTo(x, y + l.y + l.height - 20);
                ctx.lineTo(x - l.width / 2, y + l.y + l.height - 20);
                ctx.closePath();
                ctx.fill();
                
                // 右侧亮部
                ctx.fillStyle = l.lightColor;
                ctx.beginPath();
                ctx.moveTo(x, y + l.y - 20);
                ctx.lineTo(x + l.width / 2, y + l.y + l.height - 20);
                ctx.lineTo(x, y + l.y + l.height - 20);
                ctx.closePath();
                ctx.fill();
            }
            
            // 树顶星星
            this.drawStar(ctx, x, y + 10, 25, this.isLit ? '#ffd700' : '#8b7355');
        },
        
        drawStar: function(ctx, cx, cy, size, color) {
            ctx.fillStyle = color;
            ctx.beginPath();
            for (var i = 0; i < 5; i++) {
                var angle = -Math.PI / 2 + i * Math.PI * 2 / 5;
                var angle2 = angle + Math.PI / 5;
                ctx.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
                ctx.lineTo(cx + Math.cos(angle2) * size * 0.5, cy + Math.sin(angle2) * size * 0.5);
            }
            ctx.closePath();
            ctx.fill();
            
            // 发光
            if (this.isLit || this.lightProgress > 0.8) {
                ctx.save();
                ctx.globalAlpha = 0.5 + Math.sin(this.time * 3) * 0.2;
                var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 2);
                glow.addColorStop(0, 'rgba(255,215,0,0.8)');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(cx, cy, size * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        },
        
        drawLights: function(ctx) {
            var progress = this.lightProgress;
            var visibleCount = Math.floor(this.lightBulbs.length * progress);
            
            for (var i = 0; i < this.lightBulbs.length; i++) {
                var bulb = this.lightBulbs[i];
                var isLit = i < visibleCount;
                
                // 未点亮时微弱闪烁
                if (!isLit && progress < 1) {
                    ctx.globalAlpha = 0.1 + Math.sin(this.time * 2 + bulb.phase) * 0.05;
                    ctx.fillStyle = '#555';
                    ctx.beginPath();
                    ctx.arc(bulb.x, bulb.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    continue;
                }
                
                if (!isLit) continue;
                
                // 点亮状态
                var twinkle = 0.7 + Math.sin(this.time * 3 + bulb.phase) * 0.3;
                
                // 辉光
                ctx.globalAlpha = twinkle * 0.4;
                var glow = ctx.createRadialGradient(bulb.x, bulb.y, 0, bulb.x, bulb.y, 15);
                glow.addColorStop(0, bulb.color);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(bulb.x, bulb.y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // 灯泡
                ctx.globalAlpha = twinkle;
                ctx.fillStyle = bulb.color;
                ctx.beginPath();
                ctx.arc(bulb.x, bulb.y, bulb.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        },
        
        drawHungPhotos: function(ctx) {
            for (var i = 0; i < this.hungPhotos.length; i++) {
                var photo = this.hungPhotos[i];
                var swing = Math.sin(this.time * 2 + photo.swingPhase) * 0.05;
                
                ctx.save();
                ctx.translate(photo.x, photo.y);
                ctx.rotate(swing);
                
                var frameSize = 34;
                var borderWidth = 5;
                var frameColor = photo.frameStyle === 'gold' ? '#d4a574' : '#c0392b';
                
                // 阴影
                ctx.shadowColor = 'rgba(0,0,0,0.4)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 3;
                
                // 外框
                ctx.fillStyle = frameColor;
                ctx.beginPath();
                ctx.arc(0, 0, frameSize, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.shadowColor = 'transparent';
                
                // 照片区域（圆形裁切）
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, frameSize - borderWidth, 0, Math.PI * 2);
                ctx.clip();
                
                var img = this.photoCache[photo.id];
                if (img && img.complete) {
                    var size = (frameSize - borderWidth) * 2;
                    ctx.drawImage(img, -size/2, -size/2, size, size);
                } else {
                    ctx.fillStyle = '#2a2a4a';
                    ctx.fillRect(-frameSize, -frameSize, frameSize * 2, frameSize * 2);
                    ctx.font = '22px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(photo.icon, 0, 0);
                }
                ctx.restore();
                
                ctx.restore();
            }
        },
        
        drawDraggingPhoto: function(ctx) {
            var photo = this.dragPhoto;
            var x = this.dragX, y = this.dragY;
            
            ctx.save();
            ctx.globalAlpha = 0.9;
            
            // 相框
            var frameSize = 40;
            var frameColor = photo.frameStyle === 'gold' ? '#d4a574' : '#c0392b';
            
            ctx.fillStyle = frameColor;
            ctx.beginPath();
            ctx.arc(x, y, frameSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, y, frameSize - 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.font = '32px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(photo.icon, x, y);
            
            ctx.restore();
            
            // 最近锚点高亮
            if (this.nearestAnchor) {
                ctx.strokeStyle = 'rgba(255,215,0,0.6)';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(this.nearestAnchor.x, this.nearestAnchor.y, 30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        },
        
        drawSnowflakes: function(ctx, frontOnly) {
            for (var i = 0; i < this.snowflakes.length; i++) {
                var s = this.snowflakes[i];
                if (frontOnly !== s.isFront) continue;
                
                ctx.globalAlpha = s.isFront ? 0.9 : 0.5;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.isFront ? s.size * 1.5 : s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    };
})();
