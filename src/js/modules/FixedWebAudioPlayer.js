import EventEmitter from 'wavesurfer.js/dist/event-emitter.js';

/**
 * A fixed Web Audio buffer player that correctly handles playback rate changes.
 * This fixes the known WaveSurfer.js issue where setPlaybackRate causes the 
 * playback marker to desync from the actual audio position.
 */
class FixedWebAudioPlayer extends EventEmitter {
    constructor(audioContext = new AudioContext()) {
        super();
        this.bufferNode = null;
        this.playStartTime = 0;
        this.playedDuration = 0;
        this._muted = false;
        this._playbackRate = 1;
        this._duration = undefined;
        this.buffer = null;
        this.currentSrc = '';
        this.paused = true;
        this.crossOrigin = null;
        this.seeking = false;
        this.autoplay = false;
        
        this.addEventListener = this.on;
        this.removeEventListener = this.un;
        
        this.audioContext = audioContext;
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
    }

    async load() {
        return;
    }

    get src() {
        return this.currentSrc;
    }

    set src(value) {
        this.currentSrc = value;
        this._duration = undefined;
        if (!value) {
            this.buffer = null;
            this.emit('emptied');
            return;
        }
        fetch(value)
            .then((response) => {
                if (response.status >= 400) {
                    throw new Error(`Failed to fetch ${value}: ${response.status} (${response.statusText})`);
                }
                return response.arrayBuffer();
            })
            .then((arrayBuffer) => {
                if (this.currentSrc !== value) return null;
                return this.audioContext.decodeAudioData(arrayBuffer);
            })
            .then((audioBuffer) => {
                if (this.currentSrc !== value) return;
                this.buffer = audioBuffer;
                this.emit('loadedmetadata');
                this.emit('canplay');
                if (this.autoplay) this.play();
            });
    }

    _play() {
        if (!this.paused) return;
        this.paused = false;
        
        this.bufferNode?.disconnect();
        this.bufferNode = this.audioContext.createBufferSource();
        
        if (this.buffer) {
            this.bufferNode.buffer = this.buffer;
        }
        
        this.bufferNode.playbackRate.value = this._playbackRate;
        this.bufferNode.connect(this.gainNode);
        
        // playedDuration now stores actual audio position (not real time)
        let currentPos = this.playedDuration;
        if (currentPos >= this.duration) {
            currentPos = 0;
            this.playedDuration = 0;
        }
        
        this.bufferNode.start(this.audioContext.currentTime, currentPos);
        this.playStartTime = this.audioContext.currentTime;
        
        this.bufferNode.onended = () => {
            // Calculate position before pausing changes playedDuration
            const endPosition = this.playedDuration + (this.audioContext.currentTime - this.playStartTime) * this._playbackRate;
            // Check if we reached the end (with small tolerance for floating point)
            if (endPosition >= this.duration - 0.05) {
                this.pause();
                this.emit('ended');
            }
        };
    }

    _pause() {
        this.paused = true;
        this.bufferNode?.stop();
        // Store the actual audio position (elapsed real time × playback rate)
        this.playedDuration += (this.audioContext.currentTime - this.playStartTime) * this._playbackRate;
    }

    async play() {
        if (!this.paused) return;
        this._play();
        this.emit('play');
    }

    pause() {
        if (this.paused) return;
        this._pause();
        this.emit('pause');
    }

    stopAt(timeSeconds) {
        const delay = timeSeconds - this.currentTime;
        this.bufferNode?.stop(this.audioContext.currentTime + delay);
        this.bufferNode?.addEventListener('ended', () => {
            this.bufferNode = null;
            this.pause();
        }, { once: true });
    }

    async setSinkId(deviceId) {
        const ac = this.audioContext;
        return ac.setSinkId(deviceId);
    }

    get playbackRate() {
        return this._playbackRate;
    }

    set playbackRate(value) {
        if (value === this._playbackRate) return;
        
        // If playing, first update playedDuration to capture time played so far
        if (!this.paused) {
            this.playedDuration += (this.audioContext.currentTime - this.playStartTime) * this._playbackRate;
            this.playStartTime = this.audioContext.currentTime;
        }
        
        // Now change the rate - playedDuration stays the same because it's in audio time
        this._playbackRate = value;
        
        if (this.bufferNode) {
            this.bufferNode.playbackRate.value = value;
        }
    }

    get currentTime() {
        // playedDuration is now in audio time, so we just add the current session's audio time
        if (this.paused) {
            return this.playedDuration;
        }
        return this.playedDuration + (this.audioContext.currentTime - this.playStartTime) * this._playbackRate;
    }

    set currentTime(value) {
        const wasPlaying = !this.paused;
        if (wasPlaying) this._pause();
        // Store directly as audio position
        this.playedDuration = value;
        if (wasPlaying) this._play();
        this.emit('seeking');
        this.emit('timeupdate');
    }

    get duration() {
        return this._duration ?? (this.buffer?.duration || 0);
    }

    set duration(value) {
        this._duration = value;
    }

    get volume() {
        return this.gainNode.gain.value;
    }

    set volume(value) {
        this.gainNode.gain.value = value;
        this.emit('volumechange');
    }

    get muted() {
        return this._muted;
    }

    set muted(value) {
        if (this._muted === value) return;
        this._muted = value;
        if (this._muted) {
            this.gainNode.disconnect();
        } else {
            this.gainNode.connect(this.audioContext.destination);
        }
    }

    canPlayType(mimeType) {
        return /^(audio|video)\//.test(mimeType);
    }

    getGainNode() {
        return this.gainNode;
    }

    getChannelData() {
        const channels = [];
        if (!this.buffer) return channels;
        const numChannels = this.buffer.numberOfChannels;
        for (let i = 0; i < numChannels; i++) {
            channels.push(this.buffer.getChannelData(i));
        }
        return channels;
    }
}

export default FixedWebAudioPlayer;

