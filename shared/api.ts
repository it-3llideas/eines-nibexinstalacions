/**
 * Shared code between client and server
 * Tool management system types
 */

export interface DemoResponse {
  message: string;
}

export interface Tool {
  id: string;
  name: string;
  type: 'individual' | 'common';
  category: string;
  assignedTo?: string; // operario ID for individual tools
  location: string;
  status: 'available' | 'in_use' | 'maintenance' | 'missing';
  lastSeen: string;
  nextReview?: string; // for individual tools
  cost: number;
  serialNumber?: string;
  notes?: string;
  checkoutHistory: ToolCheckout[];
}

export interface ToolCheckout {
  id: string;
  toolId: string;
  operarioId: string;
  operarioName: string;
  checkedOutAt: string;
  checkedInAt?: string;
  project?: string;
  notes?: string;
}

export interface Operario {
  id: string;
  name: string;
  email: string;
  role: 'operario' | 'supervisor' | 'warehouse_manager';
  assignedTools: Tool[];
  currentProjects: string[];
  active: boolean;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'common';
}

export interface DashboardStats {
  totalTools: number;
  individualTools: number;
  commonTools: number;
  toolsInUse: number;
  toolsInMaintenance: number;
  missingTools: number;
  activeOperarios: number;
  overdueReviews: number;
}
