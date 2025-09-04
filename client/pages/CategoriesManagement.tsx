import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  Package,
  Package2,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  description: string;
  type: 'individual' | 'common';
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryStats extends Category {
  tool_count: number;
  total_quantity: number;
  available_quantity: number;
  in_use_quantity: number;
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'individual' as 'individual' | 'common',
    color: '#E2372B'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadCategories = async () => {
    setLoading(true);
    setMessage(null); // Clear previous messages
    try {
      const response = await fetch('/api/categories/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Expected array but got:', data);
        setMessage({ type: 'error', text: 'Formato de datos incorrecto' });
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setMessage({ type: 'error', text: 'Error al cargar categorías' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'El nombre es requerido' });
      return;
    }

    setLoading(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        resetForm();
        loadCategories();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: CategoryStats) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      type: category.type,
      color: category.color
    });
    setShowForm(true);
  };

  const handleDelete = async (category: CategoryStats) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        loadCategories();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'individual',
      color: '#E2372B'
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const individualCategories = categories.filter(cat => cat.type === 'individual');
  const commonCategories = categories.filter(cat => cat.type === 'common');

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Gestión de Categorías
            </h1>
            <p className="text-slate-600 mt-2">
              Crear y gestionar categorías para organizar las herramientas
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            style={{ backgroundColor: '#E2372B', borderColor: '#E2372B' }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-8 h-8 p-1 hover:bg-slate-50"
                    >
                      <div
                        className="w-full h-full rounded"
                        style={{ backgroundColor: formData.color }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Seleccionar Color</h4>
                      <div className="grid grid-cols-7 gap-1">
                        {[
                          '#E2372B', // NIBEX Red
                          '#DC2626', // Red
                          '#EA580C', // Orange
                          '#D97706', // Amber
                          '#EAB308', // Yellow
                          '#65A30D', // Lime
                          '#16A34A', // Green
                          '#059669', // Emerald
                          '#0D9488', // Teal
                          '#0891B2', // Cyan
                          '#0284C7', // Sky
                          '#2563EB', // Blue
                          '#4F46E5', // Indigo
                          '#7C3AED', // Violet
                          '#9333EA', // Purple
                          '#C026D3', // Fuchsia
                          '#EC4899', // Pink
                          '#EF4444', // Rose
                          '#F97316', // Orange Alt
                          '#84CC16', // Lime Alt
                          '#10B981', // Emerald Alt
                          '#06B6D4', // Cyan Alt
                          '#3B82F6', // Blue Alt
                          '#8B5CF6', // Violet Alt
                          '#F472B6', // Pink Alt
                          '#6B7280', // Gray
                          '#374151', // Gray Dark
                          '#111827'  // Black
                        ].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({...formData, color})}
                            className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                              formData.color === color ? 'border-slate-800 shadow-lg' : 'border-slate-300'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nombre de la categoría"
                      className="h-10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'individual' | 'common'})}
                      className="w-full p-2 border rounded-md h-10"
                      required
                    >
                      <option value="individual">Individual (H.I.)</option>
                      <option value="common">Común (H.C.)</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    style={{ backgroundColor: '#E2372B', borderColor: '#E2372B' }}
                  >
                    {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Categories Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Individual Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" style={{ color: '#E2372B' }} />
                Herramientas Individuales (H.I.)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {individualCategories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <h3 className="font-semibold text-slate-900">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(category)}
                          disabled={category.tool_count > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Herramientas:</span>
                        <div className="font-medium">{category.tool_count}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Total:</span>
                        <div className="font-medium">{category.total_quantity}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Disponible:</span>
                        <div className="font-medium text-green-600">{category.available_quantity}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {individualCategories.length === 0 && (
                  <div className="text-center py-8">
                    <Tag className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">No hay categorías individuales</p>
                    <p className="text-sm text-slate-500">Crea la primera categoría para herramientas individuales</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Common Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" style={{ color: '#E2372B' }} />
                Herramientas Comunes (H.C.)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commonCategories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <h3 className="font-semibold text-slate-900">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(category)}
                          disabled={category.tool_count > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Herramientas:</span>
                        <div className="font-medium">{category.tool_count}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Total:</span>
                        <div className="font-medium">{category.total_quantity}</div>
                      </div>
                      <div>
                        <span className="text-slate-600">Disponible:</span>
                        <div className="font-medium text-green-600">{category.available_quantity}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {commonCategories.length === 0 && (
                  <div className="text-center py-8">
                    <Tag className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">No hay categorías comunes</p>
                    <p className="text-sm text-slate-500">Crea la primera categoría para herramientas comunes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            message.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'error' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              {message.text}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
