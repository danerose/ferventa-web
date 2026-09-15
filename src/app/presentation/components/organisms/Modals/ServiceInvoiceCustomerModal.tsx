import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  PrimaryButton,
  SecondaryButton,
  Icon,
} from '@/app/presentation/components';
import { customerUseCases } from '@/core/di/container';
import { cleanPhoneDigits } from '@/core/utils';

export interface ServiceInvoiceCustomerData {
  isGeneralPublic: boolean;
  customerName: string;
  customerPhone: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string | number;
  vehicleSerial?: string;
  vehiclePlate?: string;
}

interface ServiceInvoiceCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ServiceInvoiceCustomerData) => void;
}

export const ServiceInvoiceCustomerModal: React.FC<ServiceInvoiceCustomerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [mode, setMode] = useState<'general' | 'custom'>('general');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<boolean>(false);

  // Vehicle info
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [serial, setSerial] = useState('');
  const [plate, setPlate] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setMode('general');
      setPhone('');
      setName('');
      setBrand('');
      setModel('');
      setYear('');
      setSerial('');
      setPlate('');
      setFoundCustomer(false);
    }
  }, [isOpen]);

  const handleSearchPhone = async (phoneToSearch: string) => {
    const numericOnly = cleanPhoneDigits(phoneToSearch);
    if (numericOnly.length < 10) return;

    setSearching(true);
    try {
      const customer = await customerUseCases.getCustomerByPhone(numericOnly);
      if (customer) {
        setName(customer.name || '');
        setFoundCustomer(true);
        if (customer.vehicles && customer.vehicles.length > 0) {
          const v = customer.vehicles[0];
          setBrand(v.brand || '');
          setModel(v.model || '');
          setYear(v.year ? String(v.year) : '');
          setSerial(v.serialNumberLastFour || '');
          setPlate(v.licensePlate || '');
        }
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const numericOnly = cleanPhoneDigits(val);
    if (numericOnly.length === 10) {
      handleSearchPhone(val);
    }
  };

  const handleSubmit = () => {
    if (mode === 'general') {
      onConfirm({
        isGeneralPublic: true,
        customerName: 'Público en General',
        customerPhone: '',
      });
    } else {
      onConfirm({
        isGeneralPublic: false,
        customerName: name.trim() || 'Cliente Mostrador',
        customerPhone: phone.trim(),
        vehicleBrand: brand.trim(),
        vehicleModel: model.trim(),
        vehicleYear: year.trim(),
        vehicleSerial: serial.trim(),
        vehiclePlate: plate.trim(),
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Datos para Factura de Servicio"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        <p className="text-xs text-base-content/70">
          Selecciona si deseas emitir el comprobante a <strong>Público en General</strong> o registrar los datos y vehículo del cliente.
        </p>

        {/* Selection mode tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-base-200 rounded-xl border border-base-300">
          <button
            type="button"
            onClick={() => setMode('general')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              mode === 'general'
                ? 'bg-base-100 text-primary shadow-xs'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            <Icon name="Users" size="xs" />
            <span>Público en General (Rápido)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              mode === 'custom'
                ? 'bg-base-100 text-primary shadow-xs'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            <Icon name="UserCheck" size="xs" />
            <span>Datos de Cliente y Vehículo</span>
          </button>
        </div>

        {mode === 'general' ? (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Icon name="CheckCircle" size="sm" />
            </div>
            <div>
              <div className="text-sm font-bold text-base-content">Emisión sin registro de unidad</div>
              <p className="text-xs text-base-content/70 mt-0.5 leading-relaxed">
                El documento se generará a nombre de <strong>Público en General</strong> con el concepto de <em>Servicio de mostrador</em>. No necesitas ingresar ningún dato adicional.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Customer Search */}
            <div className="space-y-3 p-3.5 bg-base-200/40 rounded-xl border border-base-200">
              <div className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                1. Datos del Cliente
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-base-content/80">
                    Teléfono (10 dígitos)
                  </label>
                  <div className="relative">
                    <TextInput
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="Ej. 9991234567"
                      size="sm"
                      maxLength={10}
                    />
                    {searching && (
                      <span className="loading loading-spinner loading-xs absolute right-3 top-2.5 text-primary"></span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-base-content/80">
                    Nombre del Cliente
                  </label>
                  <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre completo"
                    size="sm"
                  />
                </div>
              </div>

              {foundCustomer && (
                <div className="text-[11px] text-success font-medium flex items-center gap-1.5 mt-1">
                  <Icon name="Check" size="xs" />
                  <span>Cliente y vehículo cargados automáticamente.</span>
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="space-y-3 p-3.5 bg-base-200/40 rounded-xl border border-base-200">
              <div className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                2. Datos del Vehículo / Unidad
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-base-content/80">Marca</label>
                  <TextInput
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej. Italika, Honda..."
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-base-content/80">Modelo</label>
                  <TextInput
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ej. WS150, XR150..."
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-base-content/80">Año</label>
                  <TextInput
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Ej. 2024"
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-base-content/80">Serie / Placas</label>
                  <TextInput
                    value={serial || plate}
                    onChange={(e) => {
                      setSerial(e.target.value);
                      setPlate(e.target.value);
                    }}
                    placeholder="Últimos 4 dígitos o Placas"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
          <SecondaryButton size="sm" onClick={onClose}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={handleSubmit} iconStart={<Icon name="Printer" size="xs" />}>
            Generar e Imprimir Factura
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};
