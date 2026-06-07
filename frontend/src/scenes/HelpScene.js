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

    // 1. Fondo oscuro general atenuado
    let fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.6); // Bajamos un poco la opacidad general
    fondoOscuro.fillRect(0, 0, width, height);

    // 2. Gráfico para el CONTENEDOR del texto (el panel central)
    let panelTexto = this.add.graphics();

    // 3. Imagen superior
    let imgHelp = this.add
      .image(width / 2, height * 0.20, "help_img")
      .setOrigin(0.5)
      .setScale(0.28 * baseScale);

    // 4. Texto con las mecánicas
    const textoAyuda = 
      "🎮 CONTROLES\n" +
      "• Flechas: Moverse | Espacio: Saltar | Z: Ladrar\n\n" +
      "🐾 MECÁNICAS DE MOCCA\n" +
      "• ¡Ladra (Z) cerca de los enemigos para aturdirlos!\n" +
      "• Cada vez que acumules 1000 puntos, ¡ganás 1 VIDA extra!";

    let txtControles = this.add
      .text(
        width / 2,
        height * 0.54,
        textoAyuda,
        {
          fontFamily: "Arial",
          fontSize: `${Math.floor(20 * baseScale)}px`,
          fill: "#ffffff",
          align: "center",
          lineSpacing: 8,
          wordWrap: { width: width * 0.75 }, // Un pelo más angosto para que entre cómodo en el panel
        }
      )
      .setOrigin(0.5);

    // --- FUNCIÓN PARA DIBUJAR EL PANEL DETRÁS DEL TEXTO ---
    const actualizarPanel = (w, h) => {
      panelTexto.clear();
      // Color de fondo del contenedor (un gris/azul oscuro semitransparente para que quede prolijo)
      panelTexto.fillStyle(0x1a1a1a, 0.9);
      // Línea de borde (opcional, le da un toque extra)
      panelTexto.lineStyle(2, 0xffcc00, 0.8); 

      // Calculamos el tamaño del panel en base al texto dinámicamente
      const panelW = w * 0.82;
      const panelH = txtControles.height + 40; // Le damos margen interno (padding) de 40px
      const panelX = (w - panelW) / 2;
      const panelY = txtControles.y - (panelH / 2);

      // Dibujamos un rectángulo con bordes redondeados (radio de 15px)
      panelTexto.fillRoundedRect(panelX, panelY, panelW, panelH, 15);
      panelTexto.strokeRoundedRect(panelX, panelY, panelW, panelH, 15);
    };

    // Dibujamos el panel por primera vez (importante: Phaser dibuja en orden, 
    // como el texto ya se creó, usamos el método para mandarlo justo detrás del texto)
    actualizarPanel(width, height);
    this.children.moveBelow(panelTexto, txtControles);

    // 5. Botón de salida
    let btnBack = this.add
      .image(width / 2, height * 0.82, "Continue")
      .setOrigin(0.5)
      .setScale(0.42 * baseScale)
      .setInteractive({ useHandCursor: true });

    btnBack.on("pointerdown", () => {
      this.scene.stop();
    });

    btnBack.on("pointerover", () => btnBack.setTint(0xffcc00));
    btnBack.on("pointerout", () => btnBack.clearTint());

    // --- HANDLER RESIZE ---
    this.resizeHandler = (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      const bScale = h / 768;

      fondoOscuro.clear();
      fondoOscuro.fillStyle(0x000000, 0.6);
      fondoOscuro.fillRect(0, 0, w, h);

      imgHelp.setPosition(w / 2, h * 0.20).setScale(0.28 * bScale);
      txtControles.setPosition(w / 2, h * 0.54).setFontSize(`${Math.floor(20 * bScale)}px`);
      
      // Redibujamos el contenedor adaptado al nuevo tamaño de pantalla
      actualizarPanel(w, h);
      
      btnBack.setPosition(w / 2, h * 0.82).setScale(0.42 * bScale);
    };

    this.scale.on("resize", this.resizeHandler);
    this.events.on("shutdown", () => {
      this.scale.off("resize", this.resizeHandler);
    });
  }
}