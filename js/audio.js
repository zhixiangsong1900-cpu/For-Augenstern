/**
 * For Augenstern - Audio
 * BGM播放 + 程序化音效
 */
(function() {
    'use strict';
    
    window.AudioManager = {
        // Web Audio API
        ctx: null,
        unlocked: false,
        sfxGain: null,
        sfxVolume: 0.5,
        
        // BGM (使用HTML Audio元素，兼容性更好)
        bgmAudio: null,
        bgmVolume: 0.4,
        isPlaying: false,
        muted: false,
        
        // BGM文件路径
        bgmSrc: './assets/audio/audio1.mp3',
        
        init: function() {
            // 创建BGM Audio元素
            this.bgmAudio = new Audio();
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = this.bgmVolume;
            this.bgmAudio.preload = 'auto';
            this.bgmAudio.src = this.bgmSrc;
            
            // 监听加载事件
            this.bgmAudio.addEventListener('canplaythrough', function() {
                console.log('[Audio] BGM加载完成');
            });
            
            this.bgmAudio.addEventListener('error', function(e) {
                console.warn('[Audio] BGM加载失败，尝试备用格式');
                // 如果FLAC不支持，尝试其他格式
            });
            
            console.log('[Audio] 初始化完成');
        },
        
        unlock: function() {
            var self = this;
            return new Promise(function(resolve) {
                if (self.unlocked) {
                    resolve();
                    return;
                }
                
                try {
                    // 初始化Web Audio API用于音效
                    var AudioContext = window.AudioContext || window.webkitAudioContext;
                    self.ctx = new AudioContext();
                    
                    self.sfxGain = self.ctx.createGain();
                    self.sfxGain.gain.value = self.sfxVolume;
                    self.sfxGain.connect(self.ctx.destination);
                    
                    // 播放静音来解锁
                    var silentBuffer = self.ctx.createBuffer(1, 1, 22050);
                    var source = self.ctx.createBufferSource();
                    source.buffer = silentBuffer;
                    source.connect(self.ctx.destination);
                    source.start(0);
                    
                    // 同时尝试播放BGM来解锁
                    if (self.bgmAudio) {
                        self.bgmAudio.play().then(function() {
                            console.log('[Audio] BGM已解锁并开始播放');
                            self.isPlaying = true;
                        }).catch(function(e) {
                            console.log('[Audio] BGM播放需要用户交互:', e.message);
                        });
                    }
                    
                    self.unlocked = true;
                    console.log('[Audio] 音频已解锁');
                    resolve();
                } catch (e) {
                    console.warn('[Audio] 解锁失败:', e);
                    self.unlocked = true;
                    resolve();
                }
            });
        },
        
        playBgm: function() {
            if (!this.bgmAudio || this.muted) return;
            
            var self = this;
            this.bgmAudio.play().then(function() {
                self.isPlaying = true;
                console.log('[Audio] BGM开始播放');
            }).catch(function(e) {
                console.warn('[Audio] BGM播放失败:', e.message);
            });
        },
        
        stopBgm: function() {
            if (this.bgmAudio) {
                this.bgmAudio.pause();
                this.isPlaying = false;
            }
        },
        
        pauseBgm: function() {
            if (this.bgmAudio) {
                this.bgmAudio.pause();
                this.isPlaying = false;
            }
        },
        
        resumeBgm: function() {
            if (!this.muted) {
                this.playBgm();
            }
        },
        
        toggleBgm: function() {
            if (this.isPlaying) {
                this.pauseBgm();
            } else {
                this.playBgm();
            }
            return this.isPlaying;
        },
        
        toggleMute: function() {
            this.muted = !this.muted;
            
            if (this.muted) {
                if (this.bgmAudio) this.bgmAudio.volume = 0;
                if (this.sfxGain) this.sfxGain.gain.value = 0;
            } else {
                if (this.bgmAudio) this.bgmAudio.volume = this.bgmVolume;
                if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
            }
            
            return this.muted;
        },
        
        isMuted: function() {
            return this.muted;
        },
        
        setVolume: function(volume) {
            this.bgmVolume = Math.max(0, Math.min(1, volume));
            if (this.bgmAudio && !this.muted) {
                this.bgmAudio.volume = this.bgmVolume;
            }
        },
        
        // =========================================================
        // 音效（程序化生成）
        // =========================================================
        playSfx: function(type) {
            if (!this.unlocked || !this.ctx || this.muted) return;
            
            switch (type) {
                case 'ding':
                    this.playTone(880, 'sine', 0.15, 0.25);
                    break;
                case 'magic':
                    this.playTone(523, 'sine', 0.1, 0.4);
                    setTimeout(function() { AudioManager.playTone(659, 'sine', 0.1, 0.35); }, 80);
                    setTimeout(function() { AudioManager.playTone(784, 'sine', 0.1, 0.3); }, 160);
                    setTimeout(function() { AudioManager.playTone(1047, 'sine', 0.08, 0.4); }, 240);
                    break;
                case 'whoosh':
                    this.playNoise(0.08, 0.12);
                    break;
                case 'collect':
                    this.playTone(698, 'square', 0.08, 0.12);
                    setTimeout(function() { AudioManager.playTone(880, 'square', 0.08, 0.12); }, 60);
                    break;
                case 'crash':
                    this.playNoise(0.15, 0.25);
                    break;
            }
        },
        
        playTone: function(freq, type, volume, duration) {
            if (!this.ctx) return;
            
            var ctx = this.ctx;
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            
            var now = ctx.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume || 0.15, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (duration || 0.25));
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(now);
            osc.stop(now + (duration || 0.25));
        },
        
        playNoise: function(volume, duration) {
            if (!this.ctx) return;
            
            var ctx = this.ctx;
            var bufferSize = ctx.sampleRate * (duration || 0.15);
            var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            var data = buffer.getChannelData(0);
            
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            
            var source = ctx.createBufferSource();
            var gain = ctx.createGain();
            
            source.buffer = buffer;
            gain.gain.value = volume || 0.08;
            
            source.connect(gain);
            gain.connect(this.sfxGain);
            
            source.start();
        }
    };
    
})();
