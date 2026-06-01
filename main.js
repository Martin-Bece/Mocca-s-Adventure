// ============================================================================
// --- PATRÓN SINGLETON: AUDIO MANAGER ---
// ============================================================================
class AudioManager {
  constructor() {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }
    AudioManager.instance = this;

    this.game = null;
    this.currentMusic = null;
  }

  static getInstance() {
    if (!AudioManager.instance) {
      return (AudioManager.instance = new AudioManager());
    }
    return AudioManager.instance;
  }

  init(gameInstance) {
    this.game = gameInstance;
  }

  playMusic(scene, key, config = { volume: 0.2, loop: true }) {
    if (
      this.currentMusic &&
      this.currentMusic.key === key &&
      this.currentMusic.isPlaying
    ) {
      return;
    }

    this.stopMusic();

    this.currentMusic = scene.sound.add(key, config);
    this.currentMusic.play();
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  setMute(scene, isMuted) {
    scene.sound.mute = isMuted;
  }

  isMuted(scene) {
    return scene.sound.mute;
  }
}

const audioManager = AudioManager.getInstance();

// ============================================================================
// --- ESCENA: MENÚ PRINCIPAL ---
// ============================================================================
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  preload() {
    this.load.image("background", "Assets/background.png");
    this.load.image("Continue", "Assets/Botones/Continue.png");
    this.load.image("Credits", "Assets/Botones/Credits.png");
    this.load.image("Help", "Assets/Botones/Help.png");
    this.load.image("Mute", "Assets/Botones/Mute.png");
    this.load.image("Unmute", "Assets/Botones/Unmute.png");
    this.load.image("Start", "Assets/Botones/Start.png");
    this.load.image("Imagen_Menu", "Assets/Imagen_Menu.png");
    this.load.audio("level_1", "Audio/level_1.mp3");
  }

  create() {
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

    let btnStart = this.add
      .image(width / 2, baseBotonesY, "Start")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnStart.on("pointerdown", () => {
      this.registry.set("vidas", 3);
      this.registry.set("puntos", 0);
      this.scene.start("Level1");
    });

    let btnContinue = this.add
      .image(width / 2, baseBotonesY + separacion, "Continue")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnContinue.on("pointerdown", () => {
      console.log("Cargar partida...");
    });

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

    [btnStart, btnContinue, btnHelp, btnCredits].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

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

    this.scale.on("resize", () => {
      this.scene.restart();
    });
  }

  update() {}
}

// ============================================================================
// --- ESCENA: NIVEL 1 (MAPA COMPLETO) ---
// ============================================================================
class Level1 extends Phaser.Scene {
  constructor() {
    super({ key: "Level1" });
    this.mocca = null;
    this.cursors = null;
    this.ground = null;
    this.platforms = null;
    this.gatos = null;
    this.isbarking = false;
    this.canBark = true; // NUEVO: Control de disponibilidad del ladrido
    this.barkCooldownProgress = 1; // NUEVO: Estado de carga de la barra (0 a 1)
    this.isRebounding = false;
    this.isPaused = false;
    this.longitudNivel = 12000;

    this.hudMocca = null;
    this.txtHudVidas = null;
    this.txtHudPuntos = null;
    this.barLadridoGraphics = null; // NUEVO: Gráfico dinámico de la barra de recarga

    this.PLAYER_SPEED = 160;
    this.JUMP_VELOCITY = -380;
    this.GRAVITY = 500;
  }

  preload() {
    this.load.spritesheet("mocca", "Assets/Mocca_Idle.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("mocca_run", "Assets/Mocca_run_right.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("mocca_jump", "Assets/Mocca_jump.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("mocca_bark", "Assets/Mocca_bark.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.image("ground", "Assets/ground.png");
    this.load.image("cloud_platform", "Assets/plataformaAire.png");

    this.load.audio("bark_sound", "Audio/bark_sound.mp3");
    this.load.audio("comer_hueso", "Audio/comer_hueso.mp3");
    this.load.audio("obtener_vida", "Audio/getLife.mp3");
    this.load.audio("mocca_daño", "Audio/mocca_daño.mp3");
    this.load.audio("gato_daño", "Audio/gato_daño.mp3");
    this.load.audio("level_1", "Audio/level_1.mp3");
    this.load.audio("mocca_jump", "Audio/mocca_jump.wav");
    this.load.spritesheet("huesito", "Assets/Huesito.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("gato", "Assets/BlackRun.png", {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.load.image("background", "Assets/background.png");

    this.load.image("vida_mocca", "Assets/vida_mocca.png");
    this.load.image("Continue", "Assets/Botones/Continue.png");
    this.load.image("Mute", "Assets/Botones/Mute.png");
    this.load.image("Unmute", "Assets/Botones/Unmute.png");
    this.load.image("Restart", "Assets/Botones/Restart.png");
    this.load.image("Exit", "Assets/Botones/Exit.png");
    this.load.image("Resume", "Assets/Botones/Pause.png");
    this.load.image("Pause", "Assets/Botones/Resume.png");
    this.load.image("Help", "Assets/Botones/Help.png");
  }

  create() {
    const { width, height } = this.scale;

    if (!this.registry.has("vidas")) {
      this.registry.set("vidas", 3);
    }
    if (!this.registry.has("puntos")) {
      this.registry.set("puntos", 0);
    }

    this.isRebounding = false;
    this.canBark = true;
    this.barkCooldownProgress = 1;

    this.physics.world.setBounds(0, 0, this.longitudNivel, height);
    audioManager.playMusic(this, "level_1", { volume: 0.2, loop: true });

    this.fondoBosque = this.add.tileSprite(0, 0, width, height, "background");
    this.fondoBosque.setOrigin(0, 0);
    this.fondoBosque.setScrollFactor(0);

    let texturaOriginal = this.textures.get("background").getSourceImage();
    let escalaInternaY = height / texturaOriginal.height;
    let escalaInternaX = width / texturaOriginal.width;
    let factorEscalaFinal = Math.max(escalaInternaX, escalaInternaY);

    this.fondoBosque.tileScaleX = factorEscalaFinal;
    this.fondoBosque.tileScaleY = factorEscalaFinal;

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

    this.anims.create({
      key: "huesito_rotate",
      frames: this.anims.generateFrameNumbers("huesito", { start: 0, end: 4 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: "gato_run",
      frames: this.anims.generateFrameNumbers("gato", { start: 0, end: 5 }),
      frameRate: 7,
      repeat: -1,
    });

    const diseñoNivel = [];
    let proximoX = 400;
    let alternarAltura = 0;

    while (proximoX < 10400) {
      let bloquesIsla = Math.floor(Phaser.Math.Between(1, 2));
      let alturaY = height - 130;
      if (alternarAltura === 1) alturaY = height - 220;
      if (alternarAltura === 2) alturaY = height - 310;
      diseñoNivel.push({ x: proximoX, y: alturaY, bloques: bloquesIsla });
      proximoX += Phaser.Math.Between(260, 340);
      alternarAltura = (alternarAltura + 1) % 3;
    }

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
        let huesito = bones.create(nubeX, isla.y - 40, "huesito");
        huesito.body.setAllowGravity(false);
      }
    });

    for (let posX = 600; posX < 10300; posX += 450) {
      let gatoSuelo = this.gatos
        .create(posX, height - 150, "gato")
        .setScale(1.5);
      gatoSuelo.body.setSize(35, 22);
      gatoSuelo.body.setOffset(6, 26);
      gatoSuelo.setCollideWorldBounds(true);
      gatoSuelo.speed = 80 + Math.random() * 40;
      gatoSuelo.distaciaPatrulla = 140;
      gatoSuelo.puntoInicialX = posX;
      gatoSuelo.isStunned = false; // NUEVO: Bandera para saber si el gato está aturdido
      gatoSuelo.anims.play("gato_run");
      gatoSuelo.setVelocityX(gatoSuelo.speed);
    }

    this.mocca = this.physics.add
      .sprite(100, height - 100, "mocca")
      .setScale(1.5);
    this.mocca.body.setSize(50, 35);
    this.mocca.body.setOffset(8, 12);

    this.cameras.main.startFollow(this.mocca, true, 0.05, 0.05);
    this.cameras.main.setBounds(0, 0, this.longitudNivel, height);

    this.physics.add.collider(this.mocca, this.ground);
    this.platformCollider = this.physics.add.collider(
      this.mocca,
      this.platforms,
      null,
      (player, platform) => {
        if (this.cursors.down.isDown) return false;
        return true;
      },
      this,
    );

    this.mocca.setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.anims.create({
      key: "idle",
      frames: this.anims.generateFrameNumbers("mocca", { start: 0, end: 1 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers("mocca_run", {
        start: 0,
        end: 2,
      }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: "jump",
      frames: this.anims.generateFrameNumbers("mocca_jump", {
        start: 0,
        end: 3,
      }),
      frameRate: 2,
      repeat: 0,
    });
    this.anims.create({
      key: "bark_idle",
      frames: this.anims.generateFrameNumbers("mocca_bark", {
        start: 0,
        end: 0,
      }),
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "bark_run",
      frames: this.anims.generateFrameNumbers("mocca_bark", {
        start: 1,
        end: 1,
      }),
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: "bark_jump",
      frames: this.anims.generateFrameNumbers("mocca_bark", {
        start: 2,
        end: 2,
      }),
      frameRate: 1,
      repeat: 0,
    });

    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.mocca.anims.play("idle");

    bones.children.iterate((huesito) => {
      if (huesito) {
        huesito.anims.play("huesito_rotate");
        huesito.body.setSize(30, 30);
        this.tweens.add({
          targets: huesito,
          y: huesito.y - 12,
          duration: 1200 + Math.random() * 400,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      }
    });

    this.physics.add.overlap(this.mocca, bones, this.collectBone, null, this);
    this.physics.add.collider(this.gatos, this.ground);
    this.physics.add.overlap(this.mocca, this.gatos, this.hitGato, null, this);

    // ====================================================================
    // --- MARCADOR COMPACTO DINÁMICO (FIJO ARRIBA A LA IZQUIERDA) ---
    // ====================================================================
    this.hudMocca = this.add.container(40, 40);
    this.hudMocca.setScrollFactor(0);

    let imgCabezaHud = this.add
      .image(0, 0, "vida_mocca")
      .setOrigin(0.5)
      .setScale(1.2);

    this.txtHudVidas = this.add
      .text(30, 0, `x ${this.registry.get("vidas")}`, {
        fontFamily: "Arial",
        fontSize: "18px",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.txtHudPuntos = this.add
      .text(10, 25, `Puntos: ${this.registry.get("puntos")}`, {
        fontFamily: "Arial",
        fontSize: "16px",
        fill: "#ffff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // NUEVO: Gráficos de la barra de enfriamiento/recarga ubicados debajo de los puntos en el HUD
    this.barLadridoGraphics = this.add.graphics();

    this.hudMocca.add([imgCabezaHud, this.txtHudVidas, this.txtHudPuntos, this.barLadridoGraphics]);

    // Dibujamos el estado inicial listo de la barra
    this.actualizarBarraLadrido();

    // ====================================================================
    // --- BOTONES UI ---
    // ====================================================================
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
      this.scene.pause("Level1");
      this.scene.launch("PauseScene");
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

      this.physics.world.setBounds(0, 0, this.longitudNivel, h);

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

  update() {
    if (this.fondoBosque) {
      this.fondoBosque.tilePositionX =
        (this.cameras.main.scrollX * 0.3) / this.fondoBosque.tileScaleX;
    }

    // --- LÓGICA DE PATRULLA DE GATOS MODIFICADA ---
    this.gatos.children.iterate((gato) => {
      if (gato && gato.active && gato.body) {
        if (gato.isStunned) {
          // Si está aturdido, forzamos velocidad 0 y no procesamos cambios de dirección
          gato.setVelocityX(0);
          return;
        }

        if (gato.x >= gato.puntoInicialX + gato.distaciaPatrulla) {
          gato.setVelocityX(-gato.speed);
          gato.setFlipX(true);
        } else if (gato.x <= gato.puntoInicialX - gato.distaciaPatrulla) {
          gato.setVelocityX(gato.speed);
          gato.setFlipX(false);
        }
      }
    });

    if (this.isRebounding || this.isbarking || this.isPaused) return;

    // --- ACTIVACIÓN DEL LADRIDO MODIFICADO CON COOLDOWN ---
    if (Phaser.Input.Keyboard.JustDown(this.keyZ) && this.canBark) {
      this.isbarking = true;
      this.canBark = false;
      this.barkCooldownProgress = 0; // Se vacía la barra instantáneamente
      this.actualizarBarraLadrido();

      this.sound.play("bark_sound", { volume: 0.2 });

      if (!this.mocca.body.onFloor() && !this.mocca.body.touching.down) {
        this.mocca.anims.play("bark_jump", true);
      } else if (this.cursors.left.isDown || this.cursors.right.isDown) {
        this.mocca.anims.play("bark_run", true);
      } else {
        this.mocca.anims.play("bark_idle", true);
      }

      // NUEVO: Chequear área de efecto frente a Mocca para aturdir gatos cercanos
      let rangoLadrido = 160; 
      this.gatos.children.iterate((gato) => {
        if (gato && gato.active) {
          let distanciaX = gato.x - this.mocca.x;
          let distanciaY = Math.abs(gato.y - this.mocca.y);

          // Verificamos proximidad en altura (Y) y cercanía horizontal (X) basada en hacia dónde mira Mocca
          if (distanciaY < 60 && Math.abs(distanciaX) <= rangoLadrido) {
            let mirandoDerechaYEnRango = (!this.mocca.flipX && distanciaX > 0);
            let mirandoIzquierdaYEnRango = (this.mocca.flipX && distanciaX < 0);

            if (mirandoDerechaYEnRango || mirandoIzquierdaYEnRango) {
              this.aturdirGato(gato);
            }
          }
        }
      });

      // Duración de la animación de ladrido (300ms)
      this.time.delayedCall(300, () => {
        this.isbarking = false;
      });

      // NUEVO: Inicialización del Tween para recargar la barra visualmente durante 5 segundos
      this.tweens.add({
        targets: this,
        barkCooldownProgress: 1,
        duration: 5000,
        onUpdate: () => {
          this.actualizarBarraLadrido();
        },
        onComplete: () => {
          this.canBark = true;
          this.actualizarBarraLadrido(); // Redibuja en verde completo
        }
      });

      return;
    }

    if (this.cursors.left.isDown) {
      this.mocca.setVelocityX(-this.PLAYER_SPEED);
      this.mocca.setFlipX(true);
      if (this.mocca.body.onFloor() || this.mocca.body.touching.down)
        this.mocca.anims.play("run", true);
    } else if (this.cursors.right.isDown) {
      this.mocca.setVelocityX(this.PLAYER_SPEED);
      this.mocca.setFlipX(false);
      if (this.mocca.body.onFloor() || this.mocca.body.touching.down)
        this.mocca.anims.play("run", true);
    } else {
      this.mocca.setVelocityX(0);
      if (this.mocca.body.onFloor() || this.mocca.body.touching.down)
        this.mocca.anims.play("idle", true);
    }

    if (
      this.cursors.space.isDown &&
      (this.mocca.body.onFloor() || this.mocca.body.touching.down)
    ) {
      this.mocca.setVelocityY(this.JUMP_VELOCITY);
      this.mocca.anims.play("jump", true);
      this.sound.play("mocca_jump", { volume: 0.3 });
    }

    if (
      !this.mocca.body.onFloor() &&
      !this.mocca.body.touching.down &&
      this.mocca.anims.currentAnim.key !== "jump" &&
      !this.isbarking
    ) {
      this.mocca.anims.play("jump", true);
    }
  }

  // NUEVO: Método para procesar el aturdimiento del enemigo e indicadores visuales
  aturdirGato(gato) {
    gato.isStunned = true;
    gato.setVelocityX(0);
    gato.anims.pause(); // Pausamos sus patitas corriendo

    // Cambiamos el color a azul eléctrico/celeste brillante y bajamos opacidad para el parpadeo
    gato.setTint(0x3399ff);
    gato.setAlpha(0.8);

    // Creamos un efecto visual intermitente (parpadeo rápido)
    let tweensEfecto = this.tweens.add({
      targets: gato,
      alpha: 0.4,
      duration: 150,
      yoyo: true,
      repeat: 4
    });

    // Remueve el estado alterado exactamente a los 1500 milisegundos (1.5 segundos)
    this.time.delayedCall(1500, () => {
      if (gato && gato.active) {
        tweensEfecto.stop();
        gato.isStunned = false;
        gato.clearTint(); // Limpia el color azul
        gato.setAlpha(1);  // Reestablece opacidad completa
        gato.anims.resume(); // Vuelve a correr
        
        // Reactivamos velocidad inicial hacia el lado correcto
        let velocidadDireccion = gato.setFlipX ? -gato.speed : gato.speed;
        gato.setVelocityX(velocidadDireccion);
      }
    });
  }

  // NUEVO: Función encargada de renderizar geométricamente los rectángulos del medidor de recarga
  actualizarBarraLadrido() {
    if (!this.barLadridoGraphics) return;

    this.barLadridoGraphics.clear();

    const anchoMax = 70;
    const alto = 8;
    const posX = -25;
    const posY = 45;

    // 1. Dibujamos el contorno negro de fondo
    this.barLadridoGraphics.fillStyle(0x000000, 1);
    this.barLadridoGraphics.fillRect(posX, posY, anchoMax, alto);

    // 2. Definimos color según disponibilidad: Verde brillante si está listo, Celeste/Azul si carga
    let colorBarra = this.canBark ? 0x00ff00 : 0x00a8ff;
    this.barLadridoGraphics.fillStyle(colorBarra, 1);

    // 3. Dibujamos el relleno en base al progreso lineal escalado
    let anchoActual = anchoMax * this.barkCooldownProgress;
    this.barLadridoGraphics.fillRect(posX, posY, anchoActual, alto);
  }

  actualizarTextoVidas() {
    if (this.txtHudVidas) {
      this.txtHudVidas.setText(`x ${this.registry.get("vidas")}`);
    }
  }

  sumarPuntos(cantidad) {
    let puntosActuales = this.registry.get("puntos");
    let nuevosPuntos = puntosActuales + cantidad;

    this.registry.set("puntos", nuevosPuntos);

    if (this.txtHudPuntos) {
      this.txtHudPuntos.setText(`Puntos: ${nuevosPuntos}`);
    }

    let vidasPorPuntosActuales = Math.floor(puntosActuales / 1000);
    let vidasPorNuevosPuntos = Math.floor(nuevosPuntos / 1000);

    if (vidasPorNuevosPuntos > vidasPorPuntosActuales) {
      this.time.delayedCall(10, () => {
        let vidasActuales = this.registry.get("vidas") + 1;
        this.registry.set("vidas", vidasActuales);

        this.actualizarTextoVidas();

        if (this.sound.get("obtener_vida")) {
          this.sound.play("obtener_vida", { volume: 0.2 });
        }

        this.tweens.add({
          targets: this.txtHudVidas,
          scale: 1.6,
          duration: 150,
          yoyo: true,
          ease: "Quad.easeInOut",
        });
      });
    }
  }

  collectBone(mocca, huesito) {
    this.sound.play("comer_hueso", { volume: 0.2 });
    huesito.disableBody(true, true);
    huesito.destroy();
    this.sumarPuntos(10);
  }

  hitGato(mocca, gato) {
    if (this.isRebounding || !gato.active) return;

    // Si el gato está stuneado, igual lo destruimos si le saltamos encima desde arriba
    if (mocca.body.velocity.y > 0 && mocca.y < gato.y) {
      gato.disableBody(true, true);
      gato.destroy();
      mocca.setVelocityY(-300);
      this.sound.play("gato_daño", { volume: 0.1 });
      this.sumarPuntos(50);
      return;
    }

    // NUEVO CONTROL: Si el gato está aturdido/stuneado, Mocca NO recibe daño al tocarlo de costado
    if (gato.isStunned) return;

    this.isRebounding = true;
    this.physics.pause();

    this.sound.play("mocca_daño", { volume: 0.1 });

    let vidasActuales = this.registry.get("vidas") - 1;
    this.registry.set("vidas", vidasActuales);

    this.registry.set("puntos", 0);

    this.actualizarTextoVidas();
    if (this.txtHudPuntos) {
      this.txtHudPuntos.setText("Puntos: 0");
    }

    mocca.setTint(0xff0000);

    this.time.delayedCall(500, () => {
      this.scene.start("PerderVida");
    });
  }
}

// ============================================================================
// --- ESCENA: MENÚ DE PAUSA SUPERPUESTO ---
// ============================================================================
class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: "PauseScene" });
  }

  preload() {
    this.load.image("pause_img", "Assets/pause_img.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

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

    let btnResume = this.add
      .image(width / 2, baseBotonesY, "Continue")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnResume.on("pointerdown", () => {
      this.scene.stop();
      this.scene.resume("Level1");
    });

    let btnRestart = this.add
      .image(width / 2, baseBotonesY + separacion, "Restart")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnRestart.on("pointerdown", () => {
      this.scene.stop();
      this.scene.start("Level1");
    });

    let btnExit = this.add
      .image(width / 2, baseBotonesY + separacion * 2, "Exit")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnExit.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop("Level1");
      this.scene.start("MenuScene");
    });

    [btnResume, btnRestart, btnExit].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    this.scale.on("resize", () => {
      this.scene.restart();
    });
  }
}

// ============================================================================
// --- ESCENA: MENÚ INTERNO DE AYUDA (HELP) ---
// ============================================================================
class HelpScene extends Phaser.Scene {
  constructor() {
    super({ key: "HelpScene" });
  }

  preload() {
    this.load.image("help_img", "Assets/help_img.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    let fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.7);
    fondoOscuro.fillRect(0, 0, width, height);

    let imgHelp = this.add
      .image(width / 2, height * 0.28, "help_img")
      .setOrigin(0.5)
      .setScale(0.32 * baseScale);

    let txtControles = this.add
      .text(
        width / 2,
        height * 0.52,
        "Controles: Flechas para moverte, Espacio para saltar y Z para ladrar.",
        {
          fontFamily: "Arial",
          fontSize: `${Math.floor(22 * baseScale)}px`,
          fill: "#ffffff",
          align: "center",
          wordWrap: { width: width * 0.8 },
        },
      )
      .setOrigin(0.5);

    let btnBack = this.add
      .image(width / 2, height * 0.68, "Continue")
      .setOrigin(0.5)
      .setScale(0.45 * baseScale)
      .setInteractive({ useHandCursor: true });

    btnBack.on("pointerdown", () => {
      this.scene.stop();
    });

    btnBack.on("pointerover", () => btnBack.setTint(0xffcc00));
    btnBack.on("pointerout", () => btnBack.clearTint());

    this.scale.on("resize", () => {
      this.scene.restart();
    });
  }
}

// ============================================================================
// --- ESCENA: MENÚ INTERNO DE CRÉDITOS (CREDITS) ---
// ============================================================================
class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: "CreditsScene" });
  }

  preload() {
    this.load.image("credits_img", "Assets/credits_img.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    let fondoOscuro = this.add.graphics();
    fondoOscuro.fillStyle(0x000000, 0.7);
    fondoOscuro.fillRect(0, 0, width, height);

    let imgCredits = this.add
      .image(width / 2, height * 0.28, "credits_img")
      .setOrigin(0.5)
      .setScale(0.32 * baseScale);

    let txtCreditos = this.add
      .text(
        width / 2,
        height * 0.52,
        "Juego realizado por Martin Nahuel Becerra - Universidad de la Punta 2026",
        {
          fontFamily: "Arial",
          fontSize: `${Math.floor(22 * baseScale)}px`,
          fill: "#ffffff",
          align: "center",
          wordWrap: { width: width * 0.8 },
        },
      )
      .setOrigin(0.5);

    let btnBack = this.add
      .image(width / 2, height * 0.68, "Continue")
      .setOrigin(0.5)
      .setScale(0.45 * baseScale)
      .setInteractive({ useHandCursor: true });

    btnBack.on("pointerdown", () => {
      this.scene.stop();
    });

    btnBack.on("pointerover", () => btnBack.setTint(0xffcc00));
    btnBack.on("pointerout", () => btnBack.clearTint());

    this.scale.on("resize", () => {
      this.scene.restart();
    });
  }
}

// ============================================================================
// --- ESCENA: PANTALLA INTERMEDIA AL PERDER VIDA ---
// ============================================================================
class PerderVida extends Phaser.Scene {
  constructor() {
    super({ key: "PerderVida" });
  }

  preload() {
    this.load.image("vida_mocca", "Assets/vida_mocca.png");
  }

  create() {
    const { width, height } = this.scale;
    const baseScale = height / 768;

    let fondo = this.add.graphics();
    fondo.fillStyle(0x000000, 1);
    fondo.fillRect(0, 0, width, height);

    let vidasRestantes = this.registry.get("vidas");
    let contenedor = this.add.container(width / 2, height / 2);

    let imgMocca = this.add
      .image(-40 * baseScale, 0, "vida_mocca")
      .setOrigin(0.5)
      .setScale(3.2 * baseScale);

    let txtVidas = this.add
      .text(30 * baseScale, 0, `x ${vidasRestantes}`, {
        fontFamily: "Arial",
        fontSize: `${Math.floor(48 * baseScale)}px`,
        fill: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    contenedor.add([imgMocca, txtVidas]);

    this.time.delayedCall(2000, () => {
      if (vidasRestantes > 0) {
        this.scene.start("Level1");
      } else {
        this.scene.start("MenuScene");
      }
    });
  }
}

// ============================================================================
// --- CONFIGURACIÓN E INICIALIZACIÓN ---
// ============================================================================
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 500 },
      debug: false,
    },
  },
  scene: [MenuScene, Level1, PerderVida, PauseScene, HelpScene, CreditsScene],
};

const game = new Phaser.Game(config);