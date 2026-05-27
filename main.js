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
            return AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    init(gameInstance) {
        this.game = gameInstance;
    }

    playMusic(scene, key, config = { volume: 0.2, loop: true }) {
        if (this.currentMusic && this.currentMusic.key === key && this.currentMusic.isPlaying) {
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
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('background', 'Assets/background.png');
        this.load.image('Continue', 'Assets/Botones/Continue.png');
        this.load.image('Credits', 'Assets/Botones/Credits.png');
        this.load.image('Help', 'Assets/Botones/Help.png');
        this.load.image('Mute', 'Assets/Botones/Mute.png');
        this.load.image('Unmute', 'Assets/Botones/Unmute.png');
        this.load.image('Start', 'Assets/Botones/Start.png');
        this.load.image('Imagen_Menu', 'Assets/Imagen_Menu.png');
        this.load.audio('level_1', 'Audio/level_1.mp3');
    }

    create() {
        const { width, height } = this.scale;

        audioManager.init(this.game);
        audioManager.playMusic(this, 'level_1', { volume: 0.2, loop: true });

        // Fondo adaptado dinámicamente al tamaño completo de la ventana
        this.fondoMenu = this.add.tileSprite(0, 0, width, height, 'background').setOrigin(0, 0);

        // --- CARTEL DE TÍTULO PRINCIPAL (Posición basada en porcentaje real) ---
        let cartelTitulo = this.add.image(width / 2, height * 0.22, 'Imagen_Menu')
            .setOrigin(0.5)
            .setScale(0.33);

        // --- BOTONES EN COLUMNA (Escala fija pixel art, posiciones dinámicas) ---
        const escalaBotones = 0.75;

        // 1. START
        let btnStart = this.add.image(width / 2, height * 0.52, 'Start')
            .setOrigin(0.5)
            .setScale(escalaBotones)
            .setInteractive({ useHandCursor: true });

        btnStart.on('pointerdown', () => {
            this.scene.start('Level1');
        });

        // 2. CONTINUE
        let btnContinue = this.add.image(width / 2, height * 0.62, 'Continue')
            .setOrigin(0.5)
            .setScale(escalaBotones)
            .setInteractive({ useHandCursor: true });

        btnContinue.on('pointerdown', () => {
            console.log("Cargar partida...");
        });

        // 3. HELP
        let btnHelp = this.add.image(width / 2, height * 0.72, 'Help')
            .setOrigin(0.5)
            .setScale(escalaBotones)
            .setInteractive({ useHandCursor: true });

        btnHelp.on('pointerdown', () => {
            alert("Controles: Flechas para moverte, Espacio para saltar y Z para ladrar. ¡Diviértete jugando!");
        });

        // 4. CREDITS
        let btnCredits = this.add.image(width / 2, height * 0.82, 'Credits')
            .setOrigin(0.5)
            .setScale(escalaBotones)
            .setInteractive({ useHandCursor: true });

        btnCredits.on('pointerdown', () => {
            alert("Desarrollado por Martín - ULP 2026");
        });

        [btnStart, btnContinue, btnHelp, btnCredits].forEach(btn => {
            btn.on('pointerover', () => btn.setTint(0xffcc00));
            btn.on('pointerout', () => btn.clearTint());
        });

        // --- BOTÓN MUTE / UNMUTE (Siempre pegado a la esquina superior derecha real) ---
        let btnSonido = this.add.image(width - 50, 50, audioManager.isMuted(this) ? 'Mute' : 'Unmute')
            .setOrigin(0.5)
            .setScale(0.4) 
            .setInteractive({ useHandCursor: true });

        btnSonido.on('pointerdown', () => {
            let nuevoMute = !audioManager.isMuted(this);
            audioManager.setMute(this, nuevoMute);
            btnSonido.setTexture(nuevoMute ? 'Mute' : 'Unmute');
        });

        btnSonido.on('pointerover', () => btnSonido.setTint(0xffcc00));
        btnSonido.on('pointerout', () => btnSonido.clearTint());
    }

    update() {
        if (this.fondoMenu) {
            this.fondoMenu.tilePositionX += 0.5;
        }
    }
}


// ============================================================================
// --- ESCENA: NIVEL 1 ---
// ============================================================================
class Level1 extends Phaser.Scene {
    constructor() {
        super({ key: 'Level1' });
        this.mocca = null;
        this.cursors = null;
        this.ground = null;
        this.gato = null;
        this.isbarking = false;
        this.isRebounding = false;
        this.isPaused = false;
    }

    preload() {
        this.load.spritesheet("mocca", "Assets/Mocca_Idle.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("mocca_run", "Assets/Mocca_run_right.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("mocca_jump", "Assets/Mocca_jump.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("mocca_bark", "Assets/Mocca_bark.png", { frameWidth: 64, frameHeight: 64 });
        this.load.image("ground", "Assets/ground.png");
        this.load.audio("bark_sound", "Audio/bark_sound.mp3");
        this.load.audio("comer_hueso", "Audio/comer_hueso.mp3");
        this.load.audio("mocca_daño", "Audio/mocca_daño.mp3");
        this.load.audio("gato_daño", "Audio/gato_daño.mp3");
        this.load.audio("level_1", "Audio/level_1.mp3");
        this.load.audio("mocca_jump", "Audio/mocca_jump.wav");
        this.load.spritesheet("huesito", "Assets/Huesito.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("gato", "Assets/BlackRun.png", { frameWidth: 48, frameHeight: 48 });
        this.load.image("background", "Assets/background.png");

        this.load.image("Continue", "Assets/Botones/Continue.png");
        this.load.image("Mute", "Assets/Botones/Mute.png");
        this.load.image("Unmute", "Assets/Botones/Unmute.png");
        this.load.image("Restart", "Assets/Botones/Restart.png");
        this.load.image("Exit", "Assets/Botones/Exit.png");
        this.load.image("Pause", "Assets/Botones/Pause.png");
        this.load.image("Resume", "Assets/Botones/Resume.png");
        this.load.image("Help", "Assets/Botones/Help.png");
    }

    create() {
        const { width, height } = this.scale;
        this.physics.world.setBounds(0, 0, 2400, height);

        audioManager.playMusic(this, 'level_1', { volume: 0.2, loop: true });

        this.fondoBosque = this.add.tileSprite(0, 0, width, height, 'background').setOrigin(0, 0);
        this.fondoBosque.setScrollFactor(0);

        this.ground = this.physics.add.staticGroup();
        for (let x = 0; x < 2400; x += 128) {
            let tile = this.ground.create(x, height - 32, "ground").setScale(2).refreshBody();
            tile.body.setSize(128, 45);
            tile.body.setOffset(0, 19);
        }

        this.mocca = this.physics.add.sprite(100, height - 100, "mocca").setScale(1.5);
        this.mocca.body.setSize(50, 35);
        this.mocca.body.setOffset(8, 12);

        this.cameras.main.startFollow(this.mocca, true, 0.05, 0.05);
        this.cameras.main.setBounds(0, 0, 2400, height);

        this.physics.add.collider(this.mocca, this.ground);
        this.mocca.setCollideWorldBounds(true);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.anims.create({ key: "idle", frames: this.anims.generateFrameNumbers("mocca", { start: 0, end: 1 }), frameRate: 7, repeat: -1 });
        this.anims.create({ key: "run", frames: this.anims.generateFrameNumbers("mocca_run", { start: 0, end: 2 }), frameRate: 7, repeat: -1 });
        this.anims.create({ key: "jump", frames: this.anims.generateFrameNumbers("mocca_jump", { start: 0, end: 3 }), frameRate: 2, repeat: 0 });
        this.anims.create({ key: "bark_idle", frames: this.anims.generateFrameNumbers("mocca_bark", { start: 0, end: 0 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: "bark_run", frames: this.anims.generateFrameNumbers("mocca_bark", { start: 1, end: 1 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: "bark_jump", frames: this.anims.generateFrameNumbers("mocca_bark", { start: 2, end: 2 }), frameRate: 1, repeat: 0 });

        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.mocca.anims.play("idle");

        this.anims.create({ key: "huesito_rotate", frames: this.anims.generateFrameNumbers("huesito", { start: 0, end: 4 }), frameRate: 7, repeat: -1 });
        this.anims.create({ key: "gato_run", frames: this.anims.generateFrameNumbers("gato", { start: 0, end: 5 }), frameRate: 7, repeat: -1 });

        let bones = this.physics.add.group();
        for (let i = 0; i < 15; i++) {
            let x = 500 + i * 150;
            let y = height - 200;
            let huesito = bones.create(x, y, "huesito");
            huesito.anims.play("huesito_rotate");
            huesito.body.setSize(30, 30);
            huesito.body.setAllowGravity(false);

            this.tweens.add({
                targets: huesito,
                y: y - 20,
                duration: 1500,
                ease: "Sine.easeInOut",
                yoyo: true,
                repeat: -1,
            });
        }

        this.physics.add.overlap(this.mocca, bones, this.collectBone, null, this);

        this.gato = this.physics.add.sprite(1200, height - 150, "gato").setScale(1.5);
        this.gato.body.setSize(35, 22);
        this.gato.body.setOffset(6, 26);
        this.gato.setCollideWorldBounds(true);
        this.physics.add.collider(this.gato, this.ground);

        this.gato.speed = 100;
        this.gato.distaciaPatrulla = 300;
        this.gato.puntoInicialX = this.gato.x;
        this.gato.anims.play("gato_run");
        this.gato.setVelocityX(this.gato.speed);

        this.physics.add.overlap(this.mocca, this.gato, this.hitGato, null, this);

        // --- BOTONES JUEGO (Posicionamiento dinámico en base al ancho real) ---
        const margenDerecho = 80;       
        const margenSuperior = 60;      
        const espacioEntreBotones = 100; 
        const escalaBotonesJuego = 0.4;      

        let btnSonido = this.add.image(width - margenDerecho, margenSuperior, audioManager.isMuted(this) ? 'Mute' : 'Unmute')
            .setOrigin(0.5)
            .setScale(escalaBotonesJuego)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0); 

        btnSonido.on('pointerdown', () => {
            let nuevoMute = !audioManager.isMuted(this);
            audioManager.setMute(this, nuevoMute);
            btnSonido.setTexture(nuevoMute ? 'Mute' : 'Unmute');
        });

        let btnPausa = this.add.image(btnSonido.x - espacioEntreBotones, margenSuperior, 'Pause')
            .setOrigin(0.5)
            .setScale(escalaBotonesJuego)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0); 

        btnPausa.on('pointerdown', () => {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                btnPausa.setTexture('Resume');
                console.log("Juego Pausado");
            } else {
                btnPausa.setTexture('Pause');
                console.log("Juego Reanudado");
            }
        });

        [btnSonido, btnPausa].forEach(btn => {
            btn.on('pointerover', () => btn.setTint(0xffcc00));
            btn.on('pointerout', () => btn.clearTint());
        });
    }

    update() {
        this.fondoBosque.tilePositionX = this.cameras.main.scrollX * 0.3;

        if (this.isRebounding) return;

        if (this.gato && this.gato.active && this.gato.body) {
            if (this.gato.x >= this.gato.puntoInicialX + this.gato.distaciaPatrulla) {
                this.gato.setVelocityX(-this.gato.speed);
                this.gato.setFlipX(true);
            } else if (this.gato.x <= this.gato.puntoInicialX - this.gato.distaciaPatrulla) {
                this.gato.setVelocityX(this.gato.speed);
                this.gato.setFlipX(false);
            }
        }

        if (this.isbarking) return;

        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.isbarking = true;
            this.sound.play("bark_sound", { volume: 0.2 });

            if (!this.mocca.body.onFloor()) {
                this.mocca.anims.play("bark_jump", true);
            } else if (this.cursors.left.isDown || this.cursors.right.isDown) {
                this.mocca.anims.play("bark_run", true);
            } else {
                this.mocca.anims.play("bark_idle", true);
            }

            this.time.delayedCall(300, () => {
                this.isbarking = false;
            });
            return;
        }

        if (this.cursors.left.isDown) {
            this.mocca.setVelocityX(-160);
            this.mocca.setFlipX(true);
            if (this.mocca.body.onFloor()) this.mocca.anims.play("run", true);
        } else if (this.cursors.right.isDown) {
            this.mocca.setVelocityX(160);
            this.mocca.setFlipX(false);
            if (this.mocca.body.onFloor()) this.mocca.anims.play("run", true);
        } else {
            this.mocca.setVelocityX(0);
            if (this.mocca.body.onFloor()) this.mocca.anims.play("idle", true);
        }

        if (this.cursors.space.isDown && this.mocca.body.onFloor()) {
            this.mocca.setVelocityY(-350);
            this.mocca.anims.play("jump", true);
            this.sound.play("mocca_jump", { volume: 0.3 });
        }

        if (!this.mocca.body.onFloor() && this.mocca.anims.currentAnim.key !== "jump") {
            this.mocca.anims.play("jump", true);
        }
    }

    collectBone(mocca, huesito) {
        this.sound.play("comer_hueso", { volume: 0.2 });
        huesito.disableBody(true, true);
        huesito.destroy();
    }

    hitGato(mocca, gato) {
        if (mocca.body.velocity.y > 0 && mocca.y < gato.y) {
            gato.disableBody(true, true);
            gato.destroy();
            mocca.setVelocityY(-300);
            this.sound.play("gato_daño", { volume: 0.1 });
            return;
        }

        if (this.isRebounding) return;

        this.isRebounding = true;
        mocca.setTint(0xff0000);

        let direccion = (mocca.x < gato.x) ? -200 : 200;
        mocca.setVelocityX(direccion);
        mocca.setVelocityY(-150);

        this.time.delayedCall(400, () => {
            this.isRebounding = false;
            mocca.clearTint();
        });

        this.sound.play('mocca_daño', { volume: 0.1 });
    }
}


// ============================================================================
// --- CONFIGURACIÓN E INICIALIZACIÓN (Solución completa pantallas estiradas) ---
// ============================================================================
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    scale: {
        mode: Phaser.Scale.RESIZE, // Volvemos a RESIZE para estirar el juego al 100% de la ventana
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 500 },
            debug: false,
        },
    },
    scene: [MenuScene, Level1] 
};

const game = new Phaser.Game(config);