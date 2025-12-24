/**
 * Tutorial System - 新手引导系统
 * 步骤式遮罩引导，首次进入必出现
 */
(function() {
    'use strict';
    
    window.TutorialSystem = {
        isActive: false,
        currentStep: 0,
        completed: false,
        steps: [],
        overlay: null,
        
        // =========================================================
        // 初始化
        // =========================================================
        init: function() {
            this.steps = GameConfig.TUTORIAL.STEPS;
            
            // 检查是否已完成
            var save = Utils.loadData(GameConfig.STORAGE_KEYS.TUTORIAL, {});
            this.completed = save.completed || false;
            this.currentStep = save.currentStep || 0;
            
            console.log('[Tutorial] Init, completed:', this.completed, 'step:', this.currentStep);
        },
        
        // =========================================================
        // 开始引导
        // =========================================================
        start: function() {
            if (this.completed) {
                console.log('[Tutorial] Already completed, skipping');
                return;
            }
            
            this.isActive = true;
            this.showStep(this.currentStep);
        },
        
        // =========================================================
        // 显示某一步
        // =========================================================
        showStep: function(stepIndex) {
            if (stepIndex >= this.steps.length) {
                this.complete();
                return;
            }
            
            var step = this.steps[stepIndex];
            this.currentStep = stepIndex;
            this.saveProgress();
            
            console.log('[Tutorial] Showing step:', step.id, step.text);
            
            // 创建遮罩层
            this.createOverlay(step);
        },
        
        createOverlay: function(step) {
            var self = this;
            
            // 移除旧的
            this.removeOverlay();
            
            var overlay = Utils.createElement('div', 'tutorial-overlay');
            overlay.id = 'tutorial-overlay';
            
            // 跳过按钮
            var skipBtn = Utils.createElement('button', 'tutorial-skip', '跳过引导');
            Utils.bindClick(skipBtn, function() {
                self.skip();
            });
            overlay.appendChild(skipBtn);
            
            // 提示文字
            var text = Utils.createElement('div', 'tutorial-text');
            text.textContent = step.text;
            overlay.appendChild(text);
            
            // 如果有目标元素，创建高亮
            if (step.target) {
                var target = document.querySelector(step.target);
                if (target) {
                    var rect = target.getBoundingClientRect();
                    var container = document.getElementById('game-container');
                    var containerRect = container.getBoundingClientRect();
                    
                    var highlight = Utils.createElement('div', 'tutorial-highlight');
                    highlight.style.left = (rect.left - containerRect.left - 8) + 'px';
                    highlight.style.top = (rect.top - containerRect.top - 8) + 'px';
                    highlight.style.width = (rect.width + 16) + 'px';
                    highlight.style.height = (rect.height + 16) + 'px';
                    overlay.appendChild(highlight);
                    
                    // 定位文字到高亮下方
                    text.style.position = 'absolute';
                    text.style.top = (rect.bottom - containerRect.top + 20) + 'px';
                    text.style.left = '50%';
                    text.style.transform = 'translateX(-50%)';
                }
            }
            
            document.getElementById('ui-layer-popup').appendChild(overlay);
            this.overlay = overlay;
        },
        
        removeOverlay: function() {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            var old = document.getElementById('tutorial-overlay');
            if (old) old.remove();
        },
        
        // =========================================================
        // 检查步骤完成
        // =========================================================
        checkStep: function(stepId) {
            if (!this.isActive || this.completed) return;
            
            var step = this.steps[this.currentStep];
            if (step && step.id === stepId) {
                console.log('[Tutorial] Step completed:', stepId);
                this.nextStep();
            }
        },
        
        nextStep: function() {
            this.currentStep++;
            
            if (this.currentStep >= this.steps.length) {
                this.complete();
            } else {
                // 延迟显示下一步
                var self = this;
                setTimeout(function() {
                    self.showStep(self.currentStep);
                }, 500);
            }
        },
        
        // =========================================================
        // 完成引导
        // =========================================================
        complete: function() {
            console.log('[Tutorial] Complete!');
            this.completed = true;
            this.isActive = false;
            this.removeOverlay();
            
            var save = Utils.loadData(GameConfig.STORAGE_KEYS.TUTORIAL, {});
            save.completed = true;
            save.currentStep = this.steps.length;
            Utils.saveData(GameConfig.STORAGE_KEYS.TUTORIAL, save);
        },
        
        skip: function() {
            console.log('[Tutorial] Skipped');
            this.complete();
        },
        
        saveProgress: function() {
            var save = Utils.loadData(GameConfig.STORAGE_KEYS.TUTORIAL, {});
            save.currentStep = this.currentStep;
            Utils.saveData(GameConfig.STORAGE_KEYS.TUTORIAL, save);
        },
        
        // =========================================================
        // 重置（开发用）
        // =========================================================
        reset: function() {
            Utils.removeData(GameConfig.STORAGE_KEYS.TUTORIAL);
            this.completed = false;
            this.currentStep = 0;
            this.isActive = false;
            this.removeOverlay();
            console.log('[Tutorial] Reset');
        }
    };
})();

