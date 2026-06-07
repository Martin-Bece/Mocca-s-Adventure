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
    this.load.image("Restart", "./Assets/Restart.png");
    this.load.image("Exit", "./Assets/Exit.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    // Recuperamos el ID del usuario desde el Registry de Phaser
    // NOTA: Asegurate de setear "usuarioId" en el registry cuando el jugador se loguea
    this.usuarioId = this.registry.get("usuarioId") || 1; // Un fallback por si acaso

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
      // 1. Bloqueamos el botón sutilmente para evitar doble clics molestos mientras responde la API
      btnRestart.disableInteractive();

      // 2. Reseteamos los valores en tu Backend enviando los datos iniciales de reinicio
      await authService.guardarPartida(
        this.usuarioId, // usuario_id
        "Level1",       // nivel_actual
        3,              // vidas
        0,              // huesos_recolectados
        0,              // puntos_a_acumular
        0               // tiempo_a_acumular
      );

      // 3. Seteamos también el estado actual en la memoria local de Phaser (Registry)
      this.registry.set("vidas", 3);
      this.registry.set("huesos", 0);

      // 4. Mandamos al jugador al inicio
      this.scene.start("Level1"); 
    });

    btnRestart.on("pointerover", () => btnRestart.setTint(0xffcc00));
    btnRestart.on("pointerout", () => btnRestart.clearTint());

    // --- INTERACTIVIDAD: EXIT ---
    btnExit.on("pointerdown", async () => {
      btnExit.disableInteractive();

      // Al salir también reseteamos la base de datos para que la próxima vez no retome en nivel 3
      await authService.guardarPartida(this.usuarioId, "Level1", 3, 0, 0, 0);
      
      this.registry.set("vidas", 3);
      this.registry.set("huesos", 0);

      // Volvemos al menú principal
      this.scene.start("MenuScene");
    });

    btnExit.on("pointerover", () => btnExit.setTint(0xff3333));
    btnExit.on("pointerout", () => btnExit.clearTint());

    this.scale.on("resize", () => {
      this.scene.restart();
    });
  }
}