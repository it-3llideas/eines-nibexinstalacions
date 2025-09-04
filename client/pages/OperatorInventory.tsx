import OperatorLayout from "@/components/OperatorLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { 
  User, 
  Package, 
  ShoppingCart,
  Minus,
  Plus,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

interface Tool {
  id: number;
  name: string;
  description: string;
  category: 'individual' | 'common';
  subcategory: string;
  available_quantity: number;
  unit_cost: number;
  location: string;
}

interface SelectedTool {
  tool: Tool;
  quantity: number;
}

export default function OperatorInventory() {
  const [operarioCode, setOperarioCode] = useState('');
  const [operarioData, setOperarioData] = useState<any>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTools, setSelectedTools] = useState<SelectedTool[]>([]);
  const [project, setProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const authenticateOperario = async () => {
    if (!operarioCode.trim()) return;
    
    setAuthenticating(true);
    try {
      const response = await fetch('/api/inventory/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operarioCode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOperarioData(data.operario);
        loadAvailableTools();
        setMessage({ type: 'success', text: `Bienvenido, ${data.operario.name}` });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setAuthenticating(false);
    }
  };

  const loadAvailableTools = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/available');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTools(data);
      } else {
        setMessage({ type: 'error', text: 'Error al cargar herramientas' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const addToSelection = (tool: Tool) => {
    const existing = selectedTools.find(st => st.tool.id === tool.id);
    if (existing) {
      if (existing.quantity < tool.available_quantity) {
        setSelectedTools(selectedTools.map(st => 
          st.tool.id === tool.id 
            ? { ...st, quantity: st.quantity + 1 }
            : st
        ));
      }
    } else {
      setSelectedTools([...selectedTools, { tool, quantity: 1 }]);
    }
  };

  const removeFromSelection = (toolId: number) => {
    setSelectedTools(selectedTools.filter(st => st.tool.id !== toolId));
  };

  const updateQuantity = (toolId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromSelection(toolId);
      return;
    }
    
    const tool = tools.find(t => t.id === toolId);
    if (tool && newQuantity <= tool.available_quantity) {
      setSelectedTools(selectedTools.map(st => 
        st.tool.id === toolId 
          ? { ...st, quantity: newQuantity }
          : st
      ));
    }
  };

  const processCheckout = async () => {
    if (selectedTools.length === 0) return;
    
    setLoading(true);
    try {
      for (const selectedTool of selectedTools) {
        const response = await fetch('/api/inventory/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolId: selectedTool.tool.id,
            operarioCode: operarioCode,
            quantity: selectedTool.quantity,
            project: project || null
          })
        });
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error);
        }
      }
      
      setMessage({ 
        type: 'success', 
        text: `${selectedTools.length} herramienta(s) asignada(s) correctamente` 
      });
      setSelectedTools([]);
      setProject('');
      loadAvailableTools(); // Refresh inventory
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Error al procesar asignación' });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setOperarioData(null);
    setOperarioCode('');
    setSelectedTools([]);
    setTools([]);
    setProject('');
    setMessage(null);
  };

  if (!operarioData) {
    return (
      <OperatorLayout>
        <div className="max-w-md mx-auto mt-16">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#f5e5e4' }}>
                <User className="h-8 w-8" style={{ color: '#E2372B' }} />
              </div>
              <CardTitle className="text-2xl">Acceso de Operario</CardTitle>
              <p className="text-slate-600">Introduce tu código de operario</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input 
                  placeholder="Código de operario (ej: OP001)"
                  value={operarioCode}
                  onChange={(e) => setOperarioCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && authenticateOperario()}
                />
              </div>
              
              <Button 
                onClick={authenticateOperario}
                disabled={!operarioCode.trim() || authenticating}
                className="w-full"
                size="lg"
              >
                {authenticating ? 'Verificando...' : 'Acceder'}
              </Button>
              
              {message && (
                <div className={`p-3 rounded ${
                  message.type === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message.text}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout>
      <div className="space-y-6">
        {/* Header with operator info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Inventario de Herramientas
            </h1>
            <p className="text-slate-600">
              Operario: <span className="font-medium">{operarioData.name}</span> ({operarioData.operario_code})
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadAvailableTools} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Cart Summary */}
        {selectedTools.length > 0 && (
          <Card style={{ backgroundColor: '#f5e5e4', borderColor: '#E2372B' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#E2372B' }}>
                <ShoppingCart className="h-5 w-5" />
                Herramientas Seleccionadas ({selectedTools.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {selectedTools.map(({ tool, quantity }) => (
                  <div key={tool.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-slate-600">{tool.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateQuantity(tool.id, quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{quantity}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateQuantity(tool.id, quantity + 1)}
                        disabled={quantity >= tool.available_quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => removeFromSelection(tool.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <Input 
                  placeholder="Proyecto (opcional)"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                />
                <Button
                  onClick={processCheckout}
                  disabled={loading || selectedTools.length === 0}
                  className="w-full"
                  size="lg"
                  style={{ backgroundColor: '#E2372B', borderColor: '#E2372B' }}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirmar Asignación
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Tools Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const selected = selectedTools.find(st => st.tool.id === tool.id);
            const isSelected = !!selected;
            
            return (
              <Card
                key={tool.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 bg-red-50' : ''
                }`}
                style={isSelected ? { ringColor: '#E2372B' } : {}}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">{tool.name}</h3>
                      {tool.description && (
                        <p className="text-sm text-slate-600 mb-2">{tool.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant={tool.category === 'individual' ? 'default' : 'secondary'}>
                          {tool.category === 'individual' ? 'H.I.' : 'H.C.'}
                        </Badge>
                        {tool.subcategory && (
                          <Badge variant="outline" className="text-xs">
                            {tool.subcategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Disponible:</span>
                      <span className={`font-bold ${
                        tool.available_quantity > 5 ? 'text-green-600' :
                        tool.available_quantity > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {tool.available_quantity} unidades
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Ubicación:</span>
                      <span>{tool.location}</span>
                    </div>
                    
                    {isSelected ? (
                      <div className="text-center">
                        <div className="text-sm font-medium mb-2" style={{ color: '#E2372B' }}>
                          {selected.quantity} seleccionada(s)
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeFromSelection(tool.id)}
                          className="w-full"
                        >
                          Quitar Selección
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => addToSelection(tool)}
                        disabled={tool.available_quantity === 0}
                        className="w-full"
                        size="sm"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        {tool.available_quantity === 0 ? 'Sin Stock' : 'Seleccionar'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {tools.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No hay herramientas disponibles
              </h3>
              <p className="text-slate-600">
                Contacta con el administrador para añadir herramientas al inventario
              </p>
            </CardContent>
          </Card>
        )}

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
    </OperatorLayout>
  );
}
