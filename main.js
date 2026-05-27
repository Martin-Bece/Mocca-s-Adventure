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

        let fondo = this.add.image(width / 2, height / 2, 'background');
        let escalaX = width / fondo.width;
        let escalaY = height / fondo.height;
        let escalaFondo = Math.max(escalaX, escalaY);
        fondo.setScale(escalaFondo);

        const baseScale = height / 768; 

        let cartelTitulo = this.add.image(width / 2, height * 0.28, 'Imagen_Menu')
            .setOrigin(0.5)
            .setScale(0.35 * baseScale); 

        const escalaBotones = 0.5 * baseScale; 
        const separacion = 48 * baseScale;    
        const baseBotonesY = height * 0.56;   

        let btnStart = this.add.image(width / 2, baseBotonesY, 'Start')
            .setOrigin(0.5)
            .setScale(escalaBotones)
            .setInteractive({ useHandCursor: true });

        btnStart.on('pointerdown', () => {
            this.scene.start('Level1');
        });

        let btnContinue = this.add.image(width / 2, baseBotonesY + separacion, 'Continue')
            .setOrigin(0.5)
            .setScale(escalaBotones)
            .setInteractive({ useHandCursor: true });

        btnContinue.on('pointerdown', () => {
            console.log("Cargar partida...");
        });

        let btnHelp = this.add.image(width / 2, baseBotonesY + (separacion * 2), 'Help')
            .setOrigin(0.5)
            .setScale(escalaBotones)
            .setInteractive({ useHandCursor: true });

        btnHelp.on('pointerdown', () => {
            alert("Controles: Flechas para moverte, Espacio para saltar y Z para ladrar. En el nivel 1 los gatos solo patrullaran el piso, pero luego se pondra mas dificil. Diviertete!");
        });

        let btnCredits = this.add.image(width / 2, baseBotonesY + (separacion * 3), 'Credits')
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

        let btnSonido = this.add.image(width - 40, 40, audioManager.isMuted(this) ? 'Mute' : 'Unmute')
            .setOrigin(0.5)
            .setScale(0.35 * baseScale) 
            .setInteractive({ useHandCursor: true });

        btnSonido.on('pointerdown', () => {
            let nuevoMute = !audioManager.isMuted(this);
            audioManager.setMute(this, nuevoMute);
            btnSonido.setTexture(nuevoMute ? 'Mute' : 'Unmute');
        });

        btnSonido.on('pointerover', () => btnSonido.setTint(0xffcc00));
        btnSonido.on('pointerout', () => btnSonido.clearTint());

        this.scale.on('resize', () => {
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
        super({ key: 'Level1' });
        this.mocca = null;
        this.cursors = null;
        this.ground = null;
        this.platforms = null;
        this.gatos = null;
        this.isbarking = false;
        this.isRebounding = false;
        this.isPaused = false; 
        this.longitudNivel = 12000; 

        // --- PARÁMETROS FÍSICOS DE CONTROL ---
        this.PLAYER_SPEED = 160;
        this.JUMP_VELOCITY = -380; 
        this.GRAVITY = 500;
    }

    preload() {
        this.load.spritesheet("mocca", "Assets/Mocca_Idle.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("mocca_run", "Assets/Mocca_run_right.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("mocca_jump", "Assets/Mocca_jump.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("mocca_bark", "Assets/Mocca_bark.png", { frameWidth: 64, frameHeight: 64 });
        this.load.image("ground", "Assets/ground.png");
        this.load.image("cloud_platform", "Assets/plataformaAire.png");

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
        
        this.physics.world.setBounds(0, 0, this.longitudNivel, height);
        audioManager.playMusic(this, 'level_1', { volume: 0.2, loop: true });

        this.fondoBosque = this.add.tileSprite(0, 0, width, height, 'background');
        this.fondoBosque.setOrigin(0, 0);
        this.fondoBosque.setScrollFactor(0); 

        let texturaOriginal = this.textures.get('background').getSourceImage();
        let escalaInternaY = height / texturaOriginal.height;
        let escalaInternaX = width / texturaOriginal.width;
        let factorEscalaFinal = Math.max(escalaInternaX, escalaInternaY);

        this.fondoBosque.tileScaleX = factorEscalaFinal;
        this.fondoBosque.tileScaleY = factorEscalaFinal;

        // --- CAPA DE SUELO GENERAL COMPLETAMENTE SÓLIDA ---
        this.ground = this.physics.add.staticGroup();
        for (let x = 0; x < this.longitudNivel; x += 128) {
            let tile = this.ground.create(x, height - 32, "ground").setScale(2).refreshBody();
            tile.body.setSize(128, 45);
            tile.body.setOffset(0, 19);
        }

        // --- SISTEMA DE PLATAFORMAS FLOTANTES EXTENDIDO POR TODO EL NIVEL ---
        this.platforms = this.physics.add.staticGroup();
        let bones = this.physics.add.group();
        this.gatos = this.physics.add.group();

        this.anims.create({ key: "huesito_rotate", frames: this.anims.generateFrameNumbers("huesito", { start: 0, end: 4 }), frameRate: 7, repeat: -1 });
        this.anims.create({ key: "gato_run", frames: this.anims.generateFrameNumbers("gato", { start: 0, end: 5 }), frameRate: 7, repeat: -1 });

        // Diseño automatizado y fluido que cubre de 400 a 10400 metros (Última parte libre)
        const diseñoNivel = [];
        let proximoX = 400;
        let alternarAltura = 0;

        while (proximoX < 10400) {
            let bloquesIsla = Math.floor(Math.random() * 2) + 1; // Islas de 1 o 2 bloques
            let alturaY = height - 130; // Altura estándar baja

            if (alternarAltura === 1) alturaY = height - 220;
            if (alternarAltura === 2) alturaY = height - 310;

            diseñoNivel.push({ x: proximoX, y: alturaY, bloques: bloquesIsla });

            proximoX += Math.floor(Math.random() * 80) + 260; // Distancia horizontal testeada para saltos cómodos
            alternarAltura = (alternarAltura + 1) % 3;
        }

        const separacionNubes = 120;

        diseñoNivel.forEach(isla => {
            let anchoTotalIsla = (isla.bloques - 1) * separacionNubes;
            let inicioX = isla.x - (anchoTotalIsla / 2);

            for (let i = 0; i < isla.bloques; i++) {
                let nubeX = inicioX + (i * separacionNubes);
                let nube = this.platforms.create(nubeX, isla.y, "cloud_platform");
                nube.setScale(0.2).refreshBody();
                
                nube.body.setSize((nube.displayWidth / 2) - 10, 1); 
                nube.body.setOffset(50, 20);

                // Pasable desde abajo
                nube.body.checkCollision.down = false;
                nube.body.checkCollision.left = false;
                nube.body.checkCollision.right = false;

                let huesito = bones.create(nubeX, isla.y - 40, "huesito");
                huesito.body.setAllowGravity(false);
            }
        });

        // --- ENEMIGOS EN EL SUELO COMPLETAMENTE REPARTIDOS (Hasta la zona libre final) ---
        for (let posX = 600; posX < 10300; posX += 450) {
            let gatoSuelo = this.gatos.create(posX, height - 150, "gato").setScale(1.5);
            gatoSuelo.body.setSize(35, 22);
            gatoSuelo.body.setOffset(6, 26);
            gatoSuelo.setCollideWorldBounds(true);
            
            gatoSuelo.speed = 80 + Math.random() * 40;
            gatoSuelo.distaciaPatrulla = 140; 
            gatoSuelo.puntoInicialX = posX;
            gatoSuelo.anims.play("gato_run");
            gatoSuelo.setVelocityX(gatoSuelo.speed);
        }

        // --- PERSONAJE MOCCA ---
        this.mocca = this.physics.add.sprite(100, height - 100, "mocca").setScale(1.5);
        this.mocca.body.setSize(50, 35);
        this.mocca.body.setOffset(8, 12);

        this.cameras.main.startFollow(this.mocca, true, 0.05, 0.05);
        this.cameras.main.setBounds(0, 0, this.longitudNivel, height);

        this.physics.add.collider(this.mocca, this.ground);
        
        // Asignamos el colisionador con las nubes a una variable para interactuar en el update
        this.platformCollider = this.physics.add.collider(this.mocca, this.platforms);
        this.mocca.setCollideWorldBounds(true);

        this.cursors = this.input.keyboard.createCursorKeys();

        // Animaciones
        this.anims.create({ key: "idle", frames: this.anims.generateFrameNumbers("mocca", { start: 0, end: 1 }), frameRate: 7, repeat: -1 });
        this.anims.create({ key: "run", frames: this.anims.generateFrameNumbers("mocca_run", { start: 0, end: 2 }), frameRate: 7, repeat: -1 });
        this.anims.create({ key: "jump", frames: this.anims.generateFrameNumbers("mocca_jump", { start: 0, end: 3 }), frameRate: 2, repeat: 0 });
        this.anims.create({ key: "bark_idle", frames: this.anims.generateFrameNumbers("mocca_bark", { start: 0, end: 0 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: "bark_run", frames: this.anims.generateFrameNumbers("mocca_bark", { start: 1, end: 1 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: "bark_jump", frames: this.anims.generateFrameNumbers("mocca_bark", { start: 2, end: 2 }), frameRate: 1, repeat: 0 });

        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.mocca.anims.play("idle");

        bones.children.iterate(huesito => {
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

        // --- BOTONES UI ---
        const factorUI = height / 720;
        const margenDerecho = 60 * factorUI;
        const margenSuperior = 50 * factorUI;
        const espacioEntreBotones = 80 * factorUI;
        const escalaBotonesUI = 0.4 * factorUI;

        let btnSonido = this.add.image(width - margenDerecho, margenSuperior, audioManager.isMuted(this) ? 'Mute' : 'Unmute')
            .setOrigin(0.5)
            .setScale(getEscalaFloat(escalaBotonesUI))
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0); 

        btnSonido.on('pointerdown', () => {
            let nuevoMute = !audioManager.isMuted(this);
            audioManager.setMute(this, nuevoMute);
            btnSonido.setTexture(nuevoMute ? 'Mute' : 'Unmute');
        });

        let btnPausa = this.add.image(btnSonido.x - espacioEntreBotones, margenSuperior, 'Pause')
            .setOrigin(0.5)
            .setScale(escalaBotonesUI)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0); 

        btnPausa.on('pointerdown', () => {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                btnPausa.setTexture('Resume');
                this.physics.pause();
            } else {
                btnPausa.setTexture('Pause');
                this.physics.resume();
            }
        });

        [btnSonido, btnPausa].forEach(btn => {
            btn.on('pointerover', () => btn.setTint(0xffcc00));
            btn.on('pointerout', () => btn.clearTint());
        });

        this.scale.on('resize', (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;
            this.physics.world.setBounds(0, 0, this.longitudNivel, h);
            
            if (this.fondoBosque) {
                this.fondoBosque.setSize(w, h);
                let resTex = this.textures.get('background').getSourceImage();
                let fEscala = Math.max(h / resTex.height, w / resTex.width);
                this.fondoBosque.tileScaleX = fEscala;
                this.fondoBosque.tileScaleY = fEscala;
            }
            
            btnSonido.setPosition(w - (60 * (h / 720)), 50 * (h / 720));
            btnPausa.setPosition(btnSonido.x - (80 * (h / 720)), 50 * (h / 720));
        });
    }

    update() {
        if (this.fondoBosque) {
            this.fondoBosque.tilePositionX = (this.cameras.main.scrollX * 0.3) / this.fondoBosque.tileScaleX;
        }

        this.gatos.children.iterate(gato => {
            if (gato && gato.active && gato.body) {
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

        // --- NUEVA MECÁNICA: BAJARSE DE LAS NUBES CON FLECHA ABAJO ---
        // body.touching.down asegura que Mocca esté efectivamente parada sobre la nube
        // !body.onFloor() nos re asegura que NO esté en el piso principal
        if (this.cursors.down.isDown && this.mocca.body.touching.down && !this.mocca.body.onFloor()) {
            this.mocca.body.checkCollision.none = true;
            
            this.time.delayedCall(250, () => {
                this.mocca.body.checkCollision.none = false;
            });
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.isbarking = true;
            this.sound.play("bark_sound", { volume: 0.2 });

            if (!this.mocca.body.onFloor() && !this.mocca.body.touching.down) {
                this.mocca.anims.play("bark_jump", true);
            } else if (this.cursors.left.isDown || this.cursors.right.isDown) {
                this.mocca.anims.play("bark_run", true);
            } else {
                this.mocca.anims.play("bark_idle", true);
            }

            this.time.delayedCall(300, () => { this.isbarking = false; });
            return;
        }

        if (this.cursors.left.isDown) {
            this.mocca.setVelocityX(-this.PLAYER_SPEED);
            this.mocca.setFlipX(true);
            if (this.mocca.body.onFloor() || this.mocca.body.touching.down) this.mocca.anims.play("run", true);
        } else if (this.cursors.right.isDown) {
            this.mocca.setVelocityX(this.PLAYER_SPEED);
            this.mocca.setFlipX(false);
            if (this.mocca.body.onFloor() || this.mocca.body.touching.down) this.mocca.anims.play("run", true);
        } else {
            this.mocca.setVelocityX(0);
            if (this.mocca.body.onFloor() || this.mocca.body.touching.down) this.mocca.anims.play("idle", true);
        }

        // Saltar funciona tanto desde el piso como desde las nubes
        if (this.cursors.space.isDown && (this.mocca.body.onFloor() || this.mocca.body.touching.down)) {
            this.mocca.setVelocityY(this.JUMP_VELOCITY);
            this.mocca.anims.play("jump", true);
            this.sound.play("mocca_jump", { volume: 0.3 });
        }

        if (!this.mocca.body.onFloor() && !this.mocca.body.touching.down && this.mocca.anims.currentAnim.key !== "jump" && !this.isbarking) {
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

function getEscalaFloat(val) {
    return parseFloat(val) || 0.4;
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