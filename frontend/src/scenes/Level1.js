import EscenaBase from "./EscenaBase.js";
import audioManagerImport from "../utils/AudioManager.js";
const audioManager = audioManagerImport.getInstance();

// ============================================================================
// --- ESCENA: NIVEL 1 (EXTIENDE DE ESCENA BASE) ---
// ============================================================================
export default class Level1 extends EscenaBase {
  constructor() {
    super("Level1");
  }

  preload() {
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
    this.load.image("cloud_platform", "./Assets/plataformaAire.png");
    this.load.audio("bark_sound", "./Audio/bark_sound.mp3");
    this.load.audio("comer_hueso", "./Audio/comer_hueso.mp3");
    this.load.audio("obtener_vida", "./Audio/getLife.mp3");
    this.load.audio("mocca_daño", "./Audio/mocca_daño.mp3");
    this.load.audio("gato_daño", "./Audio/gato_daño.mp3");
    this.load.audio("level_1", "./Audio/level_1.mp3");
    this.load.audio("mocca_jump", "./Audio/mocca_jump.wav");
    this.load.spritesheet("huesito", "./Assets/Huesito.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("gato", "./Assets/BlackRun.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.image("background", "./Assets/background.png");
    this.load.image("vida_mocca", "./Assets/vida_mocca.png");
    this.load.image("Mute", "./Assets/Botones/Mute.png");
    this.load.image("Unmute", "./Assets/Botones/Unmute.png");
    this.load.image("Pause", "./Assets/Botones/Resume.png");
  }

  create() {
    const { width, height } = this.scale;

    this.crearBaseComun("level_1");

    // Fondo Parallax
    this.fondoBosque = this.add
      .tileSprite(0, 0, width, height, "background")
      .setOrigin(0, 0)
      .setScrollFactor(0);
    let texturaOriginal = this.textures.get("background").getSourceImage();
    let factorEscalaFinal = Math.max(
      width / texturaOriginal.width,
      height / texturaOriginal.height,
    );
    this.fondoBosque.tileScaleX = factorEscalaFinal;
    this.fondoBosque.tileScaleY = factorEscalaFinal;

    // Suelo
    this.ground = this.physics.add.staticGroup();
    for (let x = 0; x < this.longitudNivel; x += 128) {
      let tile = this.ground
        .create(x, height - 32, "ground")
        .setScale(2)
        .refreshBody();
      tile.body.setSize(128, 45);
      tile.body.setOffset(0, 19);
    }

    this.platforms = this.physics.add.staticGroup();
    let bones = this.physics.add.group();
    this.gatos = this.physics.add.group();

    // ============================================================================
    // --- VERIFICACIÓN SEGURA E INDIVIDUAL DE ANIMACIONES ---
    // ============================================================================
    if (!this.anims.exists("huesito_rotate")) {
      this.anims.create({
        key: "huesito_rotate",
        frames: this.anims.generateFrameNumbers("huesito", {
          start: 0,
          end: 4,
        }),
        frameRate: 7,
        repeat: -1,
      });
    }
    if (!this.anims.exists("gato_run")) {
      this.anims.create({
        key: "gato_run",
        frames: this.anims.generateFrameNumbers("gato", { start: 0, end: 5 }),
        frameRate: 7,
        repeat: -1,
      });
    }

    if (!this.anims.exists("idle")) {
      this.anims.create({
        key: "idle",
        frames: this.anims.generateFrameNumbers("mocca", { start: 0, end: 1 }),
        frameRate: 7,
        repeat: -1,
      });
    }
    if (!this.anims.exists("run")) {
      this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("mocca_run", {
          start: 0,
          end: 2,
        }),
        frameRate: 7,
        repeat: -1,
      });
    }
    if (!this.anims.exists("jump")) {
      this.anims.create({
        key: "jump",
        frames: this.anims.generateFrameNumbers("mocca_jump", {
          start: 0,
          end: 3,
        }),
        frameRate: 2,
        repeat: 0,
      });
    }
    if (!this.anims.exists("bark_idle")) {
      this.anims.create({
        key: "bark_idle",
        frames: this.anims.generateFrameNumbers("mocca_bark", {
          start: 0,
          end: 0,
        }),
        frameRate: 1,
        repeat: 0,
      });
    }
    if (!this.anims.exists("bark_run")) {
      this.anims.create({
        key: "bark_run",
        frames: this.anims.generateFrameNumbers("mocca_bark", {
          start: 1,
          end: 1,
        }),
        frameRate: 1,
        repeat: 0,
      });
    }
    if (!this.anims.exists("bark_jump")) {
      this.anims.create({
        key: "bark_jump",
        frames: this.anims.generateFrameNumbers("mocca_bark", {
          start: 2,
          end: 2,
        }),
        frameRate: 1,
        repeat: 0,
      });
    }

    // ============================================================================
    // --- MAPEO DE PLATAFORMAS NIVEL 1: 100% ESTÁTICO POR DISEÑO ---
    // ============================================================================
    const diseñoNivel = [
      { x: 400, y: height - 130, bloques: 1 },
      { x: 680, y: height - 220, bloques: 2 },
      { x: 980, y: height - 310, bloques: 1 },
      { x: 1260, y: height - 220, bloques: 2 },
      { x: 1560, y: height - 130, bloques: 1 },
      { x: 1840, y: height - 220, bloques: 2 },
      { x: 2140, y: height - 310, bloques: 2 },
      { x: 2450, y: height - 130, bloques: 1 },
      { x: 2750, y: height - 220, bloques: 1 },
      { x: 3050, y: height - 310, bloques: 2 },
      { x: 3380, y: height - 220, bloques: 1 },
      { x: 3680, y: height - 130, bloques: 2 },
      { x: 3980, y: height - 220, bloques: 1 },
      { x: 4280, y: height - 310, bloques: 2 },
      { x: 4600, y: height - 130, bloques: 1 },
      { x: 4900, y: height - 220, bloques: 2 },
      { x: 5200, y: height - 310, bloques: 1 },
      { x: 5500, y: height - 220, bloques: 2 },
      { x: 5800, y: height - 130, bloques: 1 },
      { x: 6100, y: height - 220, bloques: 2 },
      { x: 6400, y: height - 310, bloques: 2 },
      { x: 6720, y: height - 130, bloques: 1 },
      { x: 7020, y: height - 220, bloques: 1 },
      { x: 7320, y: height - 310, bloques: 2 },
      { x: 7650, y: height - 220, bloques: 1 },
      { x: 7950, y: height - 130, bloques: 2 },
      { x: 8250, y: height - 220, bloques: 1 },
      { x: 8550, y: height - 310, bloques: 2 },
      { x: 8880, y: height - 130, bloques: 1 },
      { x: 9180, y: height - 220, bloques: 2 },
      { x: 9480, y: height - 310, bloques: 1 },
      { x: 9780, y: height - 220, bloques: 2 },
      { x: 10100, y: height - 130, bloques: 2 },
    ];

    const separacionNubes = 120;
    diseñoNivel.forEach((isla) => {
      let anchoTotalIsla = (isla.bloques - 1) * separacionNubes;
      let inicioX = isla.x - anchoTotalIsla / 2;
      for (let i = 0; i < isla.bloques; i++) {
        let nubeX = inicioX + i * separacionNubes;
        let nube = this.platforms.create(nubeX, isla.y, "cloud_platform");
        nube.setScale(0.2).refreshBody();
        nube.body.setSize(nube.displayWidth / 2 - 10, 1);
        nube.body.setOffset(50, 20);
        nube.body.checkCollision.down = false;
        nube.body.checkCollision.left = false;
        nube.body.checkCollision.right = false;
        bones.create(nubeX, isla.y - 40, "huesito").body.setAllowGravity(false);
      }
    });

    // ============================================================================
    // --- ENEMIGOS EN EL SUELO ---
    // ============================================================================
    for (let posX = 600; posX < 10300; posX += 450) {
      let gatoSuelo = this.gatos
        .create(posX, height - 150, "gato")
        .setScale(1.5);
      gatoSuelo.body.setSize(35, 22);
      gatoSuelo.body.setOffset(6, 26);
      gatoSuelo.setCollideWorldBounds(true);
      gatoSuelo.speed = 100;
      gatoSuelo.distaciaPatrulla = 140;
      gatoSuelo.puntoInicialX = posX;
      gatoSuelo.isStunned = false;
      gatoSuelo.anims.play("gato_run");
      gatoSuelo.setVelocityX(gatoSuelo.speed);
    }

    // Mocca
    this.mocca = this.physics.add
      .sprite(100, height - 100, "mocca")
      .setScale(1.5);
    this.mocca.body.setSize(45, 35);
    this.mocca.body.setOffset(8, 12);
    this.mocca.setCollideWorldBounds(true);
    this.mocca.anims.play("idle");

    this.cameras.main.startFollow(this.mocca, true, 0.05, 0.05);
    this.cameras.main.setBounds(0, 0, this.longitudNivel, height);

    // Colisiones
    this.physics.add.collider(this.mocca, this.ground);
    this.physics.add.collider(this.gatos, this.ground);
    this.physics.add.overlap(this.mocca, bones, this.collectBone, null, this);
    this.physics.add.overlap(
      this.mocca,
      this.gatos,
      this.hitEnemigo,
      null,
      this,
    );

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

    // Animaciones flotantes de los huesitos
    bones.children.iterate((huesito) => {
      if (huesito) {
        huesito.anims.play("huesito_rotate");
        huesito.body.setSize(30, 30);
        this.tweens.add({
          targets: huesito,
          y: huesito.y - 12,
          duration: 1400,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      }
    });

    // Botones UI
    const factorUI = height / 768;
    const escalaBotonesUI = 0.25 * factorUI;
    const margenDerecho = 50 * factorUI;
    const margenSuperior = 45 * factorUI;
    const espacioEntreBotones = 65 * factorUI;

    // --- CORREGIDO: "margenSuperior" en vez de "marginSuperior" ---
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
      this.scene.pause("Level1");
      this.scene.launch("PauseScene", { currentScene: "Level1" });
    });

    [this.btnSonido, this.btnPausa].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    this.scale.on("resize", (gameSize) => {
      const w = gameSize.width;
      const h = gameSize.height;
      const fUI = h / 768;
      const eBotones = 0.25 * fUI;
      const mDerecho = 50 * fUI;
      const mSuperior = 45 * fUI;
      const eEntre = 65 * fUI;

      if (this.fondoBosque) {
        this.fondoBosque.setSize(w, h);
        let resTex = this.textures.get("background").getSourceImage();
        let fEscala = Math.max(h / resTex.height, w / resTex.width);
        this.fondoBosque.tileScaleX = fEscala;
        this.fondoBosque.tileScaleY = fEscala;
      }
      this.btnSonido.setPosition(w - mDerecho, mSuperior).setScale(eBotones);
      this.btnPausa
        .setPosition(this.btnSonido.x - eEntre, mSuperior)
        .setScale(eBotones);
    });
  }
}