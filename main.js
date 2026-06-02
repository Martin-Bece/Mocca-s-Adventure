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
    this.load.image("Exit", "Assets/Botones/Exit.png");
    this.load.image("Restart", "Assets/Botones/Restart.png");
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
      this.scene.start("Level2");
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
// --- CLASE BASE REUTILIZABLE PARA TODOS LOS NIVELES ---
// ============================================================================
class EscenaBase extends Phaser.Scene {
  constructor(key) {
    super({ key: key });

    // Variables de control compartidas
    this.mocca = null;
    this.cursors = null;
    this.ground = null;
    this.platforms = null;
    this.enemigos = null; // Grupo genérico principal para Nivel 2+
    this.gatos = null; // Grupo secundario/retrocompatible para Nivel 1

    this.isbarking = false;
    this.canBark = true;
    this.barkCooldownProgress = 1;
    this.isRebounding = false;
    this.isPaused = false;
    this.longitudNivel = 12000;

    this.hudMocca = null;
    this.txtHudVidas = null;
    this.txtHudPuntos = null;
    this.barLadridoGraphics = null;

    // Configuración física por defecto
    this.PLAYER_SPEED = 160;
    this.JUMP_VELOCITY = -380;
    this.GRAVITY = 500;
  }

  // Inicialización básica del estado del juego y HUD común
  crearBaseComun(nombreMusica) {
    const { width, height } = this.scale;

    if (!this.registry.has("vidas")) this.registry.set("vidas", 3);
    if (!this.registry.has("puntos")) this.registry.set("puntos", 0);

    this.isRebounding = false;
    this.canBark = true;
    this.barkCooldownProgress = 1;

    this.physics.world.setBounds(0, 0, this.longitudNivel, height);
    audioManager.playMusic(this, nombreMusica, { volume: 0.2, loop: true });

    // Configuración común del input de teclado
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // Inicializar el HUD
    this.crearHUD();

    this.tiempoInicio = this.time.now;
    this.nivelCompletado = false;
  }

  crearHUD() {
    // Posicionamos el contenedor en la esquina superior izquierda
    this.hudMocca = this.add.container(40, 40).setScrollFactor(0).setDepth(10);

    // La cabeza de Mocca la dejamos en el origen del contenedor (0, 0)
    let imgCabezaHud = this.add
      .image(0, 0, "vida_mocca")
      .setOrigin(0.5)
      .setScale(1.2);

    // El texto de vidas un poco a la derecha del icono
    this.txtHudVidas = this.add
      .text(18, 0, `x ${this.registry.get("vidas")}`, {
        fontFamily: "Arial",
        fontSize: "18px",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5); // Cambiado a origen 0 para mejor alineación

    // El texto de puntos abajo del icono de vida
    this.txtHudPuntos = this.add
      .text(-20, 25, `Puntos: ${this.registry.get("puntos")}`, {
        fontFamily: "Arial",
        fontSize: "16px",
        fill: "#ffff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0, 0.5);

    this.barLadridoGraphics = this.add.graphics();

    // Añadimos todo al contenedor
    this.hudMocca.add([
      imgCabezaHud,
      this.txtHudVidas,
      this.txtHudPuntos,
      this.barLadridoGraphics,
    ]);

    this.actualizarBarraLadrido();
  }

  update() {
    // Fondo parallax genérico (soporta tanto fondoParallax como fondoBosque)
    let fondoActual = this.fondoParallax || this.fondoBosque;
    if (fondoActual) {
      fondoActual.tilePositionX =
        (this.cameras.main.scrollX * 0.3) / fondoActual.tileScaleX;
    }

    // --- LÓGICA DE PATRULLA INTELIGENTE (Busca tanto enemigos como gatos) ---
    let grupoEnemigos = this.enemigos || this.gatos;
    if (grupoEnemigos) {
      grupoEnemigos.children.iterate((enemigo) => {
        if (enemigo && enemigo.active && enemigo.body) {
          if (enemigo.isStunned) {
            enemigo.setVelocityX(0);
            if (enemigo.esVolador) enemigo.setVelocityY(0);
            return;
          }

          // Movimiento horizontal de patrulla en base a su rango
          if (enemigo.x >= enemigo.puntoInicialX + enemigo.distaciaPatrulla) {
            enemigo.setVelocityX(-enemigo.speed);
            enemigo.setFlipX(true);
          } else if (
            enemigo.x <=
            enemigo.puntoInicialX - enemigo.distaciaPatrulla
          ) {
            enemigo.setVelocityX(enemigo.speed);
            enemigo.setFlipX(false);
          }
        }
      });
    }

    // --- ACCIONES Y MOVIMIENTOS DE MOCCA ---
    if (this.mocca && this.mocca.active) {
      this.manejarMovimientoMocca();
    }

    // --- PANTALLA DE VICTORIA ---
    if (this.mocca && this.mocca.active && !this.nivelCompletado) {
      if (this.mocca.x >= this.longitudNivel - 100) {
        this.nivelCompletado = true;

        let tiempoTotalMs = this.time.now - this.tiempoInicio;
        let segundosTotales = Math.floor(tiempoTotalMs / 1000);

        this.physics.pause();
        this.mocca.anims.play("idle", true);
        this.mocca.setVelocity(0, 0);

        this.scene.launch("WinScene", {
          escenaOrigen: this.scene.key,
          puntos: this.registry.get("puntos"),
          vidas: this.registry.get("vidas"),
          tiempo: segundosTotales,
        });

        this.scene.pause();
      }
    }
  }

  manejarMovimientoMocca() {
    if (this.isRebounding || this.isbarking || this.isPaused) return;

    // --- ACTIVACIÓN DEL LADRIDO ---
    if (Phaser.Input.Keyboard.JustDown(this.keyZ) && this.canBark) {
      this.isbarking = true;
      this.canBark = false;
      this.barkCooldownProgress = 0;
      this.actualizarBarraLadrido();

      this.sound.play("bark_sound", { volume: 0.2 });

      if (!this.mocca.body.onFloor() && !this.mocca.body.touching.down) {
        this.mocca.anims.play("bark_jump", true);
      } else if (this.cursors.left.isDown || this.cursors.right.isDown) {
        this.mocca.anims.play("bark_run", true);
      } else {
        this.mocca.anims.play("bark_idle", true);
      }

      let rangoLadrido = 160;
      let grupoEnemigos = this.enemigos || this.gatos;
      if (grupoEnemigos) {
        grupoEnemigos.children.iterate((enemigo) => {
          if (enemigo && enemigo.active) {
            let distanciaX = enemigo.x - this.mocca.x;
            let distanciaY = Math.abs(enemigo.y - this.mocca.y);

            if (distanciaY < 60 && Math.abs(distanciaX) <= rangoLadrido) {
              let mirandoDerechaYEnRango = !this.mocca.flipX && distanciaX > 0;
              let mirandoIzquierdaYEnRango = this.mocca.flipX && distanciaX < 0;

              if (mirandoDerechaYEnRango || mirandoIzquierdaYEnRango) {
                this.aturdirEnemigo(enemigo);
              }
            }
          }
        });
      }

      this.time.delayedCall(300, () => {
        this.isbarking = false;
      });

      this.tweens.add({
        targets: this,
        barkCooldownProgress: 1,
        duration: 5000,
        onUpdate: () => {
          this.actualizarBarraLadrido();
        },
        onComplete: () => {
          this.canBark = true;
          this.actualizarBarraLadrido();
        },
      });
      return;
    }

    // --- CORRER ---
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

    // --- SALTAR ---
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

  aturdirEnemigo(enemigo) {
    enemigo.velocidadPrevia =
      enemigo.body.velocity.x !== 0 ? enemigo.body.velocity.x : -enemigo.speed;
    enemigo.isStunned = true;
    enemigo.setVelocityX(0);
    if (enemigo.esVolador) enemigo.setVelocityY(0);

    enemigo.anims.pause();
    enemigo.setTint(0x3399ff);
    enemigo.setAlpha(0.8);

    let tweensEfecto = this.tweens.add({
      targets: enemigo,
      alpha: 0.4,
      duration: 150,
      yoyo: true,
      repeat: 4,
    });

    this.time.delayedCall(1500, () => {
      if (enemigo && enemigo.active) {
        tweensEfecto.stop();
        enemigo.isStunned = false;
        enemigo.clearTint();
        enemigo.setAlpha(1);
        enemigo.anims.resume();
        enemigo.setVelocityX(enemigo.velocidadPrevia);
      }
    });
  }

  actualizarBarraLadrido() {
    if (!this.barLadridoGraphics) return;
    this.barLadridoGraphics.clear();
    const anchoMax = 70;
    const alto = 8;
    const posX = -20; // Alineado localmente con los puntos
    const posY = 45;

    this.barLadridoGraphics.fillStyle(0x000000, 1);
    this.barLadridoGraphics.fillRect(posX, posY, anchoMax, alto);

    let colorBarra = this.canBark ? 0x00ff00 : 0x00a8ff;
    this.barLadridoGraphics.fillStyle(colorBarra, 1);

    let anchoActual = anchoMax * this.barkCooldownProgress;
    this.barLadridoGraphics.fillRect(posX, posY, anchoActual, alto);
  }

  actualizarTextoVidas() {
    if (this.txtHudVidas)
      this.txtHudVidas.setText(`x ${this.registry.get("vidas")}`);
  }

  sumarPuntos(cantidad) {
    let puntosActuales = this.registry.get("puntos");
    let nuevosPuntos = puntosActuales + cantidad;
    this.registry.set("puntos", nuevosPuntos);

    if (this.txtHudPuntos) this.txtHudPuntos.setText(`Puntos: ${nuevosPuntos}`);

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

        // --- LE DEVOLVEMOS LA ANIMACIÓN AL HUD ---
        // Buscamos la imagen de la cabeza dentro del contenedor (es el primer elemento, índice 0)
        let imgCabeza = this.hudMocca.list[0];

        if (imgCabeza) {
          // Animación de rebote (escala) y destello de color para la carita de Mocca
          this.tweens.add({
            targets: imgCabeza,
            scaleX: 1.8, // Se agranda un toque
            scaleY: 1.8,
            duration: 150,
            yoyo: true, // Vuelve a su tamaño normal (1.2)
            ease: "Quad.easeOut",
            onStart: () => {
              imgCabeza.setTint(0x00ff00); // Se pone verde brillante de la emoción
            },
            onComplete: () => {
              imgCabeza.clearTint(); // Limpia el color al terminar
            },
          });
        }

        // También le damos un pequeño brinco al texto de las vidas para que llame la atención
        if (this.txtHudVidas) {
          this.tweens.add({
            targets: this.txtHudVidas,
            scaleX: 1.4,
            scaleY: 1.4,
            duration: 150,
            yoyo: true,
            ease: "Quad.easeOut",
          });
        }
      });
    }
  }

  collectBone(mocca, huesito) {
    this.sound.play("comer_hueso", { volume: 0.2 });
    huesito.disableBody(true, true);
    huesito.destroy();
    this.sumarPuntos(10);
  }

  hitEnemigo(mocca, enemigo) {
    if (this.isRebounding || !enemigo.active) return;

    if (mocca.body.velocity.y > 0 && mocca.y < enemigo.y) {
      enemigo.disableBody(true, true);
      enemigo.destroy();
      mocca.setVelocityY(-300);
      switch (enemigo.texture.key) {
        case "gato":
          this.sound.play("gato_daño", { volume: 0.1 });
          break;
        case "ardilla":
          this.sound.play("ardilla_sound", { volume: 0.1 });
          break;
        case "paloma":
          this.sound.play("paloma_sound", { volume: 0.3 });
          break;
        default:
          // Por si te olvidás de alguno en el futuro
          this.sound.play("gato_daño", { volume: 0.1 });
          break;
      }
      this.sumarPuntos(50);
      return;
    }

    if (enemigo.isStunned) return;

    this.isRebounding = true;
    this.physics.pause();
    this.sound.play("mocca_daño", { volume: 0.1 });

    let vidasActuales = this.registry.get("vidas") - 1;
    this.registry.set("vidas", vidasActuales);
    this.registry.set("puntos", 0);

    this.actualizarTextoVidas();
    if (this.txtHudPuntos) this.txtHudPuntos.setText("Puntos: 0");

    mocca.setTint(0xff0000);
    this.time.delayedCall(500, () => {
      this.scene.start("PerderVida", { currentScene: this.scene.key });
    });
  }
}

// ============================================================================
// --- ESCENA: NIVEL 1 (EXTIENDE DE ESCENA BASE) ---
// ============================================================================
class Level1 extends EscenaBase {
  constructor() {
    super("Level1");
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
    this.load.audio("obtener_vida", "Audio/getLife.flac");
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
    this.load.image("Mute", "Assets/Botones/Mute.png");
    this.load.image("Unmute", "Assets/Botones/Unmute.png");
    this.load.image("Pause", "Assets/Botones/Resume.png");
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

    // Animaciones
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
    // --- ENEMIGOS EN EL SUELO (Velocidades estables sin randoms) ---
    // ============================================================================
    for (let posX = 600; posX < 10300; posX += 450) {
      let gatoSuelo = this.gatos
        .create(posX, height - 150, "gato")
        .setScale(1.5);
      gatoSuelo.body.setSize(35, 22);
      gatoSuelo.body.setOffset(6, 26);
      gatoSuelo.setCollideWorldBounds(true);
      gatoSuelo.speed = 100; // Velocidad fija para evitar inconsistencias en el gameplay
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
    this.mocca.body.setSize(50, 35);
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

    // Tweening fijo para las animaciones flotantes de los huesitos
    bones.children.iterate((huesito) => {
      if (huesito) {
        huesito.anims.play("huesito_rotate");
        huesito.body.setSize(30, 30);
        this.tweens.add({
          targets: huesito,
          y: huesito.y - 12,
          duration: 1400, // Duración uniforme
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
      this.scene.launch("PauseScene", { currentScene: "Level1" }); // <--- Pasamos la clave
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
}

// ============================================================================
// --- ESCENA: PANTALLA DE VICTORIA SUPERPUESTA ---
// ============================================================================
class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: "WinScene" });
  }

  init(data) {
    // Recibe los datos enviados desde el nivel
    this.escenaOrigen = data.escenaOrigen;
    this.puntosFinales = data.puntos || 0;
    this.vidasFinales = data.vidas || 0;
    this.tiempoFinal = data.tiempo || 0;
  }

  preload() {
    this.load.image("win_img", "Assets/win_img.png");
    // Asegurate de que los assets "Continue" y "Exit" ya estén precargados en el nivel principal
  }

  create() {
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

    this.add
      .text(width / 2, height * 0.44, `¡Nivel Completado!`, {
        ...estiloTexto,
        fontSize: `${32 * baseScale}px`,
        fill: "#ffff00",
      })
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height * 0.52,
        `Puntos Totales: ${this.puntosFinales}`,
        estiloTexto,
      )
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height * 0.58,
        `Vidas Restantes: x${this.vidasFinales}`,
        estiloTexto,
      )
      .setOrigin(0.5);
    this.add
      .text(
        width / 2,
        height * 0.64,
        `Tiempo de Juego: ${tiempoTexto}`,
        estiloTexto,
      )
      .setOrigin(0.5);

    // 5. Botones de Control en disposición horizontal (uno al lado del otro)
    const escalaBotones = 0.4 * baseScale;
    const botonesY = height * 0.78;
    const separacionHorizontal = 110 * baseScale; // Distancia desde el centro para cada lado

    // Botón Exit (A la izquierda)
    let btnExit = this.add
      .image(width / 2 - separacionHorizontal, botonesY, "Exit")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnExit.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.escenaOrigen);
      this.scene.start("MenuScene"); // Te manda al menú de inicio
    });

    // Botón Continue (A la derecha)
    let btnContinue = this.add
      .image(width / 2 + separacionHorizontal, botonesY, "Continue")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnContinue.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.escenaOrigen);

      this.registry.set("puntos", 0);
      this.registry.set("tiempo", 0);

      // Si venías del Nivel 1, te pasa al 2. Si venías del 2, podrías mandarlo a una pantalla final o menú.
      if (this.escenaOrigen === "Level1") {
        this.scene.start("Level2");
      } else {
        this.scene.start("MenuScene");
      }
    });

    // Efecto visual hover para los botones
    [btnExit, btnContinue].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    // Manejo de resize
    this.scale.on("resize", () => {
      this.scene.restart({
        escenaOrigen: this.escenaOrigen,
        puntos: this.puntosFinales,
        vidas: this.vidasFinales,
        tiempo: this.tiempoFinal,
      });
    });
  }
}

// ============================================================================
// --- ESCENA: NIVEL 2 (PARQUE URBANO) ---
// ============================================================================
class Level2 extends EscenaBase {
  constructor() {
    super("Level2");
  }

  preload() {
    // Carga de assets esenciales
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
    this.load.image("park_platform", "Assets/plataformaAire2.png");

    // Audios
    this.load.audio("bark_sound", "Audio/bark_sound.mp3");
    this.load.audio("comer_hueso", "Audio/comer_hueso.mp3");
    this.load.audio("obtener_vida", "Audio/getLife.mp3"); 
    this.load.audio("mocca_daño", "Audio/mocca_daño.mp3");
    this.load.audio("gato_daño", "Audio/gato_daño.mp3");
    this.load.audio("level_2", "Audio/level_2.ogg");
    this.load.audio("mocca_jump", "Audio/mocca_jump.wav");
    this.load.audio("ardilla_sound", "Audio/ardilla_sound.mp3");
    this.load.audio("paloma_sound", "Audio/paloma_sound.mp3");

    // Sprites del nivel
    this.load.spritesheet("huesito", "Assets/Huesito.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet("ardilla", "Assets/ardilla.png", {
      frameWidth: 32,
      frameHeight: 30,
    });
    this.load.spritesheet("paloma", "Assets/paloma.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.image("background2", "Assets/background2.png");
    this.load.image("vida_mocca", "Assets/vida_mocca.png");
    this.load.image("Mute", "Assets/Botones/Mute.png");
    this.load.image("Unmute", "Assets/Botones/Unmute.png");
    this.load.image("Pause", "Assets/Botones/Resume.png");
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

// ============================================================================
// --- ESCENA: MENÚ DE PAUSA SUPERPUESTO (CORREGIDO) ---
// ============================================================================
class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: "PauseScene" });
  }

  init(data) {
    this.nivelActual = data.currentScene || "Level1";
  }

  preload() {
    this.load.image("pause_img", "Assets/pause_img.png");
    this.load.image("Continue", "Assets/Botones/Continue.png"); 
    this.load.image("Restart", "Assets/Botones/Restart.png");
    this.load.image("Exit", "Assets/Botones/Exit.png");
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
      this.scene.resume(this.nivelActual);
    });

    let btnRestart = this.add
      .image(width / 2, baseBotonesY + separacion, "Restart")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnRestart.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.nivelActual);

      this.registry.set("puntos", 0);
      this.registry.set("tiempo", 0);

      this.scene.start(this.nivelActual);
    });

    let btnExit = this.add
      .image(width / 2, baseBotonesY + separacion * 2, "Exit")
      .setOrigin(0.5)
      .setScale(escalaBotones)
      .setInteractive({ useHandCursor: true });

    btnExit.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop(this.nivelActual);
      this.scene.start("MenuScene");
    });

    [btnResume, btnRestart, btnExit].forEach((btn) => {
      btn.on("pointerover", () => btn.setTint(0xffcc00));
      btn.on("pointerout", () => btn.clearTint());
    });

    // --- MANEJO DE RESIZE SEGURO PARA LA PAUSA ---
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
    };

    this.scale.on("resize", this.resizeHandler);

    this.events.on("shutdown", () => {
      this.scale.off("resize", this.resizeHandler);
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

  init(data) {
    // Guardamos la clave del nivel de donde venimos. Si por alguna razón falla, va a Level1 por defecto.
    this.nivelDeOrigen = data.currentScene || "Level1";
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
        // En vez de Level1 fijo, usamos la variable dinámica del nivel actual
        this.scene.start(this.nivelDeOrigen);
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
  scene: [
    MenuScene,
    Level1,
    PerderVida,
    PauseScene,
    HelpScene,
    CreditsScene,
    Level2,
    WinScene,
  ],
};

const game = new Phaser.Game(config);
