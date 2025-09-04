import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wrench, 
  Package, 
  AlertTriangle, 
  Users,
  Clock,
  TrendingUp,
  MapPin,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorMap = {
  blue: 'text-blue-600 bg-blue-50',
  green: 'text-green-600 bg-green-50',
  yellow: 'text-yellow-600 bg-yellow-50',
  red: 'text-red-600 bg-red-50',
  purple: 'text-purple-600 bg-purple-50',
};

function StatCard({ title, value, description, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center text-xs mt-2",
            trend.positive ? "text-green-600" : "text-red-600"
          )}>
            <TrendingUp className={cn(
              "h-3 w-3 mr-1",
              !trend.positive && "rotate-180"
            )} />
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Herramientas"
        value={847}
        description="Inventario completo"
        icon={Wrench}
        color="blue"
        trend={{ value: "+12 este mes", positive: true }}
      />
      
      <StatCard
        title="H.I. Asignadas"
        value={634}
        description="Herramientas individuales"
        icon={Users}
        color="green"
        trend={{ value: "98% asignadas", positive: true }}
      />
      
      <StatCard
        title="H.C. Disponibles"
        value={213}
        description="Herramientas comunes"
        icon={Package}
        color="purple"
        trend={{ value: "87% disponibles", positive: true }}
      />
      
      <StatCard
        title="Revisiones Pendientes"
        value={23}
        description="Requieren atención"
        icon={AlertTriangle}
        color="yellow"
        trend={{ value: "-5 esta semana", positive: true }}
      />
      
      <StatCard
        title="Operarios Activos"
        value={45}
        description="En proyectos actuales"
        icon={Users}
        color="blue"
      />
      
      <StatCard
        title="En Mantenimiento"
        value={12}
        description="Herramientas fuera de servicio"
        icon={Settings}
        color="red"
      />
      
      <StatCard
        title="En Obra"
        value={156}
        description="Herramientas desplegadas"
        icon={MapPin}
        color="green"
      />
      
      <StatCard
        title="Vencimientos Hoy"
        value={8}
        description="Revisiones programadas"
        icon={Clock}
        color="yellow"
      />
    </div>
  );
}
