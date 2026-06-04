// ============================================================================
// --- ESCENA: PANTALLA DE VICTORIA SUPERPUESTA ---
// ============================================================================
export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: "WinScene" });
  }

  init(data) {
    // Recibe los datos enviados desde el nivel
    this.escenaOrigen = data.escenaOrigen;
    this.puntosFinales = data.puntos || 0;
    this.vidasFinales = data.vidas || 0;
    this.tiempoFinal = data.tiempo || 0;
  }

  preload() {
    this.load.image("win_img", "./Assets/win_img.png");
    this.load.image("Continue", "./Assets/Botones/Continue.png");
    this.load.image("Exit", "./Assets/Botones/Exit.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    // 1. Fondo oscuro semitransparente
    let fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.7);
    fondoOscuro.fillRect(0, 0, width, height);

    // 2. Imagen de Victoria (win_img) arriba
    let imgWin = this.add
      .image(width / 2, height * 0.22, "win_img")
      .setOrigin(0.5)
      .setScale(0.32 * baseScale);

    // 3. Formatear el tiempo a MM:SS
    let minutos = Math.floor(this.tiempoFinal / 60);
    let segundos = this.tiempoFinal % 60;
    let tiempoTexto = `${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;

    // 4. Contenedor de Estadísticas (Puntos, Vidas, Tiempo)
    const estiloTexto = {
      fontFamily: "Arial",
      fontSize: `${24 * baseScale}px`,
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center",
    };

    this.add
      .text(width / 2, height * 0.44, `¡Nivel Completado!`, {
        ...estiloTexto,
        fontSize: `${32 * baseScale}px`,
        fill: "#ffff00",
      })
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height * 0.52,
        `Puntos Totales: ${this.puntosFinales}`,
        estiloTexto,
      )
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height * 0.58,
        `Vidas Restantes: x${this.vidasFinales}`,
        estiloTexto,
      )
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height * 0.64,
        `Tiempo de Juego: ${tiempoTexto}`,
        estiloTexto,
      )
      .setOrigin(0.5);

    // 5. Botones de Control en disposición horizontal (uno al lado del otro)
    const escalaBotones = 0.4 * baseScale;
    const botonesY = height * 0.78;
    const separacionHorizontal = 110 * baseScale; // Distancia desde el centro para cada lado

    // Botón Exit (A la izquierda)
    let btnExit = this.add
      .image(width / 2 - separacionHorizontal, botonesY, "Exit")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnExit.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.escenaOrigen);
      this.scene.start("MenuScene"); // Te manda al menú de inicio
    });

    // Botón Continue (A la derecha)
    let btnContinue = this.add
      .image(width / 2 + separacionHorizontal, botonesY, "Continue")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnContinue.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.escenaOrigen);

      this.registry.set("puntos", 0);
      this.registry.set("tiempo", 0);

      // Si venías del Nivel 1, te pasa al 2. Si venías del 2, podrías mandarlo a una pantalla final o menú.
      if (this.escenaOrigen === "Level1") {
        this.scene.start("Level2");
      } else {
        this.scene.start("MenuScene");
      }
    });

    // Efecto visual hover para los botones
    [btnExit, btnContinue].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    // Manejo de resize
    this.scale.on("resize", () => {
      this.scene.restart({
        escenaOrigen: this.escenaOrigen,
        puntos: this.puntosFinales,
        vidas: this.vidasFinales,
        tiempo: this.tiempoFinal,
      });
    });
  }
}