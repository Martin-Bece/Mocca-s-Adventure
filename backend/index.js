import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt'; // <--- Nueva dependencia

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*', // Permite que tu Live Server local y luego Vercel se conecten sin bloqueos
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error al conectar a Supabase:', err.stack);
  }
  console.log('✨ Conectado exitosamente a Supabase (PostgreSQL)');
  release();
});

// ==========================================
// ENDPOINT: REGISTRO DE USUARIOS
// ==========================================
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  // Validación básica por si mandan datos vacíos
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  try {
    // 1. Verificar si el usuario ya existe en tu tabla 'usuarios'
    const userCheck = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado.' });
    }

    // 2. Encriptar la contraseña (hash de 10 rondas)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Insertar el nuevo usuario en tu base de datos
    const nuevoUsuario = await pool.query(
      'INSERT INTO usuarios (username, password) VALUES ($1, $2) RETURNING id, username, fecha_registro',
      [username, hashedPassword]
    );

    // 4. Responder con éxito devolviendo los datos públicos del usuario
    res.status(201).json({
      message: '¡Usuario registrado con éxito! 🐾',
      user: nuevoUsuario.rows[0]
    });

  } catch (error) {
    console.error('Error en el servidor al registrar:', error);
    res.status(500).json({ error: 'Hubo un problema en el servidor.' });
  }
});

// ==========================================
// ENDPOINT: INICIO DE SESIÓN (LOGIN)
// ==========================================
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  try {
    // 1. Buscar si el usuario existe en tu base de datos
    const userResult = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'El usuario o la contraseña son incorrectos.' });
    }

    const usuario = userResult.rows[0];

    // 2. Comparar la contraseña ingresada con la encriptada en la base de datos
    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(400).json({ error: 'El usuario o la contraseña son incorrectos.' });
    }

    // 3. Si coincide, respondemos con éxito devolviendo los datos del usuario
    res.status(200).json({
      message: '¡Ingreso exitoso! Bienvenido de nuevo 🐾',
      user: {
        id: usuario.id,
        username: usuario.username
      }
    });

  } catch (error) {
    console.error('Error en el servidor al loguear:', error);
    res.status(500).json({ error: 'Hubo un problema en el servidor.' });
  }
});

// ============================================================================
// --- ENDPOINTS DE PERSISTENCIA Y HIGHSCORES (SISTEMA MOCCA CON POOL) ---
// ============================================================================

// 🌟 1. GUARDAR PARTIDA (Al pasar de nivel o guardar desde el menú de pausa)
app.post('/api/save-game', async (req, res) => {
  const { 
    usuario_id, 
    nivel_actual, 
    vidas, 
    huesos_recolectados, 
    puntos_a_acumular, 
    tiempo_a_acumular 
  } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ error: 'Falta el usuario_id' });
  }

  try {
    // Buscamos con query nativo si el usuario ya tiene una partida registrada
    const partidaCheck = await pool.query('SELECT * FROM partidas WHERE usuario_id = $1', [usuario_id]);
    const partidaPrevia = partidaCheck.rows[0];

    let nuevoPuntajeAcumulado = Number(puntos_a_acumular || 0);
    let nuevoTiempoAcumulado = Number(tiempo_a_acumular || 0);

    if (partidaPrevia) {
      // Sumamos lo del nivel completado al acumulado histórico que ya traía
      nuevoPuntajeAcumulado = Number(partidaPrevia.puntaje_acumulado) + nuevoPuntajeAcumulado;
      nuevoTiempoAcumulado = Number(partidaPrevia.tiempo_acumulado) + nuevoTiempoAcumulado;

      await pool.query(
        `UPDATE partidas 
         SET nivel_actual = $1, vidas = $2, huesos_recolectados = $3, puntaje_acumulado = $4, tiempo_acumulado = $5, fecha_guardado = NOW() 
         WHERE usuario_id = $6`,
        [nivel_actual, vidas, huesos_recolectados, nuevoPuntajeAcumulado, nuevoTiempoAcumulado, usuario_id]
      );
    } else {
      // Primera vez que guarda en el juego
      await pool.query(
        `INSERT INTO partidas (usuario_id, nivel_actual, vidas, huesos_recolectados, puntaje_acumulado, tiempo_acumulado) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [usuario_id, nivel_actual, vidas, huesos_recolectados, nuevoPuntajeAcumulado, nuevoTiempoAcumulado]
      );
    }

    return res.json({ 
      message: 'Partida resguardada con éxito', 
      puntaje_total_acumulado: nuevoPuntajeAcumulado,
      tiempo_total_acumulado: nuevoTiempoAcumulado
    });

  } catch (error) {
    console.error('Error en backend al guardar partida:', error);
    res.status(500).json({ error: 'Error al procesar el guardado de la partida' });
  }
});


// 🌟 2. REGISTRAR EN EL RANKING FINAL (Cuando completa el juego o muere definitivamente)
app.post('/api/save-score', async (req, res) => {
  const { usuario_id, puntos_ultimo_nivel, tiempo_ultimo_nivel } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ error: 'Falta el usuario_id' });
  }

  try {
    // Traemos lo acumulado usando pool
    const partidaCheck = await pool.query('SELECT puntaje_acumulado, tiempo_acumulado FROM partidas WHERE usuario_id = $1', [usuario_id]);
    const partida = partidaCheck.rows[0];

    if (!partida) {
      return res.status(404).json({ error: 'No se encontró una partida previa para este usuario.' });
    }

    const puntajeFinalDeLaAventura = Number(partida.puntaje_acumulado) + Number(puntos_ultimo_nivel || 0);
    const tiempoFinalDeLaAventura = Number(partida.tiempo_acumulado) + Number(tiempo_ultimo_nivel || 0);

    // Buscamos si ya tiene un récord previo guardado en 'scores'
    const scoreCheck = await pool.query('SELECT * FROM scores WHERE usuario_id = $1', [usuario_id]);
    const scorePrevio = scoreCheck.rows[0];

    if (scorePrevio) {
      if (puntajeFinalDeLaAventura > scorePrevio.puntaje_total) {
        await pool.query(
          `UPDATE scores SET puntaje_total = $1, tiempo_final = $2, fecha_logro = NOW() WHERE usuario_id = $3`,
          [puntajeFinalDeLaAventura, tiempoFinalDeLaAventura, usuario_id]
        );
        return res.json({ message: '¡Nuevo récord histórico superado!', puntaje: puntajeFinalDeLaAventura });
      }
      return res.json({ message: 'Aventura terminada, pero no superó tu récord máximo.', puntaje: puntajeFinalDeLaAventura });
    } else {
      await pool.query(
        `INSERT INTO scores (usuario_id, puntaje_total, tiempo_final) VALUES ($1, $2, $3)`,
        [usuario_id, puntajeFinalDeLaAventura, tiempoFinalDeLaAventura]
      );
      return res.json({ message: '¡Aventura completada! Entraste al ranking por primera vez.', puntaje: puntajeFinalDeLaAventura });
    }
  } catch (error) {
    console.error('Error en backend al salvar score:', error);
    res.status(500).json({ error: 'Error al registrar el Score en el ranking' });
  }
});


// 🌟 3. LEER EL TOP 5 DE HIGHSCORES (Para armar la tabla de posiciones en la UI)
app.get('/api/highscores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.puntaje_total, s.tiempo_final, u.username 
      FROM scores s
      JOIN usuarios u ON s.usuario_id = u.id
      ORDER BY s.puntaje_total DESC 
      LIMIT 5
    `);

    const top5 = result.rows.map(item => ({
      username: item.username || 'Anónimo',
      score: item.puntaje_total,
      tiempo: item.tiempo_final
    }));

    res.json(top5);
  } catch (error) {
    console.error('Error en backend al traer highscores:', error);
    res.status(500).json({ error: 'Error al obtener la tabla de highscores' });
  }
});

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor de Mocca\'s Adventure corriendo impecable 🐾');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en el puerto ${PORT}`);
});