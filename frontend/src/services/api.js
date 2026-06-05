const API_URL = "https://mocca-backend.onrender.com/api";

export const authService = {
  // Función para registrar usuarios
  async register(username, password) {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return response;
  },

  // Función para iniciar sesión
  async login(username, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return response;
  }, // 🌟 Se agregó la coma acá para separar las propiedades del objeto

  // 🌟 FUNCIÓN PARA GUARDAR LA PARTIDA (Al pasar de nivel o pausar)
  async guardarPartida(
    usuarioId,
    nivelActual,
    vidas,
    huesos,
    puntosNivel,
    tiempoNivel,
  ) {
    try {
      const response = await fetch(`${API_URL}/savegame`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_id: usuarioId,
          nivel_actual: nivelActual,
          vidas: vidas,
          huesos_recolectados: huesos,
          puntos_a_acumular: puntosNivel,
          tiempo_a_acumular: tiempoNivel,
        }),
      });

      const data = await response.json();
      console.log("Respuesta de guardado:", data);
      return data;
    } catch (error) {
      console.error(
        "Error al conectar con el servidor para guardar partida:",
        error,
      );
    }
  }, // 🌟 Coma agregada

  // 🌟 FUNCIÓN PARA REGISTRAR EL SCORE FINAL (Cuando gana el juego o muere del todo)
  async registrarScoreFinal(usuarioId, puntosUltimoNivel, tiempoUltimoNivel) {
    try {
      const response = await fetch(`${API_URL}/savescore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_id: usuarioId,
          puntos_ultimo_nivel: puntosUltimoNivel,
          tiempo_ultimo_nivel: tiempoUltimoNivel,
        }),
      });

      const data = await response.json();
      console.log("Respuesta de ranking:", data);
      return data;
    } catch (error) {
      console.error("Error al registrar score final:", error);
    }
  }, // 🌟 Coma agregada

  // 🌟 FUNCIÓN PARA TRAER EL TOP 5 (Para dibujar la pantalla de Highscores)
  async obtenerHighscores() {
    try {
      const response = await fetch(`${API_URL}/highscores`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error al traer highscores:", error);
      return [];
    }
  },

  async obtenerPartida(usuarioId) {
    try {
      const respuesta = await fetch(`${API_URL}/get-game/${usuarioId}`);
      if (!respuesta.ok) {
        if (respuesta.status === 404) return null; // Si no hay partida, devolvemos null sin romper
        throw new Error("Error al obtener la partida de la base de datos");
      }
      return await respuesta.json();
    } catch (error) {
      console.error("Error en obtenerPartida frontend:", error);
      return null;
    }
  }
};
