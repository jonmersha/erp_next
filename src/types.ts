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
  category?: string;
  risk_rating?: number;
  payment_terms?: string;
  bank_account?: string;
  tax_id?: string;
}

export interface Expense {
  id: string;
  costCenterId: string;
  costCenterName?: string;
  amount: number;
  date: string;
  description?: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  companyId: string;
  createdBy: string;
  approvedBy?: string;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  type: 'car' | 'truck' | 'van' | 'motorcycle';
  status: 'active' | 'maintenance' | 'out_of_service';
  companyId: string;
  createdAt?: string;
}

export interface VehicleRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  travelers?: string[];
  vehicleId?: string;
  vehiclePlate?: string;
  startDate: string;
  endDate: string;
  purpose: string;
  costCenterId?: string;
  costCenterName?: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'completed';
  companyId: string;
  createdBy: string;
  approvedBy?: string;
  createdAt?: string;
}

export interface FleetConsumption {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  type: 'fuel' | 'maintenance' | 'repair' | 'toll';
  cost: number;
  date: string;
  description?: string;
  costCenterId?: string;
  companyId: string;
  recordedBy: string;
  createdAt?: string;
}

export interface PurchaseRequisition {
  id: string;
  department_id: string;
  departmentName?: string;
  item_id: string;
  item_name: string;
  quantity: number;
  required_date: string;
  budget_code?: string;
  notes?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_to_po';
  createdBy?: string;
  approvedBy?: string;
  company_id: string;
  createdAt: string;
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
  calculatedProgress?: number;
  currentStageName?: string;
  companyId: string;
}

export interface ProductionStage {
  id: string;
  runId: string;
  stageName: string;
  stageOrder: number;
  estimatedTimeMinutes?: number;
  percentageWeight?: number;
  assignedOperatorId?: string;
  status: 'pending' | 'in_progress' | 'completed';
  actualTimeMinutes?: number;
  quantityProduced?: number;
  notes?: string;
  companyId: string;
  createdAt: string;
}

export interface ProductionEvent {
  id: string;
  runId: string;
  eventType: 'grain_intake' | 'conditioning' | 'milling' | 'blending' | 'packaging';
  notes?: string;
  payload?: any;
  performedBy?: string;
  companyId: string;
  createdAt: string;
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

export interface WeighbridgeLog {
  id: string;
  reference_type: 'PO' | 'SO' | 'Transfer' | 'Other';
  reference_id?: string;
  po_id?: string;
  truck_plate: string;
  driver_name?: string;
  gross_weight?: number;
  tare_weight?: number;
  net_weight?: number;
  entry_time: string;
  exit_time?: string;
  company_id: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  employeeRole?: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approverName?: string;
  companyId: string;
}

export interface QualityInspection {
  id: string;
  weighbridge_log_id: string;
  truck_plate?: string;
  reference_id?: string;
  moisture?: number;
  protein?: number;
  ash?: number;
  gluten?: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  inspector_id?: string;
  notes?: string;
  company_id: string;
  created_at: string;
}
