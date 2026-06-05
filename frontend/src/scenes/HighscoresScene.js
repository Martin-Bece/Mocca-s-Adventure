import { authService } from "../services/api.js";

// ============================================================================
// --- ESCENA: TABLA DE POSICIONES (HIGHSCORES) ---
// ============================================================================
export default class HighscoresScene extends Phaser.Scene {
  constructor() {
    super({ key: "HighscoresScene" });
  }

  preload() {
    // Cargamos la imagen del encabezado
    this.load.image("Highscores_img", "./Assets/Highscores_img.png");
    this.load.image("Continue", "./Assets/Botones/Continue.png"); // Reutilizado para volver
  }

  async create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    // 1. Fondo oscuro semitransparente (Mantiene el estilo de HelpScene)
    let fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.8); // Un pelín más oscuro para resaltar los textos
    fondoOscuro.fillRect(0, 0, width, height);

    // 2. Imagen de cabecera "Highscores_img"
    let imgHeader = this.add
      .image(width / 2, height * 0.18, "Highscores_img")
      .setOrigin(0.5)
      .setScale(0.32 * baseScale);

    // Estilo base para los textos del Ranking (Estilo Arcade con borde)
    const estiloTexto = {
      fontFamily: "Arial",
      fontSize: `${Math.floor(22 * baseScale)}px`,
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    };

    // 3. Cartel de carga temporal
    let txtCargando = this.add
      .text(width / 2, height * 0.45, "Buscando records en el servidor... 🐾", {
        ...estiloTexto,
        fill: "#ffff00",
      })
      .setOrigin(0.5);

    // 4. Botón Volver (Back / Continue) abajo
    let btnBack = this.add
      .image(width / 2, height * 0.85, "Continue")
      .setOrigin(0.5)
      .setScale(0.45 * baseScale)
      .setInteractive({ useHandCursor: true });

    btnBack.on("pointerdown", () => {
      this.scene.stop();
    });

    btnBack.on("pointerover", () => btnBack.setTint(0xffcc00));
    btnBack.on("pointerout", () => btnBack.clearTint());

    // ============================================================================
    // 📊 LLAMADA ASINCRÓNICA AL BACKEND PARA TRAER EL TOP 5
    // ============================================================================
    try {
      const top5 = await authService.obtenerHighscores();
      txtCargando.destroy(); // Chau cartel de cargando

      if (!top5 || top5.length === 0) {
        // Si la base de datos está vacía o da error
        this.add
          .text(
            width / 2,
            height * 0.45,
            "¡Aún no hay registros de aventuras completadas!\nSé el primero en liderar el ranking.",
            {
              ...estiloTexto,
              align: "center",
              fill: "#aaaaaa",
            }
          )
          .setOrigin(0.5);
      } else {
        // --- DIBUJAR LA TABLA DE HIGHSCORES ---
        let inicioY = height * 0.35; // Altura donde empieza la primera fila
        let espaciadoFilas = 50 * baseScale; // Distancia entre puestos

        top5.forEach((jugador, indice) => {
          let puesto = indice + 1;
          let filaY = inicioY + indice * espaciadoFilas;

          // Formateamos el tiempo a MM:SS de forma prolija
          let minutos = Math.floor(jugador.tiempo / 60);
          let segundos = jugador.tiempo % 60;
          let tiempoFormateado = `${minutos.toString().padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;

          // Color especial para el podio
          let colorFila = "#ffffff";
          if (puesto === 1) colorFila = "#ffff00"; // Oro
          if (puesto === 2) colorFila = "#e5e5e5"; // Plata
          if (puesto === 3) colorFila = "#cd7f32"; // Bronce

          // Columna 1: Puesto y Nombre (Alineado a la izquierda del bloque central)
          this.add.text(width * 0.25, filaY, `#${puesto}  ${jugador.username}`, {
            ...estiloTexto,
            fill: colorFila,
          }).setOrigin(0, 0.5);

          // Columna 2: Puntaje (En el centro tirando a la derecha)
          this.add.text(width * 0.55, filaY, `${jugador.score} pts`, {
            ...estiloTexto,
            fill: colorFila,
          }).setOrigin(1, 0.5);

          // Columna 3: Tiempo (A la extrema derecha del bloque)
          this.add.text(width * 0.75, filaY, `⏱️ ${tiempoFormateado}`, {
            ...estiloTexto,
            fill: colorFila,
            fontSize: `${Math.floor(18 * baseScale)}px` // Un toque más chico el tiempo para que no sature
          }).setOrigin(1, 0.5);
        });
      }
    } catch (error) {
      console.error("Error al renderizar el ranking:", error);
      txtCargando.setText("No se pudo conectar con el servidor de puntajes.");
    }

    // Manejo adaptativo del Resize
    this.resizeHandler = () => {
      this.scene.restart();
    };
    this.scale.on("resize", this.resizeHandler);

    this.events.on("shutdown", () => {
      this.scale.off("resize", this.resizeHandler);
    });
  }
}