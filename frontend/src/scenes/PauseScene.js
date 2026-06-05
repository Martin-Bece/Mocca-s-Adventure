import { authService } from "../services/api.js";

// ============================================================================
// --- ESCENA: MENÚ DE PAUSA SUPERPUESTO (SINCRO CON ESCENA BASE) ---
// ============================================================================
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: "PauseScene" });
  }

  init(data) {
    // Recibe la clave del nivel que abrió la pausa (ej: "Level1")
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

    // Fondo oscuro translúcido
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

    // --- BOTÓN: CONTINUE ---
    let btnResume = this.add
      .image(width / 2, baseBotonesY, "Continue")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnResume.on("pointerdown", () => {
      this.scene.stop();
      this.scene.resume(this.nivelActual);
    });

    // --- BOTÓN: RESTART ---
    let btnRestart = this.add
      .image(width / 2, baseBotonesY + separacion, "Restart")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnRestart.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.nivelActual);

      // Reseteamos el registry global tal como lo pide tu lógica de reinicios
      this.registry.set("puntos", 0);

      this.scene.start(this.nivelActual);
    });

    // --- BOTÓN: EXIT (MUESTRA SUBMENÚ DE ADVERTENCIA) ---
    let btnExit = this.add
      .image(width / 2, baseBotonesY + separacion * 2, "Exit")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    // --- COMPONENTES DE ADVERTENCIA (OCULTOS POR DEFECTO) ---
    let txtAdvertencia = this.add
      .text(
        width / 2,
        height * 0.52,
        "⚠️ ¡ATENCIÓN!\nSi salís ahora perderás los puntos y tiempo de este nivel.\nAl regresar, comenzarás desde el principio de esta etapa.",
        {
          fontFamily: "Arial",
          fontSize: `${20 * baseScale}px`,
          color: "#ffffff",
          align: "center",
          fontStyle: "bold",
          backgroundColor: "#111111",
          padding: { x: 15, y: 15 },
          stroke: "#ff0000",
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5)
      .setVisible(false);

    let btnConfirmarSalir = this.add
      .text(
        width / 2 - 120 * baseScale,
        height * 0.68,
        "SALIR Y PERDER PROGRESO",
        {
          fontFamily: "Arial",
          fontSize: `${18 * baseScale}px`,
          color: "#ff3333",
          fontStyle: "bold",
          backgroundColor: "#222222",
          padding: { x: 12, y: 12 },
        },
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    let btnCancelarSalir = this.add
      .text(width / 2 + 120 * baseScale, height * 0.68, "VOLVER AL JUEGO", {
        fontFamily: "Arial",
        fontSize: `${18 * baseScale}px`,
        color: "#00ff00",
        fontStyle: "bold",
        backgroundColor: "#222222",
        padding: { x: 12, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    // --- INTERACCIÓN DE EXIT ---
    btnExit.on("pointerdown", () => {
      // Ocultamos menú de pausa
      btnResume.setVisible(false);
      btnRestart.setVisible(false);
      btnExit.setVisible(false);
      imgPausa.setVisible(false);

      // Mostramos advertencia
      txtAdvertencia.setVisible(true);
      btnConfirmarSalir.setVisible(true);
      btnCancelarSalir.setVisible(true);
    });

    // Si cancela, restauramos los botones normales
    btnCancelarSalir.on("pointerdown", () => {
      txtAdvertencia.setVisible(false);
      btnConfirmarSalir.setVisible(false);
      btnCancelarSalir.setVisible(false);

      btnResume.setVisible(true);
      btnRestart.setVisible(true);
      btnExit.setVisible(true);
      imgPausa.setVisible(true);
    });

    // Si confirma, guardamos estado en el backend antes de salir
    btnConfirmarSalir.on("pointerdown", async () => {
      btnConfirmarSalir.disableInteractive();

      // 1. Recuperar usuario_id de localStorage
      const usuarioIdRaw = localStorage.getItem("usuario_id");
      const usuarioId = usuarioIdRaw ? parseInt(usuarioIdRaw, 10) : null;

      // 2. Recuperar datos del registry con valores por defecto
      const vidasActuales = this.registry.get("vidas") ?? 3;
      const puntosActuales = this.registry.get("puntos") ?? 0;
      const huesosActuales = this.registry.get("huesos") ?? 0;
      const tiempoActual = this.registry.get("tiempo_nivel") ?? 0;

      // 3. Traducir nombre de escena a número de nivel
      let numeroNivel = 1;
      if (this.nivelActual === "Level2") numeroNivel = 2;
      if (this.nivelActual === "Level3") numeroNivel = 3;

      // 4. Loguear payload antes de enviarlo
      const payload = {
        usuario_id: usuarioId,
        nivel_actual: numeroNivel,
        vidas: vidasActuales,
        huesos_recolectados: huesosActuales,
        puntos_a_acumular: puntosActuales,
        tiempo_a_acumular: tiempoActual,
      };
      console.log("Payload enviado al backend:", payload);

      // 5. Enviar al backend si hay usuario válido
      if (usuarioId) {
        try {
          const respuesta = await authService.guardarPartida(
            usuarioId,
            numeroNivel,
            vidasActuales,
            huesosActuales,
            puntosActuales,
            tiempoActual,
          );
          console.log("Respuesta del backend:", respuesta);
        } catch (err) {
          console.error("Error al guardar partida en backend:", err);
        }
      } else {
        console.warn(
          "No se pudo guardar: usuario_id no encontrado en localStorage.",
        );
      }

      // 6. Volver al menú
      this.scene.stop();
      this.scene.stop(this.nivelActual);
      this.scene.start("MenuScene");
    });

    // Efectos de hover estilizados
    [
      btnResume,
      btnRestart,
      btnExit,
      btnConfirmarSalir,
      btnCancelarSalir,
    ].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    // --- RESIZE COMPATIBLE CON TU ESCALA ---
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

      txtAdvertencia
        .setPosition(w / 2, h * 0.52)
        .setFontSize(`${20 * bScale}px`);
      btnConfirmarSalir
        .setPosition(w / 2 - 120 * bScale, h * 0.68)
        .setFontSize(`${18 * bScale}px`);
      btnCancelarSalir
        .setPosition(w / 2 + 120 * bScale, h * 0.68)
        .setFontSize(`${18 * bScale}px`);
    };

    this.scale.on("resize", this.resizeHandler);
    this.events.on("shutdown", () => {
      this.scale.off("resize", this.resizeHandler);
    });
  }
}
