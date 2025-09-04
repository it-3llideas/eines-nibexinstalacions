import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AlertCircle, Users, Mail, Edit, Trash2, Plus, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import Layout from '../components/Layout';

interface User {
  id: string;
  username: string;
  email: string;
  active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Users API response:', data);
      
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setError('Error al cargar usuarios');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Error de conexión al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Nombre de usuario y contraseña son requeridos');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Usuario creado exitosamente');
        setIsCreateDialogOpen(false);
        setFormData({ username: '', email: '', password: '' });
        await loadUsers();
      } else {
        setError(data.error || 'Error al crear usuario');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser || !formData.username.trim()) {
      setError('Nombre de usuario es requerido');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          ...(formData.password && { password: formData.password })
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Usuario actualizado exitosamente');
        setIsEditDialogOpen(false);
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '' });
        await loadUsers();
      } else {
        setError(data.error || 'Error al actualizar usuario');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Usuario eliminado exitosamente');
        await loadUsers();
      } else {
        setError(data.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: ''
    });
    setIsEditDialogOpen(true);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#E2372B' }}>
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600 mt-1">
              Administra los usuarios del sistema de administración
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#E2372B' }}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crear un nuevo usuario administrador del sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Nombre de usuario *</Label>
                  <div className="relative mt-2">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Nombre de usuario..."
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ejemplo@nibexinstalacions.com"
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Contraseña segura..."
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Usuarios
            </CardTitle>
            <CardDescription>
              Total: {users.length} usuarios registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Cargando usuarios...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay usuarios registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="hover:shadow-sm transition-shadow border-l-4" style={{ borderLeftColor: '#E2372B' }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <span className="text-sm font-semibold text-slate-600">
                              {user.username === 'admin' ? 'A' : (user.username?.charAt(0).toUpperCase() || 'U')}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-1">
                              <h3 className="font-semibold text-base text-gray-900">
                                {user.username === 'admin' ? 'Administrador' : user.username}
                              </h3>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                <span className="truncate">{user.email || 'Sin email'}</span>
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <Users className="h-4 w-4 mr-1" />
                                <span>
                                  Creado: {new Date(user.created_at).toLocaleDateString('es-ES', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                            className="h-8 px-2 hover:border-gray-300 transition-colors"
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {user.username !== 'admin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:border-red-300 transition-colors"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que quieres eliminar a {user.username}? Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user)}
                                    style={{ backgroundColor: '#E2372B' }}
                                    className="hover:opacity-90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica los datos del usuario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Nombre de usuario *</Label>
                <div className="relative mt-2">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Nombre de usuario..."
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">Email (opcional)</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ejemplo@nibexinstalacions.com"
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-password">Nueva contraseña (opcional)</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Dejar vacío para mantener actual..."
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleEditUser}
                disabled={loading}
                style={{ backgroundColor: '#E2372B' }}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
