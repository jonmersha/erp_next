export type UserRole = string;

export interface RolePermissions {
  [moduleName: string]: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: RolePermissions;
  is_system?: boolean;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  code: string; // Unique code for users to join
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
  createdAt: string;
  ownerId: string;
}

export interface UserProfile {
  id?: string;
  uid?: string;
  email: string;
  name: string;
  roles: UserRole[];
  unitId?: string;
  companyId: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export interface Factory {
  id: string;
  name: string;
  location: string;
  companyId: string;
  managerId?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  factoryId?: string;
  companyId: string;
}

export interface SalesOutlet {
  id: string;
  name: string;
  location: string;
  companyId: string;
  factory_id?: string;
  managerId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email?: string;
  companyId: string;
  certificate_url?: string;
  is_authorized?: boolean;
  status?: 'pending_approval' | 'active' | 'inactive';
  createdBy?: string;
  approvedBy?: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: 'kg' | 'liter' | 'unit' | 'bag';
  companyId: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  companyId: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  packageSize: string;
  unit: string;
  price: number;
  companyId: string;
  imageUrl?: string;
}

export interface InventoryItem {
  id: string;
  unitId: string;
  itemId: string;
  itemType: 'raw' | 'product';
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  companyId: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  factoryId: string;
  warehouseId: string;
  status: 'pending_approval' | 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  createdBy?: string;
  approvedBy?: string;
  createdAt: string;
  companyId: string;
}

export interface SalesOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface SalesOrder {
  id: string;
  customerId?: string;
  outletId: string;
  outletName: string;
  status: 'pending' | 'paid' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled';
  items: SalesOrderItem[];
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  companyId: string;
}

export interface MonthlyPlan {
  month: number; // 1-12
  quantity: number;
}

export interface QuarterlyPlan {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  quantity: number;
  monthlyPlans: MonthlyPlan[];
}

export interface ProductionPlan {
  id: string;
  factoryId: string;
  productId: string;
  year: number;
  totalQuantity: number;
  quarterlyPlans: QuarterlyPlan[];
  status: 'draft' | 'pending_approval' | 'approved';
  createdBy?: string;
  approvedBy?: string;
  companyId: string;
}

export interface ProductionRun {
  id: string;
  factoryId: string;
  productId: string;
  recipeId?: string;
  quantity: number;
  quantityProduced: number;
  status: 'planned' | 'in_progress' | 'completed';
  startDate: string;
  updatedAt?: string;
  companyId: string;
}

export interface ProcurementPlan {
  id: string;
  factoryId: string;
  warehouseId: string;
  productId?: string;
  materialId?: string;
  year: number;
  totalQuantity: number;
  quarterlyPlans: QuarterlyPlan[];
  status: 'planned' | 'pending_approval' | 'ordered' | 'received' | 'approved';
  createdBy?: string;
  approvedBy?: string;
  companyId: string;
}

export interface SalesPlan {
  id: string;
  factoryId: string;
  productId: string;
  year: number;
  totalQuantity: number;
  quarterlyPlans: QuarterlyPlan[];
  status: 'draft' | 'pending_approval' | 'approved';
  createdBy?: string;
  approvedBy?: string;
  companyId: string;
}

export interface BOMItem {
  materialId: string;
  quantity: number;
  unit: string;
}

export interface ProcessingStep {
  order: number;
  description: string;
  durationMinutes: number;
}

export interface Recipe {
  id: string;
  productId: string;
  name: string;
  bom: BOMItem[];
  processingSteps: ProcessingStep[];
  yieldPercentage: number;
  companyId: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  status: 'operational' | 'maintenance' | 'broken';
  companyId: string;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  date: string;
  description: string;
  technician: string;
  cost: number;
  companyId: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  status: 'pending' | 'in_transit' | 'delivered';
  deliveryDate: string;
  temperatureLog: number[]; // For cold chain monitoring
  companyId: string;
}

export interface GRNItem {
  itemId: string;
  quantityReceived: number;
}

export interface GRN {
  id: string;
  purchaseOrderId: string;
  warehouseId: string;
  receivedBy: string;
  receivedAt: string;
  items: GRNItem[];
  notes?: string;
  companyId: string;
}

export interface DeliveryNoteItem {
  productId: string;
  quantityShipped: number;
}

export interface DeliveryNote {
  id: string;
  salesOrderId: string;
  warehouseId: string;
  shippedBy: string;
  shippedAt: string;
  items: DeliveryNoteItem[];
  notes?: string;
  companyId: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  managerId?: string;
  companyId: string;
  managerName?: string;
  parentDepartmentName?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  departmentId?: string;
  departmentName?: string;
  managerId?: string;
  managerName?: string;
  role: string;
  salary: number;
  factoryId?: string;
  hireDate: string;
  companyId: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  orderType: 'purchase' | 'sales';
  amount: number;
  dueDate: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  companyId: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  companyId: string;
}

export interface FinancialPlan {
  id: string;
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  targetRevenue: number;
  targetExpense: number;
  companyId: string;
}

export interface QualityCheck {
  id: string;
  referenceId: string;
  referenceType: 'production_run' | 'grn' | 'inventory';
  itemId: string;
  inspectorId: string;
  checkDate: string;
  status: 'passed' | 'failed' | 'pending' | 'quarantined';
  notes?: string;
  companyId: string;
}

