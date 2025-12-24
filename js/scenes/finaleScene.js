/**
 * Finale Scene - 终章
 * 倒计时照片闪回 + 漂浮相框环绕 + Merry Christmas
 */
(function() {
    'use strict';
    
    window.FinaleScene = {
        name: 'finale',
        
        // 状态
        phase: 'waiting',  // waiting, countdown, scatter, merry, complete
        time: 0,
        
        // 倒计时
        countdownNumber: 10,
        countdownTimer: 0,
        countdownInterval: 1000,  // 每秒一次
        
        // 照片闪回
        flashbackPhotos: [],
        currentPhotoIndex: 0,
        photoTransition: 0,  // 0-1 过渡进度
        prevPhotoAlpha: 1,
        currPhotoAlpha: 0,
        flashWhite: 0,
        
        // 漂浮照片
        floatingPhotos: [],
        scatterProgress: 0,
        scatterDuration: 1500,  // 飞散动画时长
        
        // 安全区（中心留白）
        safeRect: {
            x: 720 * 0.225,  // 中心55%宽
            y: 1280 * 0.275, // 中心45%高  
            width: 720 * 0.55,
            height: 1280 * 0.45
        },
        
        // 视觉效果
        snowflakes: [],
        stars: [],
        goldParticles: [],
        auroraPhase: 0,
        
        // Merry Christmas
        merryScale: 0,
        merryAlpha: 0,
        
        // 照片缓存
        photoCache: {},
        
        checkAutoTrigger: function() {
            return Date.now() >= GameConfig.FINALE_TRIGGER_TIME;
        },
        
        enter: function() {
            var self = this;
            this.time = 0;
            this.phase = 'waiting';
            this.countdownNumber = GameConfig.COUNTDOWN_START;
            this.countdownTimer = 0;
            this.currentPhotoIndex = 0;
            this.photoTransition = 0;
            this.prevPhotoAlpha = 1;
            this.currPhotoAlpha = 0;
            this.flashWhite = 0;
            this.scatterProgress = 0;
            this.merryScale = 0;
            this.merryAlpha = 0;
            this.floatingPhotos = [];
            
            this.loadFlashbackPhotos();
            this.initEffects();
            this.createUI();
            
            Input.onTap = function(x, y) { self.handleTap(x, y); };
        },
        
        exit: function() {
            Utils.clearElement(document.getElementById('ui-layer-game'));
            Utils.clearElement(document.getElementById('ui-layer-popup'));
        },
        
        loadFlashbackPhotos: function() {
            var save = Utils.loadData(GameConfig.STORAGE_KEYS.SAVE_DATA, {});
            var hungPhotos = save.hungPhotos || [];
            
            this.flashbackPhotos = [];
            
            // 添加已挂照片
            for (var i = 0; i < hungPhotos.length; i++) {
                this.flashbackPhotos.push({
                    id: hungPhotos[i].id,
                    icon: hungPhotos[i].icon,
                    title: hungPhotos[i].title,
                    src: hungPhotos[i].src,
                    frameStyle: hungPhotos[i].frameStyle || 'gold'
                });
            }
            
            // 用预置照片补齐
            var presets = GameConfig.PHOTOS;
            for (var j = 0; j < presets.length && this.flashbackPhotos.length < GameConfig.COUNTDOWN_START; j++) {
                var exists = this.flashbackPhotos.some(function(p) { 
                    return p.id === presets[j].id; 
                });
                if (!exists) {
                    this.flashbackPhotos.push({
                        id: presets[j].id,
                        icon: presets[j].icon,
                        title: presets[j].title,
                        src: presets[j].src,
                        frameStyle: presets[j].frameStyle || 'gold'
                    });
                }
            }
            
            // 预加载照片图片
            this.preloadPhotos();
            
            console.log('[Finale] Loaded', this.flashbackPhotos.length, 'photos');
        },
        
        preloadPhotos: function() {
            var self = this;
            this.flashbackPhotos.forEach(function(photo) {
                // 生成占位图作为fallback
                self.generatePlaceholderImage(photo);
                
                // 尝试加载真实图片
                if (photo.src) {
                    var img = new Image();
                    img.onload = function() {
                        self.photoCache[photo.id] = img;
                    };
                    img.onerror = function() {
                        // 保留占位图
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
            
            // 渐变背景
            var colors = photo.frameStyle === 'gold' ? 
                ['#3a2a1a', '#5a4a3a'] : ['#2a1a1a', '#4a2a2a'];
            var grad = ctx.createLinearGradient(0, 0, 200, 200);
            grad.addColorStop(0, colors[0]);
            grad.addColorStop(1, colors[1]);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 200, 200);
            
            // 图标
            ctx.font = '70px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(photo.icon, 100, 90);
            
            // 标题
            ctx.font = 'bold 18px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(photo.title, 100, 160);
            
            // 转为图片
            var img = new Image();
            img.src = canvas.toDataURL();
            this.photoCache[photo.id] = img;
        },
        
        initEffects: function() {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            // 雪花（更多、更梦幻）
            this.snowflakes = [];
            for (var i = 0; i < 120; i++) {
                this.snowflakes.push({
                    x: Utils.randomRange(0, W),
                    y: Utils.randomRange(-50, H),
                    size: Utils.randomRange(2, 7),
                    speed: Utils.randomRange(1, 3.5),
                    wobble: Utils.randomRange(0, Math.PI * 2),
                    isGold: Math.random() < 0.35
                });
            }
            
            // 星星
            this.stars = [];
            for (var j = 0; j < 100; j++) {
                this.stars.push({
                    x: Utils.randomRange(0, W),
                    y: Utils.randomRange(0, H * 0.5),
                    size: Utils.randomRange(0.8, 2.5),
                    twinkle: Utils.randomRange(0, Math.PI * 2)
                });
            }
            
            this.goldParticles = [];
        },
        
        createUI: function() {
            var self = this;
            var gameLayer = document.getElementById('ui-layer-game');
            Utils.clearElement(gameLayer);
            
            if (this.phase === 'waiting') {
                var startBtn = Utils.createElement('button', 'finale-start-btn');
                startBtn.id = 'finale-start-btn';
                startBtn.innerHTML = 
                    '<span class="finale-countdown-preview">' + this.countdownNumber + '</span>' +
                    '<span class="finale-start-text">点我开启圣诞时刻</span>';
                Utils.bindClick(startBtn, function() {
                    self.startCountdown();
                });
                gameLayer.appendChild(startBtn);
                
                var backBtn = Utils.createElement('button', 'back-btn', '←');
                Utils.bindClick(backBtn, function() {
                    Game.changeScene('hub');
                });
                gameLayer.appendChild(backBtn);
            }
        },
        
        handleTap: function(x, y) {
            if (this.phase === 'waiting') {
                this.startCountdown();
            }
        },
        
        startCountdown: function() {
            this.phase = 'countdown';
            this.countdownTimer = 0;
            this.currentPhotoIndex = 0;
            this.photoTransition = 0;
            
            Utils.clearElement(document.getElementById('ui-layer-game'));
            
            Utils.hapticMedium();
            AudioManager.playSfx('magic');
        },
        
        // =========================================================
        // 生成漂浮照片位置（在安全区外围）
        // =========================================================
        generateFloatingPositions: function() {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            var positions = [];
            var minDist = 100;  // 最小间距
            var maxAttempts = 50;
            var photoSize = 110;
            var margin = 60;
            
            for (var i = 0; i < this.flashbackPhotos.length; i++) {
                var placed = false;
                
                for (var attempt = 0; attempt < maxAttempts && !placed; attempt++) {
                    var x, y;
                    
                    // 偏向边缘和四角生成
                    var edge = Math.floor(Math.random() * 4);
                    switch (edge) {
                        case 0: // 左侧
                            x = Utils.randomRange(margin, this.safeRect.x - photoSize/2);
                            y = Utils.randomRange(margin, H - margin);
                            break;
                        case 1: // 右侧
                            x = Utils.randomRange(this.safeRect.x + this.safeRect.width + photoSize/2, W - margin);
                            y = Utils.randomRange(margin, H - margin);
                            break;
                        case 2: // 上方
                            x = Utils.randomRange(margin, W - margin);
                            y = Utils.randomRange(margin, this.safeRect.y - photoSize/2);
                            break;
                        case 3: // 下方
                            x = Utils.randomRange(margin, W - margin);
                            y = Utils.randomRange(this.safeRect.y + this.safeRect.height + photoSize/2, H - margin);
                            break;
                    }
                    
                    // 检查是否在安全区内
                    if (this.isInSafeRect(x, y, photoSize)) continue;
                    
                    // 检查与其他照片的距离
                    var tooClose = positions.some(function(pos) {
                        return Utils.distance(x, y, pos.x, pos.y) < minDist;
                    });
                    
                    if (!tooClose) {
                        positions.push({ x: x, y: y });
                        placed = true;
                    }
                }
                
                // 如果尝试失败，随机放一个
                if (!placed) {
                    positions.push({
                        x: Utils.randomRange(margin, W - margin),
                        y: Utils.randomRange(margin, H - margin)
                    });
                }
            }
            
            return positions;
        },
        
        isInSafeRect: function(x, y, size) {
            var half = size / 2;
            var sr = this.safeRect;
            return x + half > sr.x && x - half < sr.x + sr.width &&
                   y + half > sr.y && y - half < sr.y + sr.height;
        },
        
        // =========================================================
        // 初始化漂浮照片精灵
        // =========================================================
        initFloatingPhotos: function() {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            var centerX = W / 2, centerY = H / 2;
            var positions = this.generateFloatingPositions();
            
            this.floatingPhotos = [];
            
            for (var i = 0; i < this.flashbackPhotos.length && i < positions.length; i++) {
                var photo = this.flashbackPhotos[i];
                var targetPos = positions[i];
                
                this.floatingPhotos.push({
                    photo: photo,
                    // 起始位置（中心）
                    startX: centerX,
                    startY: centerY,
                    // 目标位置
                    targetX: targetPos.x,
                    targetY: targetPos.y,
                    // 当前位置
                    x: centerX,
                    y: centerY,
                    // 漂浮参数
                    vx: Utils.randomRange(-0.3, 0.3),
                    vy: Utils.randomRange(-0.2, 0.2),
                    bobPhase: Utils.randomRange(0, Math.PI * 2),
                    bobSpeed: Utils.randomRange(0.8, 1.5),
                    bobAmp: Utils.randomRange(3, 8),
                    rotation: 0,
                    targetRotation: Utils.randomRange(-0.1, 0.1),
                    rotSpeed: Utils.randomRange(-0.0005, 0.0005),
                    scale: 0.5,
                    targetScale: Utils.randomRange(0.85, 1.0),
                    alpha: 0,
                    size: Utils.randomRange(90, 130)
                });
            }
        },
        
        spawnGoldParticles: function(x, y, count) {
            for (var i = 0; i < count; i++) {
                this.goldParticles.push({
                    x: x + Utils.randomRange(-80, 80),
                    y: y + Utils.randomRange(-80, 80),
                    vx: Utils.randomRange(-4, 4),
                    vy: Utils.randomRange(-6, -1),
                    size: Utils.randomRange(3, 9),
                    life: 1
                });
            }
        },
        
        // =========================================================
        // 更新
        // =========================================================
        update: function(dt) {
            this.time += dt * 0.001;
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            // 更新雪花
            for (var i = 0; i < this.snowflakes.length; i++) {
                var s = this.snowflakes[i];
                s.y += s.speed;
                s.wobble += 0.025;
                s.x += Math.sin(s.wobble) * 0.8;
                if (s.y > H + 20) {
                    s.y = -20;
                    s.x = Utils.randomRange(0, W);
                }
            }
            
            // 更新金粉
            for (var j = this.goldParticles.length - 1; j >= 0; j--) {
                var p = this.goldParticles[j];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.08;
                p.life -= dt * 0.0008;
                if (p.life <= 0) {
                    this.goldParticles.splice(j, 1);
                }
            }
            
            this.auroraPhase += dt * 0.0004;
            
            switch (this.phase) {
                case 'countdown':
                    this.updateCountdown(dt);
                    break;
                case 'scatter':
                    this.updateScatter(dt);
                    break;
                case 'merry':
                case 'complete':
                    this.updateMerry(dt);
                    this.updateFloating(dt);
                    break;
            }
        },
        
        updateCountdown: function(dt) {
            this.countdownTimer += dt;
            
            // 照片过渡动画
            var transitionDuration = 300;  // 过渡时长
            if (this.photoTransition < 1) {
                this.photoTransition = Math.min(1, this.photoTransition + dt / transitionDuration);
                // 交叉淡入淡出
                this.prevPhotoAlpha = 1 - this.photoTransition;
                this.currPhotoAlpha = this.photoTransition;
                // 闪白效果
                this.flashWhite = Math.sin(this.photoTransition * Math.PI) * 0.3;
            }
            
            // 每秒切换
            if (this.countdownTimer >= this.countdownInterval) {
                this.countdownTimer = 0;
                this.countdownNumber--;
                
                // 切换到下一张照片
                this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.flashbackPhotos.length;
                this.photoTransition = 0;
                this.prevPhotoAlpha = 1;
                this.currPhotoAlpha = 0;
                
                this.spawnGoldParticles(GameConfig.LOGICAL_WIDTH / 2, GameConfig.LOGICAL_HEIGHT / 2, 25);
                
                AudioManager.playSfx('ding');
                Utils.hapticLight();
                
                // 倒计时结束
                if (this.countdownNumber < 0) {
                    this.phase = 'scatter';
                    this.scatterProgress = 0;
                    this.initFloatingPhotos();
                    AudioManager.playSfx('magic');
                }
            }
        },
        
        updateScatter: function(dt) {
            this.scatterProgress += dt / this.scatterDuration;
            
            // easeOutCubic
            var t = 1 - Math.pow(1 - Math.min(1, this.scatterProgress), 3);
            
            // 更新每个漂浮照片的位置
            for (var i = 0; i < this.floatingPhotos.length; i++) {
                var fp = this.floatingPhotos[i];
                fp.x = Utils.lerp(fp.startX, fp.targetX, t);
                fp.y = Utils.lerp(fp.startY, fp.targetY, t);
                fp.rotation = Utils.lerp(0, fp.targetRotation, t);
                fp.scale = Utils.lerp(0.3, fp.targetScale, t);
                fp.alpha = Math.min(1, t * 1.5);
            }
            
            // 持续生成金粉
            if (Math.random() < 0.15) {
                this.spawnGoldParticles(
                    Utils.randomRange(100, GameConfig.LOGICAL_WIDTH - 100),
                    Utils.randomRange(200, 500),
                    5
                );
            }
            
            if (this.scatterProgress >= 1) {
                this.phase = 'merry';
                this.merryScale = 0;
                this.merryAlpha = 0;
            }
        },
        
        updateFloating: function(dt) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            var margin = 50;
            
            for (var i = 0; i < this.floatingPhotos.length; i++) {
                var fp = this.floatingPhotos[i];
                
                // 漂浮运动
                fp.bobPhase += fp.bobSpeed * dt * 0.001;
                var bobY = Math.sin(fp.bobPhase) * fp.bobAmp;
                
                fp.x += fp.vx;
                fp.y += fp.vy + bobY * 0.02;
                fp.rotation += fp.rotSpeed * dt;
                
                // 边界回弹
                if (fp.x < margin || fp.x > W - margin) {
                    fp.vx *= -0.8;
                    fp.x = Utils.clamp(fp.x, margin, W - margin);
                }
                if (fp.y < margin || fp.y > H - margin) {
                    fp.vy *= -0.8;
                    fp.y = Utils.clamp(fp.y, margin, H - margin);
                }
                
                // 缓慢随机改变方向
                if (Math.random() < 0.002) {
                    fp.vx += Utils.randomRange(-0.1, 0.1);
                    fp.vy += Utils.randomRange(-0.1, 0.1);
                    fp.vx = Utils.clamp(fp.vx, -0.5, 0.5);
                    fp.vy = Utils.clamp(fp.vy, -0.4, 0.4);
                }
            }
        },
        
        updateMerry: function(dt) {
            this.merryScale = Utils.lerp(this.merryScale, 1, 0.04);
            this.merryAlpha = Utils.lerp(this.merryAlpha, 1, 0.025);
            
            // 持续生成金粉
            if (Math.random() < 0.08) {
                this.spawnGoldParticles(
                    Utils.randomRange(150, GameConfig.LOGICAL_WIDTH - 150),
                    Utils.randomRange(150, 450),
                    3
                );
            }
            
            if (this.merryAlpha > 0.95 && this.phase === 'merry') {
                this.phase = 'complete';
                this.showFinalButtons();
            }
        },
        
        showFinalButtons: function() {
            var self = this;
            var gameLayer = document.getElementById('ui-layer-game');
            
            var btnContainer = Utils.createElement('div', 'finale-buttons');
            
            var saveBtn = Utils.createElement('button', 'finale-btn', '📷 保存这一刻');
            Utils.bindClick(saveBtn, function() {
                self.saveScreenshot();
            });
            btnContainer.appendChild(saveBtn);
            
            var backBtn = Utils.createElement('button', 'finale-btn secondary', '返回');
            Utils.bindClick(backBtn, function() {
                Game.changeScene('hub');
            });
            btnContainer.appendChild(backBtn);
            
            gameLayer.appendChild(btnContainer);
        },
        
        saveScreenshot: function() {
            var canvas = document.createElement('canvas');
            canvas.width = 720;
            canvas.height = 1280;
            var ctx = canvas.getContext('2d');
            
            this.renderFinalFrame(ctx);
            
            Utils.downloadCanvas(canvas, 'merry_christmas_' + Utils.formatDate('short').replace(/\//g, '') + '.png');
            Utils.hapticSuccess();
        },
        
        // =========================================================
        // 渲染
        // =========================================================
        render: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            // 背景
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#050515');
            grad.addColorStop(0.35, '#0a0a30');
            grad.addColorStop(0.7, '#101040');
            grad.addColorStop(1, '#151550');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            
            // 星星
            this.drawStars(ctx);
            
            // 极光
            this.drawAurora(ctx);
            
            // 漂浮照片（在雪花下层）
            if (this.phase === 'scatter' || this.phase === 'merry' || this.phase === 'complete') {
                this.drawFloatingPhotos(ctx);
            }
            
            // 阶段内容
            switch (this.phase) {
                case 'waiting':
                    break;
                case 'countdown':
                    this.drawCountdownPhoto(ctx);
                    this.drawCountdownNumber(ctx);
                    break;
                case 'scatter':
                case 'merry':
                case 'complete':
                    this.drawCenterVignette(ctx);
                    this.drawMerryChristmas(ctx);
                    break;
            }
            
            // 金粉
            this.drawGoldParticles(ctx);
            
            // 雪花（最前层）
            this.drawSnowflakes(ctx);
        },
        
        drawStars: function(ctx) {
            ctx.fillStyle = '#fff';
            for (var i = 0; i < this.stars.length; i++) {
                var s = this.stars[i];
                var twinkle = 0.25 + Math.sin(this.time * 2.5 + s.twinkle) * 0.35;
                ctx.globalAlpha = Math.max(0, twinkle);
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        },
        
        drawAurora: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH;
            var colors = GameConfig.AURORA.COLORS;
            var intensity = (this.phase === 'merry' || this.phase === 'complete') ? 1.4 : 1;
            
            for (var i = 0; i < 3; i++) {
                var c = colors[i];
                var baseY = 130 + i * 55;
                
                ctx.beginPath();
                ctx.moveTo(0, baseY + 90);
                
                for (var x = 0; x <= W; x += 8) {
                    var y = baseY + Math.sin(x * 0.008 + this.auroraPhase + i * 1.8) * 35;
                    y += Math.sin(x * 0.015 + this.auroraPhase * 1.3) * 15;
                    ctx.lineTo(x, y);
                }
                for (var x2 = W; x2 >= 0; x2 -= 8) {
                    var y2 = baseY + 75 + Math.sin(x2 * 0.006 + this.auroraPhase + i * 1.8 + 1) * 25;
                    ctx.lineTo(x2, y2);
                }
                ctx.closePath();
                
                var grad = ctx.createLinearGradient(0, baseY - 40, 0, baseY + 100);
                grad.addColorStop(0, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
                grad.addColorStop(0.3, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (0.35 * intensity) + ')');
                grad.addColorStop(0.6, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (0.45 * intensity) + ')');
                grad.addColorStop(1, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
                ctx.fillStyle = grad;
                ctx.fill();
            }
        },
        
        // =========================================================
        // 倒计时照片闪回
        // =========================================================
        drawCountdownPhoto: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            var centerX = W / 2, centerY = H / 2;
            var frameWidth = 280, frameHeight = 320;
            
            // 上一张照片（淡出）
            if (this.prevPhotoAlpha > 0 && this.currentPhotoIndex > 0) {
                var prevIndex = (this.currentPhotoIndex - 1 + this.flashbackPhotos.length) % this.flashbackPhotos.length;
                ctx.globalAlpha = this.prevPhotoAlpha;
                var prevScale = 1 - (1 - this.prevPhotoAlpha) * 0.05;
                this.drawPhotoFrame(ctx, this.flashbackPhotos[prevIndex], centerX, centerY, frameWidth * prevScale, frameHeight * prevScale);
            }
            
            // 当前照片（淡入）
            if (this.currPhotoAlpha > 0) {
                ctx.globalAlpha = this.currPhotoAlpha;
                var currScale = 0.95 + this.currPhotoAlpha * 0.05;
                this.drawPhotoFrame(ctx, this.flashbackPhotos[this.currentPhotoIndex], centerX, centerY, frameWidth * currScale, frameHeight * currScale);
            }
            
            // 闪白效果
            if (this.flashWhite > 0) {
                ctx.globalAlpha = this.flashWhite;
                ctx.fillStyle = '#fff';
                ctx.fillRect(centerX - frameWidth/2 - 10, centerY - frameHeight/2 - 10, frameWidth + 20, frameHeight + 20);
            }
            
            ctx.globalAlpha = 1;
        },
        
        drawPhotoFrame: function(ctx, photo, cx, cy, w, h) {
            var halfW = w / 2, halfH = h / 2;
            var borderWidth = 8;
            var borderRadius = 12;
            
            ctx.save();
            ctx.translate(cx, cy);
            
            // 阴影
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 8;
            
            // 相框外边框
            var frameColor = photo.frameStyle === 'gold' ? '#d4a574' : '#c0392b';
            ctx.fillStyle = frameColor;
            this.roundRect(ctx, -halfW, -halfH, w, h, borderRadius);
            ctx.fill();
            
            ctx.shadowColor = 'transparent';
            
            // 内边框（照片区域）
            var innerW = w - borderWidth * 2;
            var innerH = h - borderWidth * 2 - 35;  // 留空给标题
            
            ctx.fillStyle = '#1a1a30';
            this.roundRect(ctx, -halfW + borderWidth, -halfH + borderWidth, innerW, innerH, borderRadius - 4);
            ctx.fill();
            
            // 照片或图标
            ctx.save();
            ctx.beginPath();
            this.roundRect(ctx, -halfW + borderWidth, -halfH + borderWidth, innerW, innerH, borderRadius - 4);
            ctx.clip();
            
            var img = this.photoCache[photo.id];
            if (img && img.complete && img.naturalWidth > 0) {
                this.drawImageCover(ctx, img, -halfW + borderWidth, -halfH + borderWidth, innerW, innerH);
            } else {
                // 显示图标占位
                ctx.fillStyle = '#2a2a4a';
                ctx.fillRect(-halfW + borderWidth, -halfH + borderWidth, innerW, innerH);
                ctx.font = '80px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(photo.icon, 0, -20);
            }
            ctx.restore();
            
            // 标题
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(photo.title, 0, halfH - 22);
            
            ctx.restore();
        },
        
        drawCountdownNumber: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            if (this.countdownNumber >= 0) {
                ctx.save();
                ctx.translate(W / 2, H / 2 - 220);
                
                // 脉冲效果
                var pulse = 1 + Math.sin(this.time * 8) * 0.05;
                ctx.scale(pulse, pulse);
                
                // 光晕背景
                ctx.globalAlpha = 0.6;
                var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
                glow.addColorStop(0, 'rgba(255,215,0,0.5)');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(0, 0, 80, 0, Math.PI * 2);
                ctx.fill();
                
                // 数字
                ctx.globalAlpha = 1;
                ctx.font = 'bold 100px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = 'rgba(255,215,0,0.8)';
                ctx.shadowBlur = 30;
                ctx.fillText(this.countdownNumber.toString(), 0, 0);
                
                ctx.restore();
            }
        },
        
        // =========================================================
        // 漂浮照片
        // =========================================================
        drawFloatingPhotos: function(ctx) {
            for (var i = 0; i < this.floatingPhotos.length; i++) {
                var fp = this.floatingPhotos[i];
                
                ctx.save();
                ctx.translate(fp.x, fp.y);
                ctx.rotate(fp.rotation);
                ctx.scale(fp.scale, fp.scale);
                ctx.globalAlpha = fp.alpha;
                
                this.drawFloatingFrame(ctx, fp.photo, fp.size);
                
                ctx.restore();
            }
        },
        
        drawFloatingFrame: function(ctx, photo, size) {
            var half = size / 2;
            var borderWidth = 5;
            var borderRadius = 8;
            
            // 阴影
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;
            
            // 相框
            var frameColor = photo.frameStyle === 'gold' ? '#d4a574' : '#c0392b';
            ctx.fillStyle = frameColor;
            this.roundRect(ctx, -half, -half, size, size, borderRadius);
            ctx.fill();
            
            ctx.shadowColor = 'transparent';
            
            // 照片区域
            var innerSize = size - borderWidth * 2;
            ctx.save();
            ctx.beginPath();
            this.roundRect(ctx, -half + borderWidth, -half + borderWidth, innerSize, innerSize, borderRadius - 2);
            ctx.clip();
            
            var img = this.photoCache[photo.id];
            if (img && img.complete && img.naturalWidth > 0) {
                this.drawImageCover(ctx, img, -half + borderWidth, -half + borderWidth, innerSize, innerSize);
            } else {
                ctx.fillStyle = '#2a2a4a';
                ctx.fillRect(-half + borderWidth, -half + borderWidth, innerSize, innerSize);
                ctx.font = (size * 0.4) + 'px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(photo.icon, 0, 0);
            }
            ctx.restore();
        },
        
        // =========================================================
        // 中心暗角蒙版
        // =========================================================
        drawCenterVignette: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            var sr = this.safeRect;
            var centerX = sr.x + sr.width / 2;
            var centerY = sr.y + sr.height / 2;
            var radius = Math.max(sr.width, sr.height) * 0.7;
            
            var grad = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius);
            grad.addColorStop(0, 'rgba(10,10,30,0.4)');
            grad.addColorStop(0.5, 'rgba(10,10,30,0.15)');
            grad.addColorStop(1, 'rgba(10,10,30,0)');
            
            ctx.fillStyle = grad;
            ctx.fillRect(sr.x - 50, sr.y - 50, sr.width + 100, sr.height + 100);
        },
        
        drawMerryChristmas: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH;
            var sr = this.safeRect;
            var centerX = W / 2;
            var centerY = sr.y + sr.height * 0.4;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(this.merryScale, this.merryScale);
            ctx.globalAlpha = this.merryAlpha;
            
            // 大光晕
            var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 280);
            glow.addColorStop(0, 'rgba(255,215,0,0.35)');
            glow.addColorStop(0.4, 'rgba(255,215,0,0.1)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, 280, 0, Math.PI * 2);
            ctx.fill();
            
            // Merry Christmas
            ctx.font = 'bold 52px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 阴影层
            ctx.fillStyle = 'rgba(255,120,0,0.4)';
            ctx.fillText('Merry Christmas', 3, 3);
            
            // 主文字
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = 'rgba(255,215,0,0.9)';
            ctx.shadowBlur = 35;
            ctx.fillText('Merry Christmas', 0, 0);
            
            ctx.restore();
            
            // 副标题
            if (this.merryAlpha > 0.7) {
                var subAlpha = (this.merryAlpha - 0.7) / 0.3;
                ctx.globalAlpha = subAlpha;
                ctx.font = '26px serif';
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.textAlign = 'center';
                ctx.fillText('For Augenstern ❤️', centerX, centerY + 70);
                ctx.font = '18px serif';
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(Utils.formatDate(), centerX, centerY + 105);
            }
            
            ctx.globalAlpha = 1;
        },
        
        drawSnowflakes: function(ctx) {
            for (var i = 0; i < this.snowflakes.length; i++) {
                var s = this.snowflakes[i];
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = s.isGold ? '#ffd700' : '#fff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        },
        
        drawGoldParticles: function(ctx) {
            for (var i = 0; i < this.goldParticles.length; i++) {
                var p = this.goldParticles[i];
                ctx.globalAlpha = p.life * 0.9;
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        },
        
        // =========================================================
        // 工具方法
        // =========================================================
        roundRect: function(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        },
        
        drawImageCover: function(ctx, img, x, y, w, h) {
            var imgRatio = img.naturalWidth / img.naturalHeight;
            var boxRatio = w / h;
            var sx, sy, sw, sh;
            
            if (imgRatio > boxRatio) {
                // 图片更宽，裁切两侧
                sh = img.naturalHeight;
                sw = sh * boxRatio;
                sx = (img.naturalWidth - sw) / 2;
                sy = 0;
            } else {
                // 图片更高，裁切上下
                sw = img.naturalWidth;
                sh = sw / boxRatio;
                sx = 0;
                sy = (img.naturalHeight - sh) / 2;
            }
            
            ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
        },
        
        renderFinalFrame: function(ctx) {
            // 渲染完整场景用于截图
            this.render(ctx);
        }
    };
})();
