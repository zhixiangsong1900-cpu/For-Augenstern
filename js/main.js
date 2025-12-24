/**
 * For Augenstern - Entry
 */
(function() {
    'use strict';

    window.AppState = {
        isFirstVisit: true,
        audioUnlocked: false
    };

    document.addEventListener('DOMContentLoaded', function() {
        console.log('[Main] For Augenstern v' + GameConfig.VERSION + ' - Starting...');
        
        // 开发模式：刷新时自动重置所有数据
        if (GameConfig.DEV_MODE) {
            console.log('[Dev] 开发模式已启用，清除所有保存数据');
            Utils.removeData(GameConfig.STORAGE_KEYS.SAVE_DATA);
            Utils.removeData(GameConfig.STORAGE_KEYS.TUTORIAL);
            Utils.removeData(GameConfig.STORAGE_KEYS.SETTINGS);
        }
        
        var saveData = Utils.loadData(GameConfig.STORAGE_KEYS.SAVE_DATA, {});
        AppState.isFirstVisit = !saveData.hasVisited;
        
        // 初始化游戏
        Game.init();
        
        // 初始化引导系统
        if (typeof TutorialSystem !== 'undefined') {
            TutorialSystem.init();
        }
        
        // 开始按钮
        var startBtn = document.getElementById('start-btn');
        var overlay = document.getElementById('audio-unlock-overlay');
        
        if (startBtn && overlay) {
            var isStarting = false;
            
            var handleStart = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (isStarting || overlay.classList.contains('hidden')) return;
                isStarting = true;
                
                console.log('[Main] Start button clicked');
                
                AudioManager.unlock().then(function() {
                    AppState.audioUnlocked = true;
                    Utils.addClass(overlay, 'fade-out');
                    
                    setTimeout(function() {
                        Utils.addClass(overlay, 'hidden');
                        overlay.style.display = 'none';
                        
                        // 保存访问状态
                        var saveData = Utils.loadData(GameConfig.STORAGE_KEYS.SAVE_DATA, {});
                        saveData.hasVisited = true;
                        Utils.saveData(GameConfig.STORAGE_KEYS.SAVE_DATA, saveData);
                        
                        // 触发引导
                        if (typeof TutorialSystem !== 'undefined') {
                            TutorialSystem.checkStep('start');
                        }
                        
                        // 启动游戏
                        Game.start();
                    }, 800);
                });
            };
            
            startBtn.addEventListener('click', handleStart);
            startBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                handleStart(e);
            }, { passive: false });
        }
        
        // 防止页面滚动
        document.body.addEventListener('touchmove', function(e) {
            if (e.target.tagName !== 'INPUT') {
                e.preventDefault();
            }
        }, { passive: false });
        
        // 禁用右键菜单
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        // 防止双击缩放
        var lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            var now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
        
        // 页面可见性
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                Game.pause();
            } else {
                Game.resume();
            }
        });
        
        // 调试快捷键
        if (location.hostname === 'localhost' || location.protocol === 'file:') {
            document.addEventListener('keydown', function(e) {
                if (e.key === 'F1') { e.preventDefault(); Game.toggleDebug(); }
                if (e.key === 'F2') { e.preventDefault(); Game.changeScene('finale'); }
                if (e.key === 'F3') { e.preventDefault(); Game.resetAllData(); }
                if (e.key === 'F4') { 
                    e.preventDefault(); 
                    if (typeof TutorialSystem !== 'undefined') {
                        TutorialSystem.reset();
                        TutorialSystem.start();
                    }
                }
            });
            console.log('[Debug] F1=FPS, F2=Finale, F3=Reset, F4=Tutorial');
            console.log('[Debug] DEV_MODE=' + GameConfig.DEV_MODE);
        }
        
        // 全局调试接口
        window.GameDebug = {
            toggleDebug: function() { Game.toggleDebug(); },
            triggerFinale: function() { Game.changeScene('finale'); },
            resetData: function() { Game.resetAllData(); },
            changeScene: function(name) { Game.changeScene(name); },
            resetTutorial: function() { 
                if (typeof TutorialSystem !== 'undefined') {
                    TutorialSystem.reset(); 
                }
            }
        };
        
        console.log('[Main] Init complete');
    });
    
})();
