import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8080;
const distPath = path.join(__dirname, '../dist/spa');

// Database connection
const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// In-memory storage for users (temporary)
let users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@nibexinstalacions.com',
    active: true,
    created_at: new Date().toISOString()
  }
];

// Helper function to generate unique operario code
const generateOperarioCode = async () => {
  let code;
  let exists = true;
  
  while (exists) {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM operarios WHERE operario_code = ?',
      [code]
    );
    exists = rows[0].count > 0;
  }
  
  return code;
};

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes
  if (req.url.startsWith('/api/')) {
    try {
      if (req.url === '/api/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'pong' }));
        return;
      }

      // OPERARIOS ENDPOINTS
      if (req.url === '/api/operarios' && req.method === 'GET') {
        try {
          const [operarios] = await connection.execute(
            'SELECT id, name, email, operario_code, active, created_at FROM operarios ORDER BY created_at DESC'
          );
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            operarios
          }));
        } catch (error) {
          console.error('Error getting operarios:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Error interno del servidor' 
          }));
        }
        return;
      }

      if (req.url === '/api/operarios' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            
            if (!data.name) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'El nombre es requerido' 
              }));
              return;
            }

            // Generate unique operario code
            const operarioCode = await generateOperarioCode();

            // Insert into database
            await connection.execute(
              'INSERT INTO operarios (name, email, operario_code, active) VALUES (?, ?, ?, TRUE)',
              [data.name, data.email || null, operarioCode]
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'Operario creado exitosamente',
              operario: {
                name: data.name,
                email: data.email || null,
                operario_code: operarioCode
              }
            }));
          } catch (error) {
            console.error('Error creating operario:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'El email ya está en uso' 
              }));
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Error interno del servidor' 
              }));
            }
          }
        });
        return;
      }

      if (req.url.match(/^\/api\/operarios\/\d+$/) && req.method === 'PUT') {
        const operarioId = parseInt(req.url.split('/').pop());
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            
            if (!data.name) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'El nombre es requerido' 
              }));
              return;
            }

            await connection.execute(
              'UPDATE operarios SET name = ?, email = ?, active = ? WHERE id = ?',
              [data.name, data.email || null, data.active !== false, operarioId]
            );

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'Operario actualizado exitosamente'
            }));
          } catch (error) {
            console.error('Error updating operario:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'El email ya está en uso' 
              }));
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Error interno del servidor' 
              }));
            }
          }
        });
        return;
      }

      if (req.url.match(/^\/api\/operarios\/\d+$/) && req.method === 'DELETE') {
        const operarioId = parseInt(req.url.split('/').pop());
        
        try {
          // Check if operario has any transactions
          const [transactions] = await connection.execute(
            'SELECT COUNT(*) as count FROM tool_checkouts WHERE operario_id = ?',
            [operarioId]
          );

          if (transactions[0].count > 0) {
            // Don't delete, just deactivate
            await connection.execute(
              'UPDATE operarios SET active = FALSE WHERE id = ?',
              [operarioId]
            );
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'Operario desactivado exitosamente (tiene historial de transacciones)'
            }));
          } else {
            // Safe to delete
            await connection.execute(
              'DELETE FROM operarios WHERE id = ?',
              [operarioId]
            );
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'Operario eliminado exitosamente'
            }));
          }
        } catch (error) {
          console.error('Error deleting operario:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Error interno del servidor' 
          }));
        }
        return;
      }

      if (req.url.match(/^\/api\/operarios\/\d+\/regenerate-code$/) && req.method === 'POST') {
        const operarioId = parseInt(req.url.split('/')[3]);
        
        try {
          // Generate new unique code
          const operarioCode = await generateOperarioCode();

          // Update operario code
          await connection.execute(
            'UPDATE operarios SET operario_code = ? WHERE id = ?',
            [operarioCode, operarioId]
          );

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Código regenerado exitosamente',
            operario_code: operarioCode
          }));
        } catch (error) {
          console.error('Error regenerating code:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Error interno del servidor' 
          }));
        }
        return;
      }

      // AUTH ENDPOINTS (keep simple for now)
      if (req.url === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            
            // Find user by email or username
            const user = users.find(u => 
              u.email === data.email || 
              u.username === data.email || 
              u.username === data.username
            );
            
            if (user) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                user: { 
                  id: user.id, 
                  username: user.username, 
                  email: user.email,
                  role: 'admin'
                }
              }));
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Credenciales inválidas'
              }));
            }
          } catch (error) {
            console.error('Login error:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
          }
        });
        return;
      }

      // DEFAULT - API not found
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
      return;

    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
      return;
    }
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  let fullPath = path.join(distPath, filePath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    // For React Router - serve index.html for non-existing files
    fullPath = path.join(distPath, 'index.html');
  }

  try {
    const data = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end('File not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 Frontend: http://0.0.0.0:${port}`);
  console.log(`🔧 API: http://0.0.0.0:${port}/api`);
  
  // Show all available network interfaces
  try {
    const nets = networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          addresses.push(net.address);
        }
      }
    }
    
    if (addresses.length > 0) {
      console.log(`🌐 Available on network:`);
      addresses.forEach(addr => {
        console.log(`   http://${addr}:${port}`);
      });
    }
  } catch (error) {
    console.log('Could not detect network interfaces');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  server.close(() => process.exit(0));
});
