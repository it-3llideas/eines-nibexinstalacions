import Layout from "@/components/Layout";
import DashboardStats from "@/components/DashboardStats";
import RecentActivity from "@/components/RecentActivity";
import AlertsPanel from "@/components/AlertsPanel";
import QuickActions from "@/components/QuickActions";

export default function Index() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard de Herramientas
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Control integral de herramientas individuales (H.I.) y comunes (H.C.)
          </p>
        </div>

        {/* Stats Overview */}
        <DashboardStats />

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            <RecentActivity />
          </div>

          {/* Right Column - Takes 1/3 width */}
          <div className="space-y-8">
            <AlertsPanel />
            <QuickActions />
          </div>
        </div>

        {/* Additional Sections */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Tool Status Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Estado de Herramientas por Categoría
            </h3>
            <div className="space-y-4">
              {[
                { category: 'Taladros y Perforadoras', total: 45, inUse: 38, available: 7, maintenance: 0 },
                { category: 'Herramientas de Medición', total: 67, inUse: 52, available: 13, maintenance: 2 },
                { category: 'Escaleras y Andamios', total: 23, inUse: 18, available: 4, maintenance: 1 },
                { category: 'Equipos de Soldadura', total: 12, inUse: 9, available: 2, maintenance: 1 },
                { category: 'Prensadoras', total: 8, inUse: 5, available: 3, maintenance: 0 },
                { category: 'Grupos Electrógenos', total: 6, inUse: 4, available: 1, maintenance: 1 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-medium text-slate-900">{item.category}</div>
                    <div className="text-sm text-slate-500">{item.total} unidades totales</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">{item.inUse} en uso</span>
                    <span className="text-blue-600">{item.available} disponibles</span>
                    {item.maintenance > 0 && (
                      <span className="text-red-600">{item.maintenance} mantenimiento</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operarios Status */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Operarios Más Activos
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Carlos Martínez', tools: 12, project: 'Instalación C/Mayor', status: 'Activo' },
                { name: 'Ana García', tools: 8, project: 'Mantenimiento Hospital', status: 'Activo' },
                { name: 'Miguel López', tools: 15, project: 'Obra Nueva C/Velázquez', status: 'Activo' },
                { name: 'Laura Fernández', tools: 6, project: 'Reparación Oficinas', status: 'Activo' },
                { name: 'Pedro Ruiz', tools: 9, project: 'Instalación Industrial', status: 'Activo' }
              ].map((operario, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-medium text-slate-900">{operario.name}</div>
                    <div className="text-sm text-slate-500">{operario.project}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">{operario.tools} herramientas</div>
                    <div className="text-xs text-green-600">{operario.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Info Footer */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div>
              Sistema de gestión integral para herramientas individuales (H.I.) y comunes (H.C.)
            </div>
            <div className="flex items-center gap-4">
              <span>Última actualización: Hace 2 min</span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                Sistema operativo
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
