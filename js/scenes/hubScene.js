/**
 * Hub Scene - 雪屋主场景
 */
(function() {
    'use strict';
    
    window.HubScene = {
        name: 'hub',
        snowflakes: [],
        fireSparks: [],
        time: 0,
        isTreeLit: false,
        messageIndex: 0,
        messageTimer: null,
        
        enter: function() {
            this.initSnowflakes();
            this.initFireSparks();
            this.time = 0;
            
            var save = Utils.loadData(GameConfig.STORAGE_KEYS.SAVE_DATA, {});
            this.isTreeLit = save.treeLit || false;
            
            this.createUI();
            AudioManager.playBgm();
        },
        
        exit: function() {
            var gameLayer = document.getElementById('ui-layer-game');
            Utils.clearElement(gameLayer);
            clearInterval(this.messageTimer);
        },
        
        createUI: function() {
            var self = this;
            var gameLayer = document.getElementById('ui-layer-game');
            Utils.clearElement(gameLayer);
            
            // 顶部消息栏
            var topBar = Utils.createElement('div', 'hub-top-bar');
            
            var msgBox = Utils.createElement('div', 'message-carousel');
            msgBox.id = 'message-carousel';
            msgBox.textContent = GameConfig.CAROUSEL_MESSAGES[0];
            topBar.appendChild(msgBox);
            
            // 音乐控制
            var musicCtrl = Utils.createElement('div', 'music-controls');
            
            var playBtn = Utils.createElement('button', 'music-btn');
            playBtn.id = 'music-play-btn';
            playBtn.textContent = AudioManager.isPlaying ? '⏸' : '▶';
            Utils.bindClick(playBtn, function() {
                AudioManager.toggleBgm();
                playBtn.textContent = AudioManager.isPlaying ? '⏸' : '▶';
            });
            musicCtrl.appendChild(playBtn);
            
            var volBtn = Utils.createElement('button', 'music-btn');
            volBtn.textContent = AudioManager.isMuted() ? '🔇' : '🔊';
            Utils.bindClick(volBtn, function() {
                var muted = AudioManager.toggleMute();
                volBtn.textContent = muted ? '🔇' : '🔊';
            });
            musicCtrl.appendChild(volBtn);
            
            topBar.appendChild(musicCtrl);
            gameLayer.appendChild(topBar);
            
            // 底部导航
            var bottomNav = Utils.createElement('div', 'hub-bottom-nav');
            
            var navItems = [
                { id: 'nav-tree', icon: '🎄', label: '圣诞树', scene: 'tree' },
                { id: 'nav-aurora', icon: '🌌', label: '看极光', scene: 'aurora' },
                { id: 'nav-ski', icon: '⛷️', label: '去滑雪', scene: 'ski' },
                { id: 'nav-finale', icon: '🎁', label: '终章', scene: 'finale' }
            ];
            
            navItems.forEach(function(item) {
                var btn = Utils.createElement('button', 'nav-btn');
                btn.id = item.id;
                btn.innerHTML = 
                    '<span class="nav-icon">' + item.icon + '</span>' +
                    '<span class="nav-label">' + item.label + '</span>';
                Utils.bindClick(btn, function() {
                    Utils.hapticLight();
                    Game.changeScene(item.scene);
                    
                    // 触发引导
                    if (typeof TutorialSystem !== 'undefined') {
                        if (item.scene === 'aurora') TutorialSystem.checkStep('go_aurora');
                        if (item.scene === 'ski') TutorialSystem.checkStep('go_ski');
                        if (item.scene === 'finale') TutorialSystem.checkStep('go_finale');
                    }
                });
                bottomNav.appendChild(btn);
            });
            
            gameLayer.appendChild(bottomNav);
            
            this.startMessageCarousel();
        },
        
        startMessageCarousel: function() {
            var self = this;
            this.messageTimer = setInterval(function() {
                self.messageIndex = (self.messageIndex + 1) % GameConfig.CAROUSEL_MESSAGES.length;
                var el = document.getElementById('message-carousel');
                if (el) {
                    el.style.opacity = '0';
                    setTimeout(function() {
                        el.textContent = GameConfig.CAROUSEL_MESSAGES[self.messageIndex];
                        el.style.opacity = '1';
                    }, 300);
                }
            }, GameConfig.MESSAGE_INTERVAL);
        },
        
        initSnowflakes: function() {
            this.snowflakes = [];
            for (var i = 0; i < 60; i++) {
                this.snowflakes.push({
                    x: Utils.randomRange(0, GameConfig.LOGICAL_WIDTH),
                    y: Utils.randomRange(-100, GameConfig.LOGICAL_HEIGHT),
                    size: Utils.randomRange(2, 7),
                    speed: Utils.randomRange(1, 3),
                    wobble: Utils.randomRange(0, Math.PI * 2),
                    wobbleSpeed: Utils.randomRange(0.02, 0.05),
                    isFront: i < 20
                });
            }
        },
        
        initFireSparks: function() {
            this.fireSparks = [];
            for (var i = 0; i < 20; i++) {
                this.fireSparks.push(this.createSpark());
            }
        },
        
        createSpark: function() {
            return {
                x: Utils.randomRange(100, 180),
                y: Utils.randomRange(880, 930),
                size: Utils.randomRange(2, 5),
                life: 1,
                vx: Utils.randomRange(-0.8, 0.8),
                vy: Utils.randomRange(-2.5, -1.5)
            };
        },
        
        update: function(dt) {
            this.time += dt * 0.001;
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            // 雪花
            for (var i = 0; i < this.snowflakes.length; i++) {
                var s = this.snowflakes[i];
                s.y += s.speed * (s.isFront ? 1.5 : 1);
                s.wobble += s.wobbleSpeed;
                s.x += Math.sin(s.wobble) * (s.isFront ? 1 : 0.5) + 0.3;
                if (s.y > H + 20) { s.y = -20; s.x = Utils.randomRange(0, W); }
                if (s.x > W + 20) s.x = -20;
            }
            
            // 火花
            for (var j = 0; j < this.fireSparks.length; j++) {
                var sp = this.fireSparks[j];
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.life -= 0.012;
                if (sp.life <= 0) this.fireSparks[j] = this.createSpark();
            }
        },
        
        render: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            this.drawBackground(ctx, W, H);
            this.drawSnowflakes(ctx, false);  // 背景雪
            this.drawWindow(ctx);
            this.drawFireplace(ctx);
            this.drawChristmasTree(ctx, 500, 350);
            this.drawFireSparks(ctx);
            this.drawSnowflakes(ctx, true);   // 前景雪
        },
        
        drawBackground: function(ctx, W, H) {
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#0a1628');
            grad.addColorStop(0.4, '#132743');
            grad.addColorStop(0.7, '#1a3a5c');
            grad.addColorStop(1, '#2d4a6f');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
            
            // 地板
            ctx.fillStyle = '#2a1f1a';
            ctx.fillRect(0, H - 250, W, 250);
            
            // 地板高光
            var floorGrad = ctx.createLinearGradient(0, H - 250, 0, H);
            floorGrad.addColorStop(0, 'rgba(60,45,35,1)');
            floorGrad.addColorStop(1, 'rgba(30,20,15,1)');
            ctx.fillStyle = floorGrad;
            ctx.fillRect(0, H - 250, W, 250);
        },
        
        drawWindow: function(ctx) {
            var x = 80, y = 150, w = 180, h = 250;
            
            // 窗框
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
            
            // 窗户玻璃 - 夜空
            var skyGrad = ctx.createLinearGradient(x, y, x, y + h);
            skyGrad.addColorStop(0, '#0a1525');
            skyGrad.addColorStop(1, '#1a2a45');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(x, y, w, h);
            
            // 窗外星星
            ctx.fillStyle = '#fff';
            for (var i = 0; i < 15; i++) {
                var sx = x + (i * 37) % w;
                var sy = y + (i * 23) % h;
                ctx.globalAlpha = 0.3 + Math.sin(this.time * 2 + i) * 0.2;
                ctx.beginPath();
                ctx.arc(sx, sy, 1, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            
            // 窗格
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(x + w/2, y);
            ctx.lineTo(x + w/2, y + h);
            ctx.moveTo(x, y + h/2);
            ctx.lineTo(x + w, y + h/2);
            ctx.stroke();
        },
        
        drawFireplace: function(ctx) {
            var x = 60, y = 780;
            
            // 壁炉主体
            ctx.fillStyle = '#3d2b1f';
            ctx.fillRect(x, y, 180, 200);
            
            // 壁炉顶
            ctx.fillStyle = '#4a3728';
            ctx.fillRect(x - 15, y - 20, 210, 30);
            
            // 火焰区域
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x + 20, y + 50, 140, 120);
            
            // 火焰辉光
            var glowIntensity = this.isTreeLit ? 1.2 : 0.8;
            var fireGrad = ctx.createRadialGradient(x + 90, y + 140, 0, x + 90, y + 140, 100);
            fireGrad.addColorStop(0, 'rgba(255,150,50,' + (0.6 * glowIntensity) + ')');
            fireGrad.addColorStop(0.5, 'rgba(255,80,20,' + (0.3 * glowIntensity) + ')');
            fireGrad.addColorStop(1, 'rgba(255,30,0,0)');
            ctx.fillStyle = fireGrad;
            ctx.fillRect(x - 50, y, 280, 200);
            
            // 火焰
            for (var i = 0; i < 4; i++) {
                var fx = x + 40 + i * 35;
                var fy = y + 150 - Math.sin(this.time * 6 + i * 1.5) * 15;
                var fh = 40 + Math.sin(this.time * 8 + i * 2) * 15;
                
                var flameGrad = ctx.createLinearGradient(fx, fy, fx, fy - fh);
                flameGrad.addColorStop(0, '#ff4400');
                flameGrad.addColorStop(0.4, '#ff8800');
                flameGrad.addColorStop(0.7, '#ffcc00');
                flameGrad.addColorStop(1, 'rgba(255,220,100,0)');
                
                ctx.fillStyle = flameGrad;
                ctx.beginPath();
                ctx.moveTo(fx - 12, fy);
                ctx.quadraticCurveTo(fx - 8, fy - fh * 0.6, fx, fy - fh);
                ctx.quadraticCurveTo(fx + 8, fy - fh * 0.6, fx + 12, fy);
                ctx.closePath();
                ctx.fill();
            }
        },
        
        drawChristmasTree: function(ctx, x, y) {
            // 阴影
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(x, y + 380, 100, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 树干
            ctx.fillStyle = '#4a3728';
            ctx.fillRect(x - 20, y + 320, 40, 70);
            
            // 树身
            var layers = [
                { w: 70, h: 90, yOff: -10 },
                { w: 120, h: 100, yOff: 65 },
                { w: 170, h: 110, yOff: 150 },
                { w: 220, h: 120, yOff: 245 }
            ];
            
            for (var i = 0; i < layers.length; i++) {
                var l = layers[i];
                var treeGrad = ctx.createLinearGradient(x - l.w/2, y + l.yOff, x + l.w/2, y + l.yOff);
                treeGrad.addColorStop(0, '#0d2d1a');
                treeGrad.addColorStop(0.3, '#165a38');
                treeGrad.addColorStop(0.7, '#1a5535');
                treeGrad.addColorStop(1, '#0d2d1a');
                
                ctx.fillStyle = treeGrad;
                ctx.beginPath();
                ctx.moveTo(x, y + l.yOff - 15);
                ctx.lineTo(x + l.w/2, y + l.yOff + l.h - 15);
                ctx.lineTo(x - l.w/2, y + l.yOff + l.h - 15);
                ctx.closePath();
                ctx.fill();
            }
            
            // 树顶星星
            ctx.fillStyle = this.isTreeLit ? '#ffd700' : '#8b7355';
            ctx.beginPath();
            for (var j = 0; j < 5; j++) {
                var angle = -Math.PI / 2 + j * Math.PI * 2 / 5;
                var angle2 = angle + Math.PI / 5;
                ctx.lineTo(x + Math.cos(angle) * 20, y - 35 + Math.sin(angle) * 20);
                ctx.lineTo(x + Math.cos(angle2) * 10, y - 35 + Math.sin(angle2) * 10);
            }
            ctx.closePath();
            ctx.fill();
            
            // 灯串
            if (this.isTreeLit) {
                this.drawTreeLights(ctx, x, y);
            }
        },
        
        drawTreeLights: function(ctx, x, y) {
            var colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc65fe'];
            for (var i = 0; i < 25; i++) {
                var t = i / 25;
                var angle = t * Math.PI * 5;
                var radius = 25 + t * 90;
                var ly = y + t * 320;
                var lx = x + Math.cos(angle) * radius;
                var color = colors[i % colors.length];
                var twinkle = 0.5 + Math.sin(this.time * 4 + i) * 0.5;
                
                // 辉光
                ctx.globalAlpha = twinkle * 0.4;
                var glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 12);
                glow.addColorStop(0, color);
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(lx, ly, 12, 0, Math.PI * 2);
                ctx.fill();
                
                // 灯泡
                ctx.globalAlpha = twinkle;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(lx, ly, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        },
        
        drawSnowflakes: function(ctx, frontOnly) {
            for (var i = 0; i < this.snowflakes.length; i++) {
                var s = this.snowflakes[i];
                if (frontOnly !== s.isFront) continue;
                
                ctx.globalAlpha = s.isFront ? 0.9 : 0.4;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.isFront ? s.size * 1.3 : s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        },
        
        drawFireSparks: function(ctx) {
            for (var i = 0; i < this.fireSparks.length; i++) {
                var sp = this.fireSparks[i];
                ctx.globalAlpha = sp.life * 0.9;
                ctx.fillStyle = sp.life > 0.6 ? '#ffee88' : (sp.life > 0.3 ? '#ffaa44' : '#ff6622');
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    };
})();
