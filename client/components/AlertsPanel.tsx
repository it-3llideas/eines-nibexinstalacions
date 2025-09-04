import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Clock, 
  MapPin,
  Settings,
  CheckCircle,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: 'overdue' | 'missing' | 'maintenance' | 'location' | 'review';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  actionable: boolean;
}

const alerts: Alert[] = [
  {
    id: '1',
    type: 'overdue',
    title: 'Revisión Vencida',
    description: 'Escalera telescópica - Vencida hace 5 días',
    priority: 'high',
    timestamp: 'Hace 2h',
    actionable: true
  },
  {
    id: '2',
    type: 'missing',
    title: 'Herramienta No Localizada',
    description: 'Taladro Makita HP457D - Sin devolver 15 días',
    priority: 'high',
    timestamp: 'Hace 4h',
    actionable: true
  },
  {
    id: '3',
    type: 'maintenance',
    title: 'Mantenimiento Programado',
    description: 'Grupo electrógeno - Revisión 500h próxima semana',
    priority: 'medium',
    timestamp: 'Hace 6h',
    actionable: true
  },
  {
    id: '4',
    type: 'location',
    title: 'Herramienta Fuera de Zona',
    description: 'Prensadora en obra más de 30 días',
    priority: 'medium',
    timestamp: 'Hace 1 día',
    actionable: true
  },
  {
    id: '5',
    type: 'review',
    title: 'Revisiones Programadas Hoy',
    description: '8 herramientas requieren revisión',
    priority: 'low',
    timestamp: 'Hoy',
    actionable: true
  }
];

const typeConfig = {
  overdue: {
    icon: Clock,
    color: 'text-red-600 bg-red-50',
    badgeColor: 'bg-red-100 text-red-800'
  },
  missing: {
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50',
    badgeColor: 'bg-red-100 text-red-800'
  },
  maintenance: {
    icon: Settings,
    color: 'text-yellow-600 bg-yellow-50',
    badgeColor: 'bg-yellow-100 text-yellow-800'
  },
  location: {
    icon: MapPin,
    color: 'text-blue-600 bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  review: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-50',
    badgeColor: 'bg-green-100 text-green-800'
  }
};

const priorityConfig = {
  high: { label: 'Alta', color: 'bg-red-100 text-red-800' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  low: { label: 'Baja', color: 'bg-green-100 text-green-800' }
};

export default function AlertsPanel() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas y Notificaciones
          </CardTitle>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            {alerts.filter(a => a.priority === 'high').length} Críticas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const config = typeConfig[alert.type];
          const priority = priorityConfig[alert.priority];
          const Icon = config.icon;
          
          return (
            <div 
              key={alert.id}
              className={cn(
                "p-4 rounded-lg border border-slate-200 bg-white",
                alert.priority === 'high' && "border-red-200 bg-red-50/30"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                  config.color
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={priority.color}>
                      {priority.label}
                    </Badge>
                    <span className="text-xs text-slate-500">{alert.timestamp}</span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    {alert.description}
                  </p>
                  {alert.actionable && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" className="h-7 px-2 text-xs">
                        Resolver
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 border-t">
          <Button variant="outline" className="w-full text-sm">
            Ver Todas las Alertas ({alerts.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
