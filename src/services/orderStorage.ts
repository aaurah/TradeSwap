import { SwapOrder } from '../types';

const STORAGE_KEY = 'dex_swap_orders_v2';
const ACTIVE_ORDER_KEY = 'dex_active_order_id_v2';

export function getSavedOrders(): SwapOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('letsexchange_orders_v1');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveOrder(order: SwapOrder): void {
  try {
    const orders = getSavedOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    if (existingIndex >= 0) {
      orders[existingIndex] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.slice(0, 50))); // Keep last 50
    localStorage.setItem(ACTIVE_ORDER_KEY, order.id);
  } catch (err) {
    console.error('Failed to save order', err);
  }
}

export function getOrderById(id: string): SwapOrder | null {
  const orders = getSavedOrders();
  return orders.find(o => o.id.toLowerCase() === id.toLowerCase()) || null;
}

export function getActiveOrderId(): string | null {
  return localStorage.getItem(ACTIVE_ORDER_KEY);
}

export function clearActiveOrderId(): void {
  localStorage.removeItem(ACTIVE_ORDER_KEY);
}
