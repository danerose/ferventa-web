export const UserRole = {
  Admin: 'admin',
  Receptionist: 'receptionist',
  Mechanic: 'mechanic',
  Warehouse: 'warehouse',
  Cashier: 'cashier',
  Seller: 'seller',
  Customer: 'customer',
  User: 'user',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
