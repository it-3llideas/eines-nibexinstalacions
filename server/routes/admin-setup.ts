import { RequestHandler } from "express";
import { connection } from '../db/config';
import { encryptPassword, verifyPassword } from '../utils/password';

export const checkAndCreateAdmin: RequestHandler = async (req, res) => {
  try {
    console.log('🔍 Verificando usuario administrador...');

    // Check if users table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'nibex' AND TABLE_NAME = 'users'
    `);

    if ((tables as any[]).length === 0) {
      console.log('❌ Tabla users no existe. Creándola...');
      
      // Create users table
      await connection.execute(`
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla users creada');
    }

    // Check if admin user exists
    const [existingAdmin] = await connection.execute(
      'SELECT id, email, username, password_hash FROM users WHERE email = ?',
      ['admin@nibexinstalacions.com']
    );

    if ((existingAdmin as any[]).length === 0) {
      console.log('❌ Usuario administrador no existe. Creándolo...');
      
      // Create admin user
      const hashedPassword = encryptPassword('C@t4luny4');
      await connection.execute(`
        INSERT INTO users (username, email, password_hash, active) VALUES
        ('admin', 'admin@nibexinstalacions.com', ?, TRUE)
      `, [hashedPassword]);
      
      console.log('✅ Usuario administrador creado');
      console.log('   Email: admin@nibexinstalacions.com');
      console.log('   Password: C@t4luny4');

      res.json({
        success: true,
        message: 'Usuario administrador creado correctamente',
        user: {
          email: 'admin@nibexinstalacions.com',
          username: 'admin',
          role: 'admin'
        }
      });
    } else {
      console.log('✅ Usuario administrador ya existe');
      const admin = (existingAdmin as any[])[0];

      // Ensure password is encrypted (migrate if needed)
      if (!admin.password_hash || admin.password_hash.length !== 64 || !/^[0-9a-f]+$/i.test(admin.password_hash)) {
        const newHash = encryptPassword(String(admin.password_hash || 'C@t4luny4'));
        await connection.execute(
          'UPDATE users SET password_hash = ? WHERE id = ?',
          [newHash, admin.id]
        );
        admin.password_hash = newHash;
      }

      res.json({
        success: true,
        message: 'Usuario administrador ya existe',
        user: {
          id: admin.id,
          email: admin.email,
          username: admin.username
        }
      });
    }

  } catch (error) {
    console.error('❌ Error configurando usuario administrador:', error);
    res.status(500).json({ 
      error: 'Error configurando usuario administrador',
      details: error.message 
    });
  }
};

export const getAllAdminUsers: RequestHandler = async (req, res) => {
  try {
    const [users] = await connection.execute(`
      SELECT id, username, email, active, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ 
      error: 'Error fetching admin users',
      details: error.message 
    });
  }
};

export const ensureAdminHash: RequestHandler = async (_req, res) => {
  try {
    const [rows] = await connection.execute(
      'SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1',
      ['admin@nibexinstalacions.com']
    );
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ success: false, error: 'Admin no existe' });
    }
    const admin = (rows as any[])[0];
    const looksHashed = typeof admin.password_hash === 'string' && /^[0-9a-f]{64}$/i.test(admin.password_hash);
    if (!looksHashed) {
      const newHash = encryptPassword('C@t4luny4');
      await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, admin.id]);
      return res.json({ success: true, updated: true });
    }
    return res.json({ success: true, updated: false });
  } catch (e: any) {
    console.error('ensureAdminHash error:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
};

export const testLogin: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Testing login for:', email);

    const [users] = await connection.execute(
      'SELECT id, username, email, password_hash, active FROM users WHERE email = ? AND active = TRUE',
      [email]
    );

    if ((users as any[]).length === 0) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = (users as any[])[0];
    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      stored_password: user.password_hash,
      provided_password: password
    });

    // Simple password verification (for demo purposes)
    if (user.password_hash === password) {
      console.log('✅ Contraseña correcta');
      res.json({
        success: true,
        message: 'Login exitoso',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } else {
      console.log('❌ Contraseña incorrecta');
      res.status(401).json({ error: 'Contraseña incorrecta' });
    }

  } catch (error) {
    console.error('Error testing login:', error);
    res.status(500).json({ 
      error: 'Error testing login',
      details: error.message 
    });
  }
};
