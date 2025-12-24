/**
 * For Augenstern - Assets
 * 资源配置（路径或Base64）
 */
(function() {
    'use strict';
    
    window.GameAssets = {
        // 背景图
        IMAGES: {
            BACKGROUNDS: {
                hub: './assets/bg_hub.jpg',
                tree: './assets/bg_tree.jpg',
                aurora: './assets/bg_aurora.jpg',
                ski: './assets/bg_ski.jpg'
            },
            ORNAMENT_PHOTOS: {
                photo_1: './assets/photos/photo1.jpg',
                photo_2: './assets/photos/photo2.jpg',
                photo_3: './assets/photos/photo3.jpg',
                photo_4: './assets/photos/photo4.jpg',
                photo_5: './assets/photos/photo5.jpg',
                photo_6: './assets/photos/photo6.jpg',
                photo_7: './assets/photos/photo7.jpg',
                photo_8: './assets/photos/photo8.jpg',
                photo_9: './assets/photos/photo9.jpg',
                photo_10: './assets/photos/photo10.jpg',
                photo_11: './assets/photos/photo11.jpg',
                photo_12: './assets/photos/photo12.jpg'
            }
        },
        
        // 占位符颜色
        PLACEHOLDER_COLORS: {
            background: '#132743',
            photo: '#2a3a5a',
            ornament: '#3a4a6a'
        },
        
        // 图标
        ICONS: {
            PLAY: '▶',
            PAUSE: '⏸',
            NEXT: '⏭',
            VOLUME: '🔊',
            MUTE: '🔇',
            BACK: '←',
            CLOSE: '✕',
            DOWNLOAD: '📥'
        }
    };
    
    Object.freeze(window.GameAssets);
})();
