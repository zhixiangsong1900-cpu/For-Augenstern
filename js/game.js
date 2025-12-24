/**
 * For Augenstern - Game Core
 */
(function() {
    'use strict';

    window.Game = {
        canvas: null,
        ctx: null,
        currentScene: null,
        scenes: {},
        isRunning: false,
        isPaused: false,
        lastTime: 0,
        debugMode: false,
        frameCount: 0,
        fps: 0,
        fpsTime: 0,
        
        init: function() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            this.resizeCanvas();
            window.addEventListener('resize', this.resizeCanvas.bind(this));
            window.addEventListener('orientationchange', this.resizeCanvas.bind(this));
            
            Input.init(this.canvas);
            AudioManager.init();
            
            // 注册场景
            this.registerScene('hub', HubScene);
            this.registerScene('tree', TreeScene);
            this.registerScene('aurora', AuroraScene);
            this.registerScene('ski', SkiScene);
            this.registerScene('finale', FinaleScene);
            
            console.log('[Game] 初始化完成');
        },
        
        resizeCanvas: function() {
            var container = document.getElementById('game-container');
            var dpr = window.devicePixelRatio || 1;
            
            var containerWidth = container.clientWidth;
            var containerHeight = container.clientHeight;
            var aspectRatio = GameConfig.LOGICAL_WIDTH / GameConfig.LOGICAL_HEIGHT;
            
            var newWidth, newHeight;
            if (containerWidth / containerHeight > aspectRatio) {
                newHeight = containerHeight;
                newWidth = newHeight * aspectRatio;
            } else {
                newWidth = containerWidth;
                newHeight = newWidth / aspectRatio;
            }
            
            this.canvas.style.width = newWidth + 'px';
            this.canvas.style.height = newHeight + 'px';
            
            this.canvas.width = GameConfig.LOGICAL_WIDTH * dpr;
            this.canvas.height = GameConfig.LOGICAL_HEIGHT * dpr;
            
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            
            console.log('[Game] Canvas: ' + newWidth.toFixed(0) + 'x' + newHeight.toFixed(0) + ', DPR: ' + dpr);
        },
        
        registerScene: function(name, sceneObj) {
            this.scenes[name] = sceneObj;
            sceneObj.game = this;
        },
        
        start: function() {
            if (this.isRunning) return;
            
            this.isRunning = true;
            this.lastTime = performance.now();
            
            // 默认进入hub场景
            this.changeScene('hub');
            
            // 开始游戏循环
            this.loop();
            
            console.log('[Game] 启动');
        },
        
        loop: function() {
            if (!Game.isRunning) return;
            
            var now = performance.now();
            var dt = Math.min(now - Game.lastTime, 100);  // 限制dt避免卡顿导致跳帧
            Game.lastTime = now;
            
            // FPS计算
            Game.frameCount++;
            Game.fpsTime += dt;
            if (Game.fpsTime >= 1000) {
                Game.fps = Game.frameCount;
                Game.frameCount = 0;
                Game.fpsTime = 0;
            }
            
            if (!Game.isPaused && Game.currentScene) {
                Game.currentScene.update(dt);
                Game.currentScene.render(Game.ctx);
            }
            
            // 调试信息
            if (Game.debugMode) {
                Game.renderDebug();
            }
            
            requestAnimationFrame(Game.loop);
        },
        
        changeScene: function(name, params) {
            if (this.currentScene && this.currentScene.exit) {
                this.currentScene.exit();
            }
            
            var scene = this.scenes[name];
            if (scene) {
                this.currentScene = scene;
                if (scene.enter) {
                    scene.enter(params);
                }
                console.log('[Game] 切换场景:', name);
            } else {
                console.error('[Game] 场景不存在:', name);
            }
        },
        
        pause: function() {
            this.isPaused = true;
            AudioManager.pauseBgm();
            console.log('[Game] 暂停');
        },
        
        resume: function() {
            this.isPaused = false;
            this.lastTime = performance.now();
            AudioManager.resumeBgm();
            console.log('[Game] 恢复');
        },
        
        stop: function() {
            this.isRunning = false;
            console.log('[Game] 停止');
        },
        
        toggleDebug: function() {
            this.debugMode = !this.debugMode;
            console.log('[Game] Debug:', this.debugMode);
        },
        
        renderDebug: function() {
            var ctx = this.ctx;
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(5, 5, 120, 60);
            ctx.fillStyle = '#0f0';
            ctx.font = '14px monospace';
            ctx.fillText('FPS: ' + this.fps, 12, 22);
            ctx.fillText('Scene: ' + (this.currentScene ? this.currentScene.name : 'none'), 12, 40);
            ctx.fillText('Paused: ' + this.isPaused, 12, 58);
            ctx.restore();
        },
        
        resetAllData: function() {
            Utils.removeData(GameConfig.STORAGE_KEYS.SAVE_DATA);
            Utils.removeData(GameConfig.STORAGE_KEYS.TUTORIAL);
            Utils.removeData(GameConfig.STORAGE_KEYS.SETTINGS);
            location.reload();
        },
        
        // 获取保存数据
        getSaveData: function() {
            return Utils.loadData(GameConfig.STORAGE_KEYS.SAVE_DATA, {});
        },
        
        // 更新保存数据
        updateSaveData: function(key, value) {
            var save = this.getSaveData();
            save[key] = value;
            Utils.saveData(GameConfig.STORAGE_KEYS.SAVE_DATA, save);
        }
    };
    
})();
