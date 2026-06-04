import audioManagerImport from "../utils/AudioManager.js";
const audioManager = audioManagerImport.getInstance();
// ============================================================================
// --- ESCENA: MENÚ PRINCIPAL ---
// ============================================================================
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  preload() {
    this.load.image("background", "./Assets/background.png");
    this.load.image("Continue", "./Assets/Botones/Continue.png");
    this.load.image("Credits", "./Assets/Botones/Credits.png");
    this.load.image("Help", "./Assets/Botones/Help.png");
    this.load.image("Mute", "./Assets/Botones/Mute.png");
    this.load.image("Unmute", "./Assets/Botones/Unmute.png");
    this.load.image("Start", "./Assets/Botones/Start.png");
    this.load.image("Exit", "./Assets/Botones/Exit.png");
    this.load.image("Restart", "./Assets/Botones/Restart.png");
    this.load.image("Imagen_Menu", "./Assets/Imagen_Menu.png");
    this.load.audio("level_1", "./Audio/level_1.mp3");
  }

  create() {
    const { width, height } = this.scale;

    audioManager.init(this.game);
    audioManager.playMusic(this, "level_1", { volume: 0.2, loop: true });

    let fondo = this.add.image(width / 2, height / 2, "background");
    let escalaX = width / fondo.width;
    let escalaY = height / fondo.height;
    let escalaFondo = Math.max(escalaX, escalaY);
    fondo.setScale(escalaFondo);

    const baseScale = height / 768;

    let cartelTitulo = this.add
      .image(width / 2, height * 0.28, "Imagen_Menu")
      .setOrigin(0.5)
      .setScale(0.35 * baseScale);

    const escalaBotones = 0.5 * baseScale;
    const separacion = 48 * baseScale;
    const baseBotonesY = height * 0.56;

    let btnStart = this.add
      .image(width / 2, baseBotonesY, "Start")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnStart.on("pointerdown", () => {
      this.registry.set("vidas", 3);
      this.registry.set("puntos", 0);
      this.scene.start("Level1");
    });

    let btnContinue = this.add
      .image(width / 2, baseBotonesY + separacion, "Continue")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnContinue.on("pointerdown", () => {
      console.log("Cargar partida...");
    });

    let btnHelp = this.add
      .image(width / 2, baseBotonesY + separacion * 2, "Help")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnHelp.on("pointerdown", () => {
      this.scene.launch("HelpScene");
    });

    let btnCredits = this.add
      .image(width / 2, baseBotonesY + separacion * 3, "Credits")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnCredits.on("pointerdown", () => {
      this.scene.launch("CreditsScene");
    });

    [btnStart, btnContinue, btnHelp, btnCredits].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    let btnSonido = this.add
      .image(width - 40, 40, audioManager.isMuted(this) ? "Mute" : "Unmute")
      .setOrigin(0.5)
      .setScale(0.35 * baseScale)
      .setInteractive({ useHandCursor: true });

    btnSonido.on("pointerdown", () => {
      let nuevoMute = !audioManager.isMuted(this);
      audioManager.setMute(this, nuevoMute);
      btnSonido.setTexture(nuevoMute ? "Mute" : "Unmute");
    });

    btnSonido.on("pointerover", () => btnSonido.setTint(0xffcc00));
    btnSonido.on("pointerout", () => btnSonido.clearTint());

    this.scale.on("resize", () => {
      this.scene.restart();
    });
  }

  update() {}
}