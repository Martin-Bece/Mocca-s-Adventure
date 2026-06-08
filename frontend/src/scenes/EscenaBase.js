import audioManagerImport from "../utils/AudioManager.js";
const audioManager = audioManagerImport.getInstance();

// ============================================================================
// --- CLASE BASE REUTILIZABLE PARA TODOS LOS NIVELES ---
// ============================================================================
export default class EscenaBase extends Phaser.Scene {
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
    this.cinematicaIniciada = false;
    this.posicionCinematica = this.longitudNivel - 800;
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
    // --- ACTIVAR CINEMÁTICA FINAL ---
    if (
      this.mocca &&
      this.mocca.active &&
      !this.cinematicaIniciada &&
      !this.nivelCompletado
    ) {
      if (this.mocca.x >= this.posicionCinematica) {
        this.cinematicaIniciada = true;

        this.mocca.setVelocity(0);
        this.isPaused = true;

        this.iniciarCinematicaFinal();
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
        case "auto":
          this.sound.play("auto_sound", { volume: 0.1 });
          break;
        case "avion":
          this.sound.play("avion_sound", { volume: 0.5 });
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

  iniciarCinematicaFinal() {
    // Se sobrescribe en cada nivel
    this.finalizarNivel();
  }

  finalizarNivel() {
    if (this.nivelCompletado) return;

    this.nivelCompletado = true;

    let tiempoTotalMs = this.time.now - this.tiempoInicio;
    let segundosTotales = Math.floor(tiempoTotalMs / 1000);

    this.physics.pause();

    if (this.mocca) {
      this.mocca.setVelocity(0, 0);
      this.mocca.anims.play("idle", true);
    }

    this.scene.launch("WinScene", {
      escenaOrigen: this.scene.key,
      puntos: this.registry.get("puntos"),
      vidas: this.registry.get("vidas"),
      tiempo: segundosTotales,
    });

    this.scene.pause();
  }
}
