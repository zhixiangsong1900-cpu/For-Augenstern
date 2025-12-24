/**
 * For Augenstern - Input
 */
(function() {
    'use strict';
    
    window.Input = {
        canvas: null,
        isPointerDown: false,
        pointerX: 0,
        pointerY: 0,
        logicalPointer: { x: 0, y: 0 },
        
        // 回调
        onTap: null,
        onDragStart: null,
        onDragMove: null,
        onDragEnd: null,
        
        // 拖拽状态
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragThreshold: 10,
        
        init: function(canvas) {
            this.canvas = canvas;
            
            // 鼠标事件
            canvas.addEventListener('mousedown', this.handlePointerDown.bind(this));
            canvas.addEventListener('mousemove', this.handlePointerMove.bind(this));
            canvas.addEventListener('mouseup', this.handlePointerUp.bind(this));
            canvas.addEventListener('mouseleave', this.handlePointerUp.bind(this));
            
            // 触摸事件
            canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
            canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
            
            console.log('[Input] 初始化完成');
        },
        
        // 坐标转换
        clientToLogical: function(clientX, clientY) {
            var rect = this.canvas.getBoundingClientRect();
            var scaleX = GameConfig.LOGICAL_WIDTH / rect.width;
            var scaleY = GameConfig.LOGICAL_HEIGHT / rect.height;
            
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        },
        
        // 鼠标处理
        handlePointerDown: function(e) {
            e.preventDefault();
            this.isPointerDown = true;
            this.pointerX = e.clientX;
            this.pointerY = e.clientY;
            this.logicalPointer = this.clientToLogical(e.clientX, e.clientY);
            this.dragStartX = this.logicalPointer.x;
            this.dragStartY = this.logicalPointer.y;
            this.isDragging = false;
        },
        
        handlePointerMove: function(e) {
            if (!this.isPointerDown) return;
            e.preventDefault();
            
            this.pointerX = e.clientX;
            this.pointerY = e.clientY;
            this.logicalPointer = this.clientToLogical(e.clientX, e.clientY);
            
            var dx = this.logicalPointer.x - this.dragStartX;
            var dy = this.logicalPointer.y - this.dragStartY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            
            if (!this.isDragging && dist > this.dragThreshold) {
                this.isDragging = true;
                if (this.onDragStart) {
                    this.onDragStart(this.dragStartX, this.dragStartY);
                }
            }
            
            if (this.isDragging && this.onDragMove) {
                this.onDragMove(this.logicalPointer.x, this.logicalPointer.y);
            }
        },
        
        handlePointerUp: function(e) {
            if (!this.isPointerDown) return;
            e.preventDefault();
            
            this.logicalPointer = this.clientToLogical(this.pointerX, this.pointerY);
            
            if (this.isDragging) {
                if (this.onDragEnd) {
                    this.onDragEnd(this.logicalPointer.x, this.logicalPointer.y);
                }
            } else {
                if (this.onTap) {
                    this.onTap(this.logicalPointer.x, this.logicalPointer.y);
                }
            }
            
            this.isPointerDown = false;
            this.isDragging = false;
        },
        
        // 触摸处理
        handleTouchStart: function(e) {
            e.preventDefault();
            if (e.touches.length > 0) {
                var touch = e.touches[0];
                this.isPointerDown = true;
                this.pointerX = touch.clientX;
                this.pointerY = touch.clientY;
                this.logicalPointer = this.clientToLogical(touch.clientX, touch.clientY);
                this.dragStartX = this.logicalPointer.x;
                this.dragStartY = this.logicalPointer.y;
                this.isDragging = false;
            }
        },
        
        handleTouchMove: function(e) {
            e.preventDefault();
            if (!this.isPointerDown || e.touches.length === 0) return;
            
            var touch = e.touches[0];
            this.pointerX = touch.clientX;
            this.pointerY = touch.clientY;
            this.logicalPointer = this.clientToLogical(touch.clientX, touch.clientY);
            
            var dx = this.logicalPointer.x - this.dragStartX;
            var dy = this.logicalPointer.y - this.dragStartY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            
            if (!this.isDragging && dist > this.dragThreshold) {
                this.isDragging = true;
                if (this.onDragStart) {
                    this.onDragStart(this.dragStartX, this.dragStartY);
                }
            }
            
            if (this.isDragging && this.onDragMove) {
                this.onDragMove(this.logicalPointer.x, this.logicalPointer.y);
            }
        },
        
        handleTouchEnd: function(e) {
            e.preventDefault();
            if (!this.isPointerDown) return;
            
            if (this.isDragging) {
                if (this.onDragEnd) {
                    this.onDragEnd(this.logicalPointer.x, this.logicalPointer.y);
                }
            } else {
                if (this.onTap) {
                    this.onTap(this.logicalPointer.x, this.logicalPointer.y);
                }
            }
            
            this.isPointerDown = false;
            this.isDragging = false;
        },
        
        // 清除回调
        clearCallbacks: function() {
            this.onTap = null;
            this.onDragStart = null;
            this.onDragMove = null;
            this.onDragEnd = null;
        }
    };
    
})();
