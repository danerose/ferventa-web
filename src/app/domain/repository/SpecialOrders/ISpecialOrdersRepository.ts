import type {
  SpecialOrder,
  SpecialOrderSummary,
  SpecialOrderFilters,
  CreateSpecialOrderPayload,
  AddSpecialOrderPaymentPayload,
  UpdateSpecialOrderStatusPayload,
  CancelSpecialOrderPayload,
} from '../../entities/SpecialOrders/SpecialOrderEntities';

export interface ISpecialOrdersRepository {
  getOrders(token: string, branchId: string, filters?: SpecialOrderFilters): Promise<SpecialOrder[]>;
  getOrderById(token: string, branchId: string, id: string): Promise<SpecialOrder>;
  getSummary(token: string, branchId: string): Promise<SpecialOrderSummary>;
  createOrder(token: string, branchId: string, payload: CreateSpecialOrderPayload): Promise<SpecialOrder>;
  updateOrderStatus(
    token: string,
    branchId: string,
    id: string,
    payload: UpdateSpecialOrderStatusPayload
  ): Promise<SpecialOrder>;
  addPayment(
    token: string,
    branchId: string,
    id: string,
    payload: AddSpecialOrderPaymentPayload
  ): Promise<SpecialOrder>;
  cancelOrder(
    token: string,
    branchId: string,
    id: string,
    payload: CancelSpecialOrderPayload
  ): Promise<SpecialOrder>;
  updateOrder(
    token: string,
    branchId: string,
    id: string,
    payload: Partial<CreateSpecialOrderPayload>
  ): Promise<SpecialOrder>;
}
