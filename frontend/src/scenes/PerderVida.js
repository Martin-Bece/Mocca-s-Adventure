
// ============================================================================
// --- ESCENA: PANTALLA INTERMEDIA AL PERDER VIDA ---
// ============================================================================
export default class PerderVida extends Phaser.Scene {
  constructor() {
    super({ key: "PerderVida" });
  }

  init(data) {
    // Guardamos la clave del nivel de donde venimos. Si por alguna razón falla, va a Level1 por defecto.
    this.nivelDeOrigen = data.currentScene || "Level1";
  }

  preload() {
    this.load.image("vida_mocca", "./Assets/vida_mocca.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    let fondo = this.add.graphics();
    fondo.fillStyle(0x000000, 1);
    fondo.fillRect(0, 0, width, height);

    let vidasRestantes = this.registry.get("vidas");
    let contenedor = this.add.container(width / 2, height / 2);

    let imgMocca = this.add
      .image(-40 * baseScale, 0, "vida_mocca")
      .setOrigin(0.5)
      .setScale(3.2 * baseScale);

    let txtVidas = this.add
      .text(30 * baseScale, 0, `x ${vidasRestantes}`, {
        fontFamily: "Arial",
        fontSize: `${Math.floor(48 * baseScale)}px`,
        fill: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    contenedor.add([imgMocca, txtVidas]);

    this.time.delayedCall(2000, () => {
      if (vidasRestantes > 0) {
        this.scene.start(this.nivelDeOrigen);
      } else {
        this.scene.start("MenuScene");
      }
    });
  }
}