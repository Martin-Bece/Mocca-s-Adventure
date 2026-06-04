// ============================================================================
// --- ESCENA: MENÚ DE PAUSA SUPERPUESTO (CORREGIDO) ---
// ============================================================================
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: "PauseScene" });
  }

  init(data) {
    this.nivelActual = data.currentScene || "Level1";
  }

  preload() {
    this.load.image("pause_img", "./Assets/pause_img.png");
    this.load.image("Continue", "./Assets/Botones/Continue.png"); 
    this.load.image("Restart", "./Assets/Botones/Restart.png");
    this.load.image("Exit", "./Assets/Botones/Exit.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    let fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.6);
    fondoOscuro.fillRect(0, 0, width, height);

    let imgPausa = this.add
      .image(width / 2, height * 0.24, "pause_img")
      .setOrigin(0.5)
      .setScale(0.28 * baseScale);

    const escalaBotones = 0.4 * baseScale;
    const separacion = 60 * baseScale;
    const baseBotonesY = height * 0.6;

    let btnResume = this.add
      .image(width / 2, baseBotonesY, "Continue")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnResume.on("pointerdown", () => {
      this.scene.stop();
      this.scene.resume(this.nivelActual);
    });

    let btnRestart = this.add
      .image(width / 2, baseBotonesY + separacion, "Restart")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnRestart.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.nivelActual);

      this.registry.set("puntos", 0);
      this.registry.set("tiempo", 0);

      this.scene.start(this.nivelActual);
    });

    let btnExit = this.add
      .image(width / 2, baseBotonesY + separacion * 2, "Exit")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnExit.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.nivelActual);
      this.scene.start("MenuScene");
    });

    [btnResume, btnRestart, btnExit].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    // --- MANEJO DE RESIZE SEGURO PARA LA PAUSA ---
    this.resizeHandler = (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      const bScale = h / 768;
      const eBotones = 0.4 * bScale;
      const sep = 60 * bScale;
      const bBotonesY = h * 0.6;

      fondoOscuro.clear();
      fondoOscuro.fillStyle(0x000000, 0.6);
      fondoOscuro.fillRect(0, 0, w, h);

      imgPausa.setPosition(w / 2, h * 0.24).setScale(0.28 * bScale);
      btnResume.setPosition(w / 2, bBotonesY).setScale(eBotones);
      btnRestart.setPosition(w / 2, bBotonesY + sep).setScale(eBotones);
      btnExit.setPosition(w / 2, bBotonesY + sep * 2).setScale(eBotones);
    };

    this.scale.on("resize", this.resizeHandler);

    this.events.on("shutdown", () => {
      this.scale.off("resize", this.resizeHandler);
    });
  }
}