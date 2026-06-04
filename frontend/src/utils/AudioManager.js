// ============================================================================
// --- PATRÓN SINGLETON: AUDIO MANAGER ---
// ============================================================================
export default class AudioManager {
  constructor() {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }
    AudioManager.instance = this;

    this.game = null;
    this.currentMusic = null;
  }

  static getInstance() {
    if (!AudioManager.instance) {
      return (AudioManager.instance = new AudioManager());
    }
    return AudioManager.instance;
  }

  init(gameInstance) {
    this.game = gameInstance;
  }

  playMusic(scene, key, config = { volume: 0.2, loop: true }) {
    if (
      this.currentMusic &&
      this.currentMusic.key === key &&
      this.currentMusic.isPlaying
    ) {
      return;
    }

    this.stopMusic();

    this.currentMusic = scene.sound.add(key, config);
    this.currentMusic.play();
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  setMute(scene, isMuted) {
    scene.sound.mute = isMuted;
  }

  isMuted(scene) {
    return scene.sound.mute;
  }
}