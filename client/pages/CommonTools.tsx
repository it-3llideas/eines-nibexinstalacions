import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, Plus, Edit, Trash2, Package2, Search, Filter, Users, Wrench, Tag, FileText, Hash, MapPin, TrendingDown } from 'lucide-react';
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

interface Tool {
  id: number;
  name: string;
  description: string;
  category_id: number;
  type: 'individual' | 'common';
  total_quantity: number;
  available_quantity: number;
  in_use_quantity: number;
  maintenance_quantity: number;
  unit_cost: number;
  location: string;
  minimum_stock: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  type: 'individual' | 'common';
  color: string;
  active: boolean;
}

export default function CommonTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    total_quantity: 1,
    location: 'Almacén Central',
    minimum_stock: 1
  });

  useEffect(() => {
    loadTools();
    loadCategories();
  }, []);

  useEffect(() => {
    filterTools();
  }, [tools, searchTerm, selectedCategory, statusFilter]);

  const loadTools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/tools');
      const data = await response.json();
      
      if (data.success) {
        // Filter only common tools
        const commonTools = data.tools.filter((tool: Tool) => tool.type === 'common');
        setTools(commonTools);
      } else {
        setError('Error al cargar herramientas');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories/type/common');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Categories API response:', data);

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Expected array but got:', data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterTools = () => {
    let filtered = [...tools];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category_id.toString() === selectedCategory);
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'available':
          filtered = filtered.filter(tool => tool.available_quantity > 0);
          break;
        case 'in_use':
          filtered = filtered.filter(tool => tool.in_use_quantity > 0);
          break;
        case 'maintenance':
          filtered = filtered.filter(tool => tool.maintenance_quantity > 0);
          break;
        case 'low_stock':
          filtered = filtered.filter(tool => tool.total_quantity <= tool.minimum_stock);
          break;
      }
    }

    setFilteredTools(filtered);
  };

  const handleCreateTool = async () => {
    if (!formData.name.trim() || !formData.category_id) {
      setError('Nombre y categoría son requeridos');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: 'common',
          category_id: parseInt(formData.category_id),
          total_quantity: formData.total_quantity,
          unit_cost: 0,
          notes: ''
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Herramienta común creada exitosamente');
        setIsCreateDialogOpen(false);
        resetForm();
        await loadTools();
      } else {
        setError(data.error || 'Error al crear herramienta');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTool = async () => {
    if (!editingTool || !formData.name.trim() || !formData.category_id) {
      setError('Nombre y categoría son requeridos');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/tools/${editingTool.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id),
          total_quantity: formData.total_quantity || 1,
          unit_cost: 0,
          notes: ''
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Herramienta actualizada exitosamente');
        setIsEditDialogOpen(false);
        setEditingTool(null);
        resetForm();
        await loadTools();
      } else {
        setError(data.error || 'Error al actualizar herramienta');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTool = async (tool: Tool) => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors

      const response = await fetch(`/api/inventory/tools/${tool.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || `Error ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Herramienta eliminada exitosamente');
        await loadTools();
      } else {
        setError(data.error || 'Error al eliminar herramienta');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(`Error de conexión: ${error.message || 'No se pudo conectar con el servidor'}`);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description || '',
      category_id: tool.category_id.toString(),
      total_quantity: tool.total_quantity,
      location: tool.location || 'Almacén Central',
      minimum_stock: tool.minimum_stock || 1
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      total_quantity: 1,
      location: 'Almacén Central',
      minimum_stock: 1
    });
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  const getCategoryColor = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#E2372B';
  };

  const getStatusBadge = (tool: Tool) => {
    if (tool.available_quantity === 0) {
      return <Badge variant="secondary">Agotado</Badge>;
    }
    if (tool.available_quantity > 0) {
      return <Badge variant="default">Disponible</Badge>;
    }
    return null;
  };

  const getUsagePercentage = (tool: Tool) => {
    if (tool.total_quantity === 0) return 0;
    return Math.round((tool.in_use_quantity / tool.total_quantity) * 100);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#E2372B' }}>
              Herramientas Comunes
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona herramientas de uso compartido disponibles para todos los operarios
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: '#E2372B' }}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Herramienta Común
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nueva Herramienta Común</DialogTitle>
                <DialogDescription>
                  Agrega una nueva herramienta de uso compartido
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <div className="relative">
                    <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nombre de la herramienta..."
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Categoría *</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger className="pl-10 h-11 rounded-lg">
                        <SelectValue placeholder="Seleccionar categoría..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción detallada de la herramienta..."
                      rows={3}
                      className="pl-10 rounded-lg resize-none"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ubicación del almacén..."
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="total_quantity">Stock</Label>
                  <div className="relative">
                    <TrendingDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="total_quantity"
                      type="number"
                      min="1"
                      value={formData.total_quantity}
                      onChange={(e) => setFormData({ ...formData, total_quantity: parseInt(e.target.value) || 1 })}
                      placeholder="Cantidad total..."
                      className="pl-10 h-11 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTool} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Herramienta'}
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar herramientas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="available">Disponibles</SelectItem>
                  <SelectItem value="in_use">En uso</SelectItem>
                  <SelectItem value="maintenance">En mantenimiento</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-500 flex items-center">
                Total: {filteredTools.length} herramientas
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tools List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              Lista de Herramientas Comunes
            </CardTitle>
            <CardDescription>
              Herramientas disponibles para uso compartido entre operarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando herramientas...</div>
            ) : filteredTools.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron herramientas comunes.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTools.map((tool) => (
                  <Card key={tool.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">{tool.name}</h3>
                            <Badge 
                              style={{ backgroundColor: getCategoryColor(tool.category_id) }}
                              className="text-white"
                            >
                              {getCategoryName(tool.category_id)}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Común
                            </Badge>
                            {getStatusBadge(tool)}
                          </div>
                          
                          {tool.description && (
                            <p className="text-gray-600 mb-3">{tool.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 mb-3 text-sm">
                            <span className="text-gray-600">Total: <span className="font-bold text-gray-900">{tool.total_quantity}</span></span>
                            <span className="text-gray-600">Disponible: <span className="font-bold text-green-600">{tool.available_quantity}</span></span>
                            <span className="text-gray-600">En uso: <span className="font-bold text-blue-600">{tool.in_use_quantity}</span></span>
                            <span className="text-gray-600">Uso: <span className="font-bold text-purple-600">{getUsagePercentage(tool)}%</span></span>
                          </div>

                          {/* Usage Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Uso de herramientas</span>
                              <span>{tool.in_use_quantity}/{tool.total_quantity}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${getUsagePercentage(tool)}%`,
                                  backgroundColor: getUsagePercentage(tool) > 80 ? '#dc2626' : getUsagePercentage(tool) > 60 ? '#f59e0b' : '#10b981'
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            Ubicación: {tool.location} | Stock: {tool.total_quantity}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(tool)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar herramienta común?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que quieres eliminar "{tool.name}"? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTool(tool)}
                                  className="bg-red-600 hover:bg-red-700"
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

        {/* Edit Dialog - Same as create dialog but for editing */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Herramienta Común</DialogTitle>
              <DialogDescription>
                Modifica los datos de la herramienta común
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre *</Label>
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre de la herramienta..."
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-category">Categoría *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger className="pl-10 h-11 rounded-lg">
                      <SelectValue placeholder="Seleccionar categoría..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción detallada de la herramienta..."
                    rows={3}
                    className="pl-10 rounded-lg resize-none"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-location">Ubicación</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ubicación del almacén..."
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-total_quantity">Stock</Label>
                <div className="relative">
                  <TrendingDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="edit-total_quantity"
                    type="number"
                    min="1"
                    value={formData.total_quantity}
                    onChange={(e) => setFormData({ ...formData, total_quantity: parseInt(e.target.value) || 1 })}
                    placeholder="Cantidad total..."
                    className="pl-10 h-11 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditTool} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
