export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: "IntroScene" });

    this.currentStep = 1;
    this.totalImages = 6;
  }

  preload() {
    // Cargar imágenes de la intro
    for (let i = 1; i <= this.totalImages; i++) {
      this.load.image(`img${i}`, `./Assets/img${i}.png`);
    }

    this.load.image("Continue", "./Assets/Botones/Continue.png");
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fondo negro para las bandas laterales
    this.cameras.main.setBackgroundColor("#000000");

    // =========================
    // IMAGEN INICIAL
    // =========================
    this.backgroundImage = this.add.image(width / 2, height / 2, "img1");

    this.ajustarImagen("img1");

    // =========================
    // BOTÓN SKIP
    // =========================
    const skipBtn = this.add
      .image(width - 75, 35, "Continue")
      .setOrigin(0.5)
      .setScale(0.35)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });

    skipBtn.on("pointerover", () => {
      skipBtn.setTint(0xffcc00);
    });

    skipBtn.on("pointerout", () => {
      skipBtn.clearTint();
    });

    skipBtn.on("pointerdown", (pointer, localX, localY, event) => {
      event.stopPropagation(); // evita que también avance la intro
      this.finalizarIntro();
    });

    // =========================
    // CONTROLES
    // =========================

    // Click izquierdo avanza (excepto sobre botones)
    this.input.on("pointerdown", (pointer, currentlyOver) => {
      if (currentlyOver.length === 0) {
        this.avanzarIntro();
      }
    });

    // Barra espaciadora avanza
    this.input.keyboard.on("keydown-SPACE", () => {
      this.avanzarIntro();
    });

    // ESC salta intro
    this.input.keyboard.on("keydown-ESC", () => {
      this.finalizarIntro();
    });
  }

  ajustarImagen(textureKey) {
    const img = this.textures.get(textureKey).getSourceImage();

    const scale = Math.min(
      this.cameras.main.width / img.width,
      this.cameras.main.height / img.height,
    );

    this.backgroundImage.setScale(scale);
  }

  avanzarIntro() {
    this.currentStep++;

    if (this.currentStep > this.totalImages) {
      this.finalizarIntro();
      return;
    }

    // Fade suave
    this.cameras.main.fadeOut(150);

    this.time.delayedCall(150, () => {
      this.backgroundImage.setTexture(`img${this.currentStep}`);

      // Reajustar escala por si cambia el tamaño de la imagen
      this.ajustarImagen(`img${this.currentStep}`);

      this.cameras.main.fadeIn(150);
    });
  }

  finalizarIntro() {
    this.input.keyboard.removeAllListeners();
    this.input.removeAllListeners();

    this.scene.start("LoginScene");
  }
}
