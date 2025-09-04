import { RequestHandler } from "express";
import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

export const createUserInUsersTable: RequestHandler = async (req, res) => {
  try {
    console.log('🔍 Verificando tabla users...');

    // Check what's in users table
    const [existingUsers] = await connection.execute('SELECT * FROM users');
    console.log('Usuarios existentes en tabla users:', existingUsers);

    // Check if our admin user exists
    const [adminUser] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@nibexinstalacions.com']
    );

    if ((adminUser as any[]).length === 0) {
      console.log('❌ Usuario admin no existe en tabla users. Creándolo...');

      // Get the structure of users table to understand what fields it needs
      const [tableStructure] = await connection.execute('DESCRIBE users');
      console.log('Estructura de tabla users:', tableStructure);

      // Try to insert the user with all required fields
      const userId = 'admin-nibex-001';
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      try {
        await connection.execute(`
          INSERT INTO users (id, email, name, password, createdAt, updatedAt) VALUES
          (?, ?, ?, ?, ?, ?)
        `, [
          userId,
          'admin@nibexinstalacions.com',
          'Administrador NIBEX',
          'C@t4luny4',
          now,
          now
        ]);

        console.log('✅ Usuario administrador creado en tabla users');
      } catch (insertError) {
        console.log('Error insertando:', insertError.message);

        // Try alternative approach - check what exact fields are needed
        throw insertError;
      }

      // Verify insertion
      const [newUser] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        ['admin@nibexinstalacions.com']
      );

      res.json({
        success: true,
        message: 'Usuario creado en tabla users',
        user: (newUser as any[])[0]
      });

    } else {
      console.log('✅ Usuario admin ya existe en tabla users');
      res.json({
        success: true,
        message: 'Usuario ya existe en tabla users',
        user: (adminUser as any[])[0]
      });
    }

  } catch (error) {
    console.error('❌ Error configurando usuario en tabla users:', error);
    res.status(500).json({ 
      error: 'Error configurando usuario',
      details: error.message 
    });
  }
};

export const getAllUsersFromUsersTable: RequestHandler = async (req, res) => {
  try {
    const [users] = await connection.execute('SELECT * FROM users');
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Error fetching users',
      details: error.message 
    });
  }
};
