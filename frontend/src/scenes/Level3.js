import EscenaBase from "./EscenaBase.js";
import audioManagerImport from "../utils/AudioManager.js";
const audioManager = audioManagerImport.getInstance();

// ============================================================================
// --- ESCENA: NIVEL 3 (LA AUTOPISTA / CIUDAD ADENTRO) ---
// ============================================================================
export default class Level3 extends EscenaBase {
  constructor() {
    super("Level3");
  }

  preload() {
    // Carga de assets esenciales
    this.load.spritesheet("mocca", "./Assets/Mocca_Idle.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("mocca_run", "./Assets/Mocca_run_right.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("mocca_jump", "./Assets/Mocca_jump.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("mocca_bark", "./Assets/Mocca_bark.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.image("ground", "./Assets/ground2.png");

    // Plataformas nuevas para el nivel 3
    this.load.image("plat_corta", "./Assets/Plat_corta.png");
    this.load.image("plat_larga", "./Assets/Plat_larga.png");
    this.load.image("plat_mediana", "./Assets/Plat_mediana.png");

    // Audios
    this.load.audio("bark_sound", "./Audio/bark_sound.mp3");
    this.load.audio("comer_hueso", "./Audio/comer_hueso.mp3");
    this.load.audio("obtener_vida", "./Audio/getLife.mp3"); 
    this.load.audio("mocca_daño", "./Audio/mocca_daño.mp3");
    this.load.audio("gato_daño", "./Audio/gato_daño.mp3");
    this.load.audio("level_2", "./Audio/level_2.ogg"); // Puedes cambiar la clave si tienes track para Lvl3
    this.load.audio("mocca_jump", "./Audio/mocca_jump.wav");
    this.load.audio("auto_sound", "./Audio/auto_sound.mp3");
    this.load.audio("avion_sound", "./Audio/avion_sound.mp3");

    // Sprites del nivel
    this.load.spritesheet("huesito", "./Assets/Huesito.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    
    this.load.image("auto", "./Assets/car.png");
    this.load.image("avion", "./Assets/avion.png");

    this.load.image("background3", "./Assets/background3.png");
    this.load.image("vida_mocca", "./Assets/vida_mocca.png");
    this.load.image("Mute", "./Assets/Botones/Mute.png");
    this.load.image("Unmute", "./Assets/Botones/Unmute.png");
    this.load.image("Pause", "./Assets/Botones/Resume.png");
  }

  create() {
    const { width, height } = this.scale;

    // Inicialización del HUD, música de fondo y cursores del core
    this.crearBaseComun("level_2");

    // --- FONDO PARALLAX NIVEL 3 ---
    this.fondoParallax = this.add
      .tileSprite(0, 0, width, height, "background3")
      .setOrigin(0, 0)
      .setScrollFactor(0);
    let texturaOriginal = this.textures.get("background3").getSourceImage();
    let factorEscalaFinal = Math.max(
      width / texturaOriginal.width,
      height / texturaOriginal.height
    );
    this.fondoParallax.tileScaleX = factorEscalaFinal;
    this.fondoParallax.tileScaleY = factorEscalaFinal;

    // --- SUELO (ground2) ---
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < this.longitudNivel; x += 128) {
      let tile = this.ground
        .create(x, height - 32, "ground")
        .setScale(2)
        .refreshBody();
      tile.body.setSize(128, 45);
      tile.body.setOffset(0, 19);
    }

    // --- GRUPOS FÍSICOS ---
    this.platforms = this.physics.add.staticGroup();
    let bones = this.physics.add.group();
    this.enemigos = this.physics.add.group();

    // --- ANIMACIONES REUTILIZADAS ---
    if (!this.anims.exists("huesito_rotate")) {
      this.anims.create({
        key: "huesito_rotate",
        frames: this.anims.generateFrameNumbers("huesito", { start: 0, end: 4 }),
        frameRate: 7,
        repeat: -1,
      });
    }

    // Animaciones de Mocca (Salvaguarda de redundancias)
    if (!this.anims.exists("idle")) {
      this.anims.create({
        key: "idle",
        frames: this.anims.generateFrameNumbers("mocca", { start: 0, end: 1 }),
        frameRate: 7,
        repeat: -1,
      });
      this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("mocca_run", { start: 0, end: 2 }),
        frameRate: 7,
        repeat: -1,
      });
      this.anims.create({
        key: "jump",
        frames: this.anims.generateFrameNumbers("mocca_jump", { start: 0, end: 3 }),
        frameRate: 2,
        repeat: 0,
      });
      this.anims.create({
        key: "bark_idle",
        frames: this.anims.generateFrameNumbers("mocca_bark", { start: 0, end: 0 }),
        frameRate: 1,
        repeat: 0,
      });
    }

    // ============================================================================
    // --- DISEÑO ESTRUCTURAL: ARRAY DE PLATAFORMAS (MÉTODO MARIO BROS) ---
    // ============================================================================
    // Tipos válidos: "corta" (110px), "mediana" (197px), "larga" (360px)
    const diseñoNivel3 = [
      { x: 450,  y: height - 150, tipo: "corta" },
      { x: 750,  y: height - 220, tipo: "mediana" },
      { x: 1100, y: height - 160, tipo: "larga" }, // <-- Tendrá auto patrullando
      { x: 1500, y: height - 240, tipo: "corta" },
      { x: 1850, y: height - 310, tipo: "mediana" },
      { x: 2300, y: height - 180, tipo: "larga" }, // <-- Tendrá auto patrullando
      { x: 2800, y: height - 140, tipo: "corta" },
      { x: 3100, y: height - 220, tipo: "mediana" },
      { x: 3500, y: height - 280, tipo: "larga" }, // <-- Tendrá auto patrullando
      { x: 4000, y: height - 160, tipo: "corta" },
      { x: 4400, y: height - 240, tipo: "mediana" },
      { x: 4900, y: height - 200, tipo: "larga" }, // <-- Tendrá auto patrullando
      { x: 5400, y: height - 150, tipo: "corta" },
      { x: 5800, y: height - 230, tipo: "mediana" },
      { x: 6300, y: height - 300, tipo: "larga" }, // <-- Tendrá auto patrullando
      { x: 6800, y: height - 160, tipo: "corta" },
      { x: 7200, y: height - 240, tipo: "mediana" },
      { x: 7700, y: height - 180, tipo: "larga" }, // <-- Tendrá auto patrullando
      { x: 8200, y: height - 260, tipo: "corta" },
      { x: 8600, y: height - 310, tipo: "mediana" },
      { x: 9100, y: height - 200, tipo: "larga" }, // <-- Tendrá auto patrullando
      { x: 9600, y: height - 140, tipo: "mediana" }
    ];

    // --- PROCESAMIENTO GENERATIVO DE PLATAFORMAS ---
    diseñoNivel3.forEach((plat) => {
      let keyAsset = "plat_" + plat.tipo;
      let plataformaInstancia = this.platforms.create(plat.x, plat.y, keyAsset);
      
      plataformaInstancia.refreshBody();

      // Configuración de One-Way Platform (Atravesables desde abajo)
      plataformaInstancia.body.checkCollision.down = false;
      plataformaInstancia.body.checkCollision.left = false;
      plataformaInstancia.body.checkCollision.right = false;

      // Distribución lógica de ítems recolectables (Huesos)
      if (plat.tipo === "corta") {
        bones.create(plat.x, plat.y - 40, "huesito").body.setAllowGravity(false);
      } else if (plat.tipo === "mediana") {
        bones.create(plat.x - 35, plat.y - 45, "huesito").body.setAllowGravity(false);
        bones.create(plat.x + 35, plat.y - 45, "huesito").body.setAllowGravity(false);
      } else if (plat.tipo === "larga") {
        // En las largas agregamos 3 huesos distribuidos
        bones.create(plat.x - 80, plat.y - 45, "huesito").body.setAllowGravity(false);
        bones.create(plat.x, plat.y - 65, "huesito").body.setAllowGravity(false);
        bones.create(plat.x + 80, plat.y - 45, "huesito").body.setAllowGravity(false);

        // CONDICIÓN: Enemigo terrestre patrullando en plataformas largas (Auto)
        let autoEnemigo = this.enemigos.create(plat.x, plat.y - 55, "auto");
        autoEnemigo.setScale(0.25); // Reducido proporcionalmente de su escala original 360x360
        autoEnemigo.body.setSize(260, 160);
        autoEnemigo.body.setOffset(50, 100);
        
        autoEnemigo.speed = 90;
        autoEnemigo.distaciaPatrulla = 120; // Rango de ida y vuelta sobre el bloque largo
        autoEnemigo.puntoInicialX = plat.x;
        autoEnemigo.esVolador = false;
        autoEnemigo.isStunned = false;
        autoEnemigo.setVelocityX(autoEnemigo.speed);
      }
    });

    // --- ENEMIGOS TERRESTRES EN EL SUELO (Autos de tráfico) ---
    for (let posX = 700; posX < 10000; posX += 550) {
      let autoSuelo = this.enemigos.create(posX, height - 100, "auto");
      autoSuelo.setScale(0.28);
      autoSuelo.body.setSize(260, 160);
      autoSuelo.body.setOffset(50, 100);
      autoSuelo.setCollideWorldBounds(true);
      
      autoSuelo.speed = 130; // Más rápido que el de las plataformas
      autoSuelo.distaciaPatrulla = 180;
      autoSuelo.puntoInicialX = posX;
      autoSuelo.esVolador = false;
      autoSuelo.isStunned = false;
      autoSuelo.setVelocityX(autoSuelo.speed);
    }

    // --- ENEMIGOS AÉREOS (Aviones sin gravedad) ---
    let alternarAlturaAvion = 0;
    for (let posX = 900; posX < 10000; posX += 650) {
      let alturaAvion = height - 280;
      if (alternarAlturaAvion === 1) alturaAvion = height - 360;
      alternarAlturaAvion = (alternarAlturaAvion + 1) % 2;

      let avion = this.enemigos.create(posX, alturaAvion, "avion");
      avion.setScale(1.1); // Medida base 64x64 óptima

      avion.body.setSize(54, 40);
      avion.body.setOffset(5, 12);
      avion.body.setAllowGravity(false); // Inmune a la fuerza de gravedad
      avion.setCollideWorldBounds(true);

      avion.speed = 100;
      avion.distaciaPatrulla = 200;
      avion.puntoInicialX = posX;
      avion.esVolador = true;
      avion.isStunned = false;
      avion.setVelocityX(avion.speed);
    }

    // --- INSTANCIACIÓN DE MOCCA ---
    this.mocca = this.physics.add
      .sprite(100, height - 100, "mocca")
      .setScale(1.5);
    this.mocca.body.setSize(50, 35);
    this.mocca.body.setOffset(8, 12);
    this.mocca.setCollideWorldBounds(true);
    this.mocca.anims.play("idle");

    // --- SEGUIMIENTO DE CÁMARA ---
    this.cameras.main.startFollow(this.mocca, true, 0.05, 0.05);
    this.cameras.main.setBounds(0, 0, this.longitudNivel, height);

    // --- CONFIGURACIÓN DE COLISIONES ---
    this.physics.add.collider(this.mocca, this.ground);
    this.physics.add.collider(this.enemigos, this.ground);
    this.physics.add.collider(this.enemigos, this.platforms);
    this.physics.add.overlap(this.mocca, bones, this.collectBone, null, this);
    this.physics.add.overlap(this.mocca, this.enemigos, this.hitEnemigo, null, this);

    // Control para bajar de las plataformas atravesables (One-Way)
    this.physics.add.collider(
      this.mocca,
      this.platforms,
      null,
      (player, platform) => {
        if (this.cursors.down.isDown) return false;
        return true;
      },
      this
    );

    // Efecto visual flotante de los huesos
    bones.children.iterate((huesito) => {
      if (huesito) {
        huesito.anims.play("huesito_rotate");
        huesito.body.setSize(30, 30);
        this.tweens.add({
          targets: huesito,
          y: huesito.y - 12,
          duration: 1300,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      }
    });

    // --- CONTROLES DE INTERFAZ DE USUARIO (HUD / BOTONES) ---
    const factorUI = height / 768;
    const escalaBotonesUI = 0.25 * factorUI;
    const margenDerecho = 50 * factorUI;
    const margenSuperior = 45 * factorUI;
    const espacioEntreBotones = 65 * factorUI;

    this.btnSonido = this.add
      .image(
        width - margenDerecho,
        margenSuperior,
        audioManager.isMuted(this) ? "Mute" : "Unmute"
      )
      .setOrigin(0.5)
      .setScale(escalaBotonesUI)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    this.btnSonido.on("pointerdown", () => {
      let nuevoMute = !audioManager.isMuted(this);
      audioManager.setMute(this, nuevoMute);
      this.btnSonido.setTexture(nuevoMute ? "Mute" : "Unmute");
    });

    this.btnPausa = this.add
      .image(this.btnSonido.x - espacioEntreBotones, margenSuperior, "Pause")
      .setOrigin(0.5)
      .setScale(escalaBotonesUI)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    this.btnPausa.on("pointerdown", () => {
      this.scene.pause("Level3");
      this.scene.launch("PauseScene", { currentScene: "Level3" });
      this.scene.bringToTop("PauseScene");
    });

    [this.btnSonido, this.btnPausa].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    // --- RESPONSIVIDAD / RESIZE ADAPTATIVO ---
    this.levelResizeHandler = (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      const fUI = h / 768;
      const eBotones = 0.25 * fUI;
      const mDerecho = 50 * fUI;
      const mSuperior = 45 * fUI;
      const eEntre = 65 * fUI;
      this.physics.world.setBounds(0, 0, this.longitudNivel, h);

      if (this.fondoParallax) {
        this.fondoParallax.setSize(w, h);
        let resTex = this.textures.get("background3").getSourceImage();
        let fEscala = Math.max(h / resTex.height, w / resTex.width);
        this.fondoParallax.tileScaleX = fEscala;
        this.fondoParallax.tileScaleY = fEscala;
      }
      this.btnSonido.setPosition(w - mDerecho, mSuperior).setScale(eBotones);
      this.btnPausa
        .setPosition(this.btnSonido.x - eEntre, mSuperior)
        .setScale(eBotones);
    };

    this.scale.on("resize", this.levelResizeHandler);
    this.events.on("shutdown", () => {
      this.scale.off("resize", this.levelResizeHandler);
    });
  }
}