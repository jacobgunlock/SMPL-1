/**
 * WaveSurfer configuration constants
 */
export const WAVESURFER_CONFIG = {
  waveColor: "rgb(100,181,246)",
  progressColor: "rgb(10, 95, 169)",
  height: 200,
  barWidth: 1,
  barGap: 1,
  barRadius: 100,
  dragToSeek: true,
  minPxPerSec: 1,
  hideScrollbar: false,
  autoCenter: false,
  autoScroll: false,
  backend: 'WebAudio',
  sampleRate: 44100,
};

export const ZOOM_CONFIG = {
  min: 1,
  max: 100,
  default: 1,
};

export const DIAL_CONFIG = {
  VOLUME_CONFIG: {
    defaultValue: 100,
    maxRotation: 180,
    sensitivity: 5,
    minValue: 0,
    maxValue: 200,
  },
  BASS_CONFIG: {
    defaultValue: 0,
    maxRotation: 180,
    sensitivity: 3,
    minValue: 0,
    maxValue: 100,
  },
  TREBLE_CONFIG: {
    defaultValue: 100,
    maxRotation: 180,
    sensitivity: 3,
    minValue: 0,
    maxValue: 100,
  },
  TEMPO_CONFIG: {
    defaultValue: 1,
    maxRotation: 180,
    sensitivity: 100,
    minValue: 0,
    maxValue: 2,
  }
};

