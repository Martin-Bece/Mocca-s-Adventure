// ============================================================================
// --- ESCENA: MENÚ INTERNO DE AYUDA (HELP) ---
// ============================================================================
export default class HelpScene extends Phaser.Scene {
  constructor() {
    super({ key: "HelpScene" });
  }

  preload() {
    this.load.image("help_img", "./Assets/help_img.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    let fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.7);
    fondoOscuro.fillRect(0, 0, width, height);

    let imgHelp = this.add
      .image(width / 2, height * 0.28, "help_img")
      .setOrigin(0.5)
      .setScale(0.32 * baseScale);

    let txtControles = this.add
      .text(
        width / 2,
        height * 0.52,
        "Controles: Flechas para moverte, Espacio para saltar y Z para ladrar.",
        {
          fontFamily: "Arial",
          fontSize: `${Math.floor(22 * baseScale)}px`,
          fill: "#ffffff",
          align: "center",
          wordWrap: { width: width * 0.8 },
        },
      )
      .setOrigin(0.5);

    let btnBack = this.add
      .image(width / 2, height * 0.68, "Continue")
      .setOrigin(0.5)
      .setScale(0.45 * baseScale)
      .setInteractive({ useHandCursor: true });

    btnBack.on("pointerdown", () => {
      this.scene.stop();
    });

    btnBack.on("pointerover", () => btnBack.setTint(0xffcc00));
    btnBack.on("pointerout", () => btnBack.clearTint());

    this.scale.on("resize", () => {
      this.scene.restart();
    });
  }
}