import React, { useState, useEffect } from 'react';
import {
  Modal,
  Textarea,
  PrimaryButton,
  SecondaryButton,
  KbdBadge,
  Box,
  Flex,
  Text,
  Icon,
} from '@/app/presentation/components';
import type { AdminMaintenanceOrder } from '@/app/domain';
import { formatCurrency } from '@/core/utils';
import { cleanPhoneDigits } from '@/core/utils/formatters/formatPhoneNumber';
import { useActiveBranch } from '@/app/presentation/hooks';

export interface NotifyMaintenanceModalProps {
  isOpen: boolean;
  order: AdminMaintenanceOrder | null;
  onClose: () => void;
  onConfirm: (customNotes?: string, openWhatsApp?: boolean) => Promise<void>;
  loading: boolean;
}

export const NotifyMaintenanceModal: React.FC<NotifyMaintenanceModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirm,
  loading,
}) => {
  const { workshopName } = useActiveBranch();
  const [message, setMessage] = useState('');
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    if (order && !isEdited) {
      const laborFormatted = order.laborCost || order.laborPrice
        ? formatCurrency(order.laborCost || order.laborPrice || 0)
        : 'Por definir en caja';

      const workshopUpper = workshopName.toUpperCase();
      const defaultMsg = `*VEHÍCULO LISTO PARA ENTREGA - ${workshopUpper}* 🚗✨\n\nHola *${order.customer.name}*, le saludamos del *${workshopName}*. Le informamos que el servicio de *${order.serviceRequested || 'Mantenimiento General'}* para su vehículo *${order.vehicle.brand} ${order.vehicle.model}* (Serie: *${order.vehicle.serialNumberLastFour}*) ha concluido con éxito.\n\n💰 *Mano de obra estimada:* ${laborFormatted}\n📍 *Estatus:* Listo para ser entregado en sucursal.\n\n¡Ya puede pasar a recogerlo en nuestro horario de atención!`;
      setMessage(defaultMsg);
    }
  }, [order, isEdited, workshopName]);

  useEffect(() => {
    if (!isOpen) {
      setIsEdited(false);
    }
  }, [isOpen]);

  if (!order) return null;

  const phoneDigits = cleanPhoneDigits(order.customer.phone || '');
  const waUrl = phoneDigits ? `https://wa.me/52${phoneDigits}?text=${encodeURIComponent(message)}` : undefined;

  const handleSendWhatsAppAndRegister = async () => {
    if (waUrl) {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
    await onConfirm(message, true);
    onClose();
  };

  const handleRegisterOnly = async () => {
    await onConfirm(message, false);
    onClose();
  };

  const footer = (
    <Flex justify="between" align="center" className="w-full gap-2 flex-wrap">
      <SecondaryButton onClick={onClose} disabled={loading} size="sm">
        Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
      </SecondaryButton>

      <Flex gap="xs" align="center" className="flex-wrap">
        <SecondaryButton
          size="sm"
          onClick={handleRegisterOnly}
          disabled={loading}
          loading={loading}
          title="Registrar aviso en sistema sin abrir WhatsApp"
        >
          Solo Registrar Aviso
        </SecondaryButton>

        <PrimaryButton
          size="sm"
          color="success"
          onClick={handleSendWhatsAppAndRegister}
          disabled={loading || !phoneDigits}
          loading={loading}
          iconStart={<Icon name="MessageSquare" size="xs" />}
        >
          <span>WhatsApp y Registrar</span>
          <KbdBadge keys="Enter ↵" className="ml-1.5" />
        </PrimaryButton>
      </Flex>
    </Flex>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Avisar al Cliente (Vehículo Listo)"
      footer={footer}
      maxWidth="620px"
    >
      <div className="flex flex-col gap-4">
        {/* Recipient & Vehicle summary card */}
        <Box bg="base-200" rounded="DEFAULT" className="p-3.5 border border-base-300">
          <Flex justify="between" align="center" className="flex-wrap gap-2">
            <div>
              <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                Cliente & Contacto
              </Text>
              <Text size="sm" weight="bold" className="text-base-content mt-0.5">
                {order.customer.name}
              </Text>
              <Text size="xs" variant="muted" className="font-mono">
                {order.customer.phone || 'Sin teléfono registrado'}
              </Text>
            </div>

            <div className="text-right">
              <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                Vehículo
              </Text>
              <Text size="sm" weight="bold" className="text-base-content mt-0.5">
                {order.vehicle.brand} {order.vehicle.model}
              </Text>
              <Text size="xs" variant="muted" className="font-mono">
                Serie: {order.vehicle.serialNumberLastFour}
              </Text>
            </div>
          </Flex>
        </Box>

        {/* Message editor */}
        <div className="flex flex-col gap-1.5">
          <Flex justify="between" align="center">
            <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
              Mensaje de Notificación (Editable)
            </label>
            <span className="text-[11px] text-base-content/50">
              Se enviará por WhatsApp al cliente
            </span>
          </Flex>
          <Textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setIsEdited(true);
            }}
            rows={8}
            className="font-sans text-[13px] leading-relaxed"
          />
        </div>
      </div>
    </Modal>
  );
};
