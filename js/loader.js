/**
 * For Augenstern - Loader
 */
(function() {
    'use strict';
    
    window.Loader = {
        images: {},
        loadQueue: [],
        loaded: 0,
        total: 0,
        
        loadImage: function(id, src) {
            var self = this;
            return new Promise(function(resolve) {
                var img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = function() {
                    self.images[id] = img;
                    self.loaded++;
                    resolve(img);
                };
                
                img.onerror = function() {
                    console.warn('[Loader] 加载失败:', src);
                    self.images[id] = null;
                    self.loaded++;
                    resolve(null);
                };
                
                // Base64或路径
                img.src = src;
            });
        },
        
        getImage: function(id) {
            return this.images[id] || null;
        },
        
        preloadAll: function(imageList) {
            var self = this;
            this.total = imageList.length;
            this.loaded = 0;
            
            var promises = imageList.map(function(item) {
                return self.loadImage(item.id, item.src);
            });
            
            return Promise.all(promises);
        },
        
        getProgress: function() {
            return this.total > 0 ? this.loaded / this.total : 1;
        }
    };
    
})();
