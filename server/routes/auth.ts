import { RequestHandler } from "express";
import { verifyPassword } from '../utils/password';
import { connection } from '../db/config';

// Login endpoint
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const [rows] = await connection.execute(
      'SELECT id, username, email, password_hash, active FROM users WHERE email = ? AND active = TRUE',
      [email]
    );

    if ((rows as any[]).length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = (rows as any[])[0];
    const isValid = verifyPassword(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Get current user info
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const [users] = await connection.execute(
      'SELECT id, username, email, active FROM users WHERE id = ? AND active = TRUE',
      [userId]
    );

    if ((users as any[]).length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = (users as any[])[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// This function is no longer needed as we create the admin user in the reset process

// Logout endpoint
export const logoutUser: RequestHandler = async (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada correctamente' });
};
