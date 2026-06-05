import { authService } from "../services/api.js";
import audioManagerImport from "../utils/AudioManager.js";
const audioManager = audioManagerImport.getInstance();

// ============================================================================
// --- ESCENA: MENÚ PRINCIPAL ---
// ============================================================================
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
    this.cachedPartida = null; 
  }

  preload() {
    this.load.image("background", "./Assets/background.png");
    this.load.image("Continue", "./Assets/Botones/Continue.png");
    this.load.image("Credits", "./Assets/Botones/Credits.png");
    this.load.image("Help", "./Assets/Botones/Help.png");
    this.load.image("Mute", "./Assets/Botones/Mute.png");
    this.load.image("Unmute", "./Assets/Botones/Unmute.png");
    this.load.image("Start", "./Assets/Botones/Start.png");
    this.load.image("Exit", "./Assets/Botones/Exit.png");
    this.load.image("Restart", "./Assets/Botones/Restart.png");
    this.load.image("Imagen_Menu", "./Assets/Imagen_Menu.png");
    this.load.audio("level_1", "./Audio/level_1.mp3");
  }

  async create() {
    const { width, height } = this.scale;

    audioManager.init(this.game);
    audioManager.playMusic(this, "level_1", { volume: 0.2, loop: true });

    let fondo = this.add.image(width / 2, height / 2, "background");
    let escalaX = width / fondo.width;
    let escalaY = height / fondo.height;
    let escalaFondo = Math.max(escalaX, escalaY);
    fondo.setScale(escalaFondo);

    const baseScale = height / 768;

    let cartelTitulo = this.add
      .image(width / 2, height * 0.28, "Imagen_Menu")
      .setOrigin(0.5)
      .setScale(0.35 * baseScale);

    const escalaBotones = 0.5 * baseScale;
    const separacion = 48 * baseScale;
    const baseBotonesY = height * 0.56;

    // --- CHEQUEO PREVIO DE PARTIDA GUARDADA ---
    const usuarioIdRaw = localStorage.getItem("usuario_id");
    const usuarioId = usuarioIdRaw ? parseInt(usuarioIdRaw, 10) : null;
    let tienePartida = false;

    if (usuarioId) {
      try {
        // Consultamos al backend si este usuario tiene registros guardados
        const data = await authService.obtenerPartida(usuarioId);
        if (data && data.nivel_actual) {
          this.cachedPartida = data; // Almacenamos la info de la partida
          tienePartida = true;
        }
      } catch (error) {
        console.log("No se encontró partida previa o error de conexión:", error);
      }
    }

    // --- BOTÓN START (JUGAR NUEVA) ---
    let btnStart = this.add
      .image(width / 2, baseBotonesY, "Start")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnStart.on("pointerdown", () => {
      if (tienePartida) {
        // Cartel de advertencia nativo del navegador
        const confirmarBorrar = window.confirm(
          "¡Atención! Tenés una partida guardada. Si empezás de nuevo se va a sobrescribir tu progreso actual. ¿Querés borrarla y empezar de cero?"
        );
        
        if (!confirmarBorrar) {
          return; // Si el usuario pone "Cancelar", frena todo y no borra nada
        }
      }

      // Inicializa valores desde cero para una nueva aventura
      this.registry.set("vidas", 3);
      this.registry.set("puntos", 0);
      this.registry.set("tiempo", 0);
      this.registry.set("huesos", 0);
      
      this.scene.start("Level1");
    });

    // --- BOTÓN CONTINUE (RECUPERAR) ---
    let btnContinue = this.add
      .image(width / 2, baseBotonesY + separacion, "Continue")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    // Si no hay partida, lo ponemos un poco transparente para indicar que está inactivo
    if (!tienePartida) {
      btnContinue.setAlpha(0.5);
    }

    btnContinue.on("pointerdown", () => {
      if (!tienePartida || !this.cachedPartida) {
        console.log("No hay ninguna partida guardada para recuperar.");
        return;
      }

      console.log("Cargando datos recuperados del servidor...", this.cachedPartida);

      // Seteamos el registry global de Phaser con lo que vino de la base de datos
      this.registry.set("vidas", this.cachedPartida.vidas ?? 3);
      this.registry.set("puntos", this.cachedPartida.puntaje ?? 0);
      this.registry.set("tiempo", this.cachedPartida.tiempo_jugado ?? 0);
      this.registry.set("huesos", this.cachedPartida.huesos ?? 0);

      // Redireccionamos dinámicamente al nivel donde se quedó Mocca
      const nivelAValidar = this.cachedPartida.nivel_actual;
      if (nivelAValidar === 2) {
        this.scene.start("Level2");
      } else if (nivelAValidar === 3) {
        this.scene.start("Level3");
      } else {
        this.scene.start("Level1");
      }
    });

    // --- OTROS BOTONES ---
    let btnHelp = this.add
      .image(width / 2, baseBotonesY + separacion * 2, "Help")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnHelp.on("pointerdown", () => {
      this.scene.launch("HelpScene");
    });

    let btnCredits = this.add
      .image(width / 2, baseBotonesY + separacion * 3, "Credits")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnCredits.on("pointerdown", () => {
      this.scene.launch("CreditsScene");
    });

    // Efectos hover (al botón Continuar solo si está activo)
    [btnStart, btnHelp, btnCredits].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    if (tienePartida) {
      btnContinue.on("pointerover", () => btnContinue.setTint(0xffcc00));
      btnContinue.on("pointerout", () => btnContinue.clearTint());
    }

    // --- CONTROL DE AUDIO ---
    let btnSonido = this.add
      .image(width - 40, 40, audioManager.isMuted(this) ? "Mute" : "Unmute")
      .setOrigin(0.5)
      .setScale(0.35 * baseScale)
      .setInteractive({ useHandCursor: true });

    btnSonido.on("pointerdown", () => {
      let nuevoMute = !audioManager.isMuted(this);
      audioManager.setMute(this, nuevoMute);
      btnSonido.setTexture(nuevoMute ? "Mute" : "Unmute");
    });

    btnSonido.on("pointerover", () => btnSonido.setTint(0xffcc00));
    btnSonido.on("pointerout", () => btnSonido.clearTint());

    // Manejo de resize
    this.resizeHandler = () => {
      this.scene.restart();
    };
    this.scale.on("resize", this.resizeHandler);

    this.events.on("shutdown", () => {
      this.scale.off("resize", this.resizeHandler);
    });
  }

  update() {}
}