import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor introduce email y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect based on user role
        if (data.user.role === 'admin' || data.user.role === 'warehouse_manager') {
          navigate('/');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const goToPanel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <img 
                src="https://cdn.builder.io/api/v1/image/assets%2F09680fc109f1491ab861c2ae20c8761e%2Fef0ba1a90f6d4d25a74050d85e26ab80?format=webp&width=800" 
                alt="NIBEX" 
                className="h-16 mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Iniciar sesión
              </h1>
              <p className="text-slate-600 text-sm">
                Accede a tu cuenta para gestionar herramientas
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Correo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-slate-300 focus:border-red-500 focus:ring-red-500"
                    placeholder="example@nibexinstalacions.com"
                    style={{ borderColor: '#E2E8F0' }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-slate-300 focus:border-red-500 focus:ring-red-500"
                    placeholder="••••••••••••••••"
                    style={{ borderColor: '#E2E8F0' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-white font-semibold text-base rounded-full hover:bg-red-400 transition-colors duration-200"
                style={{ backgroundColor: '#E2372B', borderColor: '#E2372B' }}
              >
                {loading ? 'Iniciando sesión...' : 'Inicia sesión'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">o</span>
              </div>
            </div>

            {/* Panel Access Button */}
            <Button
              type="button"
              variant="outline"
              onClick={goToPanel}
              className="w-full py-3 font-semibold text-base rounded-full border-2 hover:bg-red-50"
              style={{ borderColor: '#E2372B', color: '#E2372B' }}
            >
              Ir al Panel de Entrada/Salida
            </Button>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-slate-500">
                Sistema de gestión de herramientas NIBEX
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Contacta con el administrador si necesitas acceso
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
