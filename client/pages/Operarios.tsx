import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { AlertCircle, Plus, Edit, Trash2, RefreshCw, Users, User, Mail, Eye, EyeOff } from 'lucide-react';
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

interface Operario {
  id: number;
  name: string;
  email: string;
  operario_code: string;
  active: boolean;
  created_at: string;
}

export default function Operarios() {
  const [operarios, setOperarios] = useState<Operario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visibleCodes, setVisibleCodes] = useState<Set<number>>(new Set());

  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOperario, setEditingOperario] = useState<Operario | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    loadOperarios();
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadOperarios = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const response = await fetch('/api/operarios');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Operarios API response:', data);

      if (data.success) {
        setOperarios(data.operarios || []);
      } else {
        setError('Error al cargar operarios');
      }
    } catch (error) {
      console.error('Error loading operarios:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOperario = async () => {
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/operarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Operario creado exitosamente. Código: ${data.operario.operario_code}`);
        setIsCreateDialogOpen(false);
        setFormData({ name: '', email: '' });
        await loadOperarios();
      } else {
        setError(data.error || 'Error al crear operario');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOperario = async () => {
    if (!editingOperario || !formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/operarios/${editingOperario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          active: editingOperario.active
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Operario actualizado exitosamente');
        setIsEditDialogOpen(false);
        setEditingOperario(null);
        setFormData({ name: '', email: '' });
        await loadOperarios();
      } else {
        setError(data.error || 'Error al actualizar operario');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOperario = async (operario: Operario) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/operarios/${operario.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        await loadOperarios();
      } else {
        setError(data.error || 'Error al eliminar operario');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async (operario: Operario) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/operarios/${operario.id}/regenerate-code`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Nuevo código generado: ${data.operario_code}`);
        await loadOperarios();
      } else {
        setError(data.error || 'Error al regenerar código');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (operario: Operario) => {
    setEditingOperario(operario);
    setFormData({
      name: operario.name,
      email: operario.email || ''
    });
    setIsEditDialogOpen(true);
  };

  const toggleCodeVisibility = (operarioId: number) => {
    const newVisibleCodes = new Set(visibleCodes);
    if (newVisibleCodes.has(operarioId)) {
      newVisibleCodes.delete(operarioId);
    } else {
      newVisibleCodes.add(operarioId);
    }
    setVisibleCodes(newVisibleCodes);
  };


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#E2372B' }}>
              Gestión de Operarios
            </h1>
            <p className="text-gray-600 mt-1">
              Administra los operarios y sus códigos de acceso
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#E2372B' }}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Operario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Operario</DialogTitle>
                <DialogDescription>
                  Se generará automáticamente un código único de 4 dígitos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre completo *</Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre completo del operario..."
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
                      placeholder="Email del operario..."
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateOperario} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Operario'}
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
              Lista de Operarios
            </CardTitle>
            <CardDescription>
              Total: {operarios.length} operarios registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando operarios...</div>
            ) : operarios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay operarios registrados. Crea el primero usando el botón "Nuevo Operario".
              </div>
            ) : (
              <div className="space-y-2">
                {operarios.map((operario) => (
                  <Card key={operario.id} className="hover:shadow-sm transition-shadow border-l-4" style={{ borderLeftColor: '#E2372B' }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center space-x-1">
                              <h3 className="font-semibold text-base text-gray-900">{operario.name}</h3>
                              <div className="flex items-center">
                                <button
                                  onClick={() => toggleCodeVisibility(operario.id)}
                                  className="flex items-center px-2 py-1 hover:bg-gray-100 rounded transition-colors text-sm text-gray-600"
                                  title={visibleCodes.has(operario.id) ? "Ocultar código" : "Ver código"}
                                >
                                  {visibleCodes.has(operario.id) ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-1" />
                                      Ocultar
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Ver código
                                    </>
                                  )}
                                </button>
                                {visibleCodes.has(operario.id) && (
                                  <span className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                    {operario.operario_code}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              {operario.email ? (
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                  <span className="truncate">{operario.email}</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-gray-400">
                                  <Mail className="h-4 w-4 mr-1" />
                                  <span>Sin email</span>
                                </div>
                              )}
                              <div className="flex items-center text-xs text-gray-500">
                                <Users className="h-4 w-4 mr-1" />
                                <span>
                                  Registrado: {new Date(operario.created_at).toLocaleDateString('es-ES', {
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
                            onClick={() => openEditDialog(operario)}
                            className="h-8 px-2 hover:border-gray-300 transition-colors"
                            title="Editar operario"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRegenerateCode(operario)}
                            className="h-8 px-2 hover:border-gray-300 transition-colors"
                            title="Regenerar código"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:border-red-300 transition-colors"
                                title="Eliminar operario"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar operario?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que quieres eliminar a {operario.name}?
                                  {operario.active && ' Si tiene transacciones, se desactivará en lugar de eliminarse.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteOperario(operario)}
                                  style={{ backgroundColor: '#E2372B' }}
                                  className="hover:opacity-90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
              <DialogTitle>Editar Operario</DialogTitle>
              <DialogDescription>
                Modifica los datos del operario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre completo *</Label>
                <div className="relative mt-0.5">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre completo del operario..."
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">Email (opcional)</Label>
                <div className="relative mt-0.5">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email del operario..."
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditOperario} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
