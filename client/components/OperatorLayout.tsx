import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  ArrowLeft,
  User,
  Clock
} from "lucide-react";

interface OperatorLayoutProps {
  children: React.ReactNode;
}

export default function OperatorLayout({ children }: OperatorLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F09680fc109f1491ab861c2ae20c8761e%2F8bdb9addf4654ceab4a12d9826d86b7b?format=webp&width=800"
                alt="NIBEX"
                className="h-10 w-10 rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-slate-900">NIBEX</h1>
                <p className="text-xs font-medium" style={{ color: '#E2372B' }}>MODO OPERARIO</p>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="h-4 w-4" />
                <span>{new Date().toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Operario</span>
              </div>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Simple Footer */}
      <div className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Sistema de Gestión de Herramientas</span>
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              Sistema activo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
