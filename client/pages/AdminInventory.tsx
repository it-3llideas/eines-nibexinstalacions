import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Edit,
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  Package2,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";

interface Tool {
  id: number;
  name: string;
  description: string;
  category: 'individual' | 'common';
  subcategory: string;
  total_quantity: number;
  available_quantity: number;
  in_use_quantity: number;
  maintenance_quantity: number;
  unit_cost: number;
  location: string;
  minimum_stock: number;
  notes: string;
}

interface Transaction {
  id: number;
  type: string;
  tool: string;
  operario: string;
  operarioEmail: string;
  quantity: number;
  timestamp: string;
  project: string;
  stockChange: string;
}

interface Stats {
  totalToolTypes: number;
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity: number;
  maintenanceQuantity: number;
  lowStockTools: number;
  activeOperarios: number;
}

export default function AdminInventory() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    category: 'individual' as 'individual' | 'common',
    subcategory: '',
    quantity: 1,
    unitCost: 0,
    location: 'Almacén Central'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTools(),
        loadStats(),
        loadTransactions()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTools = async () => {
    try {
      const response = await fetch('/api/inventory/tools');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTools(data);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/inventory/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default stats to prevent blank screen
      setStats({
        totalToolTypes: 0,
        totalQuantity: 0,
        availableQuantity: 0,
        inUseQuantity: 0,
        maintenanceQuantity: 0,
        lowStockTools: 0,
        activeOperarios: 0
      });
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/inventory/transactions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.warn('Transactions data is not an array:', data);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    }
  };

  const addNewTool = async () => {
    if (!newTool.name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTool)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewTool({
          name: '',
          description: '',
          category: 'individual',
          subcategory: '',
          quantity: 1,
          unitCost: 0,
          location: 'Almacén Central'
        });
        setShowAddForm(false);
        loadData(); // Refresh all data
      } else {
        alert(data.error || 'Error al añadir herramienta');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Cargando inventario...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">

        {/* Tool Categories Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Herramientas Individuales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#E2372B' }}>
                <Package className="h-5 w-5" />
                Herramientas Individuales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {tools.filter(t => t.category === 'individual').reduce((sum, t) => sum + t.in_use_quantity, 0)}
                  </div>
                  <div className="text-sm text-gray-600">En Uso</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {tools.filter(t => t.category === 'individual').reduce((sum, t) => sum + t.available_quantity, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Devueltas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Herramientas Comunes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: '#E2372B' }}>
                <Package2 className="h-5 w-5" />
                Herramientas Comunes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {tools.filter(t => t.category === 'common').reduce((sum, t) => sum + t.in_use_quantity, 0)}
                  </div>
                  <div className="text-sm text-gray-600">En Uso</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {tools.filter(t => t.category === 'common').reduce((sum, t) => sum + t.available_quantity, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Devueltas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Tool Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Añadir Nueva Herramienta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre *</label>
                  <Input
                    value={newTool.name}
                    onChange={(e) => setNewTool({...newTool, name: e.target.value})}
                    placeholder="Nombre de la herramienta"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Categoría *</label>
                  <select
                    value={newTool.category}
                    onChange={(e) => setNewTool({...newTool, category: e.target.value as 'individual' | 'common'})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="individual">Individual (H.I.)</option>
                    <option value="common">Común (H.C.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subcategoría</label>
                  <Input
                    value={newTool.subcategory}
                    onChange={(e) => setNewTool({...newTool, subcategory: e.target.value})}
                    placeholder="Ej: Taladros, Medición, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cantidad *</label>
                  <Input
                    type="number"
                    min="1"
                    value={newTool.quantity}
                    onChange={(e) => setNewTool({...newTool, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Coste Unitario (€)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTool.unitCost}
                    onChange={(e) => setNewTool({...newTool, unitCost: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ubicación</label>
                  <Input
                    value={newTool.location}
                    onChange={(e) => setNewTool({...newTool, location: e.target.value})}
                    placeholder="Ubicación física"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={newTool.description}
                  onChange={(e) => setNewTool({...newTool, description: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Descripción detallada de la herramienta"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={addNewTool} disabled={loading || !newTool.name.trim()}>
                  Añadir Herramienta
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Log - Registro de Herramientas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Registro de Herramientas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 20).map((transaction) => {
                const formatDate = (timestamp: string) => {
                  try {
                    // Handle various timestamp formats
                    let date;
                    if (timestamp && timestamp !== 'undefined' && timestamp !== 'null') {
                      date = new Date(timestamp);
                      if (isNaN(date.getTime())) {
                        // Try parsing as ISO string or other formats
                        date = new Date();
                      }
                    } else {
                      date = new Date();
                    }

                    return {
                      date: date.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }),
                      time: date.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    };
                  } catch (error) {
                    console.error('Error formatting date:', error, 'for timestamp:', timestamp);
                    return {
                      date: 'Fecha inválida',
                      time: '--:--'
                    };
                  }
                };

                const { date, time } = formatDate(transaction.timestamp);
                const isCheckout = transaction.action === 'checkout';

                return (
                  <div key={transaction.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{ color: '#E2372B' }}>
                        {transaction.quantity || 1}
                      </div>
                      <div className="text-xs text-slate-500">Cantidad</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900">
                              {transaction.tool_name}
                            </p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isCheckout ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {isCheckout ? 'SALIDA' : 'ENTRADA'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">
                            Operario: <span className="font-medium">{transaction.operario_name}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Ubicación: {transaction.location || 'No especificada'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{date}</p>
                          <p className="text-xs text-slate-500">{time}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {transactions.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-sm text-slate-600">Sin movimientos registrados</p>
                  <p className="text-xs text-slate-500">Los movimientos de herramientas aparecerán aquí</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
