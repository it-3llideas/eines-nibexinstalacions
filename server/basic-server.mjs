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

// Data persistence paths
const dataDir = path.join(__dirname, 'data');
const operariosFile = path.join(dataDir, 'operarios.json');
const categoriesFile = path.join(dataDir, 'categories.json');
const toolsFile = path.join(dataDir, 'tools.json');
const usersFile = path.join(dataDir, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Save data to files
const saveData = () => {
  try {
    fs.writeFileSync(operariosFile, JSON.stringify(operarios, null, 2));
    fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2));
    fs.writeFileSync(toolsFile, JSON.stringify(tools, null, 2));
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Load data from files
const loadData = () => {
  try {
    if (fs.existsSync(operariosFile)) {
      const data = fs.readFileSync(operariosFile, 'utf8');
      operarios = JSON.parse(data);
    }
    if (fs.existsSync(categoriesFile)) {
      const data = fs.readFileSync(categoriesFile, 'utf8');
      categories = JSON.parse(data);
    }
    if (fs.existsSync(toolsFile)) {
      const data = fs.readFileSync(toolsFile, 'utf8');
      tools = JSON.parse(data);
    }
    if (fs.existsSync(usersFile)) {
      const data = fs.readFileSync(usersFile, 'utf8');
      users = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

// Database connection
const connection = mysql.createPool({
  uri: process.env.DATABASE_URL || 'mysql://nibex:nibex@212.83.137.117:3306/nibex',
  ssl: false
});

// In-memory storage (no default data)
let users = [];
let operarios = [];
let categories = [];
let tools = [];

// Load existing data on startup
loadData();

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

const server = http.createServer((req, res) => {
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
    if (req.url === '/api/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'pong' }));
      return;
    }

    if (req.url === '/api/operarios' && req.method === 'GET') {
      // Return stored operarios
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        operarios: operarios
      }));
      return;
    }

    if (req.url === '/api/operarios' && req.method === 'POST') {
      // Handle POST - Create new operario
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);

          if (!data.name || !data.name.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'El nombre es requerido'
            }));
            return;
          }

          // Generate unique operario code
          let newCode;
          let codeExists = true;
          while (codeExists) {
            newCode = Math.floor(1000 + Math.random() * 9000).toString();
            codeExists = operarios.some(op => op.operario_code === newCode);
          }

          const newOperario = {
            id: Math.max(...operarios.map(op => op.id), 0) + 1,
            name: data.name.trim(),
            email: data.email || null,
            operario_code: newCode,
            active: true,
            created_at: new Date().toISOString()
          };

          // Store in memory
          operarios.push(newOperario);

          // Save to file
          saveData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Operario creado exitosamente',
            operario: newOperario
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url.match(/^\/api\/operarios\/\d+$/) && req.method === 'PUT') {
      // Handle PUT - Update operario
      const operarioId = parseInt(req.url.split('/').pop());
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);

          if (!data.name || !data.name.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'El nombre es requerido'
            }));
            return;
          }

          const operarioIndex = operarios.findIndex(op => op.id === operarioId);

          if (operarioIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Operario no encontrado'
            }));
            return;
          }

          // Update operario properties
          operarios[operarioIndex] = {
            ...operarios[operarioIndex],
            name: data.name.trim(),
            email: data.email || null,
            active: data.active !== false
          };

          // Save to file
          saveData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Operario actualizado exitosamente'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url.match(/^\/api\/operarios\/\d+$/) && req.method === 'DELETE') {
      // Handle DELETE - Delete operario
      const operarioId = parseInt(req.url.split('/').pop());
      const operarioIndex = operarios.findIndex(op => op.id === operarioId);

      if (operarioIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Operario no encontrado'
        }));
        return;
      }

      // Remove operario from array
      const deletedOperario = operarios.splice(operarioIndex, 1)[0];

      // Save to file
      saveData();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Operario "${deletedOperario.name}" eliminado exitosamente`
      }));
      return;
    }

    if (req.url.match(/^\/api\/operarios\/\d+\/regenerate-code$/) && req.method === 'POST') {
      // Handle regenerate code
      const operarioId = parseInt(req.url.split('/')[3]);
      const operarioIndex = operarios.findIndex(op => op.id === operarioId);

      if (operarioIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Operario no encontrado'
        }));
        return;
      }

      // Generate unique code
      let newCode;
      let codeExists = true;
      while (codeExists) {
        newCode = Math.floor(1000 + Math.random() * 9000).toString();
        codeExists = operarios.some(op => op.operario_code === newCode);
      }

      // Update operario code
      operarios[operarioIndex].operario_code = newCode;

      // Save to file
      saveData();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Código regenerado exitosamente',
        operario_code: newCode
      }));
      return;
    }

    if (req.url === '/api/admin/users' && req.method === 'GET') {
      // Handle GET - List users from memory
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        users: users
      }));
      return;
    }

    if (req.url === '/api/admin/users' && req.method === 'POST') {
      // Handle POST - Create user
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);

          // Check if username already exists
          if (users.find(user => user.username === data.username)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'El nombre de usuario ya existe'
            }));
            return;
          }

          const newUser = {
            id: Math.max(...users.map(u => u.id), 0) + 1,
            username: data.username,
            email: data.email || '',
            active: true,
            created_at: new Date().toISOString()
          };

          users.push(newUser);

          // Save to file
          saveData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Usuario creado exitosamente',
            user: newUser
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url.match(/^\/api\/admin\/users\/\d+$/) && req.method === 'PUT') {
      // Handle PUT - Update user
      const userId = parseInt(req.url.split('/').pop());
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const userIndex = users.findIndex(user => user.id === userId);

          if (userIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Usuario no encontrado'
            }));
            return;
          }

          // Update user properties
          const updatedUser = {
            ...users[userIndex],
            username: data.username || users[userIndex].username,
            email: data.email !== undefined ? data.email : users[userIndex].email
          };

          users[userIndex] = updatedUser;

          // Save to file
          saveData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Usuario actualizado exitosamente'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url.match(/^\/api\/admin\/users\/\d+$/) && req.method === 'DELETE') {
      // Handle DELETE - Delete user
      const userId = parseInt(req.url.split('/').pop());
      const userIndex = users.findIndex(user => user.id === userId);

      if (userIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no encontrado'
        }));
        return;
      }

      // Prevent deleting admin user
      if (users[userIndex].username === 'admin') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'No se puede eliminar el usuario administrador'
        }));
        return;
      }

      // Remove user from array
      const deletedUser = users.splice(userIndex, 1)[0];

      // Save to file
      saveData();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Usuario "${deletedUser.username}" eliminado exitosamente`
      }));
      return;
    }

    if (req.url === '/api/categories' && req.method === 'GET') {
      // Return categories from memory
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(categories));
      return;
    }

    if (req.url === '/api/categories/stats' && req.method === 'GET') {
      // Calculate dynamic stats based on actual tools
      const categoriesWithStats = categories.map(category => {
        const categoryTools = tools.filter(tool => tool.category_id === category.id);
        const availableTools = categoryTools.filter(tool => tool.available_quantity > 0);

        return {
          ...category,
          tool_count: categoryTools.length,
          available_tools: availableTools.length
        };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(categoriesWithStats));
      return;
    }

    if (req.url === '/api/categories/type/individual' && req.method === 'GET') {
      // Individual categories only
      const individualCategories = categories.filter(cat => cat.type === 'individual');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(individualCategories));
      return;
    }

    if (req.url === '/api/categories/type/common' && req.method === 'GET') {
      // Common categories only
      const commonCategories = categories.filter(cat => cat.type === 'common');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(commonCategories));
      return;
    }

    if (req.url === '/api/categories' && req.method === 'POST') {
      // Create category
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const newCategory = {
            id: Math.max(...categories.map(c => c.id), 0) + 1,
            name: data.name,
            description: data.description || '',
            type: data.type,
            color: data.color || '#3B82F6'
          };
          categories.push(newCategory);

          // Save to file
          saveData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Categoría creada exitosamente',
            category: newCategory
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url.match(/^\/api\/categories\/\d+$/) && req.method === 'PUT') {
      // Update category
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Categoría actualizada exitosamente'
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url.match(/^\/api\/categories\/\d+$/) && req.method === 'DELETE') {
      // Delete category from memory
      const categoryId = parseInt(req.url.split('/').pop());
      const categoryIndex = categories.findIndex(cat => cat.id === categoryId);

      if (categoryIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Categoría no encontrada'
        }));
        return;
      }

      // Check if category has tools
      const categoryTools = tools.filter(tool => tool.category_id === categoryId);
      if (categoryTools.length > 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `No se puede eliminar la categoría porque tiene ${categoryTools.length} herramienta(s) asociada(s)`
        }));
        return;
      }

      // Remove category from array
      const deletedCategory = categories.splice(categoryIndex, 1)[0];

      // Save to file
      saveData();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Categoría "${deletedCategory.name}" eliminada exitosamente`
      }));
      return;
    }

    if (req.url === '/api/inventory/tools' && req.method === 'GET') {
      // Return current tools from memory
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        tools: tools
      }));
      return;
    }

    if (req.url === '/api/inventory/stats' && req.method === 'GET') {
      // Mock inventory stats
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        totalToolTypes: 13,
        individualTools: 8,
        commonTools: 5,
        toolsInUse: 4,
        toolsInMaintenance: 1,
        missingTools: 0,
        activeOperarios: 2,
        overdueReviews: 1,
        lowStockTools: 2
      }));
      return;
    }

    if (req.url === '/api/inventory/transactions' && req.method === 'GET') {
      // Empty transaction history - no test data
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }

    if (req.url === '/api/inventory/available' && req.method === 'GET') {
      // Available tools for checkout
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        tools: [
          {
            id: 1,
            name: 'Taladro Bosch GSB 13 RE',
            available_quantity: 3,
            category_id: 1
          },
          {
            id: 4,
            name: 'Grupo Electrógeno Honda EU20i',
            available_quantity: 2,
            category_id: 4
          }
        ]
      }));
      return;
    }

    if (req.url === '/api/inventory/add' && req.method === 'POST') {
      // Add new tool to memory
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const newTool = {
            id: Math.max(...tools.map(t => t.id), 0) + 1,
            name: data.name,
            type: data.type,
            category_id: parseInt(data.category_id),
            location: data.location,
            status: 'available',
            total_quantity: parseInt(data.total_quantity),
            available_quantity: parseInt(data.total_quantity),
            in_use_quantity: 0,
            description: data.description || ''
          };

          // Add to tools array
          tools.push(newTool);

          // Save to file
          saveData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Herramienta agregada exitosamente',
            tool: newTool
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url.match(/^\/api\/inventory\/tools\/\d+$/) && req.method === 'PUT') {
      // Update tool in memory
      const toolId = parseInt(req.url.split('/').pop());
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const toolIndex = tools.findIndex(tool => tool.id === toolId);

          if (toolIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Herramienta no encontrada'
            }));
            return;
          }

          // Update tool properties
          const updatedTool = {
            ...tools[toolIndex],
            name: data.name || tools[toolIndex].name,
            category_id: data.category_id ? parseInt(data.category_id) : tools[toolIndex].category_id,
            location: data.location || tools[toolIndex].location,
            total_quantity: data.total_quantity ? parseInt(data.total_quantity) : tools[toolIndex].total_quantity,
            description: data.description !== undefined ? data.description : tools[toolIndex].description
          };

          // Recalculate available quantity if total changed
          if (data.total_quantity) {
            updatedTool.available_quantity = updatedTool.total_quantity - updatedTool.in_use_quantity;
          }

          tools[toolIndex] = updatedTool;

          // Save to file
          saveData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Herramienta actualizada exitosamente',
            tool: updatedTool
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url.match(/^\/api\/inventory\/tools\/\d+$/) && req.method === 'DELETE') {
      // Delete tool from memory
      const toolId = parseInt(req.url.split('/').pop());
      const toolIndex = tools.findIndex(tool => tool.id === toolId);

      if (toolIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Herramienta no encontrada'
        }));
        return;
      }

      // Remove tool from array
      const deletedTool = tools.splice(toolIndex, 1)[0];

      // Save to file
      saveData();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Herramienta "${deletedTool.name}" eliminada exitosamente`
      }));
      return;
    }

    // Auth endpoints
    if (req.url === '/api/auth/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('Login attempt:', data);

          // Find user by email or username
          const user = users.find(u =>
            u.email === data.email ||
            u.username === data.email ||
            u.username === data.username
          );

          if (user) {
            console.log('User found:', user.username);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: 'admin' // Always admin for now
              }
            }));
          } else {
            console.log('User not found for email/username:', data.email || data.username);
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

    if (req.url.startsWith('/api/auth/user/') && req.method === 'GET') {
      const userId = req.url.split('/').pop();
      const user = users.find(u => u.id == userId);
      if (user) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          user: { id: user.id, username: user.username, email: user.email }
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Usuario no encontrado'
        }));
      }
      return;
    }

    if (req.url === '/api/auth/logout' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Sesión cerrada exitosamente'
      }));
      return;
    }

    if (req.url === '/api/inventory/checkout' && req.method === 'POST') {
      // Handle tool checkout
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { toolId, operarioCode, quantity, project } = data;

          // Find operario by code
          const operario = operarios.find(op => op.operario_code === operarioCode);
          if (!operario) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Operario no encontrado'
            }));
            return;
          }

          // Find tool
          const toolIndex = tools.findIndex(tool => tool.id === parseInt(toolId));
          if (toolIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Herramienta no encontrada'
            }));
            return;
          }

          const tool = tools[toolIndex];

          // Check availability
          if (tool.available_quantity < quantity) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: `Solo hay ${tool.available_quantity} unidades disponibles`
            }));
            return;
          }

          // Update tool quantities
          tools[toolIndex].available_quantity -= quantity;
          tools[toolIndex].in_use_quantity += quantity;

          // Save to file
          saveData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: `Herramienta asignada exitosamente a ${operario.name}`
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url === '/api/inventory/checkin' && req.method === 'POST') {
      // Handle tool checkin
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { toolId, operarioCode, quantity, project } = data;

          // Find operario by code
          const operario = operarios.find(op => op.operario_code === operarioCode);
          if (!operario) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Operario no encontrado'
            }));
            return;
          }

          // Find tool
          const toolIndex = tools.findIndex(tool => tool.id === parseInt(toolId));
          if (toolIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: 'Herramienta no encontrada'
            }));
            return;
          }

          const tool = tools[toolIndex];

          // Check if there are tools in use
          if (tool.in_use_quantity < quantity) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: `Solo hay ${tool.in_use_quantity} unidades en uso`
            }));
            return;
          }

          // Update tool quantities
          tools[toolIndex].in_use_quantity -= quantity;
          tools[toolIndex].available_quantity += quantity;

          // Save to file
          saveData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: `Herramienta devuelta exitosamente por ${operario.name}`
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (req.url === '/api/inventory/auth' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          // Mock auth for operario code
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            operario: { id: 1, name: 'Test Operario', code: data.code }
          }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
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
  console.log('💾 Saving data before shutdown...');
  saveData();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  console.log('💾 Saving data before shutdown...');
  saveData();
  server.close(() => process.exit(0));
});
