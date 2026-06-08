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
    this.load.image("ground2", "./Assets/ground2.png");

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
    this.load.audio("level_3", "./Audio/level_3.wav");
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

    // --- ASSETS EXCLUSIVOS PARA LA CINEMÁTICA FINAL ---
    this.load.spritesheet("Eagle_fly", "./Assets/Eagle_fly.png", {
      frameWidth: 64, // Ajustá el tamaño si tu spritesheet de águila usa otra medida
      frameHeight: 64,
    });
    this.load.image("mocca_ball", "./Assets/mocca_ball.png"); 
  }

  create() {
    const { width, height } = this.scale;

    // Inicialización del HUD, música de fondo y cursores del core
    this.crearBaseComun("level_3");

    // --- FONDO PARALLAX NIVEL 3 ---
    this.fondoParallax = this.add
      .tileSprite(0, 0, width, height, "background3")
      .setOrigin(0, 0)
      .setScrollFactor(0);
    let texturaOriginal = this.textures.get("background3").getSourceImage();
    let factorEscalaFinal = Math.max(
      width / texturaOriginal.width,
      height / texturaOriginal.height,
    );
    this.fondoParallax.tileScaleX = factorEscalaFinal;
    this.fondoParallax.tileScaleY = factorEscalaFinal;

    // --- SUELO (ground2) ---
    this.ground2 = this.physics.add.staticGroup();
    for (let x = 0; x < this.longitudNivel; x += 128) {
      let tile = this.ground2
        .create(x, height - 32, "ground2")
        .setScale(2)
        .refreshBody();
      tile.body.setSize(128, 45);
      tile.body.setOffset(0, 19);
    }

    // --- GRUPOS FÍSICOS ---
    this.platforms = this.physics.add.staticGroup();
    let bones = this.physics.add.group();
    this.enemigos = this.physics.add.group();

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

    // Animaciones de Mocca validadas una por una
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

    // Animación del Águila para la cinemática
    if (!this.anims.exists("eagle_fly")) {
      this.anims.create({
        key: "eagle_fly",
        frames: this.anims.generateFrameNumbers("Eagle_fly", { start: 0, end: 2 }), // Ajustalo según tus frames
        frameRate: 6,
        repeat: -1,
      });
    }

    // ============================================================================
    // --- DISEÑO ESTRUCTURAL: ARRAY DE PLATAFORMAS ---
    // ============================================================================
    const diseñoNivel3 = [
      { x: 450, y: height - 150, tipo: "corta" },
      { x: 750, y: height - 220, tipo: "mediana" },
      { x: 1100, y: height - 160, tipo: "larga" },
      { x: 1500, y: height - 240, tipo: "corta" },
      { x: 1850, y: height - 310, tipo: "mediana" },
      { x: 2300, y: height - 180, tipo: "larga" },
      { x: 2800, y: height - 140, tipo: "corta" },
      { x: 3100, y: height - 220, tipo: "mediana" },
      { x: 3500, y: height - 280, tipo: "larga" },
      { x: 4000, y: height - 160, tipo: "corta" },
      { x: 4400, y: height - 240, tipo: "mediana" },
      { x: 4900, y: height - 200, tipo: "larga" },
      { x: 5400, y: height - 150, tipo: "corta" },
      { x: 5800, y: height - 230, tipo: "mediana" },
      { x: 6300, y: height - 300, tipo: "larga" },
      { x: 6800, y: height - 160, tipo: "corta" },
      { x: 7200, y: height - 240, tipo: "mediana" },
      { x: 7700, y: height - 180, tipo: "larga" },
      { x: 8200, y: height - 260, tipo: "corta" },
      { x: 8600, y: height - 310, tipo: "mediana" },
      { x: 9100, y: height - 200, tipo: "larga" },
      { x: 9600, y: height - 140, tipo: "mediana" },
    ];

    // --- PROCESAMIENTO GENERATIVO DE PLATAFORMAS ---
    diseñoNivel3.forEach((plat) => {
      let keyAsset = "plat_" + plat.tipo;
      let plataformaInstancia = this.platforms.create(plat.x, plat.y, keyAsset);

      plataformaInstancia.refreshBody();

      plataformaInstancia.body.checkCollision.down = false;
      plataformaInstancia.body.checkCollision.left = false;
      plataformaInstancia.body.checkCollision.right = false;

      if (plat.tipo === "corta") {
        plataformaInstancia.body.setSize(100, 1);
        plataformaInstancia.body.setOffset(1, 10);

        bones
          .create(plat.x, plat.y - 40, "huesito")
          .body.setAllowGravity(false);
      } else if (plat.tipo === "mediana") {
        plataformaInstancia.body.setSize(170, 1);
        plataformaInstancia.body.setOffset(10, 14);

        bones
          .create(plat.x - 35, plat.y - 45, "huesito")
          .body.setAllowGravity(false);
        bones
          .create(plat.x + 35, plat.y - 45, "huesito")
          .body.setAllowGravity(false);
      } else if (plat.tipo === "larga") {
        plataformaInstancia.body.setSize(330, 1);
        plataformaInstancia.body.setOffset(10, 14);

        bones
          .create(plat.x - 80, plat.y - 45, "huesito")
          .body.setAllowGravity(false);
        bones
          .create(plat.x, plat.y - 65, "huesito")
          .body.setAllowGravity(false);
        bones
          .create(plat.x + 80, plat.y - 45, "huesito")
          .body.setAllowGravity(false);

        // --- AUTO EN PLATAFORMA LARGA ---
        let autoEnemigo = this.enemigos.create(plat.x, plat.y - 50, "auto");
        autoEnemigo.setScale(0.18);
        autoEnemigo.body.setSize(270, 150);
        autoEnemigo.body.setOffset(45, 120);

        autoEnemigo.speed = 90;
        autoEnemigo.distaciaPatrulla = 120;
        autoEnemigo.puntoInicialX = plat.x;
        autoEnemigo.esVolador = false;
        autoEnemigo.isStunned = false;
        autoEnemigo.setVelocityX(autoEnemigo.speed);
      }
    });

    // --- ENEMIGOS TERRESTRES EN EL SUELO ---
    for (let posX = 700; posX < 10000; posX += 550) {
      let autoSuelo = this.enemigos.create(posX, height - 110, "auto");
      autoSuelo.setScale(0.2);
      autoSuelo.body.setSize(270, 140);
      autoSuelo.body.setOffset(45, 120);
      autoSuelo.setCollideWorldBounds(true);

      autoSuelo.speed = 130;
      autoSuelo.distaciaPatrulla = 180;
      autoSuelo.puntoInicialX = posX;
      autoSuelo.esVolador = false;
      autoSuelo.isStunned = false;
      autoSuelo.setVelocityX(autoSuelo.speed);
    }

    // --- ENEMIGOS AÉREOS ---
    let alternarAlturaAvion = 0;
    for (let posX = 900; posX < 10000; posX += 650) {
      let alturaAvion = height - 300;
      if (alternarAlturaAvion === 1) alturaAvion = height - 380;
      alternarAlturaAvion = (alternarAlturaAvion + 1) % 2;

      let avion = this.enemigos.create(posX, alturaAvion, "avion");
      avion.setScale(2.2);

      avion.body.setSize(27, 12);
      avion.body.setOffset(19, 25);
      avion.body.setAllowGravity(false);
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
    this.physics.add.collider(this.mocca, this.ground2);
    this.physics.add.collider(this.enemigos, this.ground2);
    this.physics.add.collider(this.enemigos, this.platforms);
    this.physics.add.overlap(this.mocca, bones, this.collectBone, null, this);
    this.physics.add.overlap(
      this.mocca,
      this.enemigos,
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

  // --- COMPORTAMIENTO DE MOVIMIENTO / PATRULLA EN TIEMPO REAL ---
  update(time, delta) {
    // 🌟 1. LLAMAMOS AL UPDATE DE ESCENABASE
    super.update(time, delta);

    // 🛑 CLÁUSULA DE GUARDA: Si el nivel ya se completó, frenamos el código acá
    if (this.nivelCompletado) return;

    // 🌟 2. PATRULLAJE EXCLUSIVO CON GIRO ADAPTADO PARA ESTE NIVEL
    if (this.enemigos) {
      this.enemigos.children.iterate((enemigo) => {
        if (enemigo && enemigo.active && enemigo.body) {
          if (enemigo.isStunned) return;

          let diffX = Math.abs(enemigo.x - enemigo.puntoInicialX);

          if (diffX >= enemigo.distaciaPatrulla) {
            if (
              enemigo.x > enemigo.puntoInicialX &&
              enemigo.body.velocity.x > 0
            ) {
              enemigo.setVelocityX(-enemigo.speed);
            } else if (
              enemigo.x < enemigo.puntoInicialX &&
              enemigo.body.velocity.x < 0
            ) {
              enemigo.setVelocityX(enemigo.speed);
            }
          }

          // --- ORIENTACIÓN CORRECTA DE SPRITES EN NIVEL 3 ---
          if (enemigo.texture.key === "avion") {
            if (enemigo.body.velocity.x > 0) {
              enemigo.setFlipX(false); // Avanza a la derecha, se des-espeja
            } else if (enemigo.body.velocity.x < 0) {
              enemigo.setFlipX(true);  // Avanza a la izquierda, se espeja
            }
          } else {
            if (enemigo.body.velocity.x > 0) {
              enemigo.setFlipX(true);  // Autos mirando a la derecha
            } else if (enemigo.body.velocity.x < 0) {
              enemigo.setFlipX(false); // Autos mirando a la izquierda
            }
          }
        }
      });
    }
  }

  // ============================================================================
  // --- SOBREESCRITURA DE LA CINEMÁTICA FINAL DE JUEGO (EL DESENLACE) ---
  // ============================================================================
  iniciarCinematicaFinal() {
    // Evitamos ejecuciones repetidas
    if (this.nivelCompletado) return;
    
    const { width, height } = this.scale;

    // Frenamos las físicas de todo el nivel
    this.physics.pause();

    // 1. Reajustamos la cámara fijándola en el final del mapa para el clímax
    this.cameras.main.stopFollow();
    this.cameras.main.pan(this.posicionCinematica + 300, height / 2, 1000, "Power2", true);

    // Ocultamos los botones del HUD para que la cinemática quede limpia en pantalla limpia
    if (this.btnSonido) this.btnSonido.setVisible(false);
    if (this.btnPausa) this.btnPausa.setVisible(false);

    // 2. Colocamos los actores de la cinemática usando coordenadas del mundo real (fin del nivel)
    const baseCamaraX = this.posicionCinematica;

    // Forzamos a nuestra Mocca jugable a quedarse quieta corriendo
    this.mocca.setVelocity(0, 0);
    this.mocca.setFlipX(false);
    this.mocca.anims.play("run", true);

    // Instanciamos al águila ladrona escapando cansada y a la pelota flotando cerca
    let eagleCinematica = this.add.sprite(baseCamaraX + 650, height - 300, "Eagle_fly").setScale(2.5).setFlipX(true);
    let ballCinematica = this.add.image(eagleCinematica.x, eagleCinematica.y + 20, "mocca_ball").setScale(1.2);
    eagleCinematica.anims.play("eagle_fly", true);

    // --- CADENA DE EFECTOS / SECUENCIA DE TWEENS ---

    // Paso A: Mocca avanza en posición de carrera fija hacia el centro del encuadre
    this.tweens.add({
      targets: this.mocca,
      x: baseCamaraX + 250,
      duration: 1500,
      ease: "Linear",
      onComplete: () => {
        // Paso B: Llegó al punto justo... ¡Mocca mete salto olímpico a lo WWE! 🐾💥
        this.mocca.anims.play("jump", true);
        if (this.sound.get("mocca_jump")) this.sound.play("mocca_jump", { volume: 0.4 });

        this.tweens.add({
          targets: this.mocca,
          x: eagleCinematica.x,
          y: eagleCinematica.y - 25, // Se clava directo arriba del lomo del águila
          duration: 900,
          ease: "Quad.easeOut",
          onComplete: () => {
            // ¡PUM! IMPACTO TOTAL CONTRA EL JEFE INVOLUNTARIO 💥🦅
            if (this.sound.get("avion_sound")) this.sound.play("avion_sound", { volume: 0.6 }); // Efecto destructivo

            // La pelotita se suelta y sale disparada hacia arriba haciendo una campana
            this.tweens.add({
              targets: ballCinematica,
              x: eagleCinematica.x + 60,
              y: eagleCinematica.y - 140,
              duration: 450,
              yoyo: true, // Cae por fuerza de gravedad simulada
              ease: "Quad.easeInOut"
            });

            // El águila queda fulminada en espiral cómica y cae al vacío fuera de la pantalla
            this.tweens.add({
              targets: eagleCinematica,
              y: height + 150,
              angle: 180, // Queda patas para arriba
              x: eagleCinematica.x + 120,
              duration: 1200,
              ease: "Quad.easeIn",
              onComplete: () => { eagleCinematica.destroy(); }
            });

            // Mocca desciende triunfante directo hacia el suelo
            this.tweens.add({
              targets: this.mocca,
              x: eagleCinematica.x + 60,
              y: height - 100, // Cae firme sobre sus patas
              duration: 450,
              ease: "Quad.easeIn",
              onComplete: () => {
                // Paso C: ¡Festejo definitivo con su juguete recuperado!
                this.mocca.anims.play("idle", true);
                ballCinematica.setPosition(this.mocca.x + 15, this.mocca.y + 5); // Le encaja perfecto en el hocico

                if (this.sound.get("comer_hueso")) this.sound.play("comer_hueso", { volume: 0.5 }); // Sonido satisfactorio

                // Lanzamos cartelería final épica directo sobre el centro fijo de la pantalla de juego
                let txtVictoria = this.add.text(this.cameras.main.centerX, height / 2 - 50, "¡PELOTA RECUPERADA!", {
                  fontFamily: "Courier New, Arial, sans-serif",
                  fontSize: "52px",
                  fill: "#ffff00",
                  fontStyle: "bold",
                  stroke: "#000000",
                  strokeThickness: 8
                }).setOrigin(0.5).setScrollFactor(0);

                let txtCreditos = this.add.text(this.cameras.main.centerX, height / 2 + 40, "¡Mocca salvó el día!\nGracias por jugar.", {
                  fontFamily: "Arial",
                  fontSize: "26px",
                  fill: "#ffffff",
                  align: "center",
                  stroke: "#000000",
                  strokeThickness: 5
                }).setOrigin(0.5).setScrollFactor(0);

                // Pequeño escalado dinámico para que el texto principal golpee con onda
                txtVictoria.setScale(0);
                this.tweens.add({
                  targets: txtVictoria,
                  scaleX: 1,
                  scaleY: 1,
                  duration: 500,
                  ease: "Back.easeOut"
                });

                // Esperamos 4 segundos para que disfrute el final y cerramos llamando al core del motor
                this.time.delayedCall(4000, () => {
                  this.nivelCompletado = true;
                  
                  let tiempoTotalMs = this.time.now - this.tiempoInicio;
                  let segundosTotales = Math.floor(tiempoTotalMs / 1000);

                  this.scene.launch("WinScene", {
                    escenaOrigen: this.scene.key,
                    puntos: this.registry.get("puntos"),
                    vidas: this.registry.get("vidas"),
                    tiempo: segundosTotales,
                  });
                  this.scene.pause();
                });
              }
            });
          }
        });
      }
    });
  }
}