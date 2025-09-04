import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, MessageSquare } from "lucide-react";

export default function Settings() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Configuración del Sistema
          </h1>
          <p className="text-slate-600 mt-2">
            Parámetros generales, categorías de herramientas y configuración avanzada
          </p>
        </div>

        <Card className="text-center py-16">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <SettingsIcon className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Módulo de Configuración
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Esta sección incluirá configuración de categorías, intervalos de revisión, 
              alertas automáticas, integraciones y parámetros del sistema.
            </p>
            <Button className="mr-4">
              <MessageSquare className="h-4 w-4 mr-2" />
              Solicitar Implementación
            </Button>
            <Button variant="outline">
              Ver Especificaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
