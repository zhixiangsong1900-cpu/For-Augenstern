/**
 * Aurora Scene - 极光观赏场景
 * 柔和、流动、带状、多层、颜色渐变
 */
(function() {
    'use strict';
    
    window.AuroraScene = {
        name: 'aurora',
        time: 0,
        auroraBands: [],
        stars: [],
        clickStars: [],
        wishText: '',
        auroraIntensity: 1,
        
        enter: function() {
            var self = this;
            this.time = 0;
            this.clickStars = [];
            this.wishText = '';
            this.initAurora();
            this.initStars();
            this.createUI();
            
            Input.onTap = function(x, y) { self.handleTap(x, y); };
        },
        
        exit: function() {
            Utils.clearElement(document.getElementById('ui-layer-game'));
        },
        
        createUI: function() {
            var self = this;
            var gameLayer = document.getElementById('ui-layer-game');
            Utils.clearElement(gameLayer);
            
            // 返回按钮
            var backBtn = Utils.createElement('button', 'back-btn', '←');
            Utils.bindClick(backBtn, function() {
                Utils.hapticLight();
                Game.changeScene('hub');
            });
            gameLayer.appendChild(backBtn);
            
            // 星星计数
            var starCount = Utils.createElement('div', 'star-count');
            starCount.id = 'star-count';
            starCount.innerHTML = '⭐ <span id="star-num">0</span>';
            gameLayer.appendChild(starCount);
            
            // 底部面板
            var bottomPanel = Utils.createElement('div', 'aurora-bottom');
            
            var wishInput = Utils.createElement('input', 'wish-input');
            wishInput.type = 'text';
            wishInput.placeholder = '写下你的愿望...';
            wishInput.maxLength = 30;
            wishInput.addEventListener('input', function(e) { 
                self.wishText = e.target.value; 
            });
            bottomPanel.appendChild(wishInput);
            
            var postcardBtn = Utils.createElement('button', 'postcard-btn', '生成明信片');
            Utils.bindClick(postcardBtn, function() { 
                self.generatePostcard(); 
            });
            bottomPanel.appendChild(postcardBtn);
            
            gameLayer.appendChild(bottomPanel);
            
            // 提示
            var hint = Utils.createElement('div', 'aurora-hint');
            hint.textContent = '点击天空创造星光';
            gameLayer.appendChild(hint);
            setTimeout(function() { hint.style.opacity = '0'; }, 3000);
        },
        
        initAurora: function() {
            this.auroraBands = [];
            var cfg = GameConfig.AURORA;
            
            for (var i = 0; i < cfg.LAYERS; i++) {
                this.auroraBands.push({
                    baseY: 120 + i * 70,
                    amplitude: cfg.WAVE_AMPLITUDE * (1 - i * 0.15),
                    frequency1: 0.004 + i * 0.001,
                    frequency2: 0.008 + i * 0.002,
                    phase1: Utils.randomRange(0, Math.PI * 2),
                    phase2: Utils.randomRange(0, Math.PI * 2),
                    speed1: cfg.WAVE_SPEED * (1 + i * 0.2),
                    speed2: cfg.WAVE_SPEED * 0.7 * (1 + i * 0.1),
                    color: cfg.COLORS[i],
                    height: 80 - i * 10,
                    verticalOffset: 0
                });
            }
        },
        
        initStars: function() {
            this.stars = [];
            var W = GameConfig.LOGICAL_WIDTH;
            for (var i = 0; i < 120; i++) {
                this.stars.push({
                    x: Utils.randomRange(0, W),
                    y: Utils.randomRange(0, 550),
                    size: Utils.randomRange(0.5, 2.5),
                    twinkleSpeed: Utils.randomRange(1, 4),
                    twinklePhase: Utils.randomRange(0, Math.PI * 2)
                });
            }
        },
        
        handleTap: function(x, y) {
            // 只在天空区域响应
            if (y > 750) return;
            
            // 创建星光粒子
            for (var i = 0; i < 5; i++) {
                this.clickStars.push({
                    x: x + Utils.randomRange(-20, 20),
                    y: y + Utils.randomRange(-20, 20),
                    size: Utils.randomRange(8, 15),
                    life: 1,
                    vy: Utils.randomRange(-2, -0.5),  // 向上飘
                    vx: Utils.randomRange(-0.5, 0.5),
                    targetY: Utils.randomRange(100, 300)  // 汇入极光
                });
            }
            
            AudioManager.playSfx('ding');
            Utils.hapticLight();
            
            // 更新计数
            var numEl = document.getElementById('star-num');
            if (numEl) {
                var count = parseInt(numEl.textContent) + 1;
                numEl.textContent = count;
            }
            
            // 临时增强极光
            this.auroraIntensity = 1.3;
        },
        
        generatePostcard: function() {
            var canvas = document.createElement('canvas');
            canvas.width = 720;
            canvas.height = 1280;
            var ctx = canvas.getContext('2d');
            
            // 渲染场景
            this.renderToCanvas(ctx);
            
            // 添加文字框
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 1050, 720, 230);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 26px serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.wishText || '愿你所愿，皆能实现', 360, 1110);
            
            ctx.font = '18px serif';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText('For Augenstern · ' + Utils.formatDate(), 360, 1160);
            
            var numEl = document.getElementById('star-num');
            var starCount = numEl ? numEl.textContent : '0';
            ctx.fillText('⭐ ' + starCount + ' 颗星光', 360, 1200);
            
            Utils.downloadCanvas(canvas, 'aurora_postcard.png');
            Utils.hapticSuccess();
        },
        
        update: function(dt) {
            this.time += dt * 0.001;
            
            // 更新极光带
            for (var i = 0; i < this.auroraBands.length; i++) {
                var band = this.auroraBands[i];
                band.phase1 += band.speed1 * dt * 0.001;
                band.phase2 += band.speed2 * dt * 0.001;
                // 垂直漂移
                band.verticalOffset = Math.sin(this.time * 0.3 + i) * 15;
            }
            
            // 更新点击星光
            for (var j = this.clickStars.length - 1; j >= 0; j--) {
                var star = this.clickStars[j];
                star.x += star.vx;
                star.y += star.vy;
                
                // 向极光汇聚
                if (star.y > star.targetY) {
                    star.vy -= 0.02;
                }
                
                star.life -= dt * 0.0008;
                star.size *= 0.995;
                
                if (star.life <= 0 || star.size < 1) {
                    this.clickStars.splice(j, 1);
                }
            }
            
            // 极光强度恢复
            this.auroraIntensity = Utils.lerp(this.auroraIntensity, 1, 0.02);
        },
        
        render: function(ctx) {
            this.renderToCanvas(ctx);
        },
        
        renderToCanvas: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            // 背景
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#050510');
            grad.addColorStop(0.3, '#0a0a25');
            grad.addColorStop(0.6, '#101035');
            grad.addColorStop(1, '#1a1a45');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            
            // 星星
            this.drawStars(ctx);
            
            // 极光（多层叠加）
            this.drawAurora(ctx);
            
            // 点击星光
            this.drawClickStars(ctx);
            
            // 远山
            this.drawMountains(ctx);
        },
        
        drawStars: function(ctx) {
            ctx.fillStyle = '#fff';
            for (var i = 0; i < this.stars.length; i++) {
                var s = this.stars[i];
                var twinkle = 0.3 + Math.sin(this.time * s.twinkleSpeed + s.twinklePhase) * 0.4;
                ctx.globalAlpha = Math.max(0, twinkle);
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        },
        
        drawAurora: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH;
            var intensity = this.auroraIntensity;
            
            // 从后往前绘制
            for (var i = this.auroraBands.length - 1; i >= 0; i--) {
                var band = this.auroraBands[i];
                var baseY = band.baseY + band.verticalOffset;
                
                ctx.beginPath();
                ctx.moveTo(-10, baseY + band.height);
                
                // 上边缘（波动）
                for (var x = -10; x <= W + 10; x += 8) {
                    var wave1 = Math.sin(x * band.frequency1 + band.phase1) * band.amplitude;
                    var wave2 = Math.sin(x * band.frequency2 + band.phase2) * band.amplitude * 0.4;
                    var wave3 = Math.sin(x * band.frequency1 * 3 + band.phase1 * 2) * band.amplitude * 0.15;
                    var y = baseY + wave1 + wave2 + wave3;
                    ctx.lineTo(x, y);
                }
                
                // 下边缘（更平滑的波动）
                for (var x2 = W + 10; x2 >= -10; x2 -= 8) {
                    var wave1b = Math.sin(x2 * band.frequency1 * 0.7 + band.phase1 + 1) * band.amplitude * 0.5;
                    var y2 = baseY + band.height + wave1b;
                    ctx.lineTo(x2, y2);
                }
                
                ctx.closePath();
                
                // 渐变填充
                var c = band.color;
                var grad = ctx.createLinearGradient(0, baseY - band.amplitude, 0, baseY + band.height + band.amplitude);
                grad.addColorStop(0, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
                grad.addColorStop(0.2, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (c.a * 0.7 * intensity) + ')');
                grad.addColorStop(0.5, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (c.a * intensity) + ')');
                grad.addColorStop(0.8, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (c.a * 0.5 * intensity) + ')');
                grad.addColorStop(1, 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0)');
                
                ctx.fillStyle = grad;
                ctx.fill();
            }
        },
        
        drawClickStars: function(ctx) {
            for (var i = 0; i < this.clickStars.length; i++) {
                var star = this.clickStars[i];
                
                ctx.globalAlpha = star.life * 0.9;
                
                // 发光效果
                var grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, '#ffd700');
                grad.addColorStop(0.6, 'rgba(100,255,180,0.5)');
                grad.addColorStop(1, 'transparent');
                
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // 核心
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        },
        
        drawMountains: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            // 远山（深色）
            ctx.fillStyle = '#0a0a20';
            ctx.beginPath();
            ctx.moveTo(0, H);
            ctx.lineTo(0, 850);
            ctx.lineTo(100, 720);
            ctx.lineTo(200, 800);
            ctx.lineTo(350, 680);
            ctx.lineTo(450, 750);
            ctx.lineTo(550, 700);
            ctx.lineTo(650, 780);
            ctx.lineTo(W, 720);
            ctx.lineTo(W, H);
            ctx.closePath();
            ctx.fill();
            
            // 近山（稍亮）
            ctx.fillStyle = '#151530';
            ctx.beginPath();
            ctx.moveTo(0, H);
            ctx.lineTo(0, 920);
            ctx.lineTo(150, 830);
            ctx.lineTo(280, 880);
            ctx.lineTo(400, 810);
            ctx.lineTo(520, 860);
            ctx.lineTo(620, 820);
            ctx.lineTo(W, 870);
            ctx.lineTo(W, H);
            ctx.closePath();
            ctx.fill();
            
            // 雪地
            var snowGrad = ctx.createLinearGradient(0, 950, 0, H);
            snowGrad.addColorStop(0, '#2a2a50');
            snowGrad.addColorStop(1, '#1a1a40');
            ctx.fillStyle = snowGrad;
            ctx.fillRect(0, 950, W, H - 950);
        }
    };
})();
