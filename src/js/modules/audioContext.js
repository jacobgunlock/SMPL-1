import FixedWebAudioPlayer from "./FixedWebAudioPlayer.js";
const AudioContext = window.AudioContext || window.webkitAudioContext;
let webAudioPlayer = null;
let sharedContext = null;

export const getAudioContext = () => {
    if (!sharedContext) {
        sharedContext = new AudioContext();
    }
    return sharedContext;
};

export const getWebAudioPlayer = () => {
    if (!webAudioPlayer) {
        webAudioPlayer = new FixedWebAudioPlayer(getAudioContext());
        webAudioPlayer.src = "/Sayin.wav";
    }
    return webAudioPlayer;
};