import "./global.css";
import "@/lib/resize-observer-fix";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import InterfaceSelect from "./pages/InterfaceSelect";
import AdminDashboard from "./pages/AdminDashboard";
import IndividualTools from "./pages/IndividualTools";
import CommonTools from "./pages/CommonTools";
import Operarios from "./pages/Operarios";
import Settings from "./pages/Settings";
import EntryExitPanel from "./pages/EntryExitPanel";
import OperatorInventory from "./pages/OperatorInventory";
import CategoriesManagement from "./pages/CategoriesManagement";
import Users from "./pages/Users";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<EntryExitPanel />} />
          <Route path="/categories" element={
            <ProtectedRoute adminOnly>
              <CategoriesManagement />
            </ProtectedRoute>
          } />
          <Route path="/select" element={<InterfaceSelect />} />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/individual-tools" element={
            <ProtectedRoute adminOnly>
              <IndividualTools />
            </ProtectedRoute>
          } />
          <Route path="/admin/common-tools" element={
            <ProtectedRoute adminOnly>
              <CommonTools />
            </ProtectedRoute>
          } />
          <Route path="/admin/operarios" element={
            <ProtectedRoute adminOnly>
              <Operarios />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute adminOnly>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/operario" element={<OperatorInventory />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
