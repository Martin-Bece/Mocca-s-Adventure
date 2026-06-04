// ============================================================================
// --- ESCENA: MENÚ INTERNO DE CRÉDITOS (CREDITS) ---
// ============================================================================
export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: "CreditsScene" });
  }

  preload() {
    this.load.image("credits_img", "./Assets/credits_img.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    let fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.7);
    fondoOscuro.fillRect(0, 0, width, height);

    let imgCredits = this.add
      .image(width / 2, height * 0.28, "credits_img")
      .setOrigin(0.5)
      .setScale(0.32 * baseScale);

    let txtCreditos = this.add
      .text(
        width / 2,
        height * 0.52,
        "Juego realizado por Martin Nahuel Becerra - Universidad de la Punta 2026",
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