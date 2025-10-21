export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'KOT Printed'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Billed'
  | 'Paid'
  | 'Cancelled';

export type KotStatus = 'New' | 'Printed';

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
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: number;
  total: number;
}
