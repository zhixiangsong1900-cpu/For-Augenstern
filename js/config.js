/**
 * For Augenstern - Config
 */
(function() {
    'use strict';

    window.GameConfig = {
        GAME_TITLE: 'For Augenstern',
        VERSION: '2.0.0',
        
        // 开发模式：设为true时，每次刷新都会重置游戏状态
        DEV_MODE: true,
        
        LOGICAL_WIDTH: 720,
        LOGICAL_HEIGHT: 1280,
        SAFE_AREA_TOP: 44,
        SAFE_AREA_BOTTOM: 34,
        
        // =========================================================
        // 终章触发时间
        // =========================================================
        FINALE_TRIGGER_TIME: new Date('2025-12-25T00:00:00+08:00').getTime(),
        COUNTDOWN_START: 10,  // 倒计时从10开始（与照片数量一致）
        
        // =========================================================
        // 轮播消息 - 《花冠》保罗·策兰
        // =========================================================
        CAROUSEL_MESSAGES: [
            '秋天轻咬我手中的树叶：我们是朋友',
            '我们从坚果里剥去时间，教它走路',
            '时间回到它的壳中',
            '镜中是星期天，在梦里入梦，嘴巴说出真相',
            '我的目光投向爱人的身体',
            '我们互相凝视，我们倾吐心中不悦',
            '我们相爱如罂粟和记忆',
            '我们昏睡如海贝里的酒，像月亮血喷时的大海',
            '我们在窗前拥抱，他们在街上看着',
            '是时候让人们知道了！',
            '是时候了，石头也会开花，一颗心不安地跳动',
            '是时候，时间到了',
            '是时候了'
        ],
        MESSAGE_INTERVAL: 5000,  // 每5秒切换一句
        
        // =========================================================
        // 照片/挂件数据（核心配置）
        // 每个物件绑定1张预置照片
        // =========================================================
        PHOTOS: [
            { 
                id: 'photo_1', 
                title: '长沙', 
                icon: '🚂',
                message: '橘子洲头的夜晚，小火车的我们相依而坐',
                src: './assets/photos/photo1.jpg',
                frameStyle: 'gold'
            },
            { 
                id: 'photo_2', 
                title: '马拉松', 
                icon: '🏃',
                message: '马拉松的意义不止是终点，还有陪伴你的Ta',
                src: './assets/photos/photo2.jpg',
                frameStyle: 'red'
            },
            { 
                id: 'photo_3', 
                title: '童年', 
                icon: '🎈',
                message: '渴望参与你的每一个瞬间，过去，现在和未来',
                src: './assets/photos/photo3.jpg',
                frameStyle: 'gold'
            },
            { 
                id: 'photo_4', 
                title: '歌声', 
                icon: '🎵',
                message: '歌声能抚平所有忧伤的心灵',
                src: './assets/photos/photo4.jpg',
                frameStyle: 'red'
            },
            { 
                id: 'photo_5', 
                title: '大人中', 
                icon: '👣',
                message: '一步一步走过昨天我的孩子气',
                src: './assets/photos/photo5.jpg',
                frameStyle: 'gold'
            },
            { 
                id: 'photo_6', 
                title: '爱人', 
                icon: '❤️',
                message: '阳光下的你光彩照人',
                src: './assets/photos/photo6.jpg',
                frameStyle: 'red'
            },
            { 
                id: 'photo_7', 
                title: '毕业', 
                icon: '🎓',
                message: '玻璃晴朗，橘子辉煌',
                src: './assets/photos/photo7.jpg',
                frameStyle: 'gold'
            },
            { 
                id: 'photo_8', 
                title: '鱼', 
                icon: '🐟',
                message: '没有你的日子，像离开水的鱼',
                src: './assets/photos/photo8.jpg',
                frameStyle: 'red'
            },
            { 
                id: 'photo_9', 
                title: '公园', 
                icon: '🌳',
                message: '在一个阳光明媚的午后',
                src: './assets/photos/photo9.jpg',
                frameStyle: 'gold'
            },
            { 
                id: 'photo_10', 
                title: '日子', 
                icon: '✨',
                message: '平凡的日子里泛着光',
                src: './assets/photos/photo10.jpg',
                frameStyle: 'red'
            }
        ],
        
        // =========================================================
        // 圣诞树锚点配置（用于挂件吸附）
        // =========================================================
        TREE_ANCHOR_POINTS: [
            // 顶部
            { x: 360, y: 180, layer: 1 },
            // 第二层
            { x: 300, y: 250, layer: 2 }, 
            { x: 420, y: 250, layer: 2 },
            // 第三层
            { x: 250, y: 320, layer: 3 }, 
            { x: 360, y: 300, layer: 3 }, 
            { x: 470, y: 320, layer: 3 },
            // 第四层
            { x: 200, y: 400, layer: 4 }, 
            { x: 300, y: 380, layer: 4 }, 
            { x: 420, y: 380, layer: 4 }, 
            { x: 520, y: 400, layer: 4 },
            // 第五层
            { x: 160, y: 480, layer: 5 }, 
            { x: 260, y: 460, layer: 5 }, 
            { x: 360, y: 450, layer: 5 }, 
            { x: 460, y: 460, layer: 5 }, 
            { x: 560, y: 480, layer: 5 },
            // 第六层
            { x: 130, y: 560, layer: 6 }, 
            { x: 230, y: 540, layer: 6 }, 
            { x: 330, y: 530, layer: 6 }, 
            { x: 430, y: 530, layer: 6 }, 
            { x: 530, y: 540, layer: 6 }, 
            { x: 600, y: 560, layer: 6 }
        ],
        
        // 树区域边界（用于判断拖拽是否在树上）
        TREE_BOUNDS: {
            left: 120,
            right: 600,
            top: 120,
            bottom: 620
        },
        
        // =========================================================
        // 极光参数
        // =========================================================
        AURORA: {
            LAYERS: 4,
            COLORS: [
                { r: 80, g: 255, b: 180, a: 0.4 },   // 主绿色
                { r: 100, g: 220, b: 255, a: 0.3 },  // 青色
                { r: 150, g: 100, b: 255, a: 0.25 }, // 紫色
                { r: 60, g: 200, b: 140, a: 0.2 }    // 深绿
            ],
            WAVE_SPEED: 0.3,
            WAVE_AMPLITUDE: 40,
            VERTICAL_DRIFT: 0.5
        },
        
        // =========================================================
        // 滑雪参数（横向跑酷）
        // =========================================================
        SKI: {
            SCROLL_SPEED: 6,        // 基础滚动速度
            MAX_SPEED: 12,          // 最大速度
            JUMP_FORCE: 18,         // 跳跃力度
            GRAVITY: 0.8,           // 重力
            GROUND_Y: 900,          // 地面Y坐标
            GAME_DURATION: 45000,   // 游戏时长
            OBSTACLE_TYPES: [
                { type: 'tree', emoji: '🌲', width: 50, height: 80 },
                { type: 'rock', emoji: '🪨', width: 40, height: 40 },
                { type: 'snowpile', emoji: '⛄', width: 60, height: 50 }
            ],
            COLLECTIBLE_TYPES: [
                { type: 'gift', emoji: '🎁', points: 10 },
                { type: 'star', emoji: '⭐', points: 25 },
                { type: 'crystal', emoji: '💎', points: 50 }
            ],
            REWARDS: [
                { id: 'frame_gold', name: '金色相框', points: 50, type: 'frame' },
                { id: 'lights_warm', name: '暖色灯串', points: 100, type: 'lights' },
                { id: 'snow_gold', name: '金粉雪花', points: 200, type: 'effect' }
            ]
        },
        
        // =========================================================
        // 引导系统配置
        // =========================================================
        TUTORIAL: {
            STEPS: [
                { id: 'start', target: '#start-btn', text: '点击开始旅程', action: 'click' },
                { id: 'open_gift', target: '.gift-item', text: '点开礼物看照片', action: 'click' },
                { id: 'hang_photo', target: '#hang-btn', text: '把照片挂到树上', action: 'click' },
                { id: 'drag_to_tree', target: '#game-canvas', text: '拖到树上松手', action: 'drag' },
                { id: 'light_tree', target: '#light-btn', text: '点亮圣诞树', action: 'click' },
                { id: 'go_aurora', target: '#nav-aurora', text: '去看极光', action: 'click' },
                { id: 'go_ski', target: '#nav-ski', text: '去滑雪收礼物', action: 'click' },
                { id: 'go_finale', target: '#nav-finale', text: '进入终章', action: 'click' }
            ]
        },
        
        // =========================================================
        // 终章信件
        // =========================================================
        FINALE_LETTER: [
            'Merry Christmas',
            '',
            '亲爱的你：',
            '感谢你出现在我的生命中',
            '让平凡的日子都闪闪发光',
            '',
            '愿我们的故事',
            '像这棵圣诞树一样',
            '永远闪耀着幸福的光芒',
            '',
            '我爱你 ❤️'
        ],
        
        // =========================================================
        // 存储键
        // =========================================================
        STORAGE_KEYS: {
            SAVE_DATA: 'augenstern_save',
            TUTORIAL: 'augenstern_tutorial',
            SETTINGS: 'augenstern_settings'
        }
    };
    
    Object.freeze(window.GameConfig);
})();
