/**
 * Ticket Items Parser and Formatter
 * 
 * Normalizes sale items from both local POS carts and remote backend sales,
 * properly nesting supplies/insumos under their parent services for ticket printing.
 */

export interface ParsedTicketSupply {
  qty: number;
  name: string;
  price: number;
  subtotal: number;
}

export interface ParsedTicketItem {
  id: string;
  cartId?: string;
  parentCartId?: string;
  type: 'product' | 'service' | 'external';
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  isService: boolean;
  supplies: ParsedTicketSupply[];
}

interface RawItemDict {
  id?: string;
  _id?: string;
  cartId?: string;
  parentCartId?: string;
  parentId?: string;
  parentServiceId?: string;
  type?: string;
  name?: string;
  productNameSnapshot?: string;
  serviceNameSnapshot?: string;
  quantity?: number;
  qty?: number;
  unitPrice?: number;
  priceSnapshot?: number;
  subtotal?: number;
  product?: { name?: string; sku?: string; sellingPrice?: number };
  service?: { name?: string; basePrice?: number; supplies?: unknown[] };
  serviceId?: { name?: string; basePrice?: number; supplies?: unknown[] };
  supplies?: unknown[];
  suppliesConsumed?: unknown[];
  isConsumable?: boolean;
  isSupply?: boolean;
  isServicePackageConsumable?: boolean;
  isNoAplica?: boolean;
  origin?: string;
}

export function parseTicketItems(rawItems?: unknown[] | null, isTest: boolean = false): ParsedTicketItem[] {
  if (isTest) {
    return [
      {
        id: 'test-1',
        type: 'product',
        name: 'Aceite Sintético 10W-40 4T',
        qty: 1,
        price: 220.0,
        subtotal: 220.0,
        isService: false,
        supplies: [],
      },
      {
        id: 'test-2',
        type: 'service',
        name: 'Servicio de Afinación Mayor',
        qty: 1,
        price: 300.0,
        subtotal: 300.0,
        isService: true,
        supplies: [
          { qty: 1, name: 'Filtro de Aire', price: 0.0, subtotal: 0.0 },
          { qty: 1, name: 'Bujía NGK C7HSA', price: 0.0, subtotal: 0.0 },
        ],
      },
    ];
  }

  if (!Array.isArray(rawItems)) return [];

  const list = rawItems as RawItemDict[];
  const normalized: (ParsedTicketItem & { raw: RawItemDict; isExplicitSupply: boolean })[] = list.map((item, idx) => {
    const isService =
      item.type === 'service' ||
      Boolean(item.serviceId) ||
      Boolean(item.service) ||
      Boolean(item.serviceNameSnapshot);

    const productObj = typeof item.product === 'object' && item.product !== null ? item.product : null;
    const serviceObj = typeof item.service === 'object' && item.service !== null ? item.service : null;
    const serviceIdObj = typeof item.serviceId === 'object' && item.serviceId !== null ? item.serviceId : null;

    const rawName =
      item.productNameSnapshot ||
      item.serviceNameSnapshot ||
      item.name ||
      productObj?.name ||
      serviceObj?.name ||
      serviceIdObj?.name ||
      (isService ? 'Servicio de Taller' : 'Artículo');

    const isExplicitSupply = Boolean(
      item.parentCartId ||
      item.parentId ||
      item.parentServiceId ||
      item.isConsumable ||
      item.isSupply ||
      item.isServicePackageConsumable ||
      item.origin === 'service' ||
      /^[\s\-–—]+/.test(rawName)
    );

    // Strip leading dashes, hyphens, and whitespace
    const cleanName = rawName.replace(/^[\s\-–—]+/, '').trim() || (isService ? 'Servicio de Taller' : 'Artículo');

    const qty = typeof item.quantity === 'number' && item.quantity > 0
      ? item.quantity
      : typeof item.qty === 'number' && item.qty > 0
        ? item.qty
        : Number(item.quantity || item.qty) || 1;

    const isNoAplica = Boolean(item.isNoAplica);
    const rawPrice = typeof item.unitPrice === 'number'
      ? item.unitPrice
      : typeof item.priceSnapshot === 'number'
        ? item.priceSnapshot
        : Number(productObj?.sellingPrice ?? serviceObj?.basePrice ?? serviceIdObj?.basePrice ?? 0);

    const unitPrice = isNoAplica ? 0 : rawPrice;
    const subtotal = typeof item.subtotal === 'number' ? (isNoAplica ? 0 : item.subtotal) : unitPrice * qty;

    const itemId = String(item.cartId || item.id || item._id || `item-${idx}`);
    const parentId = item.parentCartId || item.parentId || item.parentServiceId;

    // Check for nested supplies if attached on service object
    const nestedRaw =
      item.suppliesConsumed ||
      item.supplies ||
      serviceObj?.supplies ||
      serviceIdObj?.supplies ||
      [];

    const nestedSupplies: ParsedTicketSupply[] = Array.isArray(nestedRaw)
      ? nestedRaw.map((supRaw) => {
          const sup = (typeof supRaw === 'object' && supRaw !== null ? supRaw : {}) as RawItemDict;
          const supProd = typeof sup.product === 'object' && sup.product !== null ? sup.product : null;
          const supRawName = sup.name || supProd?.name || 'Insumo de servicio';
          const supCleanName = supRawName.replace(/^[\s\-–—]+/, '').trim() || 'Insumo';
          const sQty = typeof sup.quantity === 'number' && sup.quantity > 0 ? sup.quantity : Number(sup.quantity) || 1;
          const sPrice = sup.isNoAplica ? 0 : (typeof sup.unitPrice === 'number' ? sup.unitPrice : supProd?.sellingPrice ?? 0);
          const sSubtotal = typeof sup.subtotal === 'number' ? (sup.isNoAplica ? 0 : sup.subtotal) : sPrice * sQty;
          return {
            qty: sQty,
            name: supCleanName,
            price: sPrice,
            subtotal: sSubtotal,
          };
        })
      : [];

    return {
      id: itemId,
      cartId: item.cartId,
      parentCartId: parentId,
      type: isService ? 'service' : 'product',
      name: cleanName,
      qty,
      price: unitPrice,
      subtotal,
      isService,
      supplies: nestedSupplies,
      raw: item,
      isExplicitSupply,
    };
  });

  // Group explicit supplies by parent id
  const rootItems: ParsedTicketItem[] = [];
  const suppliesByParentId = new Map<string, ParsedTicketSupply[]>();
  const orphanedSupplies: ParsedTicketSupply[] = [];

  normalized.forEach((item) => {
    if (item.parentCartId) {
      if (!suppliesByParentId.has(item.parentCartId)) {
        suppliesByParentId.set(item.parentCartId, []);
      }
      suppliesByParentId.get(item.parentCartId)!.push({
        qty: item.qty,
        name: item.name,
        price: item.price,
        subtotal: item.subtotal,
      });
    } else if (item.isExplicitSupply && !item.isService) {
      orphanedSupplies.push({
        qty: item.qty,
        name: item.name,
        price: item.price,
        subtotal: item.subtotal,
      });
    }
  });

  let lastServiceItem: ParsedTicketItem | null = null;

  normalized.forEach((item) => {
    if (item.parentCartId || (item.isExplicitSupply && !item.isService)) {
      // Handled as a nested supply of a service
      return;
    }

    const explicitSupplies =
      suppliesByParentId.get(item.id) ||
      (item.cartId ? suppliesByParentId.get(item.cartId) : []) ||
      [];

    // If explicit supplies were provided in the cart/order, use them exclusively!
    // Otherwise fallback to blueprint supplies defined on the service.
    const suppliesToUse = explicitSupplies.length > 0 ? explicitSupplies : item.supplies;

    const rootItem: ParsedTicketItem = {
      id: item.id,
      cartId: item.cartId,
      type: item.type,
      name: item.name,
      qty: item.qty,
      price: item.price,
      subtotal: item.subtotal,
      isService: item.isService,
      supplies: suppliesToUse,
    };

    if (item.isService) {
      lastServiceItem = rootItem;
    }

    rootItems.push(rootItem);
  });

  // If there are orphaned supplies without explicit parentCartId and we had a preceding service, attach them
  if (orphanedSupplies.length > 0) {
    if (lastServiceItem) {
      const existingNames = new Set((lastServiceItem as ParsedTicketItem).supplies.map((s) => s.name.toLowerCase()));
      orphanedSupplies.forEach((sup) => {
        if (!existingNames.has(sup.name.toLowerCase())) {
          (lastServiceItem as ParsedTicketItem).supplies.push(sup);
          existingNames.add(sup.name.toLowerCase());
        }
      });
    } else {
      orphanedSupplies.forEach((sup, sIdx) => {
        rootItems.push({
          id: `orphaned-${sIdx}`,
          type: 'product',
          name: sup.name,
          qty: sup.qty,
          price: sup.price,
          subtotal: sup.subtotal,
          isService: false,
          supplies: [],
        });
      });
    }
  }

  return rootItems;
}
