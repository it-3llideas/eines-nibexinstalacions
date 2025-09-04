import { RequestHandler } from "express";
import mysql from 'mysql2/promise';
import { verifyPassword } from '../utils/password';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

// Login endpoint
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Check admin users table first
    const [adminUsers] = await connection.execute(
      'SELECT id, username, email, password_hash, active FROM users WHERE email = ? AND active = TRUE',
      [email]
    );

    if ((adminUsers as any[]).length > 0) {
      const user = (adminUsers as any[])[0];

      // Verify password using encryption
      const isValidPassword = verifyPassword(password, user.password_hash);

      if (isValidPassword) {
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: 'admin' // All admin users are administrators
          }
        });
        return;
      }
    }

    // Check users table for admin login with encrypted passwords
    const [regularUsers] = await connection.execute(
      'SELECT id, name, email, password, role, status FROM users WHERE email = ? AND status = "ACTIVE"',
      [email]
    );

    if ((regularUsers as any[]).length > 0) {
      const user = (regularUsers as any[])[0];

      // Verify password using encryption
      const isValidPassword = verifyPassword(password, user.password);

      if (isValidPassword) {
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.name,
            email: user.email,
            role: 'admin' // All users are administrators
          }
        });
        return;
      }
    }

    // Check operarios table for operator login with codes
    const [operarios] = await connection.execute(
      'SELECT id, name, email, operario_code, active FROM operarios WHERE operario_code = ? AND active = TRUE',
      [password] // Use password field as operario_code
    );

    if ((operarios as any[]).length > 0) {
      const operario = (operarios as any[])[0];

      res.json({
        success: true,
        user: {
          id: operario.id,
          username: operario.name,
          email: operario.email || `operario${operario.id}@nibex.com`,
          role: 'operario'
        }
      });
      return;
    }

    // If not found in either table, return error
    res.status(401).json({ error: 'Credenciales incorrectas' });
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
