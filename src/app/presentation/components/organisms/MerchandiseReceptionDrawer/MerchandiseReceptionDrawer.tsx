import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Icon,
  Modal,
  KbdBadge,
  TextInput,
  SearchableSelect,
  PrimaryButton,
  SecondaryButton,
  Badge,
  Box,
  Flex,
  Stack,
  Text,
  Heading,
} from '@/app/presentation/components';
import type { Brand, Category, Product, Provider } from '@/app/domain';
import { APIInventoryRepository } from '@/app/data';
import { useAuthStore } from '@/app/presentation/stores';
import { useBarcodeScanner } from '@/core/hooks';
import { findClosestProduct, type ClosestProductMatch } from '@/core/utils/levenshtein';
import { QuickAddProductModal } from './QuickAddProductModal';
import { cn } from '@/core/utils/cn';

const inventoryRepo = new APIInventoryRepository();

export interface ReceptionArticleItem {
  id: string; // movement id
  productId: string;
  productName: string;
  sku?: string;
  unit?: string;
  photo?: string;
  brandName?: string;
  categoryName?: string;
  costPrice?: number;
  sellingPrice?: number;
  quantity: number;
  previousStock: number;
  newStock: number;
  providerName?: string;
  reason?: string;
  timestamp: Date;
}

export interface MerchandiseReceptionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  providers: Provider[];
  categories?: Category[];
  brands?: Brand[];
  activeBranchName: string;
  activeBranchId?: string | null;
  initialProductId?: string;
  onStockUpdated: () => void;
}

export const MerchandiseReceptionDrawer: React.FC<MerchandiseReceptionDrawerProps> = ({
  isOpen,
  onClose,
  products,
  providers,
  categories = [],
  brands = [],
  activeBranchName,
  activeBranchId,
  initialProductId,
  onStockUpdated,
}) => {
  const accessToken = useAuthStore((s) => s.accessToken);

  // Local products list (to immediately reflect newly created products in this session)
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('Ingreso Manual de Mercancía');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // 🌟 SESSION ONLY ITEMS: Pure list of items entered in this intake batch
  const [sessionItems, setSessionItems] = useState<ReceptionArticleItem[]>([]);

  // Success Feedback State
  const [lastSuccess, setLastSuccess] = useState<{
    productName: string;
    sku?: string;
    quantity: number;
    unit?: string;
    newStock: number;
    photo?: string;
  } | null>(null);

  // Missing product prompt & closest match state
  const [missingProductInfo, setMissingProductInfo] = useState<{
    query: string;
    closestMatch: ClosestProductMatch | null;
  } | null>(null);

  // Quick Add Product Modal state
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);

  // Exit / Finish Reception Confirmation Modal State
  const [showFinishConfirmModal, setShowFinishConfirmModal] = useState(false);

  // Deletion Confirmation Modal State
  const [itemToDelete, setItemToDelete] = useState<ReceptionArticleItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletionSuccessNotice, setDeletionSuccessNotice] = useState<string | null>(null);

  // Scan feedback toast and timer
  const [scanNotice, setScanNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Click outside listener to close product combobox dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Audio feedback for barcode gun
  const playBeep = (isSuccess: boolean) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.09);
      } else {
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // AudioContext blocked or unsupported
    }
  };

  // Reset all session state cleanly
  const resetSessionClean = useCallback(() => {
    setSessionItems([]);
    setSelectedProductId('');
    setProductSearchTerm('');
    setIsProductDropdownOpen(false);
    setQuantity(1);
    setLastSuccess(null);
    setMissingProductInfo(null);
    setFormErrors({});
    setDeletionSuccessNotice(null);
    setScanNotice(null);
    setShowFinishConfirmModal(false);
  }, []);

  // Handle request to close or finish reception
  const handleRequestClose = useCallback(() => {
    if (sessionItems.length > 0) {
      setShowFinishConfirmModal(true);
    } else {
      resetSessionClean();
      onClose();
    }
  }, [sessionItems.length, resetSessionClean, onClose]);

  // Handle confirm finish & exit
  const handleConfirmFinishAndExit = () => {
    resetSessionClean();
    onClose();
    onStockUpdated();
  };

  // Initialize or reset when drawer opens
  useEffect(() => {
    if (isOpen) {
      setFormErrors({});
      setDeleteError(null);
      setMissingProductInfo(null);
      if (initialProductId) {
        setSelectedProductId(initialProductId);
        const initProd = localProducts.find((p) => p.id === initialProductId);
        if (initProd) {
          setProductSearchTerm(initProd.sku ? `[${initProd.sku}] ${initProd.name}` : initProd.name);
        }
      }
    } else {
      resetSessionClean();
    }
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [isOpen, initialProductId, localProducts, resetSessionClean]);

  // Handle ESC and global Enter keyboard shortcuts
  const handleRegisterMovementRef = useRef<((e?: React.FormEvent) => Promise<void>) | null>(null);

  useEffect(() => {
    if (!isOpen || itemToDelete || isQuickAddModalOpen || showFinishConfirmModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestClose();
      } else if (e.key === 'Enter') {
        // If user is inside the product search input and product is NOT selected yet, let combobox handler run
        if (
          document.activeElement === productInputRef.current &&
          !selectedProductId
        ) {
          return;
        }

        // Avoid intercepting if inside a textarea or interactive button (unless submit button)
        const activeTag = document.activeElement?.tagName;
        if (
          activeTag === 'TEXTAREA' ||
          (activeTag === 'BUTTON' && (document.activeElement as HTMLButtonElement).type !== 'submit')
        ) {
          return;
        }

        e.preventDefault();
        handleRegisterMovementRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    itemToDelete,
    isQuickAddModalOpen,
    showFinishConfirmModal,
    handleRequestClose,
    selectedProductId,
  ]);

  // Barcode Scanner integration for continuous scanning in drawer
  useBarcodeScanner({
    onScan: async (barcode) => {
      if (!accessToken || !isOpen || isQuickAddModalOpen) return;
      const cleanCode = barcode.trim().toLowerCase();

      let matched = localProducts.find(
        (p) =>
          p.sku?.toLowerCase() === cleanCode ||
          p.id.toLowerCase() === cleanCode
      );

      if (!matched) {
        try {
          const remoteProd = await inventoryRepo.getProductBySku(accessToken, barcode.trim());
          if (remoteProd) {
            matched = remoteProd;
            setLocalProducts((prev) => [remoteProd, ...prev]);
          }
        } catch {
          // not found in remote
        }
      }

      if (matched) {
        playBeep(true);
        setMissingProductInfo(null);
        setSelectedProductId(matched.id);
        setProductSearchTerm(matched.sku ? `[${matched.sku}] ${matched.name}` : matched.name);
        setIsProductDropdownOpen(false);

        if (selectedProductId === matched.id) {
          // If already selected, scanning again increments quantity (+1 per trigger pull)
          setQuantity((q) => q + 1);
          setScanNotice({
            message: `+1 pieza sumada a "${matched.name}" (Total: ${quantity + 1})`,
            type: 'success',
          });
        } else {
          setQuantity(1);
          setScanNotice({
            message: `Detectado: [${matched.sku || 'SKU'}] ${matched.name}`,
            type: 'success',
          });
        }
        if (formErrors.productId) {
          setFormErrors((prev) => ({ ...prev, productId: '' }));
        }
      } else {
        // Product does not exist! Compute closest match
        playBeep(false);
        setProductSearchTerm(barcode.trim());
        const closestMatch = findClosestProduct(barcode.trim(), localProducts);
        setMissingProductInfo({
          query: barcode.trim(),
          closestMatch,
        });
        setIsProductDropdownOpen(true);
        setScanNotice({
          message: `Código no encontrado: "${barcode.trim()}"`,
          type: 'error',
        });
      }

      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      scanTimerRef.current = setTimeout(() => {
        setScanNotice(null);
      }, 4000);
    },
    enabled: isOpen && !isQuickAddModalOpen,
  });

  // Filter matching products as user types manually (strictly by Name or SKU, never DB UUID)
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) {
      return localProducts.slice(0, 10);
    }
    const q = productSearchTerm.trim().toLowerCase();
    return localProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [localProducts, productSearchTerm]);

  // Reset highlightedIndex when filteredProducts changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredProducts]);

  // Compute closest match if user typed something with 0 exact matches
  const dynamicClosestMatch = useMemo(() => {
    if (filteredProducts.length > 0 || !productSearchTerm.trim()) return null;
    return findClosestProduct(productSearchTerm.trim(), localProducts);
  }, [filteredProducts.length, productSearchTerm, localProducts]);

  // Selected product details
  const selectedProduct = useMemo(() => {
    return localProducts.find((p) => p.id === selectedProductId);
  }, [localProducts, selectedProductId]);

  const selectedProvider = useMemo(() => {
    return providers.find((pr) => pr.id === selectedProviderId);
  }, [providers, selectedProviderId]);

  // Provider select options
  const providerOptions = useMemo(() => {
    return providers.map((pr) => ({
      id: pr.id,
      name: pr.name + (pr.providerCode ? ` (${pr.providerCode})` : ''),
    }));
  }, [providers]);

  // Handle register movement
  const handleRegisterMovement = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let targetProdId = selectedProductId;

    // Auto-select if there's an exact match by SKU or Name in catalog, or exactly 1 match in filtered products
    if (!targetProdId && productSearchTerm.trim()) {
      const q = productSearchTerm.trim().toLowerCase();
      const exact = localProducts.find(
        (p) => p.sku?.toLowerCase() === q || p.name.toLowerCase() === q
      );
      if (exact) {
        targetProdId = exact.id;
        setSelectedProductId(exact.id);
      } else if (filteredProducts.length === 1) {
        targetProdId = filteredProducts[0].id;
        setSelectedProductId(targetProdId);
      }
    }

    const errors: { [key: string]: string } = {};
    if (!targetProdId) {
      errors.productId = 'Debes seleccionar o registrar un producto primero';
      if (productSearchTerm.trim()) {
        const closest = findClosestProduct(productSearchTerm.trim(), localProducts);
        setMissingProductInfo({ query: productSearchTerm.trim(), closestMatch: closest });
      }
    }
    if (!quantity || quantity <= 0) errors.quantity = 'La cantidad debe ser mayor a 0';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!accessToken) return;

    try {
      setSubmitting(true);
      setFormErrors({});
      setDeletionSuccessNotice(null);
      setMissingProductInfo(null);

      const targetProd = localProducts.find((p) => p.id === targetProdId);

      const created = await inventoryRepo.createMovement(accessToken, {
        productId: targetProdId,
        quantity,
        type: 'in',
        reason: reason.trim() || 'Ingreso Manual de Mercancía',
        providerId: selectedProviderId.trim() ? selectedProviderId : undefined,
        branchId: activeBranchId || undefined,
      });

      const currentStock = targetProd?.stock || 0;
      const newStock = currentStock + quantity;

      // Update local product stock
      setLocalProducts((prev) =>
        prev.map((p) => (p.id === targetProdId ? { ...p, stock: newStock } : p))
      );

      // Add to Session Registered Items (placed at top of right column)
      const newArticle: ReceptionArticleItem = {
        id: created.id,
        productId: targetProdId,
        productName: targetProd?.name || 'Producto',
        sku: targetProd?.sku,
        unit: targetProd?.unit || 'pza',
        photo: targetProd?.photos?.[0],
        brandName: targetProd?.brand?.name,
        categoryName: targetProd?.category?.name,
        costPrice: targetProd?.costPrice,
        sellingPrice: targetProd?.sellingPrice,
        quantity,
        previousStock: currentStock,
        newStock,
        providerName: selectedProvider?.name,
        reason: reason.trim() || 'Ingreso Manual de Mercancía',
        timestamp: new Date(),
      };

      setSessionItems((prev) => [newArticle, ...prev]);

      // Set prominent success banner
      setLastSuccess({
        productName: targetProd?.name || 'Producto',
        sku: targetProd?.sku,
        quantity,
        unit: targetProd?.unit || 'pza',
        newStock,
        photo: targetProd?.photos?.[0],
      });

      // Clear product input so user can type/scan the next one, keep provider
      setSelectedProductId('');
      setProductSearchTerm('');
      setIsProductDropdownOpen(false);
      setQuantity(1);

      // Refresh parent page inventory data
      onStockUpdated();

      // Auto dismiss success notice after 8 seconds
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setLastSuccess(null);
      }, 8000);

      // Return focus to product input for rapid continuous scanning/typing
      setTimeout(() => {
        productInputRef.current?.focus();
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el ingreso';
      setFormErrors({ general: msg });
    } finally {
      setSubmitting(false);
    }
  };
  handleRegisterMovementRef.current = handleRegisterMovement;

  // Handle confirm delete movement
  const handleConfirmDelete = async () => {
    if (!itemToDelete || !accessToken || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await inventoryRepo.deleteMovement(accessToken, itemToDelete.id);

      setDeletionSuccessNotice(
        `Se eliminó el ingreso y se descontaron -${itemToDelete.quantity} ${itemToDelete.unit || 'un.'} de "${itemToDelete.productName}".`
      );

      // Remove from session items list
      setSessionItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));

      // Revert stock on local product
      setLocalProducts((prev) =>
        prev.map((p) =>
          p.id === itemToDelete.productId
            ? { ...p, stock: Math.max(0, (p.stock || 0) - itemToDelete.quantity) }
            : p
        )
      );

      setItemToDelete(null);
      onStockUpdated();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Error al eliminar el ingreso. Verifique el stock restante del producto.';
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Handle select product from dropdown or closest match
  const handleSelectProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setProductSearchTerm(prod.sku ? `[${prod.sku}] ${prod.name}` : prod.name);
    setIsProductDropdownOpen(false);
    setMissingProductInfo(null);
    playBeep(true);
    if (formErrors.productId) {
      setFormErrors((prev) => ({ ...prev, productId: '' }));
    }
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 100);
  };

  // Handle newly created product from QuickAddProductModal
  const handleProductCreated = (newProd: Product) => {
    setLocalProducts((prev) => [newProd, ...prev]);
    setSelectedProductId(newProd.id);
    setProductSearchTerm(newProd.sku ? `[${newProd.sku}] ${newProd.name}` : newProd.name);
    setIsProductDropdownOpen(false);
    setMissingProductInfo(null);
    setQuantity(1);
    setScanNotice({
      message: `¡Producto "${newProd.name}" registrado exitosamente! Listo para recibir`,
      type: 'success',
    });
    playBeep(true);
    onStockUpdated();
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 150);
  };

  // Aggregate stats for current session
  const sessionTotalItems = sessionItems.length;
  const sessionTotalUnits = useMemo(() => {
    return sessionItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
  }, [sessionItems]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[998] transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!itemToDelete && !isQuickAddModalOpen && !showFinishConfirmModal) {
            handleRequestClose();
          }
        }}
      />

      {/* Main Drawer Panel */}
      <aside className="fixed top-0 right-0 bottom-0 w-[1180px] max-w-[96vw] bg-base-100 border-l border-base-300 shadow-2xl z-[999] flex flex-col animate-slide-in-right overflow-hidden">
        {/* Drawer Header */}
        <header className="p-4 px-6 border-b border-base-300 flex justify-between items-center bg-base-200/60 shrink-0">
          <Flex align="center" gap="md">
            <Flex
              align="center"
              justify="center"
              className="w-10 h-10 rounded-xl bg-success/15 border border-success/30 text-success shadow-xs"
            >
              <Icon name="PackagePlus" size="md" />
            </Flex>
            <div>
              <Heading level={4} className="font-bold text-base-content m-0 flex items-center gap-2">
                Ingreso y Recepción de Mercancía
              </Heading>
              <Flex align="center" gap="xs" className="mt-0.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <Text size="xs" color="muted">
                  Sucursal destino: <strong className="text-base-content">{activeBranchName}</strong>
                </Text>
              </Flex>
            </div>
          </Flex>

          <Flex align="center" gap="sm">
            {sessionTotalItems > 0 && (
              <button
                type="button"
                onClick={handleRequestClose}
                className="btn btn-sm btn-primary font-bold shadow-xs text-xs flex items-center gap-1.5 mr-2"
              >
                <Icon name="CheckCheck" size="xs" />
                Terminar de registrar ({sessionTotalItems})
              </button>
            )}
            <KbdBadge keys="Esc" className="opacity-75 text-[11px]" />
            <button
              onClick={handleRequestClose}
              className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
              title="Cerrar (Esc)"
            >
              <Icon name="X" size="sm" />
            </button>
          </Flex>
        </header>

        {/* Deletion success notice inside drawer */}
        {deletionSuccessNotice && (
          <Box className="mx-6 mt-4 p-3.5 bg-warning/15 border border-warning/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
            <Flex align="center" gap="sm">
              <Icon name="CheckCircle2" size="sm" className="text-warning shrink-0" />
              <span>{deletionSuccessNotice}</span>
            </Flex>
            <button
              onClick={() => setDeletionSuccessNotice(null)}
              className="text-base-content/60 hover:text-base-content p-1"
            >
              <Icon name="X" size="xs" />
            </button>
          </Box>
        )}

        {/* 2-Column Content Body */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 bg-base-100">
          {/* ── LEFT COLUMN: Fast-capture Form ── */}
          <section className="lg:col-span-5 flex flex-col gap-4">
            <Box className="bg-base-200/50 p-5 rounded-2xl border border-base-300 shadow-sm flex flex-col h-full">
              <Flex justify="between" align="center" className="mb-4 pb-3 border-b border-base-300">
                <Flex align="center" gap="sm">
                  <Icon name="PlusCircle" size="sm" className="text-primary" />
                  <Heading level={5} className="font-bold text-base m-0">
                    1. Registrar Entrada
                  </Heading>
                </Flex>
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/15 border border-success/30 text-success text-[11px] font-mono font-bold"
                    title="Pistola lectora activa: Puedes escanear códigos de barra en cualquier momento"
                  >
                    <Icon name="Barcode" size="xs" />
                    Pistola lista
                  </span>
                </div>
              </Flex>

              {/* ⚡ Instant Barcode Scanner Feedback Notice ⚡ */}
              {scanNotice && (
                <div
                  className={cn(
                    'mb-3 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-xs animate-in zoom-in-95 duration-150',
                    scanNotice.type === 'success'
                      ? 'bg-success/15 border-success/40 text-success'
                      : 'bg-error/15 border-error/40 text-error'
                  )}
                >
                  <Flex align="center" gap="sm">
                    <Icon name={scanNotice.type === 'success' ? 'Barcode' : 'AlertCircle'} size="sm" />
                    <span>{scanNotice.message}</span>
                  </Flex>
                  <button
                    type="button"
                    onClick={() => setScanNotice(null)}
                    className="p-1 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <Icon name="X" size="xs" />
                  </button>
                </div>
              )}


              {/* 🌟 VIBRANT SUCCESS BANNER: Explicit confirmation of successful registration 🌟 */}
              {lastSuccess && (
                <Box className="mb-4 p-3.5 rounded-xl bg-success/15 border-2 border-success/40 text-base-content shadow-sm animate-in zoom-in-95 duration-200">
                  <Flex align="start" justify="between" gap="sm">
                    <Flex align="start" gap="sm">
                      {lastSuccess.photo ? (
                        <img
                          src={lastSuccess.photo}
                          alt={lastSuccess.productName}
                          className="w-11 h-11 rounded-lg object-cover border border-success/40 shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-success text-success-content flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Icon name="Check" size="sm" />
                        </div>
                      )}
                      <div>
                        <Text weight="bold" className="text-success text-xs block leading-tight">
                          ¡Ingreso registrado exitosamente!
                        </Text>
                        <Text size="xs" className="text-base-content font-medium mt-0.5 leading-snug">
                          Se agregaron{' '}
                          <span className="font-extrabold text-success font-mono text-xs">
                            +{lastSuccess.quantity} {lastSuccess.unit}
                          </span>{' '}
                          al inventario:
                        </Text>
                        <Text size="xs" weight="bold" className="text-base-content mt-0.5 block truncate max-w-[260px]">
                          {lastSuccess.sku ? `[${lastSuccess.sku}] ` : ''}
                          {lastSuccess.productName}
                        </Text>
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-success/20 border border-success/30 text-success text-[11px] font-bold">
                          <Icon name="Boxes" size="xs" />
                          Nuevo stock total: {lastSuccess.newStock} {lastSuccess.unit}
                        </div>
                      </div>
                    </Flex>
                    <button
                      onClick={() => setLastSuccess(null)}
                      className="text-base-content/50 hover:text-base-content p-1 rounded-md transition-colors"
                      title="Descartar aviso"
                    >
                      <Icon name="X" size="xs" />
                    </button>
                  </Flex>
                </Box>
              )}

              {/* General Form Error Banner */}
              {formErrors.general && (
                <Box className="mb-4 p-3 bg-error/15 border border-error/30 rounded-xl text-error text-xs font-semibold flex items-center gap-2">
                  <Icon name="AlertCircle" size="sm" className="shrink-0" />
                  <span>{formErrors.general}</span>
                </Box>
              )}

              {/* Form Controls */}
              <form onSubmit={handleRegisterMovement} className="flex flex-col gap-4 flex-1">
                {/* Provider Selector */}
                <Box>
                  <Text as="label" size="xs" weight="bold" className="block mb-1.5 text-base-content/80">
                    Proveedor (Opcional)
                  </Text>
                  <SearchableSelect
                    options={providerOptions}
                    value={selectedProviderId}
                    onChange={(id) => setSelectedProviderId(id)}
                    placeholder="Seleccionar proveedor de la remisión..."
                    size="sm"
                  />
                </Box>

                {/* 🌟 DIRECT COMBOBOX: Type manually, see live matches, or detect non-existent products 🌟 */}
                <Box className="relative" ref={comboboxRef}>
                  <Flex justify="between" align="center" className="mb-1.5">
                    <Text as="label" size="xs" weight="bold" className="text-base-content/80">
                      Producto a Ingresar <span className="text-error">*</span>
                    </Text>
                    {selectedProduct ? (
                      <span className="text-[11px] font-medium text-base-content/60">
                        Stock actual:{' '}
                        <strong className="text-primary font-mono">{selectedProduct.stock ?? 0}</strong>{' '}
                        {selectedProduct.unit || 'pza'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-base-content/50">
                        Escribe o escanea cualquier código
                      </span>
                    )}
                  </Flex>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/40 z-10">
                      <Icon name="Search" size="xs" />
                    </span>
                    <input
                      ref={productInputRef}
                      type="text"
                      placeholder="Escribe SKU, nombre o escanea código de barras..."
                      value={productSearchTerm}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProductSearchTerm(val);
                        setIsProductDropdownOpen(true);
                        if (selectedProductId) setSelectedProductId('');
                        if (formErrors.productId) setFormErrors((p) => ({ ...p, productId: '' }));
                      }}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setIsProductDropdownOpen(true);
                          if (filteredProducts.length > 0) {
                            setHighlightedIndex((prev) => (prev + 1) % filteredProducts.length);
                          }
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setIsProductDropdownOpen(true);
                          if (filteredProducts.length > 0) {
                            setHighlightedIndex((prev) => (prev <= 0 ? filteredProducts.length - 1 : prev - 1));
                          }
                        } else if (e.key === 'Escape') {
                          setIsProductDropdownOpen(false);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();

                          // If product is already selected, Enter triggers registration!
                          if (selectedProductId) {
                            handleRegisterMovement();
                            return;
                          }

                          // Check if there is an exact match by SKU or Name in catalog
                          const q = productSearchTerm.trim().toLowerCase();
                          const exact = localProducts.find(
                            (p) => p.sku?.toLowerCase() === q || p.name.toLowerCase() === q
                          );
                          if (exact) {
                            handleSelectProduct(exact);
                            return;
                          }

                          if (filteredProducts.length > 0) {
                            // Shortcut: Select highlighted or first matching product
                            const target =
                              filteredProducts[
                                highlightedIndex >= 0 && highlightedIndex < filteredProducts.length
                                  ? highlightedIndex
                                  : 0
                              ];
                            if (target) {
                              handleSelectProduct(target);
                            }
                          } else if (filteredProducts.length === 0 && productSearchTerm.trim()) {
                            // Shortcut: Open Quick Add modal right away
                            setIsProductDropdownOpen(false);
                            setIsQuickAddModalOpen(true);
                          }
                        }
                      }}
                      className={cn(
                        'input input-sm w-full bg-base-100 border border-base-300 rounded-xl pl-9 pr-8 text-xs font-medium focus:border-primary focus:outline-none transition-all shadow-xs',
                        formErrors.productId && 'border-error text-error',
                        selectedProduct && 'border-primary/50 bg-primary/5 font-semibold text-base-content'
                      )}
                    />
                    {productSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearchTerm('');
                          setSelectedProductId('');
                          setMissingProductInfo(null);
                          setIsProductDropdownOpen(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content p-0.5 rounded z-10"
                        title="Limpiar"
                      >
                        <Icon name="X" size="xs" />
                      </button>
                    )}
                  </div>

                  {formErrors.productId && (
                    <Text size="xs" color="error" className="mt-1 block font-medium">
                      {formErrors.productId}
                    </Text>
                  )}

                  {/* Live Dropdown Options & Non-existent / Closest Match Card */}
                  {isProductDropdownOpen && !selectedProductId && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-base-100 border border-base-300 rounded-xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-base-200 animate-in fade-in zoom-in-95 duration-150">
                      {filteredProducts.length > 0 ? (
                        <>
                          <div className="p-2 px-3 text-[10px] font-bold uppercase tracking-wider text-base-content/50 bg-base-200/50 flex items-center justify-between">
                            <span>
                              {productSearchTerm.trim()
                                ? `Coincidencias encontradas (${filteredProducts.length})`
                                : 'Productos del catálogo'}
                            </span>
                            <span className="text-[9px] font-normal lowercase opacity-70">
                              Usa ↑ ↓ y Enter
                            </span>
                          </div>
                          {filteredProducts.map((p, idx) => {
                            const isHighlighted = highlightedIndex === idx;
                            return (
                              <div
                                key={p.id}
                                onClick={() => handleSelectProduct(p)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                className={cn(
                                  'p-2.5 px-3 cursor-pointer transition-colors flex items-center justify-between gap-2',
                                  isHighlighted
                                    ? 'bg-primary/10 border-l-4 border-primary pl-2'
                                    : 'hover:bg-base-200/70'
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {p.photos?.[0] ? (
                                    <img
                                      src={p.photos[0]}
                                      alt={p.name}
                                      className="w-8 h-8 rounded-lg object-cover border border-base-300 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center text-base-content/40 shrink-0">
                                      <Icon name="Package" size="xs" />
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      {p.sku && (
                                        <span className="font-mono text-[10px] font-bold bg-base-200 px-1 py-0.2 rounded border border-base-300">
                                          {p.sku}
                                        </span>
                                      )}
                                      <span className="text-xs font-semibold text-base-content truncate">
                                        {p.name}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-base-content/50 block truncate">
                                      {p.brand?.name ? `${p.brand.name} • ` : ''}
                                      {p.category?.name || ''}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isHighlighted && (
                                    <span className="text-[10px] text-primary font-mono font-bold bg-primary/15 px-1.5 py-0.5 rounded border border-primary/25">
                                      ↵ Enter
                                    </span>
                                  )}
                                  <Badge variant="primary" size="xs" className="font-mono font-bold">
                                    Stock: {p.stock ?? 0} {p.unit || 'pza'}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        /* NO EXACT MATCHES: Render "Producto parece no existir" + Closest Match right inside dropdown! */
                        <div className="p-4 bg-amber-500/10 dark:bg-amber-500/15 border-t border-amber-500/20 text-base-content space-y-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                              <Icon name="AlertTriangle" size="xs" />
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-amber-700 dark:text-amber-300 block leading-tight">
                                Producto parece no existir, ¿deseas agregarlo?
                              </strong>
                              <p className="text-[11px] text-base-content/80 mt-1">
                                No encontramos ningún producto con:{' '}
                                <strong className="font-mono text-base-content bg-base-200 dark:bg-base-300 px-1.5 py-0.5 rounded border border-base-300">
                                  "{productSearchTerm.trim()}"
                                </strong>
                              </p>
                            </div>
                          </div>

                          {/* Closest Match suggestion ("por si se quedó a un número de ponerlo") */}
                          {dynamicClosestMatch && (
                            <div className="p-2.5 rounded-lg bg-base-100/90 dark:bg-base-200 border border-base-300 shadow-xs">
                              <span className="text-[10px] font-bold text-base-content/70 uppercase tracking-wider block mb-1">
                                ¿Quisiste decir este producto?
                              </span>
                              <div className="flex items-center justify-between gap-2">
                                <div className="truncate mr-1">
                                  <span className="font-mono text-[11px] font-bold bg-base-200 dark:bg-base-300 px-1 py-0.5 rounded mr-1 border border-base-300">
                                    {dynamicClosestMatch.product.sku}
                                  </span>
                                  <strong className="text-xs text-base-content">
                                    {dynamicClosestMatch.product.name}
                                  </strong>
                                  <span className="text-[10px] text-base-content/60 block">
                                    Stock: {dynamicClosestMatch.product.stock}{' '}
                                    {dynamicClosestMatch.product.unit || 'pza'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSelectProduct(dynamicClosestMatch.product)}
                                  className="btn btn-xs btn-primary shrink-0 font-bold shadow-xs"
                                >
                                  Seleccionar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Action button to create right here without closing session */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsProductDropdownOpen(false);
                              setIsQuickAddModalOpen(true);
                            }}
                            className="btn btn-sm btn-primary w-full font-bold shadow-sm flex items-center justify-center gap-1.5 text-xs"
                          >
                            <Icon name="Plus" size="xs" />
                            <span>Registrar producto nuevo "{productSearchTerm.trim()}"</span>
                            <kbd className="kbd kbd-xs bg-primary-content/20 text-primary-content border-none font-mono ml-1">
                              ↵ Enter
                            </kbd>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ⚠️ Inline Non-existent Product notice when input has text but product doesn't exist (visible only when dropdown is closed) ⚠️ */}
                  {!isProductDropdownOpen && !selectedProductId && productSearchTerm.trim().length > 0 && filteredProducts.length === 0 && (
                    <Box className="mt-2.5 p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/30 text-base-content shadow-xs animate-in fade-in zoom-in-95 duration-150">
                      <Flex align="start" gap="sm">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          <Icon name="AlertTriangle" size="xs" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text weight="bold" className="text-amber-700 dark:text-amber-300 text-xs block leading-tight">
                            Producto parece no existir, ¿deseas agregarlo?
                          </Text>
                          <Text size="xs" className="text-base-content/80 mt-1 block">
                            No encontramos ningún producto con:{' '}
                            <strong className="font-mono text-base-content bg-base-100 dark:bg-base-200 px-1.5 py-0.5 rounded border border-base-300">
                              "{productSearchTerm.trim()}"
                            </strong>
                          </Text>

                          {/* Closest Match Suggestion ("por si se quedó a un número de ponerlo") */}
                          {dynamicClosestMatch && (
                            <div className="mt-2.5 p-2 rounded-lg bg-base-100 dark:bg-base-200 border border-base-300 shadow-xs">
                              <Text size="xs" weight="bold" className="text-base-content/70 block mb-1 text-[11px]">
                                ¿Quisiste decir este producto? (Coincidencia más cercana)
                              </Text>
                              <Flex justify="between" align="center" gap="xs">
                                <div className="truncate mr-2">
                                  <span className="font-mono text-[11px] font-bold bg-base-200 dark:bg-base-300 px-1 py-0.5 rounded mr-1.5 border border-base-300">
                                    {dynamicClosestMatch.product.sku}
                                  </span>
                                  <strong className="text-xs text-base-content">
                                    {dynamicClosestMatch.product.name}
                                  </strong>
                                  <span className="text-[10px] text-base-content/60 block">
                                    Stock actual: {dynamicClosestMatch.product.stock}{' '}
                                    {dynamicClosestMatch.product.unit || 'pza'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSelectProduct(dynamicClosestMatch.product)}
                                  className="btn btn-xs btn-outline btn-primary shrink-0 font-bold"
                                >
                                  Seleccionar
                                </button>
                              </Flex>
                            </div>
                          )}

                          {/* Action buttons */}
                          <Flex gap="xs" className="mt-2.5" align="center">
                            <PrimaryButton
                              size="xs"
                              type="button"
                              onClick={() => {
                                setIsProductDropdownOpen(false);
                                setIsQuickAddModalOpen(true);
                              }}
                              className="font-bold flex items-center gap-1.5 shadow-xs"
                            >
                              <Icon name="Plus" size="xs" />
                              <span>Registrar producto nuevo</span>
                              <kbd className="kbd kbd-xs bg-primary-content/20 text-primary-content border-none font-mono">
                                ↵ Enter
                              </kbd>
                            </PrimaryButton>
                            <button
                              type="button"
                              onClick={() => {
                                setProductSearchTerm('');
                                setSelectedProductId('');
                                setIsProductDropdownOpen(false);
                                setMissingProductInfo(null);
                              }}
                              className="btn btn-xs btn-ghost text-base-content/60"
                            >
                              Limpiar
                            </button>
                          </Flex>
                        </div>
                      </Flex>
                    </Box>
                  )}

                  {/* Selected Product Pill Preview */}
                  {selectedProduct && (
                    <Box className="mt-2.5 p-3 bg-base-100 rounded-xl border border-primary/30 bg-primary/[0.02] flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedProduct.photos?.[0] ? (
                          <img
                            src={selectedProduct.photos[0]}
                            alt={selectedProduct.name}
                            className="w-11 h-11 rounded-lg object-cover border border-base-300 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center text-base-content/40 shrink-0">
                            <Icon name="Package" size="sm" />
                          </div>
                        )}
                        <div className="truncate">
                          <Text size="xs" weight="bold" className="block truncate text-base-content">
                            {selectedProduct.name}
                          </Text>
                          <Text size="xs" color="muted" className="font-mono text-[11px]">
                            SKU: {selectedProduct.sku || 'N/A'} •{' '}
                            {selectedProduct.category?.name || 'General'}
                          </Text>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-base-content/60 block">Stock actual</span>
                          <Badge variant="primary" size="sm" className="font-mono font-bold">
                            {selectedProduct.stock ?? 0} {selectedProduct.unit || 'pza'}
                          </Badge>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductId('');
                            setProductSearchTerm('');
                            setIsProductDropdownOpen(false);
                          }}
                          className="btn btn-xs btn-ghost btn-circle text-base-content/50 hover:text-error"
                          title="Cambiar producto"
                        >
                          <Icon name="X" size="xs" />
                        </button>
                      </div>
                    </Box>
                  )}
                </Box>

                {/* Quantity to Receive */}
                <Box>
                  <Flex justify="between" align="center" className="mb-1.5">
                    <Text as="label" size="xs" weight="bold" className="text-base-content/80">
                      Cantidad a Ingresar <span className="text-error">*</span>
                    </Text>
                    {selectedProduct && quantity > 0 && (
                      <span className="text-[11px] font-bold text-success font-mono">
                        Resultado: {(selectedProduct.stock ?? 0) + quantity} {selectedProduct.unit || 'pza'}
                      </span>
                    )}
                  </Flex>

                  <Flex gap="xs" align="center">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="btn btn-sm btn-outline btn-square text-base-content"
                      title="Restar 1"
                    >
                      -
                    </button>
                    <TextInput
                      ref={quantityInputRef}
                      size="sm"
                      placeholder="Cantidad..."
                      type="number"
                      min="1"
                      value={quantity.toString()}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setQuantity(isNaN(val) ? 0 : val);
                        if (formErrors.quantity) {
                          setFormErrors((prev) => ({ ...prev, quantity: '' }));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRegisterMovement();
                        }
                      }}
                      className="text-center font-mono font-bold text-base"
                      error={!!formErrors.quantity}
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="btn btn-sm btn-outline btn-square text-base-content"
                      title="Sumar 1"
                    >
                      +
                    </button>
                  </Flex>
                  {formErrors.quantity && (
                    <Text size="xs" color="error" className="mt-1 block font-medium">
                      {formErrors.quantity}
                    </Text>
                  )}

                  {/* Quick preset step buttons */}
                  <Flex gap="xs" className="mt-2" wrap>
                    <Text size="xs" color="muted" className="mr-1 self-center text-[10px] uppercase font-bold">
                      Rápidos:
                    </Text>
                    {[1, 5, 10, 20, 50, 100].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setQuantity(step)}
                        className={`btn btn-xs rounded-md border font-mono transition-colors ${
                          quantity === step
                            ? 'btn-primary text-primary-content font-bold'
                            : 'btn-ghost bg-base-100 hover:bg-base-300 border-base-300 text-base-content/80'
                        }`}
                      >
                        +{step}
                      </button>
                    ))}
                  </Flex>
                </Box>

                {/* Reason / Invoice Reference */}
                <Box>
                  <Text as="label" size="xs" weight="bold" className="block mb-1.5 text-base-content/80">
                    Motivo o Referencia de Remisión
                  </Text>
                  <TextInput
                    size="sm"
                    placeholder="Ej. Factura F-2045, Remisión, Ingreso Inicial..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRegisterMovement();
                      }
                    }}
                  />
                </Box>

                {/* Submit button */}
                <Box className="mt-auto pt-4">
                  <PrimaryButton
                    type="submit"
                    onClick={() => handleRegisterMovement()}
                    loading={submitting}
                    disabled={submitting}
                    className="w-full shadow-md py-3 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Icon name="Plus" size="sm" />
                    Registrar Ingreso de Mercancía
                    <KbdBadge keys="Enter ↵" className="ml-2" />
                  </PrimaryButton>
                  <Text size="xs" color="muted" className="text-center block mt-2 text-[11px]">
                    El producto ingresado aparecerá de inmediato a la derecha.
                  </Text>
                </Box>
              </form>
            </Box>
          </section>

          {/* ── RIGHT COLUMN: Strictly The Articles Just Entered in this session ── */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            <Box className="bg-base-200/50 p-5 rounded-2xl border border-base-300 shadow-sm flex flex-col h-full">
              {/* Header with Title and Live Counter */}
              <div className="mb-4 pb-3 border-b border-base-300 flex justify-between items-center wrap gap-sm">
                <div>
                  <Heading level={5} className="font-bold text-base m-0 flex items-center gap-2">
                    <Icon name="Boxes" size="sm" className="text-success" />
                    Artículos Ingresados en esta Recepción
                  </Heading>
                  <Text size="xs" color="muted" className="mt-0.5">
                    Conforme ingreses productos a la izquierda, aparecerán en esta lista
                  </Text>
                </div>

                {sessionTotalItems > 0 && (
                  <Badge variant="success" size="sm" className="font-mono font-bold text-xs py-1 px-3 shadow-xs">
                    +{sessionTotalUnits} unidades registradas
                  </Badge>
                )}
              </div>

              {/* Items List (Strictly this session) */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[calc(100vh-310px)]">
                {sessionItems.length === 0 ? (
                  /* ── CLEAN EMPTY STATE WHEN OPENING A FRESH SESSION ── */
                  <Box className="py-24 text-center bg-base-100/60 border border-dashed border-base-300 rounded-2xl p-8 flex flex-col items-center justify-center my-auto">
                    <div className="w-16 h-16 rounded-2xl bg-base-200 border border-base-300 flex items-center justify-center text-base-content/35 mb-3 shadow-inner">
                      <Icon name="PackageOpen" size={34} />
                    </div>
                    <Text weight="bold" className="text-base text-base-content block">
                      Recepción de mercancía limpia
                    </Text>
                    <Text size="xs" color="muted" className="mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Aquí se irán enlistando uno a uno los artículos que vayas ingresando en esta sesión.
                      Utiliza el buscador de la izquierda o tu pistola lectora de códigos de barras para comenzar.
                    </Text>
                  </Box>
                ) : (
                  /* ── RENDER SESSION ARTICLES ── */
                  sessionItems.map((item, idx) => {
                    const itemNumber = sessionItems.length - idx;
                    const timeFmt = item.timestamp.toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-success/40 ring-1 ring-success/20 bg-success/[0.02] shadow-sm hover:border-success transition-all duration-200 bg-base-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 animate-in fade-in slide-in-from-top-2 duration-300"
                      >
                        {/* Left: Thumbnail & Article Details */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Product Thumbnail */}
                          <div className="relative shrink-0">
                            {item.photo ? (
                              <img
                                src={item.photo}
                                alt={item.productName}
                                className="w-13 h-13 rounded-xl object-cover border border-base-300 shadow-xs"
                              />
                            ) : (
                              <div className="w-13 h-13 rounded-xl bg-base-200 border border-base-300 flex flex-col items-center justify-center text-base-content/40 shadow-inner">
                                <Icon name="Package" size="md" />
                                <span className="text-[9px] font-bold uppercase mt-0.5 text-base-content/50">
                                  {item.unit || 'pza'}
                                </span>
                              </div>
                            )}
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-success border-2 border-base-100"></span>
                            </span>
                          </div>

                          {/* Article Information */}
                          <div className="flex-1 min-w-0">
                            {/* Top row of metadata */}
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="badge badge-success badge-sm font-bold text-[10px] gap-1 shadow-xs">
                                <Icon name="Sparkles" size="xs" />
                                #{itemNumber} Ingresado
                              </span>

                              {item.sku && (
                                <span className="font-mono text-[11px] font-bold bg-base-200 text-base-content/85 px-1.5 py-0.5 rounded border border-base-300">
                                  {item.sku}
                                </span>
                              )}

                              {(item.brandName || item.categoryName) && (
                                <span className="text-[11px] text-base-content/60 font-medium truncate max-w-[160px]">
                                  {item.brandName ? `${item.brandName} • ` : ''}
                                  {item.categoryName}
                                </span>
                              )}

                              <span className="text-[11px] font-mono text-base-content/40 ml-auto">
                                {timeFmt}
                              </span>
                            </div>

                            {/* Product Name */}
                            <Text weight="bold" className="text-sm text-base-content block truncate leading-snug">
                              {item.productName}
                            </Text>

                            {/* Stock Transition & Provider / Reason */}
                            <div className="flex items-center gap-3 flex-wrap mt-1.5 text-xs text-base-content/70">
                              {/* Stock pill */}
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-base-200 border border-base-300 font-mono text-[11px]">
                                <span className="text-base-content/50">Stock:</span>
                                <span className="line-through text-base-content/40">{item.previousStock}</span>
                                <Icon name="ArrowRight" size="xs" className="text-success" />
                                <strong className="text-success font-bold">
                                  {item.newStock} {item.unit}
                                </strong>
                              </div>

                              {item.costPrice !== undefined && item.costPrice > 0 && (
                                <span className="text-[11px] font-mono text-base-content/60">
                                  Costo: ${item.costPrice.toFixed(2)}
                                </span>
                              )}

                              {item.providerName && (
                                <span className="text-[11px] text-base-content/70 inline-flex items-center gap-1 truncate max-w-[140px]">
                                  <Icon name="Truck" size="xs" className="text-base-content/40 shrink-0" />
                                  <span className="truncate">{item.providerName}</span>
                                </span>
                              )}

                              {item.reason && (
                                <span className="text-[11px] italic text-base-content/50 truncate max-w-[160px]">
                                  "{item.reason}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Quantity Badge & Delete/Revert Button */}
                        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <div className="px-3.5 py-1.5 rounded-xl bg-success/15 border border-success/30 text-success font-mono font-black text-sm flex items-center gap-1 shadow-xs">
                              <Icon name="Plus" size="xs" />
                              <span>{item.quantity}</span>
                              <span className="text-xs font-semibold opacity-90">{item.unit}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setItemToDelete(item);
                            }}
                            className="btn btn-sm btn-ghost btn-square text-error/70 hover:text-error hover:bg-error/10 transition-colors"
                            title="Eliminar este ingreso y descontar del stock"
                          >
                            <Icon name="Trash2" size="sm" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sticky Reception Summary Footer */}
              <div className="mt-4 pt-3 border-t border-base-300 bg-base-100 p-3.5 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs text-base-content/70 block">Artículos en esta recepción:</span>
                  <strong className="text-sm text-base-content">
                    {sessionTotalItems}{' '}
                    {sessionTotalItems === 1 ? 'artículo ingresado' : 'artículos ingresados'}
                  </strong>
                </div>

                <Flex align="center" gap="md">
                  <div className="text-right mr-2">
                    <span className="text-xs text-base-content/70 block">Total piezas:</span>
                    <span className="text-base font-mono font-extrabold text-success">
                      +{sessionTotalUnits} unidades
                    </span>
                  </div>

                  {sessionTotalItems > 0 && (
                    <PrimaryButton
                      size="sm"
                      onClick={handleRequestClose}
                      className="font-bold shadow-sm"
                    >
                      <Icon name="CheckCheck" size="xs" className="mr-1.5" />
                      Terminar de registrar productos
                    </PrimaryButton>
                  )}
                </Flex>
              </div>
            </Box>
          </section>
        </div>
      </aside>

      {/* ── MODAL: Confirm Delete / Revert Movement ── */}
      {itemToDelete && (
        <Modal
          isOpen={Boolean(itemToDelete)}
          onClose={() => {
            if (!deleting) setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="¿Revertir y eliminar ingreso de mercancía?"
          maxWidth="460px"
          footer={
            <>
              <SecondaryButton onClick={() => setItemToDelete(null)} disabled={deleting}>
                Cancelar
                <KbdBadge keys="Esc" className="ml-1.5" />
              </SecondaryButton>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="btn btn-error btn-sm font-bold text-white shadow-sm flex items-center gap-1.5"
              >
                {deleting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Icon name="Trash2" size="xs" />
                )}
                Sí, eliminar y descontar stock
                <KbdBadge keys="Enter ↵" className="ml-1.5" />
              </button>
            </>
          }
        >
          <Stack spacing="md">
            <Box className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs leading-relaxed flex items-start gap-2.5">
              <Icon name="AlertTriangle" size="sm" className="shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Advertencia de reversión de inventario:</strong>
                Esta acción descontará las unidades ingresadas del stock del producto en la sucursal{' '}
                <strong>{activeBranchName}</strong>.
              </div>
            </Box>

            {deleteError && (
              <Box className="p-3 bg-error/15 border border-error/30 rounded-xl text-error text-xs font-semibold">
                {deleteError}
              </Box>
            )}

            <Box className="bg-base-200 p-4 rounded-xl border border-base-300 space-y-2 text-xs">
              <Flex justify="between" align="center">
                <span className="text-base-content/60">Producto:</span>
                <strong className="text-base-content text-right max-w-[240px] truncate">
                  {itemToDelete.productName}
                </strong>
              </Flex>
              {itemToDelete.sku && (
                <Flex justify="between">
                  <span className="text-base-content/60">SKU:</span>
                  <span className="font-mono font-bold text-base-content">{itemToDelete.sku}</span>
                </Flex>
              )}
              <Flex justify="between">
                <span className="text-base-content/60">Cantidad a descontar:</span>
                <span className="font-mono font-bold text-error">
                  -{itemToDelete.quantity} {itemToDelete.unit || 'un.'}
                </span>
              </Flex>
              <Flex justify="between">
                <span className="text-base-content/60">Reversión estimada:</span>
                <span className="font-mono font-semibold text-base-content">
                  {itemToDelete.newStock} ➔ {itemToDelete.previousStock} {itemToDelete.unit}
                </span>
              </Flex>
              {itemToDelete.providerName && (
                <Flex justify="between">
                  <span className="text-base-content/60">Proveedor:</span>
                  <span className="text-base-content">{itemToDelete.providerName}</span>
                </Flex>
              )}
              {itemToDelete.reason && (
                <Flex justify="between">
                  <span className="text-base-content/60">Motivo original:</span>
                  <span className="text-base-content italic">{itemToDelete.reason}</span>
                </Flex>
              )}
            </Box>
          </Stack>
        </Modal>
      )}

      {/* ── MODAL: Confirm Terminate / Close Reception Batch ── */}
      {showFinishConfirmModal && (
        <Modal
          isOpen={showFinishConfirmModal}
          onClose={() => setShowFinishConfirmModal(false)}
          onConfirm={handleConfirmFinishAndExit}
          title="¿Deseas terminar de registrar productos?"
          maxWidth="540px"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full flex-wrap sm:flex-nowrap">
              <SecondaryButton
                size="sm"
                onClick={() => setShowFinishConfirmModal(false)}
                className="font-medium whitespace-nowrap"
              >
                Continuar registrando
                <KbdBadge keys="Esc" className="ml-1.5" />
              </SecondaryButton>
              <PrimaryButton
                size="sm"
                onClick={handleConfirmFinishAndExit}
                className="font-bold whitespace-nowrap"
              >
                <Icon name="CheckCheck" size="xs" className="mr-1" />
                Sí, terminar y cerrar
                <KbdBadge keys="Enter ↵" className="ml-1.5" />
              </PrimaryButton>
            </div>
          }
        >
          <Stack spacing="md">
            <Box className="p-3.5 bg-info/10 border border-info/30 rounded-xl text-base-content text-xs leading-relaxed flex items-start gap-3 shadow-xs">
              <Icon name="Info" size="sm" className="shrink-0 mt-0.5 text-info" />
              <div>
                Has registrado exitosamente{' '}
                <strong className="text-primary font-bold">
                  {sessionTotalItems} {sessionTotalItems === 1 ? 'producto' : 'productos'} (+{sessionTotalUnits} unidades)
                </strong>{' '}
                en esta recepción para la sucursal <strong className="text-base-content font-bold">{activeBranchName}</strong>.
              </div>
            </Box>

            <Text size="xs" variant="caption" className="text-base-content/75 leading-relaxed">
              Al terminar, los registros quedarán guardados en el inventario y la lista de esta recepción se
              cerrará limpiamente para que la próxima vez comiences desde cero.
            </Text>
          </Stack>
        </Modal>
      )}

      {/* ── MODAL: Quick Add Product ── */}
      {isQuickAddModalOpen && (
        <QuickAddProductModal
          isOpen={isQuickAddModalOpen}
          onClose={() => setIsQuickAddModalOpen(false)}
          initialSku={missingProductInfo?.query || productSearchTerm.trim()}
          initialName={missingProductInfo?.query || productSearchTerm.trim()}
          categories={categories}
          brands={brands}
          activeBranchId={activeBranchId}
          onProductCreated={handleProductCreated}
        />
      )}
    </>
  );
};
