import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import {
  Clock,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string | number;
  type: 'checkout' | 'checkin' | 'maintenance' | 'review' | 'assignment';
  tool: string;
  operario: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
  details?: string;
}

// Live data will be fetched from /api/inventory/transactions
const activities: ActivityItem[] = [
  {
    id: '1',
    type: 'checkout',
    tool: 'Taladro Bosch GSB 13 RE',
    operario: 'Carlos Martínez',
    timestamp: 'Hace 15 min',
    status: 'success',
    details: 'Proyecto: Instalación eléctrica C/Mayor'
  },
  {
    id: '2',
    type: 'review',
    tool: 'Escalera Aluminio 3m',
    operario: 'Ana García',
    timestamp: 'Hace 32 min',
    status: 'warning',
    details: 'Revisión mensual completada - Desgaste menor'
  },
  {
    id: '3',
    type: 'checkin',
    tool: 'Prensadora Rems Power-Press SE',
    operario: 'Miguel López',
    timestamp: 'Hace 1h',
    status: 'success',
    details: 'Retornada de obra C/Velázquez'
  },
  {
    id: '4',
    type: 'maintenance',
    tool: 'Grupo Electrógeno Honda EU20i',
    operario: 'Taller Central',
    timestamp: 'Hace 2h',
    status: 'error',
    details: 'Requiere reparación - Problema arranque'
  },
  {
    id: '5',
    type: 'assignment',
    tool: 'Set Llaves Allen Würth',
    operario: 'Pedro Ruiz',
    timestamp: 'Hace 3h',
    status: 'success',
    details: 'Nueva asignación H.I.'
  },
  {
    id: '6',
    type: 'checkout',
    tool: 'Tester Digital Fluke 117',
    operario: 'Laura Fernández',
    timestamp: 'Hace 4h',
    status: 'success',
    details: 'Proyecto: Mantenimiento Hospital'
  }
];

const typeConfig = {
  checkout: {
    icon: Package,
    label: 'Retirada',
    color: 'text-blue-600 bg-blue-50'
  },
  checkin: {
    icon: CheckCircle,
    label: 'Devolución',
    color: 'text-green-600 bg-green-50'
  },
  maintenance: {
    icon: AlertTriangle,
    label: 'Mantenimiento',
    color: 'text-red-600 bg-red-50'
  },
  review: {
    icon: Clock,
    label: 'Revisión',
    color: 'text-yellow-600 bg-yellow-50'
  },
  assignment: {
    icon: User,
    label: 'Asignación',
    color: 'text-purple-600 bg-purple-50'
  }
};

const statusConfig = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800'
};

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/inventory/transactions');
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data)) {
            const mapped: ActivityItem[] = data.map((t: any) => ({
              id: t.id,
              type: t.type === 'checkout' || t.type === 'checkin' ? t.type : 'assignment',
              tool: t.tool,
              operario: t.operario,
              timestamp: t.timestamp,
              details: t.project ? `Proyecto: ${t.project} • Stock ${t.stockChange}` : `Stock ${t.stockChange}`,
              status: 'success'
            }));
            setItems(mapped);
          }
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTransactions();
    const id = setInterval(fetchTransactions, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="space-y-4 p-6 pt-0">
            {loading && items.length === 0 && (
              <div className="text-sm text-slate-500">Cargando actividad...</div>
            )}
            {!loading && items.length === 0 && (
              <div className="text-sm text-slate-500">Sin movimientos recientes</div>
            )}
            {items.map((activity) => {
              const config = typeConfig[activity.type];
              const Icon = config.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5",
                    config.color
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {config.label}
                      </Badge>
                      {activity.status && (
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          activity.status === 'success' ? 'bg-green-500' :
                          activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        )} />
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {activity.tool}
                    </p>
                    <p className="text-xs text-slate-500 mb-1">
                      {activity.operario} • {activity.timestamp}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 mt-2">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
