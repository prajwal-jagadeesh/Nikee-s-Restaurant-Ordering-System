export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Billed'
  | 'Paid'
  | 'Cancelled';

export type KotStatus = 'New' | 'Printed';
export type ItemStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  kotStatus: KotStatus;
  itemStatus: ItemStatus;
  kotId?: string; // Unique identifier for the KOT
}

export interface Order {
  id: string;
  tableNumber: number; // Legacy, will be phased out
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: number;
  total: number;
  kotCounter?: number; // To generate unique KOT IDs
}

export interface Table {
  id: string;
  name: string;
}
