import LoginScene from "./scenes/LoginScene.js";
import MenuScene from "./scenes/MenuScene.js";
import Level1 from "./scenes/Level1.js";
import PerderVida from "./scenes/PerderVida.js";
import PauseScene from "./scenes/PauseScene.js";
import HelpScene from "./scenes/HelpScene.js";
import CreditsScene from "./scenes/CreditsScene.js";
import Level2 from "./scenes/Level2.js";
import WinScene from "./scenes/WinScene.js";

// ============================================================================
// --- CONFIGURACIÓN E INICIALIZACIÓN ---
// ============================================================================
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  dom: {
    createContainer: true,
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 500 },
      debug: false,
    },
  },
  scene: [
    LoginScene,
    MenuScene,
    Level1,
    PerderVida,
    PauseScene,
    HelpScene,
    CreditsScene,
    Level2,
    WinScene,
  ],
};

const game = new Phaser.Game(config);
