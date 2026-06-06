import { authService } from "../services/api.js";

// ============================================================================
// --- ESCENA: PANTALLA DE VICTORIA SUPERPUESTA ---
// ============================================================================
export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: "WinScene" });
  }

  init(data) {
    this.escenaOrigen = data.escenaOrigen;
    this.puntosFinales = data.puntos || 0;
    this.vidasFinales = data.vidas || 0;
    this.tiempoFinal = data.tiempo || 0;
    this.huesosFinales = data.huesos || 0; 
  }

  preload() {
    this.load.image("win_img", "./Assets/win_img.png");
    this.load.image("Continue", "./Assets/Botones/Continue.png");
    this.load.image("Exit", "./Assets/Botones/Exit.png");
  }

  async create() {
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

    // Cambiamos el texto dinámicamente si es el final del juego
    const esFinDelJuego = this.escenaOrigen === "Level3";

    this.add
      .text(width / 2, height * 0.44, esFinDelJuego ? "¡COMPLETASTE LA AVENTURA! 🐾" : "¡Nivel Completado!", {
        ...estiloTexto,
        fontSize: `${32 * baseScale}px`,
        fill: esFinDelJuego ? "#00ff00" : "#ffff00", // Verde si ganó el juego
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.52, `Puntos Totales: ${this.puntosFinales}`, estiloTexto)
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.58, `Vidas Restantes: x${this.vidasFinales}`, estiloTexto)
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.64, `Tiempo de Juego: ${tiempoTexto}`, estiloTexto)
      .setOrigin(0.5);

    // ============================================================================
    // 🌟 PERSISTENCIA AUTOMÁTICA EN EL BACKEND (INTEGRADA PARA NIVEL 3)
    // ============================================================================
    const usuarioIdRaw = localStorage.getItem("usuario_id");
    const usuarioId = usuarioIdRaw ? parseInt(usuarioIdRaw, 10) : null;

    if (usuarioId) {
      try {
        if (esFinDelJuego) {
          // 🏁 ESCENARIO A: Ganó el juego (Level3) -> Registramos ranking y borramos partida
          console.log("¡Juego completado! Registrando score definitivo en el ranking...");
          
          const respuestaScore = await authService.registrarScoreFinal(
            usuarioId,
            this.puntosFinales,
            this.tiempoFinal
          );
          console.log("Respuesta del ranking y borrado de partida:", respuestaScore);

        } else {
          // 🕹️ ESCENARIO B: Pasó Nivel 1 o Nivel 2 -> Guardamos progreso normal
          let proximoNivel = this.escenaOrigen === "Level1" ? 2 : 3;
          console.log(`Guardando progreso automáticamente para el Nivel ${proximoNivel}...`);
          
          const respuestaGuardado = await authService.guardarPartida(
            usuarioId,
            proximoNivel,
            this.vidasFinales,
            this.huesosFinales,
            this.puntosFinales,
            this.tiempoFinal
          );
          console.log("¡Progreso intermedio guardado!", respuestaGuardado);
        }
      } catch (err) {
        console.error("Error en la persistencia automática de victoria:", err);
      }
    } else {
      console.warn("Auto-guardado saltado: usuario_id no encontrado en localStorage.");
    }
    // ============================================================================

    // 5. Botones de Control en disposición horizontal
    const escalaBotones = 0.4 * baseScale;
    const botonesY = height * 0.78;
    const separacionHorizontal = 110 * baseScale;

    // Botón Exit (A la izquierda)
    let btnExit = this.add
      .image(width / 2 - separacionHorizontal, botonesY, "Exit")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnExit.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.escenaOrigen);
      this.scene.start("MenuScene"); 
    });

    // Botón Continue (A la derecha)
    let btnContinue = this.add
      .image(width / 2 + separacionHorizontal, botonesY, "Continue")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    // Si es el nivel 3, podés ocultar el botón Continue o hacer que te mande a los Highscores/Menú
    if (esFinDelJuego) {
      // Opción estética: podés cambiarle la textura o dejar que "Continuar" te mande al menú
      btnContinue.on("pointerdown", () => {
        this.scene.stop();
        this.scene.stop(this.escenaOrigen);
        this.registry.set("puntos", 0);
        this.registry.set("tiempo", 0);
        this.scene.start("MenuScene"); // O "HighscoreScene" si tenés una pantalla de ranking
      });
    } else {
      btnContinue.on("pointerdown", () => {
        this.scene.stop();
        this.scene.stop(this.escenaOrigen);

        this.registry.set("puntos", 0);
        this.registry.set("tiempo", 0);

        if (this.escenaOrigen === "Level1") {
          this.scene.start("Level2");
        } else if (this.escenaOrigen === "Level2") {
          this.scene.start("Level3");
        }
      });
    }

    // Efecto visual hover para los botones
    [btnExit, btnContinue].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    // Manejo de resize
    this.resizeHandler = () => {
      this.scene.restart({
        escenaOrigen: this.escenaOrigen,
        puntos: this.puntosFinales,
        vidas: this.vidasFinales,
        tiempo: this.tiempoFinal,
        huesos: this.huesosFinales
      });
    };

    this.scale.on("resize", this.resizeHandler);
    this.events.on("shutdown", () => {
      this.scale.off("resize", this.resizeHandler);
    });
  }
}