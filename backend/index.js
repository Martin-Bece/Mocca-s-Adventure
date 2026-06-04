import express from 'express';
import pkg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcrypt'; // <--- Nueva dependencia

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

// Ruta base
app.get('/', (req, res) => {
  res.send('Servidor de Mocca\'s Adventure corriendo impecable 🐾');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en el puerto ${PORT}`);
});