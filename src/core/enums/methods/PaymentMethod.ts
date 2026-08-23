export const PaymentMethod = {
  Cash: 'cash',
  Card: 'card',
  Transfer: 'transfer',
  Mixed: 'mixed',
  Credit: 'credit',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
