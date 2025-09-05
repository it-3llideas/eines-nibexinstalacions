import { RequestHandler } from 'express';
import { connection } from '../db/config';
import { encryptPassword } from '../utils/password';

// Get all users
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const [users] = await connection.execute(`
      SELECT id, username, email,
             CASE WHEN active = 1 THEN 'ACTIVE' ELSE 'INACTIVE' END as active,
             created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
};

// Create new user
export const createUser: RequestHandler = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de usuario y contraseña son requeridos'
      });
    }

    // Check if username already exists
    const [existingUsername] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if ((existingUsername as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de usuario ya existe'
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const [existingEmail] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if ((existingEmail as any[]).length > 0) {
        return res.status(400).json({
          success: false,
          error: 'El email ya existe'
        });
      }
    }

    // Encrypt password
    const hashedPassword = encryptPassword(password);

    // Insert new user
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password_hash, active) VALUES (?, ?, ?, TRUE)',
      [username, email, hashedPassword]
    );

    res.json({
      success: true,
      message: 'Usuario creado exitosamente',
      userId: (result as any).insertId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear usuario'
    });
  }
};

// Update user
export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de usuario es requerido'
      });
    }

    // Check if user exists
    const [existingUser] = await connection.execute(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    );

    if ((existingUser as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Check if username is taken by another user
    const [usernameCheck] = await connection.execute(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id]
    );

    if ((usernameCheck as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El nombre de usuario ya está registrado'
      });
    }

    // Check if email is taken by another user (if provided)
    if (email) {
      const [emailCheck] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if ((emailCheck as any[]).length > 0) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está registrado'
        });
      }
    }

    // Update user
    let updateQuery = 'UPDATE users SET username = ?, email = ?';
    let updateParams = [username, email];

    if (password) {
      const hashedPassword = encryptPassword(password);
      updateQuery += ', password_hash = ?';
      updateParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await connection.execute(updateQuery, updateParams);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario'
    });
  }
};

// Delete user
export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUser] = await connection.execute(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    );

    if ((existingUser as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = (existingUser as any[])[0];

    // Prevent deleting the main admin user
    if (user.username === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el usuario administrador principal'
      });
    }

    // Delete user
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario'
    });
  }
};
