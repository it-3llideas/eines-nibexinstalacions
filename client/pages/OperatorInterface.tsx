import OperatorLayout from "@/components/OperatorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  Scan, 
  PackageCheck, 
  PackageMinus,
  Search,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

export default function OperatorInterface() {
  const [selectedAction, setSelectedAction] = useState<'checkout' | 'checkin' | null>(null);
  const [toolCode, setToolCode] = useState('');
  const [operarioName, setOperarioName] = useState('');
  const [lastAction, setLastAction] = useState<{
    type: 'checkout' | 'checkin';
    tool: string;
    operario: string;
    time: string;
    success: boolean;
  } | null>(null);

  const handleAction = () => {
    if (!selectedAction || !toolCode.trim()) return;
    
    // Simulate action
    setLastAction({
      type: selectedAction,
      tool: toolCode,
      operario: operarioName || 'Sin especificar',
      time: new Date().toLocaleTimeString('es-ES'),
      success: true
    });
    
    // Reset form
    setToolCode('');
    setOperarioName('');
    setSelectedAction(null);
  };

  return (
    <OperatorLayout>
      <div className="space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Registro de Herramientas
          </h1>
          <p className="text-xl text-slate-600">
            Selecciona la acción que quieres realizar
          </p>
        </div>

        {/* Action Selection - Large Buttons */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedAction === 'checkout' 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:border-blue-200'
            }`}
            onClick={() => setSelectedAction('checkout')}
          >
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <PackageMinus className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                COGER HERRAMIENTA
              </h2>
              <p className="text-lg text-slate-600">
                Registrar cuando cojas una herramienta
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedAction === 'checkin' 
                ? 'ring-2 ring-green-500 bg-green-50' 
                : 'hover:border-green-200'
            }`}
            onClick={() => setSelectedAction('checkin')}
          >
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <PackageCheck className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                DEVOLVER HERRAMIENTA
              </h2>
              <p className="text-lg text-slate-600">
                Registrar cuando devuelvas una herramienta
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Form Section */}
        {selectedAction && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {selectedAction === 'checkout' ? 'Coger Herramienta' : 'Devolver Herramienta'}
                  </h3>
                  <p className="text-slate-600">
                    Introduce los datos de la herramienta
                  </p>
                </div>

                {/* Tool Code Input */}
                <div className="space-y-2">
                  <label className="text-lg font-medium text-slate-900">
                    Código de Herramienta *
                  </label>
                  <div className="relative">
                    <Input 
                      placeholder="Escanea el QR o introduce el código"
                      value={toolCode}
                      onChange={(e) => setToolCode(e.target.value)}
                      className="text-lg py-4 pl-12 text-center font-mono"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                {/* Operario Name Input (optional for checkout) */}
                {selectedAction === 'checkout' && (
                  <div className="space-y-2">
                    <label className="text-lg font-medium text-slate-900">
                      Tu Nombre (Opcional)
                    </label>
                    <div className="relative">
                      <Input 
                        placeholder="Introduce tu nombre"
                        value={operarioName}
                        onChange={(e) => setOperarioName(e.target.value)}
                        className="text-lg py-4 pl-12"
                      />
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid gap-4">
                  <Button 
                    size="lg" 
                    onClick={handleAction}
                    disabled={!toolCode.trim()}
                    className={`text-xl py-6 ${
                      selectedAction === 'checkout' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    <Scan className="h-6 w-6 mr-3" />
                    {selectedAction === 'checkout' ? 'REGISTRAR COGER' : 'REGISTRAR DEVOLVER'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      setSelectedAction(null);
                      setToolCode('');
                      setOperarioName('');
                    }}
                    className="text-lg py-4"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Action Result */}
        {lastAction && (
          <Card className="max-w-2xl mx-auto bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {lastAction.success ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-green-900 mb-1">
                    ¡Registro Completado!
                  </h4>
                  <p className="text-green-700">
                    {lastAction.type === 'checkout' ? 'Herramienta cogida' : 'Herramienta devuelta'}: 
                    <span className="font-mono font-bold"> {lastAction.tool}</span>
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {lastAction.operario} • {lastAction.time}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Help */}
        <Card className="max-w-4xl mx-auto bg-slate-50">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <Scan className="h-8 w-8 text-slate-600" />
                <h4 className="font-medium text-slate-900">Escanea el QR</h4>
                <p className="text-sm text-slate-600">
                  Usa la cámara para escanear el código de la herramienta
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Clock className="h-8 w-8 text-slate-600" />
                <h4 className="font-medium text-slate-900">Registro Automático</h4>
                <p className="text-sm text-slate-600">
                  El sistema registra automáticamente la hora y fecha
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-slate-600" />
                <h4 className="font-medium text-slate-900">Siempre Registra</h4>
                <p className="text-sm text-slate-600">
                  Importante registrar cuando cojas y devuelvas herramientas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OperatorLayout>
  );
}
