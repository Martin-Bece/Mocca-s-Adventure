const API_URL = 'https://mocca-backend.onrender.com/api';

export const authService = {
  // Función para registrar usuarios
  async register(username, password) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response;
  },

  // Función para iniciar sesión (la usaremos en el próximo paso)
  async login(username, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response;
  }
};