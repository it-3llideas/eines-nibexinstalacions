import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Settings, 
  Scan,
  Monitor,
  Smartphone,
  Shield
} from "lucide-react";

export default function InterfaceSelect() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src="https://cdn.builder.io/o/assets%2F09680fc109f1491ab861c2ae20c8761e%2Fd081bb74cb8e412188656758bfb96e64?alt=media&token=4322fdf3-454c-40d9-bf79-c80239fe8f46&apiKey=09680fc109f1491ab861c2ae20c8761e"
              alt="NIBEX Instal·lacions"
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Sistema de Gestión de Herramientas
          </h1>
          <p className="text-slate-500">
            Selecciona el tipo de interfaz que necesitas
          </p>
        </div>

        {/* Interface Options */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin Interface */}
          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-red-200">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#f5e5e4' }}>
                <Monitor className="h-10 w-10" style={{ color: '#E2372B' }} />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Administrador
              </h2>
              
              <p className="text-slate-600 mb-6 leading-relaxed">
                Interfaz completa para gestión, reportes y configuración del sistema. 
                Control total de herramientas H.I. y H.C.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Shield className="h-4 w-4" style={{ color: '#E2372B' }} />
                  Dashboard completo con estadísticas
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Settings className="h-4 w-4" style={{ color: '#E2372B' }} />
                  Gestión de operarios y herramientas
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Monitor className="h-4 w-4" style={{ color: '#E2372B' }} />
                  Reportes y configuración avanzada
                </div>
              </div>
              
              <Link to="/admin">
                <Button size="lg" className="w-full text-lg py-6" style={{ backgroundColor: '#E2372B', borderColor: '#E2372B' }}>
                  <Shield className="h-5 w-5 mr-2" />
                  Acceso Administrador
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Operator Interface */}
          <Card className="hover:shadow-lg transition-shadow border-2 hover:border-red-200">
            <CardContent className="p-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#f5e5e4' }}>
                <Smartphone className="h-10 w-10" style={{ color: '#E2372B' }} />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Operario
              </h2>
              
              <p className="text-slate-600 mb-6 leading-relaxed">
                Interfaz simple con botones grandes para registrar entrada y salida 
                de herramientas de forma rápida y sencilla.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Scan className="h-4 w-4" style={{ color: '#E2372B' }} />
                  Botones grandes y fáciles de usar
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Smartphone className="h-4 w-4" style={{ color: '#E2372B' }} />
                  Optimizado para tablets y móviles
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Wrench className="h-4 w-4" style={{ color: '#E2372B' }} />
                  Registro rápido de herramientas
                </div>
              </div>
              
              <Link to="/operario">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg py-6 hover:bg-red-50"
                  style={{ borderColor: '#E2372B', color: '#E2372B' }}
                >
                  <Scan className="h-5 w-5 mr-2" />
                  Acceso Operario
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-slate-400">
            Control integral de herramientas individuales (H.I.) y comunes (H.C.)
          </p>
        </div>
      </div>
    </div>
  );
}
