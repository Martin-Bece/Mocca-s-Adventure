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

app.use('/api', authRoutes);

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
// --- ENDPOINTS DE PERSISTENCIA Y HIGHSCORES (SISTEMA MOCCA) ---
// ============================================================================

// 🌟 1. GUARDAR PARTIDA (Al pasar de nivel o guardar desde el menú de pausa)
// Si guarda a mitad de nivel, puntos_a_acumular y tiempo_a_acumular deben ser 0.
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
    // Buscamos si el usuario ya tiene un registro en la tabla 'partidas'
    const { data: partidaPrevia, error: errorBusqueda } = await supabase
      .from('partidas')
      .select('*')
      .eq('usuario_id', usuario_id)
      .single();

    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') throw errorBusqueda;

    let nuevoPuntajeAcumulado = puntos_a_acumular;
    let nuevoTiempoAcumulado = tiempo_a_acumular;

    if (partidaPrevia) {
      // 💡 LÓGICA MARTÍN: Sumamos lo del nivel completado al acumulado histórico que ya traía
      nuevoPuntajeAcumulado = partidaPrevia.puntaje_acumulado + puntos_a_acumular;
      nuevoTiempoAcumulado = partidaPrevia.tiempo_acumulado + tiempo_a_acumular;

      const { error: errorUpdate } = await supabase
        .from('partidas')
        .update({
          nivel_actual,
          vidas,
          huesos_recolectados,
          puntaje_acumulado: nuevoPuntajeAcumulado,
          tiempo_acumulado: nuevoTiempoAcumulado,
          fecha_guardado: new Date()
        })
        .eq('usuario_id', usuario_id);

      if (errorUpdate) throw errorUpdate;
    } else {
      // Primera vez que guarda en el juego (Nivel 1)
      const { error: errorInsert } = await supabase
        .from('partidas')
        .insert([{ 
          usuario_id, 
          nivel_actual, 
          vidas, 
          huesos_recolectados, 
          puntaje_acumulado: nuevoPuntajeAcumulado, 
          tiempo_acumulado: nuevoTiempoAcumulado 
        }]);

      if (errorInsert) throw errorInsert;
    }

    return res.json({ 
      message: 'Partida resguardada con éxito', 
      puntaje_total_acumulado: nuevoPuntajeAcumulado,
      tiempo_total_acumulado: nuevoTiempoAcumulado
    });

  } catch (error) {
    console.error(error);
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
    // Traemos lo que acumuló en los niveles anteriores desde la tabla 'partidas'
    const { data: partida, error: errorPartida } = await supabase
      .from('partidas')
      .select('puntaje_acumulado, tiempo_acumulado')
      .eq('usuario_id', usuario_id)
      .single();

    if (errorPartida) throw errorPartida;

    // Sumamos el esfuerzo del último nivel al acumulado de la aventura entera
    const puntajeFinalDeLaAventura = partida.puntaje_acumulado + puntos_ultimo_nivel;
    const tiempoFinalDeLaAventura = partida.tiempo_acumulado + tiempo_ultimo_nivel;

    // Buscamos si ya tiene un récord previo guardado en la tabla 'scores'
    const { data: scorePrevio, error: errorScore } = await supabase
      .from('scores')
      .select('*')
      .eq('usuario_id', usuario_id)
      .single();

    if (errorScore && errorScore.code !== 'PGRST116') throw errorScore;

    if (scorePrevio) {
      // SOLO se actualiza el ranking si esta partida superó su propio récord anterior
      if (puntajeFinalDeLaAventura > scorePrevio.puntaje_total) {
        const { error: errorUpdate } = await supabase
          .from('scores')
          .update({ 
            puntaje_total: puntajeFinalDeLaAventura, 
            tiempo_final: tiempoFinalDeLaAventura, 
            fecha_logro: new Date() 
          })
          .eq('usuario_id', usuario_id);
        
        if (errorUpdate) throw errorUpdate;
        return res.json({ message: '¡Nuevo récord histórico superado!', puntaje: puntajeFinalDeLaAventura });
      }
      return res.json({ message: 'Aventura terminada, pero no superó tu récord máximo.', puntaje: puntajeFinalDeLaAventura });
    } else {
      // Si es su primera vez en el ranking de la tabla 'scores', lo insertamos de una
      const { error: errorInsert } = await supabase
        .from('scores')
        .insert([{ 
          usuario_id, 
          puntaje_total: puntajeFinalDeLaAventura, 
          tiempo_final: tiempoFinalDeLaAventura 
        }]);

      if (errorInsert) throw errorInsert;
      return res.json({ message: '¡Aventura completada! Entraste al ranking por primera vez.', puntaje: puntajeFinalDeLaAventura });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el Score en el ranking' });
  }
});


// 🌟 3. LEER EL TOP 5 DE HIGHSCORES (Para armar la tabla de posiciones en la UI)
app.get('/api/highscores', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select(`
        puntaje_total,
        tiempo_final,
        usuarios ( username )
      `)
      .order('puntaje_total', { ascending: false })
      .limit(5);

    if (error) throw error;
    
    // Devolvemos un formato limpio haciendo el mapeo con el JOIN de usuarios
    const top5 = data.map(item => ({
      username: item.usuarios?.username || 'Anónimo',
      score: item.puntaje_total,
      tiempo: item.tiempo_final
    }));

    res.json(top5);
  } catch (error) {
    console.error(error);
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