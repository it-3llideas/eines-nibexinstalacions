import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { AlertCircle, CheckCircle2, Package, PackageOpen, User, Clock, Plus, Minus, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import PinPad from '../components/PinPad';

interface Operario {
  id: number;
  name: string;
  email: string;
  operario_code: string;
  active: boolean;
}

interface Tool {
  id: number;
  name: string;
  description: string;
  category_id: number;
  type: 'individual' | 'common';
  total_quantity: number;
  available_quantity: number;
  in_use_quantity: number;
  location: string;
}

type ActionType = 'checkout' | 'checkin' | null;
type Step = 'action' | 'operator' | 'pin' | 'tool' | 'quantity' | 'confirm';

export default function EntryExitPanel() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('action');
  const [actionType, setActionType] = useState<ActionType>(null);
  const [selectedOperario, setSelectedOperario] = useState<Operario | null>(null);
  const [pinCode, setPinCode] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [operarios, setOperarios] = useState<Operario[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedToolType, setSelectedToolType] = useState<string | null>(null);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      const response = await fetch('/api/categories');
      if (!response.ok) {
        console.error(`Categories API error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Categories response:', data);
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Error de conexión al cargar categorías');
    }
  };

  // Load operarios, tools and categories
  useEffect(() => {
    loadOperarios();
    loadTools();
    loadCategories();
  }, []);

  // Filter tools based on category, tool type and action type
  useEffect(() => {
    let filtered = tools;

    // Filter by category if selected
    if (selectedCategory !== null) {
      filtered = filtered.filter(tool => tool.category_id === selectedCategory);
    }

    // Filter by tool type if selected
    if (selectedToolType !== null) {
      filtered = filtered.filter(tool => tool.type === selectedToolType);
    }

    // Filter by action type (checkout = available tools, checkin = in-use tools)
    if (actionType === 'checkout') {
      filtered = filtered.filter(tool => tool.available_quantity > 0);
    } else if (actionType === 'checkin') {
      filtered = filtered.filter(tool => tool.in_use_quantity > 0);
    }

    setFilteredTools(filtered);
  }, [tools, selectedCategory, selectedToolType, actionType]);

  const loadOperarios = async () => {
    try {
      console.log('Loading operarios...');
      const response = await fetch('/api/operarios');
      if (!response.ok) {
        console.error(`Operarios API error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Operarios response:', data);
      if (data.success) {
        setOperarios(data.operarios?.filter((op: Operario) => op.active) || []);
      } else {
        console.error('Operarios API returned error:', data.error);
        setError('Error al cargar operarios');
      }
    } catch (error) {
      console.error('Error loading operarios:', error);
      setError('Error de conexión al cargar operarios');
    }
  };

  const loadTools = async () => {
    try {
      console.log('Loading tools...');
      const response = await fetch('/api/inventory/tools');
      if (!response.ok) {
        console.error(`Tools API error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Tools response:', data);
      if (data.success) {
        setTools(data.tools || []);
      } else {
        console.error('Tools API returned error:', data.error);
        setError('Error al cargar herramientas');
      }
    } catch (error) {
      console.error('Error loading tools:', error);
      setError('Error de conexión al cargar herramientas');
    }
  };

  const handleActionSelect = (action: ActionType) => {
    setActionType(action);
    setCurrentStep('operator');
    setError('');
    setSuccess('');
  };

  const handleOperatorSelect = (operario: Operario) => {
    setSelectedOperario(operario);
    setCurrentStep('pin');
    setPinCode('');
  };

  const handlePinSubmit = () => {
    if (!selectedOperario) return;

    if (pinCode === selectedOperario.operario_code) {
      setCurrentStep('tool');
      setError('');
    } else {
      setError('Código incorrecto. Inténtalo de nuevo.');
      setPinCode('');
    }
  };

  const handlePinChange = (code: string) => {
    setPinCode(code);
    if (code.length === 4 && selectedOperario) {
      if (code === selectedOperario.operario_code) {
        setCurrentStep('tool');
        setError('');
      } else {
        setError('Código incorrecto. Inténtalo de nuevo.');
        setPinCode('');
      }
    }
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    setQuantity(1);
    setCurrentStep('quantity');
  };

  const handleQuantityConfirm = () => {
    setCurrentStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedTool || !selectedOperario || !quantity) {
      setError('Faltan datos para completar la operación');
      return;
    }

    setLoading(true);
    try {
      const endpoint = actionType === 'checkout' ? '/api/inventory/checkout' : '/api/inventory/checkin';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolId: selectedTool.id,
          operarioCode: selectedOperario.operario_code,
          quantity: quantity,
          project: 'Panel de Entrada/Salida'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          actionType === 'checkout' 
            ? `Herramienta asignada exitosamente a ${selectedOperario.name}`
            : `Herramienta devuelta exitosamente por ${selectedOperario.name}`
        );
        // Reload tools to update quantities
        await loadTools();
        resetForm();
      } else {
        setError(data.error || 'Error en la operación');
        setLoading(false);
      }
    } catch (error) {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTimeout(() => {
      setCurrentStep('action');
      setActionType(null);
      setSelectedOperario(null);
      setPinCode('');
      setSelectedTool(null);
      setQuantity(1);
      setSelectedCategory(null);
      setSelectedToolType(null);
      setError('');
      setSuccess('');
      setLoading(false);
    }, 5000);
  };

  const goBack = () => {
    switch (currentStep) {
      case 'operator':
        setCurrentStep('action');
        setActionType(null);
        break;
      case 'pin':
        setCurrentStep('operator');
        setSelectedOperario(null);
        setPinCode('');
        break;
      case 'tool':
        setCurrentStep('pin');
        setSelectedTool(null);
        setSelectedCategory(null);
        setSelectedToolType(null);
        setPinCode('');
        break;
      case 'quantity':
        setCurrentStep('tool');
        setQuantity(1);
        break;
      case 'confirm':
        setCurrentStep('quantity');
        break;
    }
  };

  const getMaxQuantity = () => {
    if (!selectedTool) return 0;
    return actionType === 'checkout' ? selectedTool.available_quantity : selectedTool.in_use_quantity;
  };

  // Success screen
  if (success && currentStep === 'action') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-green-200 shadow-xl">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Operación Completada</h2>
            <p className="text-lg text-gray-600 mb-8">{success}</p>
            <Button 
              onClick={() => setSuccess('')}
              className="w-full py-4 text-lg"
              style={{ backgroundColor: '#E2372B' }}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error display
  if (error) {
    setTimeout(() => setError(''), 5000);
  }

  // Main interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Back arrow in top right */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          onClick={() => navigate('/login')}
          className="border-gray-300 p-2"
          size="sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Action Selection */}
        {currentStep === 'action' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-5xl">PANEL DE HERRAMIENTAS</CardTitle>
                <CardDescription className="text-xl">Selecciona la acción que deseas realizar</CardDescription>
              </CardHeader>
              <CardContent className="p-12">
                <div className="grid md:grid-cols-2 gap-10">
                  <Card 
                    className="cursor-pointer transition-all duration-300 hover:shadow-lg border-2 hover:border-red-300 group"
                    onClick={() => handleActionSelect('checkout')}
                  >
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-red-200 transition-colors">
                        <PackageOpen className="h-12 w-12 text-red-600" />
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-4">Coger Herramienta</h3>
                      <p className="text-xl text-gray-600">Asignar herramientas a un operario</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer transition-all duration-300 hover:shadow-lg border-2 hover:border-green-300 group"
                    onClick={() => handleActionSelect('checkin')}
                  >
                    <CardContent className="p-12 text-center">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-green-200 transition-colors">
                        <Package className="h-12 w-12 text-green-600" />
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-4">Devolver Herramienta</h3>
                      <p className="text-xl text-gray-600">Registrar la devolución de herramientas</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Operator Selection */}
        {currentStep === 'operator' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <User className="h-7 w-7" />
                  Seleccionar Operario
                </CardTitle>
                <CardDescription className="text-xl">
                  {actionType === 'checkout' ? 'A quién se asignará la herramienta' : 'Quién está devolviendo la herramienta'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <div className="grid gap-8">
                  {operarios.map((operario) => (
                    <Card
                      key={operario.id}
                      className="cursor-pointer transition-all duration-300 hover:shadow-md border hover:border-red-300"
                      onClick={() => handleOperatorSelect(operario)}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-center space-x-6">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="text-xl font-medium text-gray-900">{operario.name}</h4>
                            <p className="text-lg text-gray-500">{operario.email}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <Button variant="outline" onClick={goBack} className="py-4 px-8 text-xl">
                    <ArrowLeft className="h-6 w-6 mr-2" />
                    Volver
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: PIN Verification */}
        {currentStep === 'pin' && selectedOperario && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Verificación de Identidad</CardTitle>
                <CardDescription className="text-xl">
                  Hola {selectedOperario.name}, introduce tu código de acceso
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <div className="max-w-md mx-auto">
                  <PinPad
                    value={pinCode}
                    onChange={handlePinChange}
                    maxLength={4}
                  />
                  
                  <div className="mt-10 flex gap-6 justify-center">
                    <Button variant="outline" onClick={goBack} className="py-4 px-8 text-xl">
                      <ArrowLeft className="h-6 w-6 mr-2" />
                      Volver
                    </Button>
                    <Button
                      onClick={handlePinSubmit}
                      disabled={pinCode.length !== 4}
                      className="py-4 px-8 text-xl"
                      style={{ backgroundColor: '#E2372B' }}
                    >
                      Verificar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Tool Selection */}
        {currentStep === 'tool' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">
                  {actionType === 'checkout' ? 'Seleccionar Herramienta para Coger' : 'Seleccionar Herramienta para Devolver'}
                </CardTitle>
                <CardDescription className="text-xl">
                  Operario: {selectedOperario?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                {/* Filters */}
                <div className="flex gap-8 mb-10">
                  <div className="flex-1 max-w-md">
                    <Select
                      value={selectedCategory?.toString() || "all"}
                      onValueChange={(value) => setSelectedCategory(value === "all" ? null : parseInt(value))}
                    >
                      <SelectTrigger className="border-2 h-14 text-xl" style={{ borderColor: '#E2372B' }}>
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
                  </div>
                  
                  <div className="flex-1 max-w-md">
                    <Select
                      value={selectedToolType || "all"}
                      onValueChange={(value) => setSelectedToolType(value === "all" ? null : value)}
                    >
                      <SelectTrigger className="border-2 h-14 text-xl" style={{ borderColor: '#E2372B' }}>
                        <SelectValue placeholder="Tipo de herramienta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="common">Común</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tools list */}
                <div className="grid gap-8">
                  {filteredTools.map((tool) => (
                    <Card
                      key={tool.id}
                      className="cursor-pointer border-2 border-gray-200 hover:border-red-300 transition-all duration-300"
                      onClick={() => handleToolSelect(tool)}
                    >
                      <CardContent className="p-8">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800">{tool.name}</h3>
                            {tool.description && (
                              <p className="text-lg text-gray-600 mt-2">{tool.description}</p>
                            )}
                            <p className="text-lg text-gray-500 mt-2">
                              Ubicación: {tool.location}
                            </p>
                          </div>

                          <div className="flex justify-between items-center">
                            <Badge
                              variant="outline"
                              className="border-2 text-base px-3 py-1"
                              style={{
                                borderColor: tool.type === 'individual' ? '#E2372B' : '#6b7280',
                                color: tool.type === 'individual' ? '#E2372B' : '#6b7280'
                              }}
                            >
                              {tool.type === 'individual' ? 'Individual' : 'Común'}
                            </Badge>

                            {actionType === 'checkout' ? (
                              <Badge
                                variant="outline"
                                className="border-2 flex items-center gap-2 text-base px-3 py-1"
                                style={{
                                  borderColor: tool.available_quantity > 0 ? '#10b981' : '#ef4444',
                                  color: tool.available_quantity > 0 ? '#10b981' : '#ef4444',
                                  backgroundColor: 'transparent'
                                }}
                              >
                                Disponible: {tool.available_quantity} / {tool.total_quantity}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-2 flex items-center gap-2 text-base px-3 py-1"
                                style={{
                                  borderColor: tool.in_use_quantity > 0 ? '#f59e0b' : '#6b7280',
                                  color: tool.in_use_quantity > 0 ? '#f59e0b' : '#6b7280',
                                  backgroundColor: 'transparent'
                                }}
                              >
                                <Clock className="h-5 w-5" />
                                En uso: {tool.in_use_quantity} / {tool.total_quantity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredTools.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-xl text-gray-500">
                      {actionType === 'checkout'
                        ? 'No hay herramientas disponibles'
                        : 'No hay herramientas en uso'
                      }
                    </p>
                    <p className="text-gray-400 mt-2">
                      {selectedCategory !== null && 'Intenta con otra categoría'}
                    </p>
                  </div>
                )}

                <div className="mt-8 text-center">
                  <Button variant="outline" onClick={goBack} className="py-3 px-6 text-lg">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Volver
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Quantity Selection */}
        {currentStep === 'quantity' && selectedTool && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Seleccionar Cantidad</CardTitle>
                <CardDescription className="text-xl">
                  {selectedTool.name} - {selectedOperario?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <div className="max-w-lg mx-auto">
                  {/* Current quantity display */}
                  <div className="text-center mb-10">
                    <div
                      className="w-40 h-40 rounded-full flex items-center justify-center text-6xl font-bold text-white mx-auto mb-8"
                      style={{ backgroundColor: '#E2372B' }}
                    >
                      {quantity}
                    </div>
                    <p className="text-xl text-gray-600">
                      Máximo: {getMaxQuantity()}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-center gap-8 mb-10">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-20 h-20 p-0"
                    >
                      <Minus className="h-8 w-8" />
                    </Button>

                    <Input
                      type="number"
                      min="1"
                      max={getMaxQuantity()}
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setQuantity(Math.min(Math.max(1, value), getMaxQuantity()));
                      }}
                      className="w-32 text-center text-3xl font-bold h-20"
                    />
                    
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setQuantity(Math.min(getMaxQuantity(), quantity + 1))}
                      disabled={quantity >= getMaxQuantity()}
                      className="w-16 h-16 p-0"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Quick quantity buttons */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1, 5, 10].filter(num => num <= getMaxQuantity()).map((num) => (
                      <Button
                        key={num}
                        variant={quantity === num ? "default" : "outline"}
                        onClick={() => setQuantity(num)}
                        className="py-3 text-lg"
                        style={quantity === num ? { backgroundColor: '#E2372B' } : {}}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={goBack} className="flex-1 py-3 text-lg">
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Volver
                    </Button>
                    <Button 
                      onClick={handleQuantityConfirm}
                      className="flex-1 py-3 text-lg"
                      style={{ backgroundColor: '#E2372B' }}
                    >
                      Continuar
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 6: Confirmation */}
        {currentStep === 'confirm' && selectedTool && selectedOperario && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">
                  Confirmar {actionType === 'checkout' ? 'Asignación' : 'Devolución'}
                </CardTitle>
                <CardDescription className="text-lg">
                  Revisa los detalles antes de confirmar
                </CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <div className="max-w-3xl mx-auto">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-8 mb-10">
                    <div className="space-y-6">
                      {/* Operation Type */}
                      <div className="text-center pb-4 border-b border-gray-200">
                        <span className="text-gray-600 text-lg block mb-2">Operación:</span>
                        <span className="font-bold text-2xl text-gray-900">
                          {actionType === 'checkout' ? 'Coger Herramienta' : 'Devolver Herramienta'}
                        </span>
                      </div>

                      {/* Main Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <span className="text-gray-600 text-base block mb-1">Operario:</span>
                            <span className="font-bold text-xl text-gray-900">{selectedOperario.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 text-base block mb-1">Ubicación:</span>
                            <span className="font-bold text-xl text-gray-900">{selectedTool.location}</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <span className="text-gray-600 text-base block mb-1">Herramienta:</span>
                            <span className="font-bold text-xl text-gray-900">{selectedTool.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 text-base block mb-1">Cantidad:</span>
                            <span className="font-bold text-3xl" style={{ color: '#E2372B' }}>{quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={goBack} className="flex-1 py-4 text-lg">
                      <ArrowLeft className="h-5 w-5 mr-2" />
                      Volver
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 py-4 text-lg"
                      style={{ backgroundColor: loading ? '#ccc' : '#E2372B' }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        `Confirmar ${actionType === 'checkout' ? 'Asignación' : 'Devolución'}`
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
