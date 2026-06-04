import audioManagerImport from "../utils/AudioManager.js";
import { authService } from "../services/api.js";
const audioManager = audioManagerImport.getInstance();

// ============================================================================
// --- ESCENA: LOGIN / INICIO DE SESIÓN ---
// ============================================================================
export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoginScene" });
  }

  preload() {
    // Carga de assets estéticos basados en tu menú
    this.load.image("background", "./Assets/background.png");
    this.load.image("Mute", "./Assets/Botones/Mute.png");
    this.load.image("Unmute", "./Assets/Botones/Unmute.png");
    this.load.image("img_login", "./Assets/img_login.png");
    this.load.audio("level_1", "./Audio/level_1.mp3");

    // Botones de control de acceso
    this.load.image("Login", "./Assets/Botones/Login.png");
    this.load.image("Register", "./Assets/Botones/Register.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    // --- AUDIO ---
    audioManager.init(this.game);
    audioManager.playMusic(this, "level_1", { volume: 0.2, loop: true });

    // --- FONDO ADAPTATIVO ---
    let fondo = this.add.image(width / 2, height / 2, "background");
    let escalaX = width / fondo.width;
    let escalaY = height / fondo.height;
    let escalaFondo = Math.max(escalaX, escalaY);
    fondo.setScale(escalaFondo);

    // --- IMAGEN PRINCIPAL (LOGOTIPO / CARTEL) ---
    this.add
      .image(width / 2, height * 0.20, "img_login")
      .setOrigin(0.5)
      .setScale(0.35 * baseScale);

    // --- INTERFAZ DE TEXTO INPUTS (HTML DOM) ---
    const formularioHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px; width: 280px; font-family: 'Arial', sans-serif; margin-top: 40px;">
        <div>
          <label style="color: #ffffff; display: block; margin-bottom: 6px; font-size: 14px; font-weight: bold; text-shadow: 2px 2px #000;">Usuario:</label>
          <input type="text" id="username" placeholder="Tu usuario..." style="width: 100%; padding: 10px; border: 2px solid #ffcc00; border-radius: 6px; background: rgba(0,0,0,0.7); color: #fff; font-size: 14px; box-sizing: border-box; outline: none;">
        </div>
        <div>
          <label style="color: #ffffff; display: block; margin-bottom: 6px; font-size: 14px; font-weight: bold; text-shadow: 2px 2px #000;">Contraseña:</label>
          <input type="password" id="password" placeholder="••••••••" style="width: 100%; padding: 10px; border: 2px solid #ffcc00; border-radius: 6px; background: rgba(0,0,0,0.7); color: #fff; font-size: 14px; box-sizing: border-box; outline: none;">
        </div>
      </div>
    `;

    this.formElement = this.add.dom(width / 2, height * 0.56).createFromHTML(formularioHTML);

    // --- TEXTO DE AVISOS / ESTADO (FEEDBACK) ---
    this.txtFeedback = this.add.text(width / 2, height * 0.72, "", {
      fontSize: "16px",
      fontFamily: "Arial",
      fontWeight: "bold",
      fill: "#ff3333",
      align: "center"
    }).setOrigin(0.5);

    // --- BOTONES (DISTRIBUIDOS) ---
    const escalaBotones = 0.5 * baseScale;
    const distanciaCentro = 120 * baseScale; 
    const botonesY = height * 0.78;

    let btnLogin = this.add
      .image(width / 2 - distanciaCentro, botonesY, "Login")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    let btnRegister = this.add
      .image(width / 2 + distanciaCentro, botonesY, "Register")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    // --- ACCIÓN: CLICK LOGIN ---
    btnLogin.on("pointerdown", async () => {
      const usernameInput = document.getElementById("username")?.value.trim();
      const passwordInput = document.getElementById("password")?.value.trim();
      
      if (!usernameInput || !passwordInput) {
        this.mostrarFeedback("Completá todos los campos", "#ff3333");
        return;
      }
      
      this.mostrarFeedback("Conectando...", "#ffcc00");
      try {
        const response = await authService.login(usernameInput, passwordInput);
        const data = await response.json();

        if (response.ok) {
          this.mostrarFeedback("¡Ingreso exitoso! 🐾", "#00ff00");
          this.registry.set("vidas", 3);
          this.registry.set("puntos", 0);
          
          this.time.delayedCall(1000, () => {
            this.scene.start("MenuScene");
          });
        } else {
          this.mostrarFeedback(data.error || "Error al iniciar sesión", "#ff3333");
        }
      } catch (error) {
        this.mostrarFeedback("No se pudo conectar con el servidor", "#ff3333");
      }
    }, this);

    // --- ACCIÓN: CLICK REGISTER ---
    btnRegister.on("pointerdown", async () => {
      const usernameInput = document.getElementById("username")?.value.trim();
      const passwordInput = document.getElementById("password")?.value.trim();

      if (!usernameInput || !passwordInput) {
        this.mostrarFeedback("Completá todos los campos", "#ff3333");
        return;
      }

      this.mostrarFeedback("Registrando...", "#ffcc00");
      try {
        const response = await authService.register(usernameInput, passwordInput);
        const data = await response.json();

        if (response.ok) {
          this.mostrarFeedback("¡Registrado! Ya podés iniciar sesión 🐾", "#00ff00");
          document.getElementById("username").value = "";
          document.getElementById("password").value = "";
        } else {
          this.mostrarFeedback(data.error || "Error al registrar", "#ff3333");
        }
      } catch (error) {
        this.mostrarFeedback("No se pudo conectar con el servidor", "#ff3333");
      }
    }, this);

    // --- EFECTOS HOVER ---
    [btnLogin, btnRegister].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

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

    // --- MANEJO DE RESIZE ---
    this.scale.on("resize", () => {
      this.scene.restart();
    });
  }

  // --- MÉTODO DE CONTROL DE MENSAJES EN PANTALLA ---
  mostrarFeedback(mensaje, color) {
    if (this.txtFeedback) {
      this.txtFeedback.setText(mensaje);
      this.txtFeedback.setFill(color);
    }
  }

  update() {}
}