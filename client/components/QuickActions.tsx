import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Scan, 
  FileSpreadsheet,
  UserPlus,
  Settings,
  Download,
  Upload,
  Search
} from "lucide-react";

const quickActions = [
  {
    icon: Plus,
    label: 'Nueva Herramienta',
    description: 'Agregar al inventario',
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
  },
  {
    icon: Scan,
    label: 'Escanear QR',
    description: 'Registrar movimiento',
    color: 'bg-green-50 text-green-600 hover:bg-green-100'
  },
  {
    icon: UserPlus,
    label: 'Nuevo Operario',
    description: 'Registrar usuario',
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
  },
  {
    icon: FileSpreadsheet,
    label: 'Generar Reporte',
    description: 'Exportar datos',
    color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
  },
  {
    icon: Search,
    label: 'Buscar Herramienta',
    description: 'Localizar en sistema',
    color: 'bg-slate-50 text-slate-600 hover:bg-slate-100'
  },
  {
    icon: Download,
    label: 'Importar Datos',
    description: 'Cargar desde Excel',
    color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
  }
];

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className={`h-auto p-6 flex flex-col items-center text-center space-y-3 ${action.color}`}
              >
                <Icon className="h-8 w-8" />
                <div>
                  <div className="text-base font-medium">{action.label}</div>
                  <div className="text-sm opacity-70">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 mb-2">Reportes Rápidos</div>
          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" size="sm" className="justify-start text-xs">
              <FileSpreadsheet className="h-3 w-3 mr-2" />
              Herramientas Vencidas
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-xs">
              <FileSpreadsheet className="h-3 w-3 mr-2" />
              Inventario Completo
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-xs">
              <FileSpreadsheet className="h-3 w-3 mr-2" />
              Asignaciones por Operario
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
