// Importamos el servicio que maneja el backend de Mocca
import { authService } from "../services/api.js";

// ============================================================================
// --- ESCENA: PANTALLA DE GAME OVER ---
// ============================================================================
export default class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: "GameOver" });
  }

  preload() {
    this.load.image("gameover_img", "./Assets/gameover_img.png");
    this.load.image("Restart", "./Assets/Botones/Restart.png"); // Corregida la ruta para usar tu carpeta Botones
    this.load.image("Exit", "./Assets/Botones/Exit.png");       // Corregida la ruta para usar tu carpeta Botones
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    // 1. Recuperamos el usuario_id de localStorage TAL CUAL como lo hacés en PauseScene
    const usuarioIdRaw = localStorage.getItem("usuario_id");
    const usuarioId = usuarioIdRaw ? parseInt(usuarioIdRaw, 10) : null;

    let fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.8);
    fondoOscuro.fillRect(0, 0, width, height);

    let imgGameOver = this.add
      .image(width / 2, height * 0.28, "gameover_img")
      .setOrigin(0.5)
      .setScale(0.35 * baseScale);

    let txtMensaje = this.add
      .text(
        width / 2,
        height * 0.52,
        "¡Te quedaste sin vidas! Pero no te preocupes, el camino del héroe está lleno de desafíos. ¿Querés intentarlo de nuevo?",
        {
          fontFamily: "Arial",
          fontSize: `${Math.floor(22 * baseScale)}px`,
          fill: "#ffffff",
          align: "center",
          wordWrap: { width: width * 0.75 },
        }
      )
      .setOrigin(0.5);

    const espacioEntreBotones = 120 * baseScale; 
    const posicionYBotones = height * 0.70;

    // Botón Volver a Jugar (Restart)
    let btnRestart = this.add
      .image(width / 2 - espacioEntreBotones, posicionYBotones, "Restart")
      .setOrigin(0.5)
      .setScale(0.45 * baseScale)
      .setInteractive({ useHandCursor: true });

    // Botón Salir (Exit)
    let btnExit = this.add
      .image(width / 2 + espacioEntreBotones, posicionYBotones, "Exit")
      .setOrigin(0.5)
      .setScale(0.45 * baseScale)
      .setInteractive({ useHandCursor: true });

    // --- INTERACTIVIDAD: RESTART ---
    btnRestart.on("pointerdown", async () => {
      btnRestart.disableInteractive();

      // 1. Seteamos el estado a cero en la memoria local de Phaser (Registry)
      this.registry.set("vidas", 3);
      this.registry.set("huesos", 0);
      this.registry.set("puntos", 0);

      // 2. Mandamos al backend usando el endpoint de cierre de aventura
      if (usuarioId) {
        try {
          // Usamos registrarScoreFinal. Le pasamos 0 y 0 porque en este nivel final (donde murió) 
          // no sumó puntos ni tiempo extra que queramos agregar al score histórico.
          const respuesta = await authService.registrarScoreFinal(usuarioId, 0, 0);
          console.log("Respuesta de ranking y reseteo (Restart):", respuesta);
        } catch (err) {
          console.error("Error al registrar score en GameOver (Restart):", err);
        }
      }

      // 3. Mandamos al jugador al inicio fresco
      this.scene.start("Level1"); 
    });

    btnRestart.on("pointerover", () => btnRestart.setTint(0xffcc00));
    btnRestart.on("pointerout", () => btnRestart.clearTint());

    // --- INTERACTIVIDAD: EXIT ---
    btnExit.on("pointerdown", async () => {
      btnExit.disableInteractive();

      this.registry.set("vidas", 3);
      this.registry.set("huesos", 0);
      this.registry.set("puntos", 0);

      // Sincronizamos el cierre y reseteo con el backend antes de ir al menú
      if (usuarioId) {
        try {
          await authService.registrarScoreFinal(usuarioId, 0, 0);
        } catch (err) {
          console.error("Error al registrar score en GameOver (Exit):", err);
        }
      }

      // Volvemos al menú principal
      this.scene.start("MenuScene");
    });

    btnExit.on("pointerover", () => btnExit.setTint(0xff3333));
    btnExit.on("pointerout", () => btnExit.clearTint());

    // --- RESIZE ---
    // Usamos un resizeHandler estructurado igual al tuyo para evitar dolores de cabeza
    this.resizeHandler = (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      const bScale = h / 768;
      const esp = 120 * bScale;
      const posY = h * 0.70;

      fondoOscuro.clear();
      fondoOscuro.fillStyle(0x000000, 0.8);
      fondoOscuro.fillRect(0, 0, w, h);

      imgGameOver.setPosition(w / 2, h * 0.28).setScale(0.35 * bScale);
      txtMensaje.setPosition(w / 2, h * 0.52).setFontSize(`${Math.floor(22 * bScale)}px`);
      btnRestart.setPosition(w / 2 - esp, posY).setScale(0.45 * bScale);
      btnExit.setPosition(w / 2 + esp, posY).setScale(0.45 * bScale);
    };

    this.scale.on("resize", this.resizeHandler);
    this.events.on("shutdown", () => {
      this.scale.off("resize", this.resizeHandler);
    });
  }
}