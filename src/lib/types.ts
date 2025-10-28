export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Served'
  | 'Billed'
  | 'Paid'
  | 'Cancelled'
  | 'Accepted' // For online orders
  | 'Food Ready' // For online orders
  | 'Out for Delivery' // For online orders
  | 'Delivered'; // For online orders

export type KotStatus = 'New' | 'Printed';
export type ItemStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';
export type OrderType = 'dine-in' | 'online';
export type OnlinePlatform = 'Zomato' | 'Swiggy' | 'Others';
export type DiscountType = 'percentage' | 'amount';
export type PaymentMethod = 'card' | 'cash_at_counter';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  kotStatus: KotStatus;
  itemStatus: ItemStatus;
  kotId?: string; // Unique identifier for the KOT for each item
}

export interface CustomerDetails {
    name: string;
    phone: string;
    address: string;
}

export interface Order {
  id: string;
  orderType: OrderType;
  tableId?: string; // For dine-in
  onlinePlatform?: OnlinePlatform; // For online orders
  platformOrderId?: string; // For online orders
  customerDetails?: CustomerDetails; // For online orders
  items: OrderItem[];
  status: OrderStatus;
  timestamp: number;
  total: number;
  originalTotal?: number;
  discount?: number;
  discountType?: DiscountType;
  kotCounter?: number; // To generate unique KOT IDs
  switchedFrom?: string; // To track table switches
  sessionId?: string;
  paymentMethod?: PaymentMethod | null;
  billRequested?: boolean;
}

export interface Table {
  id: string;
  name: string;
}

export interface UpiDetails {
  upiId?: string;
  restaurantName?: string;
}
