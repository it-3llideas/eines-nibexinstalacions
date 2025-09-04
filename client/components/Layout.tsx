import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Wrench,
  Users,
  Package,
  BarChart3,
  Menu,
  Search,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Categorías', href: '/categories', icon: Package },
  { name: 'Herramientas Individuales', href: '/admin/individual-tools', icon: Wrench },
  { name: 'Herramientas Comunes', href: '/admin/common-tools', icon: Package },
  { name: 'Operarios', href: '/admin/operarios', icon: Users },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    // Clear any stored auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');

    // Navigate to login
    navigate('/login');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-slate-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-sm">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
          <div className="flex h-16 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <div className="flex items-center gap-x-4">
                  <div className="relative user-menu-container">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-x-2 p-1 hover:bg-slate-50"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: '#E2372B' }}
                      >
                        A
                      </div>
                      <span className="text-sm font-medium text-slate-700">Admin</span>
                    </Button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent() {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F09680fc109f1491ab861c2ae20c8761e%2F8bdb9addf4654ceab4a12d9826d86b7b?format=webp&width=800"
            alt="NIBEX"
            className="h-8 w-8 rounded-lg"
          />
          <div>
            <span className="text-lg font-semibold text-slate-900">NIBEX</span>
            <p className="text-xs" style={{ color: '#E2372B' }}>Gestión de Herramientas</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const current = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                current
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  current ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-slate-200">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs font-medium text-slate-600 mb-1">Sistema de Gestión</div>
          <div className="text-xs text-slate-500">Control integral de herramientas</div>
        </div>
      </div>
    </div>
  );
}
