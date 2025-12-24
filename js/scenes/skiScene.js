/**
 * Ski Scene - 横向跑酷滑雪
 * 类似《滑雪大冒险》，自动向右滑行，点击跳跃
 */
(function() {
    'use strict';
    
    window.SkiScene = {
        name: 'ski',
        
        // 游戏状态
        isPlaying: false,
        isEnded: false,
        gameTime: 0,
        score: 0,
        time: 0,
        
        // 玩家
        player: {
            x: 200,
            y: 0,
            vy: 0,
            isJumping: false,
            isFalling: false,
            fallTimer: 0,
            rotation: 0
        },
        
        // 地形
        groundY: 900,
        scrollX: 0,
        scrollSpeed: 0,
        
        // 障碍物和收集物
        obstacles: [],
        collectibles: [],
        
        // 视觉效果
        mountains: [],
        trees: [],
        snowParticles: [],
        
        enter: function() {
            var self = this;
            this.reset();
            this.initBackground();
            this.createUI();
            
            Input.onTap = function(x, y) { self.handleTap(x, y); };
        },
        
        exit: function() {
            Utils.clearElement(document.getElementById('ui-layer-game'));
            Utils.clearElement(document.getElementById('ui-layer-popup'));
        },
        
        reset: function() {
            var cfg = GameConfig.SKI;
            this.isPlaying = false;
            this.isEnded = false;
            this.gameTime = 0;
            this.score = 0;
            this.time = 0;
            this.scrollX = 0;
            this.scrollSpeed = cfg.SCROLL_SPEED;
            
            this.player = {
                x: 200,
                y: this.groundY - 60,
                vy: 0,
                isJumping: false,
                isFalling: false,
                fallTimer: 0,
                rotation: 0
            };
            
            this.obstacles = [];
            this.collectibles = [];
        },
        
        initBackground: function() {
            var W = GameConfig.LOGICAL_WIDTH;
            
            // 远山
            this.mountains = [];
            for (var i = 0; i < 8; i++) {
                this.mountains.push({
                    x: i * 300,
                    height: Utils.randomRange(150, 280),
                    width: Utils.randomRange(200, 350)
                });
            }
            
            // 背景树
            this.trees = [];
            for (var j = 0; j < 15; j++) {
                this.trees.push({
                    x: j * 150 + Utils.randomRange(-30, 30),
                    y: Utils.randomRange(750, 850),
                    scale: Utils.randomRange(0.5, 1)
                });
            }
            
            // 雪粒子
            this.snowParticles = [];
            for (var k = 0; k < 40; k++) {
                this.snowParticles.push({
                    x: Utils.randomRange(0, W),
                    y: Utils.randomRange(0, GameConfig.LOGICAL_HEIGHT),
                    size: Utils.randomRange(2, 5),
                    speed: Utils.randomRange(1, 3)
                });
            }
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
            
            // HUD
            var hud = Utils.createElement('div', 'ski-hud');
            hud.innerHTML = 
                '<div class="ski-score">🎁 <span id="ski-score">0</span></div>' +
                '<div class="ski-time">⏱ <span id="ski-time">' + 
                Math.ceil(GameConfig.SKI.GAME_DURATION / 1000) + '</span>s</div>';
            gameLayer.appendChild(hud);
            
            // 开始提示
            if (!this.isPlaying && !this.isEnded) {
                var startPrompt = Utils.createElement('div', 'ski-start');
                startPrompt.id = 'ski-start';
                startPrompt.innerHTML = 
                    '<p>🎿 点击屏幕开始</p>' +
                    '<p class="ski-hint">点击 = 跳跃</p>';
                gameLayer.appendChild(startPrompt);
            }
        },
        
        handleTap: function(x, y) {
            if (!this.isPlaying && !this.isEnded) {
                this.startGame();
                return;
            }
            
            if (this.isPlaying && !this.player.isJumping && !this.player.isFalling) {
                this.jump();
            }
        },
        
        startGame: function() {
            this.isPlaying = true;
            var startEl = document.getElementById('ski-start');
            if (startEl) startEl.remove();
            Utils.hapticLight();
        },
        
        jump: function() {
            this.player.isJumping = true;
            this.player.vy = -GameConfig.SKI.JUMP_FORCE;
            AudioManager.playSfx('whoosh');
            Utils.hapticLight();
        },
        
        spawnObstacle: function() {
            var types = GameConfig.SKI.OBSTACLE_TYPES;
            var type = Utils.randomPick(types);
            this.obstacles.push({
                x: GameConfig.LOGICAL_WIDTH + 100,
                y: this.groundY - type.height / 2,
                type: type.type,
                emoji: type.emoji,
                width: type.width,
                height: type.height
            });
        },
        
        spawnCollectible: function() {
            var types = GameConfig.SKI.COLLECTIBLE_TYPES;
            var type = Utils.randomPick(types);
            var isHigh = Math.random() > 0.5;
            this.collectibles.push({
                x: GameConfig.LOGICAL_WIDTH + 100,
                y: isHigh ? this.groundY - 150 : this.groundY - 60,
                emoji: type.emoji,
                points: type.points,
                collected: false
            });
        },
        
        update: function(dt) {
            this.time += dt * 0.001;
            
            // 更新雪粒子
            this.updateSnow(dt);
            
            if (!this.isPlaying || this.isEnded) return;
            
            // 更新游戏时间
            this.gameTime += dt;
            var remaining = Math.max(0, Math.ceil((GameConfig.SKI.GAME_DURATION - this.gameTime) / 1000));
            var timeEl = document.getElementById('ski-time');
            if (timeEl) timeEl.textContent = remaining;
            
            if (this.gameTime >= GameConfig.SKI.GAME_DURATION) {
                this.endGame();
                return;
            }
            
            // 更新滚动
            var effectiveSpeed = this.player.isFalling ? this.scrollSpeed * 0.3 : this.scrollSpeed;
            this.scrollX += effectiveSpeed;
            
            // 更新玩家
            this.updatePlayer(dt);
            
            // 生成障碍物和收集物
            if (Math.random() < 0.015) this.spawnObstacle();
            if (Math.random() < 0.02) this.spawnCollectible();
            
            // 更新障碍物
            for (var i = this.obstacles.length - 1; i >= 0; i--) {
                this.obstacles[i].x -= effectiveSpeed;
                if (this.obstacles[i].x < -100) {
                    this.obstacles.splice(i, 1);
                    continue;
                }
                
                // 碰撞检测
                if (this.checkCollision(this.obstacles[i])) {
                    if (!this.player.isFalling && !this.player.isJumping) {
                        this.player.isFalling = true;
                        this.player.fallTimer = 1000;
                        AudioManager.playSfx('crash');
                        Utils.hapticMedium();
                    }
                }
            }
            
            // 更新收集物
            for (var j = this.collectibles.length - 1; j >= 0; j--) {
                this.collectibles[j].x -= effectiveSpeed;
                if (this.collectibles[j].x < -50) {
                    this.collectibles.splice(j, 1);
                    continue;
                }
                
                // 收集检测
                if (!this.collectibles[j].collected && this.checkCollect(this.collectibles[j])) {
                    this.collectibles[j].collected = true;
                    this.score += this.collectibles[j].points;
                    var scoreEl = document.getElementById('ski-score');
                    if (scoreEl) scoreEl.textContent = this.score;
                    AudioManager.playSfx('collect');
                    Utils.hapticLight();
                    this.collectibles.splice(j, 1);
                }
            }
            
            // 速度逐渐增加
            this.scrollSpeed = Math.min(GameConfig.SKI.MAX_SPEED, 
                this.scrollSpeed + dt * 0.0003);
        },
        
        updatePlayer: function(dt) {
            var p = this.player;
            var cfg = GameConfig.SKI;
            
            // 重力
            if (p.isJumping) {
                p.vy += cfg.GRAVITY;
                p.y += p.vy;
                
                // 落地
                if (p.y >= this.groundY - 60) {
                    p.y = this.groundY - 60;
                    p.vy = 0;
                    p.isJumping = false;
                }
            }
            
            // 摔倒恢复
            if (p.isFalling) {
                p.fallTimer -= dt;
                p.rotation += dt * 0.01;
                if (p.fallTimer <= 0) {
                    p.isFalling = false;
                    p.rotation = 0;
                }
            }
        },
        
        updateSnow: function(dt) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            for (var i = 0; i < this.snowParticles.length; i++) {
                var s = this.snowParticles[i];
                s.x -= this.scrollSpeed * 0.3 + s.speed;
                s.y += s.speed * 0.5;
                if (s.x < -10) s.x = W + 10;
                if (s.y > H) { s.y = -10; s.x = Utils.randomRange(0, W); }
            }
        },
        
        checkCollision: function(obstacle) {
            var p = this.player;
            var ox = obstacle.x, oy = obstacle.y;
            var hw = obstacle.width / 2, hh = obstacle.height / 2;
            
            // 简单矩形碰撞
            return p.x + 25 > ox - hw && 
                   p.x - 25 < ox + hw && 
                   p.y + 30 > oy - hh && 
                   p.y - 30 < oy + hh;
        },
        
        checkCollect: function(item) {
            var p = this.player;
            return Utils.distance(p.x, p.y, item.x, item.y) < 50;
        },
        
        endGame: function() {
            this.isEnded = true;
            this.isPlaying = false;
            this.showResult();
        },
        
        showResult: function() {
            var self = this;
            var rewards = this.calculateRewards();
            
            var popup = Utils.createElement('div', 'ski-result');
            var rewardText = rewards.length > 0 ? 
                '<p class="result-rewards">解锁: ' + rewards.map(function(r) { return r.emoji || '🎁'; }).join(' ') + '</p>' : '';
            
            popup.innerHTML = 
                '<div class="result-card">' +
                    '<h2>🎿 滑雪结束!</h2>' +
                    '<p class="result-score">得分: ' + this.score + '</p>' +
                    rewardText +
                    '<button class="result-btn" id="ski-again">再来一次</button>' +
                    '<button class="result-btn secondary" id="ski-back">返回</button>' +
                '</div>';
            
            document.getElementById('ui-layer-popup').appendChild(popup);
            
            Utils.bindClick(document.getElementById('ski-again'), function() {
                popup.remove();
                self.reset();
                self.initBackground();
                self.createUI();
            });
            
            Utils.bindClick(document.getElementById('ski-back'), function() {
                Game.changeScene('hub');
            });
        },
        
        calculateRewards: function() {
            var unlocked = [];
            var save = Utils.loadData(GameConfig.STORAGE_KEYS.SAVE_DATA, {});
            save.skiRewards = save.skiRewards || [];
            save.totalSkiScore = (save.totalSkiScore || 0) + this.score;
            
            var rewards = GameConfig.SKI.REWARDS;
            for (var i = 0; i < rewards.length; i++) {
                var r = rewards[i];
                if (save.totalSkiScore >= r.points && save.skiRewards.indexOf(r.id) === -1) {
                    save.skiRewards.push(r.id);
                    unlocked.push(r);
                }
            }
            
            Utils.saveData(GameConfig.STORAGE_KEYS.SAVE_DATA, save);
            return unlocked;
        },
        
        render: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            // 天空
            var skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.7);
            skyGrad.addColorStop(0, '#87CEEB');
            skyGrad.addColorStop(0.5, '#B0E0E6');
            skyGrad.addColorStop(1, '#E0F4FF');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, H);
            
            // 太阳
            ctx.fillStyle = '#FFE484';
            ctx.beginPath();
            ctx.arc(600, 150, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF8DC';
            ctx.beginPath();
            ctx.arc(600, 150, 40, 0, Math.PI * 2);
            ctx.fill();
            
            // 远山
            this.drawMountains(ctx);
            
            // 背景树
            this.drawBackgroundTrees(ctx);
            
            // 雪地
            this.drawGround(ctx);
            
            // 障碍物
            this.drawObstacles(ctx);
            
            // 收集物
            this.drawCollectibles(ctx);
            
            // 玩家
            this.drawPlayer(ctx);
            
            // 雪粒子
            this.drawSnow(ctx);
        },
        
        drawMountains: function(ctx) {
            ctx.fillStyle = '#8BA4B4';
            for (var i = 0; i < this.mountains.length; i++) {
                var m = this.mountains[i];
                var x = (m.x - this.scrollX * 0.1) % (GameConfig.LOGICAL_WIDTH + 400) - 200;
                
                ctx.beginPath();
                ctx.moveTo(x - m.width / 2, 700);
                ctx.lineTo(x, 700 - m.height);
                ctx.lineTo(x + m.width / 2, 700);
                ctx.closePath();
                ctx.fill();
                
                // 雪顶
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.moveTo(x - m.width * 0.15, 700 - m.height + 40);
                ctx.lineTo(x, 700 - m.height);
                ctx.lineTo(x + m.width * 0.15, 700 - m.height + 40);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#8BA4B4';
            }
        },
        
        drawBackgroundTrees: function(ctx) {
            for (var i = 0; i < this.trees.length; i++) {
                var t = this.trees[i];
                var x = (t.x - this.scrollX * 0.3) % (GameConfig.LOGICAL_WIDTH + 200) - 100;
                
                ctx.save();
                ctx.translate(x, t.y);
                ctx.scale(t.scale, t.scale);
                
                // 树干
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(-5, 0, 10, 30);
                
                // 树冠
                ctx.fillStyle = '#2E7D32';
                ctx.beginPath();
                ctx.moveTo(0, -50);
                ctx.lineTo(25, 0);
                ctx.lineTo(-25, 0);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        },
        
        drawGround: function(ctx) {
            var W = GameConfig.LOGICAL_WIDTH, H = GameConfig.LOGICAL_HEIGHT;
            
            // 主雪地
            var snowGrad = ctx.createLinearGradient(0, this.groundY - 50, 0, H);
            snowGrad.addColorStop(0, '#F5F5F5');
            snowGrad.addColorStop(0.5, '#E8E8E8');
            snowGrad.addColorStop(1, '#D0D0D0');
            ctx.fillStyle = snowGrad;
            ctx.fillRect(0, this.groundY - 50, W, H - this.groundY + 50);
            
            // 雪地纹理线
            ctx.strokeStyle = 'rgba(200,200,200,0.5)';
            ctx.lineWidth = 1;
            for (var i = 0; i < 10; i++) {
                var lx = (i * 100 - this.scrollX) % (W + 200) - 100;
                ctx.beginPath();
                ctx.moveTo(lx, this.groundY);
                ctx.lineTo(lx + 150, H);
                ctx.stroke();
            }
        },
        
        drawObstacles: function(ctx) {
            ctx.font = '50px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (var i = 0; i < this.obstacles.length; i++) {
                var o = this.obstacles[i];
                ctx.fillText(o.emoji, o.x, o.y);
            }
        },
        
        drawCollectibles: function(ctx) {
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (var i = 0; i < this.collectibles.length; i++) {
                var c = this.collectibles[i];
                if (c.collected) continue;
                var bounce = Math.sin(this.time * 6 + i) * 8;
                ctx.fillText(c.emoji, c.x, c.y + bounce);
            }
        },
        
        drawPlayer: function(ctx) {
            var p = this.player;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            
            if (p.isFalling) {
                ctx.rotate(p.rotation);
                // 摔倒表情
                ctx.font = '55px serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🤸', 0, 0);
            } else {
                // 跳跃时倾斜
                if (p.isJumping) {
                    ctx.rotate(-0.2 - p.vy * 0.01);
                }
                
                // 身体
                ctx.fillStyle = '#E53935';  // 红色外套
                ctx.beginPath();
                ctx.ellipse(0, 0, 18, 25, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 头
                ctx.fillStyle = '#FFCC80';
                ctx.beginPath();
                ctx.arc(0, -30, 14, 0, Math.PI * 2);
                ctx.fill();
                
                // 帽子
                ctx.fillStyle = '#1565C0';
                ctx.beginPath();
                ctx.arc(0, -38, 12, Math.PI, 0);
                ctx.fill();
                ctx.fillRect(-12, -40, 24, 6);
                
                // 护目镜
                ctx.fillStyle = '#263238';
                ctx.fillRect(-10, -32, 20, 6);
                
                // 滑雪板
                ctx.fillStyle = '#FFC107';
                ctx.fillRect(-30, 28, 60, 8);
                
                // 滑雪杖
                ctx.strokeStyle = '#757575';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-15, -5);
                ctx.lineTo(-35, 25);
                ctx.moveTo(15, -5);
                ctx.lineTo(35, 25);
                ctx.stroke();
            }
            
            ctx.restore();
        },
        
        drawSnow: function(ctx) {
            ctx.fillStyle = '#fff';
            for (var i = 0; i < this.snowParticles.length; i++) {
                var s = this.snowParticles[i];
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    };
})();
