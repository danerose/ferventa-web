import type { ISpecialOrdersRepository } from '../../repository/SpecialOrders/ISpecialOrdersRepository';
import type {
  SpecialOrder,
  SpecialOrderSummary,
  SpecialOrderFilters,
  CreateSpecialOrderPayload,
  AddSpecialOrderPaymentPayload,
  UpdateSpecialOrderStatusPayload,
  CancelSpecialOrderPayload,
} from '../../entities/SpecialOrders/SpecialOrderEntities';

export class SpecialOrdersUseCases {
  private readonly repository: ISpecialOrdersRepository;

  constructor(repository: ISpecialOrdersRepository) {
    this.repository = repository;
  }

  getOrders(token: string, branchId: string, filters?: SpecialOrderFilters): Promise<SpecialOrder[]> {
    return this.repository.getOrders(token, branchId, filters);
  }

  getOrderById(token: string, branchId: string, id: string): Promise<SpecialOrder> {
    return this.repository.getOrderById(token, branchId, id);
  }

  getSummary(token: string, branchId: string): Promise<SpecialOrderSummary> {
    return this.repository.getSummary(token, branchId);
  }

  createOrder(token: string, branchId: string, payload: CreateSpecialOrderPayload): Promise<SpecialOrder> {
    return this.repository.createOrder(token, branchId, payload);
  }

  updateOrderStatus(
    token: string,
    branchId: string,
    id: string,
    payload: UpdateSpecialOrderStatusPayload
  ): Promise<SpecialOrder> {
    return this.repository.updateOrderStatus(token, branchId, id, payload);
  }

  addPayment(
    token: string,
    branchId: string,
    id: string,
    payload: AddSpecialOrderPaymentPayload
  ): Promise<SpecialOrder> {
    return this.repository.addPayment(token, branchId, id, payload);
  }

  cancelOrder(
    token: string,
    branchId: string,
    id: string,
    payload: CancelSpecialOrderPayload
  ): Promise<SpecialOrder> {
    return this.repository.cancelOrder(token, branchId, id, payload);
  }

  updateOrder(
    token: string,
    branchId: string,
    id: string,
    payload: Partial<CreateSpecialOrderPayload>
  ): Promise<SpecialOrder> {
    return this.repository.updateOrder(token, branchId, id, payload);
  }
}
