import EscenaBase from "./EscenaBase.js";
import audioManagerImport from "../utils/AudioManager.js";
const audioManager = audioManagerImport.getInstance();

// ============================================================================
// --- ESCENA: NIVEL 2 (PARQUE URBANO) ---
// ============================================================================
export default class Level2 extends EscenaBase {
  constructor() {
    super("Level2");
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
    this.load.image("ground", "./Assets/ground.png");
    this.load.image("park_platform", "./Assets/plataformaAire2.png");

    // Audios
    this.load.audio("bark_sound", "./Audio/bark_sound.mp3");
    this.load.audio("comer_hueso", "./Audio/comer_hueso.mp3");
    this.load.audio("obtener_vida", "./Audio/getLife.mp3"); 
    this.load.audio("mocca_daño", "./Audio/mocca_daño.mp3");
    this.load.audio("gato_daño", "./Audio/gato_daño.mp3");
    this.load.audio("level_2", "./Audio/level_2.ogg");
    this.load.audio("mocca_jump", "./Audio/mocca_jump.wav");
    this.load.audio("ardilla_sound", "./Audio/ardilla_sound.mp3");
    this.load.audio("paloma_sound", "./Audio/paloma_sound.mp3");

    // Sprites del nivel
    this.load.spritesheet("huesito", "./Assets/Huesito.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("ardilla", "./Assets/ardilla.png", {
      frameWidth: 32,
      frameHeight: 30,
    });
    this.load.spritesheet("paloma", "./Assets/paloma.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.image("background2", "./Assets/background2.png");
    this.load.image("vida_mocca", "./Assets/vida_mocca.png");
    this.load.image("Mute", "./Assets/Botones/Mute.png");
    this.load.image("Unmute", "./Assets/Botones/Unmute.png");
    this.load.image("Pause", "./Assets/Botones/Resume.png");
  }

  create() {
    const { width, height } = this.scale;

    // Inicialización del HUD, música y cursores compartidos
    this.crearBaseComun("level_2");

    // --- FONDO PARALLAX CIUDAD/PARQUE ---
    this.fondoParallax = this.add
      .tileSprite(0, 0, width, height, "background2")
      .setOrigin(0, 0)
      .setScrollFactor(0);
    let texturaOriginal = this.textures.get("background2").getSourceImage();
    let factorEscalaFinal = Math.max(
      width / texturaOriginal.width,
      height / texturaOriginal.height,
    );
    this.fondoParallax.tileScaleX = factorEscalaFinal;
    this.fondoParallax.tileScaleY = factorEscalaFinal;

    // --- SUELO ---
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

    // --- ANIMACIONES DEL NIVEL 2 ---
    if (!this.anims.exists("huesito_rotate")) {
      this.anims.create({
        key: "huesito_rotate",
        frames: this.anims.generateFrameNumbers("huesito", { start: 0, end: 4 }),
        frameRate: 7,
        repeat: -1,
      });
    }
    if (!this.anims.exists("ardilla_run")) {
      this.anims.create({
        key: "ardilla_run",
        frames: this.anims.generateFrameNumbers("ardilla", { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists("paloma_fly")) {
      this.anims.create({
        key: "paloma_fly",
        frames: this.anims.generateFrameNumbers("paloma", { start: 0, end: 6 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Animaciones Mocca
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
      this.anims.create({
        key: "bark_run",
        frames: this.anims.generateFrameNumbers("mocca_bark", { start: 1, end: 1 }),
        frameRate: 1,
        repeat: 0,
      });
      this.anims.create({
        key: "bark_jump",
        frames: this.anims.generateFrameNumbers("mocca_bark", { start: 2, end: 2 }),
        frameRate: 1,
        repeat: 0,
      });
    }

    // ============================================================================
    // --- MAPEO DE PLATAFORMAS COMPLETAMENTE INTEGRADO (CON PUENTES) ---
    // ============================================================================
    const diseñoNivel = [
      { x: 500, y: height - 140, bloques: 3, ardilla: true },
      { x: 725, y: height - 185, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 950, y: height - 230, bloques: 1, ardilla: false },
      { x: 1300, y: height - 140, bloques: 4, ardilla: true },
      { x: 1550, y: height - 230, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 1800, y: height - 320, bloques: 2, ardilla: false },
      { x: 2200, y: height - 230, bloques: 3, ardilla: true },
      { x: 2700, y: height - 140, bloques: 1, ardilla: false },
      { x: 2900, y: height - 185, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 3100, y: height - 230, bloques: 4, ardilla: true },
      { x: 3375, y: height - 275, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 3650, y: height - 320, bloques: 2, ardilla: false },
      { x: 4100, y: height - 140, bloques: 3, ardilla: true },
      { x: 4600, y: height - 230, bloques: 1, ardilla: false },
      { x: 4800, y: height - 275, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 5000, y: height - 320, bloques: 4, ardilla: true },
      { x: 5600, y: height - 140, bloques: 2, ardilla: false },
      { x: 5850, y: height - 185, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 6100, y: height - 230, bloques: 3, ardilla: true },
      { x: 6350, y: height - 275, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 6600, y: height - 320, bloques: 1, ardilla: false },
      { x: 7000, y: height - 140, bloques: 4, ardilla: true },
      { x: 7600, y: height - 230, bloques: 2, ardilla: false },
      { x: 7850, y: height - 275, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 8100, y: height - 320, bloques: 3, ardilla: true },
      { x: 8600, y: height - 140, bloques: 1, ardilla: false },
      { x: 8800, y: height - 185, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 9000, y: height - 230, bloques: 4, ardilla: true },
      { x: 9300, y: height - 275, bloques: 1, ardilla: false }, // Puente intermedio
      { x: 9600, y: height - 320, bloques: 2, ardilla: false },
      { x: 10100, y: height - 140, bloques: 3, ardilla: true },
    ];

    const escalaParque = 0.13;
    const separacionParque = 71;

    // --- RENDERIZADO DIRECTO Y SEGURO ---
    diseñoNivel.forEach((isla) => {
      let anchoTotalIsla = (isla.bloques - 1) * separacionParque;
      let inicioX = isla.x - anchoTotalIsla / 2;

      for (let i = 0; i < isla.bloques; i++) {
        let nubeX = inicioX + i * separacionParque;
        let nube = this.platforms.create(nubeX, isla.y, "park_platform");

        nube.setScale(escalaParque).refreshBody();
        nube.body.setSize(nube.displayWidth / 2 - 10, 1);
        nube.body.setOffset(50, 20);

        nube.body.checkCollision.down = false;
        nube.body.checkCollision.left = false;
        nube.body.checkCollision.right = false;

        bones.create(nubeX, isla.y - 45, "huesito").body.setAllowGravity(false);
      }

      if (isla.ardilla) {
        let ardillaPlat = this.enemigos
          .create(isla.x, isla.y - 45, "ardilla")
          .setScale(1.3);
        ardillaPlat.body.setSize(20, 20);
        ardillaPlat.speed = 85;
        ardillaPlat.distaciaPatrulla = anchoTotalIsla / 2;
        ardillaPlat.puntoInicialX = isla.x;
        ardillaPlat.esVolador = false;
        ardillaPlat.isStunned = false;
        ardillaPlat.anims.play("ardilla_run");
        ardillaPlat.setVelocityX(ardillaPlat.speed);
      }
    });

    // --- ENEMIGOS SUELO ---
    for (let posX = 600; posX < 10300; posX += 480) {
      let ardillaSuelo = this.enemigos
        .create(posX, height - 150, "ardilla")
        .setScale(1.4);
      ardillaSuelo.body.setSize(24, 20);
      ardillaSuelo.setCollideWorldBounds(true);
      ardillaSuelo.speed = 110;
      ardillaSuelo.distaciaPatrulla = 130;
      ardillaSuelo.puntoInicialX = posX;
      ardillaSuelo.esVolador = false;
      ardillaSuelo.isStunned = false;
      ardillaSuelo.anims.play("ardilla_run");
      ardillaSuelo.setVelocityX(ardillaSuelo.speed);
    }

    // --- ENEMIGOS AÉREOS ---
    let alternarAlturaVuelo = 0;
    for (let posX = 850; posX < 10300; posX += 600) {
      let alturaVuelo = height - 260;
      if (alternarAlturaVuelo === 1) alturaVuelo = height - 340;
      alternarAlturaVuelo = (alternarAlturaVuelo + 1) % 2;

      let paloma = this.enemigos
        .create(posX, alturaVuelo, "paloma")
        .setScale(1.3);

      paloma.body.setSize(24, 24);
      paloma.body.setAllowGravity(false);
      paloma.setCollideWorldBounds(true);

      paloma.speed = 85;
      paloma.distaciaPatrulla = 140;
      paloma.puntoInicialX = posX;
      paloma.esVolador = true;
      paloma.isStunned = false;
      paloma.anims.play("paloma_fly");
      paloma.setVelocityX(paloma.speed);
    }

    // --- MOCCA ---
    this.mocca = this.physics.add
      .sprite(100, height - 100, "mocca")
      .setScale(1.5);
    this.mocca.body.setSize(50, 35);
    this.mocca.body.setOffset(8, 12);
    this.mocca.setCollideWorldBounds(true);
    this.mocca.anims.play("idle");

    // --- CÁMARAS ---
    this.cameras.main.startFollow(this.mocca, true, 0.05, 0.05);
    this.cameras.main.setBounds(0, 0, this.longitudNivel, height);

    // --- COLISIONES ---
    this.physics.add.collider(this.mocca, this.ground);
    this.physics.add.collider(this.enemigos, this.ground);
    this.physics.add.overlap(this.mocca, bones, this.collectBone, null, this);
    this.physics.add.overlap(this.mocca, this.enemigos, this.hitEnemigo, null, this);

    this.physics.add.collider(
      this.mocca,
      this.platforms,
      null,
      (player, platform) => {
        if (this.cursors.down.isDown) return false;
        return true;
      },
      this,
    );

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

    // --- BOTONES DE UI ---
    const factorUI = height / 768;
    const escalaBotonesUI = 0.25 * factorUI;
    const margenDerecho = 50 * factorUI;
    const margenSuperior = 45 * factorUI;
    const espacioEntreBotones = 65 * factorUI;

    this.btnSonido = this.add
      .image(
        width - margenDerecho,
        margenSuperior,
        audioManager.isMuted(this) ? "Mute" : "Unmute",
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
      this.scene.pause("Level2");
      this.scene.launch("PauseScene", { currentScene: "Level2" });
      this.scene.bringToTop("PauseScene"); // Asegura que la escena de pausa esté por encima del nivel
    });

    [this.btnSonido, this.btnPausa].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    // --- RESIZE DE PANTALLA ---
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
        let resTex = this.textures.get("background2").getSourceImage();
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