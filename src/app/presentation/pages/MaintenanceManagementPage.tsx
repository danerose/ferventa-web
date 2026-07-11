import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { APIAdminRepository } from '@/app/data/repositories/APIAdminRepository';
import type { AdminMaintenanceOrder } from '@/app/domain/entities/AdminEntities';
import { Sidebar, Icon, PrimaryButton, SecondaryButton } from '@/app/presentation/components';
import { Modal } from '@/app/presentation/components/molecules/Modal/Modal';

const adminRepo = new APIAdminRepository();

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'No Comenzado' },
  { value: 'in_progress', label: 'En Proceso' },
  { value: 'completed', label: 'Terminado' },
  { value: 'delivered', label: 'Entregado' },
];

export const MaintenanceManagementPage: React.FC = () => {
  const { user, accessToken, clearAuth } = useAuthStore();
  const [maintenances, setMaintenances] = useState<AdminMaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Evidence modal state
  const [activeEvidenceOrder, setActiveEvidenceOrder] = useState<AdminMaintenanceOrder | null>(null);
  const [evidenceStage, setEvidenceStage] = useState<'reception' | 'disassembly' | 'maintenance' | 'completed'>('reception');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error'; message: string }[]>([]);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const handleUnauthorized = () => {
    clearAuth();
    window.location.hash = '/login';
  };

  const fetchMaintenances = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminRepo.getMaintenances(accessToken);
      setMaintenances(data);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') {
        handleUnauthorized();
        return;
      }
      setError(err.message || 'Error al cargar mantenimientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleStatusChange = async (id: string, newStatus: any) => {
    if (!accessToken) return;
    setUpdatingId(id);
    try {
      await adminRepo.updateMaintenance(accessToken, id, { status: newStatus });
      setMaintenances((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      addToast('success', 'Estado de mantenimiento actualizado.');
    } catch (err: any) {
      addToast('error', err.message || 'Error al actualizar estado.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !activeEvidenceOrder || !selectedFiles || selectedFiles.length === 0) return;

    setUploadingEvidence(true);
    try {
      const filesArray = Array.from(selectedFiles);
      await adminRepo.uploadMaintenanceEvidence(accessToken, activeEvidenceOrder.id, evidenceStage, filesArray);
      
      addToast('success', 'Evidencia subida correctamente.');
      setSelectedFiles(null);
      
      // Reload order details to refresh evidence list
      const updatedOrder = await adminRepo.getMaintenances(accessToken);
      setMaintenances(updatedOrder);
      
      // Find and update active order in state
      const refreshedActive = updatedOrder.find((o) => o.id === activeEvidenceOrder.id);
      if (refreshedActive) {
        setActiveEvidenceOrder(refreshedActive);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Error al subir la evidencia.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  // Filtered maintenance list
  const filteredMaintenances = useMemo(() => {
    let list = maintenances.filter((m) => m.status !== 'awaiting_appointment'); // skip appointments limbo
    
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      list = list.filter(
        (m) =>
          m.customer.name.toLowerCase().includes(q) ||
          m.vehicle.brand.toLowerCase().includes(q) ||
          m.vehicle.model.toLowerCase().includes(q) ||
          m.vehicle.serialNumberLastFour.includes(q)
      );
    }
    return list;
  }, [maintenances, searchValue]);

  // Status statistics calculation
  const stats = useMemo(() => {
    const active = maintenances.filter((m) => m.status !== 'awaiting_appointment' && m.status !== 'delivered');
    const notStarted = active.filter((m) => m.status === 'not_started').length;
    const inProgress = active.filter((m) => m.status === 'in_progress').length;
    const completed = active.filter((m) => m.status === 'completed').length;
    
    return {
      total: active.length,
      notStarted,
      inProgress,
      completed,
    };
  }, [maintenances]);

  // Formatter for creation dates
  const formatIntakeDate = (dateStr?: string) => {
    if (!dateStr) return 'Reciente';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to get progress bar width and colors
  const getProgressDetails = (status: string) => {
    switch (status) {
      case 'not_started':
        return { width: '0%', color: '#94a3b8', label: 'Cola de espera' };
      case 'in_progress':
        return { width: '65%', color: '#ea580c', label: '65% Completado' };
      case 'completed':
        return { width: '100%', color: '#16a34a', label: 'Listo para entrega' };
      case 'delivered':
        return { width: '100%', color: '#2563eb', label: 'Entregado al cliente' };
      default:
        return { width: '0%', color: '#cbd5e1', label: '' };
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'not_started':
        return { bg: '#f1f5f9', text: '#475569', icon: 'Pause', label: 'No comenzado' };
      case 'in_progress':
        return { bg: '#fff7ed', text: '#c2410c', icon: 'Zap', label: 'En Proceso' };
      case 'completed':
        return { bg: '#f0fdf4', text: '#15803d', icon: 'CheckCircle', label: 'Terminado' };
      case 'delivered':
        return { bg: '#eff6ff', text: '#1d4ed8', icon: 'Sparkles', label: 'Entregado' };
      default:
        return { bg: '#f8fafc', text: '#64748b', icon: 'Activity', label: status };
    }
  };

  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      {/* Main Content Area */}
      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar search & actions */}
        <header
          style={{
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'between',
            alignItems: 'center',
            height: '64px',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '480px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon name="Search" size="sm" />
              </span>
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Buscar por serie, marca o cliente..."
                type="text"
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  outline: 'none',
                  fontSize: '13.5px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
            <button
              onClick={fetchMaintenances}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '50%',
              }}
              title="Sincronizar órdenes"
            >
              <Icon name="RefreshCw" size="sm" />
            </button>
          </div>
        </header>

        {/* Page canvas */}
        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '700',
                color: '#091426',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              Mantenimientos Activos
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Gestiona el flujo de trabajo del taller de reparación en tiempo real.
            </p>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            {/* Total Vehiculos */}
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#091426',
                }}
              >
                <Icon name="Gauge" />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Vehículos Activos
                </p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#091426', margin: 0 }}>{stats.total}</p>
              </div>
            </div>

            {/* No Comenzado */}
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                <Icon name="Pause" />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  No Comenzado
                </p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#091426', margin: 0 }}>{stats.notStarted}</p>
              </div>
            </div>

            {/* En Proceso */}
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: '#fff7ed',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c2410c',
                }}
              >
                <Icon name="Zap" />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  En Proceso
                </p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#091426', margin: 0 }}>{stats.inProgress}</p>
              </div>
            </div>

            {/* Terminado */}
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: '#f0fdf4',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#15803d',
                }}
              >
                <Icon name="CheckCircle" />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Terminado
                </p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: '#091426', margin: 0 }}>{stats.completed}</p>
              </div>
            </div>
          </div>

          {/* Service cards grid */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ height: '140px', background: 'white', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '140px', background: 'white', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
            </div>
          ) : error ? (
            <div
              style={{
                background: '#fff1f1',
                border: '1px solid rgba(186,26,26,0.2)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Icon name="AlertTriangle" className="text-error" />
              <div>
                <p style={{ fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>Error al cargar datos</p>
                <p style={{ fontSize: '14px', color: '#7f1d1d' }}>{error}</p>
              </div>
              <button
                onClick={fetchMaintenances}
                style={{
                  marginLeft: 'auto',
                  background: '#991b1b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Reintentar
              </button>
            </div>
          ) : filteredMaintenances.length === 0 ? (
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '56px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="Wrench" className="text-[#94a3b8]" />
              </div>
              <p style={{ fontWeight: '700', color: '#0b1c30', fontSize: '16px' }}>Sin órdenes activas</p>
              <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>
                {searchValue
                  ? `No se encontraron mantenimientos para "${searchValue}"`
                  : `No hay órdenes de mantenimiento activas en el taller.`}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '24px',
              }}
            >
              {filteredMaintenances.map((order) => {
                const badge = getStatusBadgeStyle(order.status);
                const progress = getProgressDetails(order.status);

                return (
                  <div
                    key={order.id}
                    className="service-card"
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 2px 8px rgba(9, 20, 38, 0.02)',
                      opacity: order.status === 'not_started' ? 0.93 : 1,
                    }}
                  >
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Badge status */}
                      <div style={{ marginBottom: '14px', display: 'flex', justifySelf: 'start' }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.text,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          }}
                        >
                          <Icon name={badge.icon as 'Zap'} size="xs" />
                          {badge.label}
                        </span>
                      </div>

                      {/* Title vehicle */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#091426', margin: '0 0 2px 0' }}>
                            {order.vehicle.brand} {order.vehicle.model}
                          </h3>
                          <p style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', color: '#64748b', fontWeight: '600' }}>
                            SERIE: {order.vehicle.serialNumberLastFour}
                          </p>
                        </div>
                      </div>

                      {/* Stats details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon name="User" size="xs" style={{ color: '#94a3b8' }} />
                          <span style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: '500' }}>
                            {order.customer.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icon name="Calendar" size="xs" style={{ color: '#94a3b8' }} />
                          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                            Ingreso: {formatIntakeDate(order.createdAt)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '6px', border: '1px solid #e2e8f0' }}>
                            <div
                              style={{
                                background: progress.color,
                                width: progress.width,
                                height: '100%',
                                borderRadius: '9999px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', marginTop: '4px', fontWeight: '600', margin: '4px 0 0' }}>
                            {progress.label}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'auto' }}>
                        <SecondaryButton
                          onClick={() => setActiveEvidenceOrder(order)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 12px',
                          }}
                        >
                          <Icon name="Camera" size="xs" />
                          Evidencia
                        </SecondaryButton>

                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#0f172a',
                            padding: '8px 12px',
                            outline: 'none',
                            cursor: updatingId === order.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* --- EVIDENCE UPLOAD MODAL --- */}
      <Modal
        isOpen={activeEvidenceOrder !== null}
        onClose={() => {
          setActiveEvidenceOrder(null);
          setSelectedFiles(null);
        }}
        title="Evidencia Fotográfica"
        maxWidth="650px"
      >
        {activeEvidenceOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#091426', margin: '0 0 4px 0' }}>
                {activeEvidenceOrder.vehicle.brand} {activeEvidenceOrder.vehicle.model}
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Cliente: {activeEvidenceOrder.customer.name} | Serie: {activeEvidenceOrder.vehicle.serialNumberLastFour}
              </p>
            </div>

            {/* List existing evidence */}
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '12px' }}>
                Fotos Guardadas
              </h5>
              
              {!activeEvidenceOrder.evidence || activeEvidenceOrder.evidence.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No hay fotos subidas para esta orden de servicio.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeEvidenceOrder.evidence.map((ev, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#855300', background: '#ffddb8', padding: '2px 8px', borderRadius: '4px' }}>
                        Etapa: {ev.stage === 'reception' ? 'Recepción' : ev.stage === 'disassembly' ? 'Desarmado' : ev.stage === 'maintenance' ? 'Reparación' : 'Finalizado'}
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', marginTop: '10px' }}>
                        {ev.photoUrls.map((url, uidx) => (
                          <a
                            key={uidx}
                            href={`${adminRepo.login.name === 'mock' ? '' : import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'block', borderRadius: '4px', overflow: 'hidden', height: '70px', border: '1px solid #e2e8f0' }}
                          >
                            <img
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`}
                              alt="Evidencia"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload form */}
            <form onSubmit={handleUploadEvidence} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', margin: 0 }}>
                Subir Nueva Evidencia
              </h5>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Fase / Etapa</label>
                  <select
                    value={evidenceStage}
                    onChange={(e: any) => setEvidenceStage(e.target.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="reception">Recepción</option>
                    <option value="disassembly">Desarmado</option>
                    <option value="maintenance">Reparación</option>
                    <option value="completed">Finalizado</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Archivos de Imagen (Máx. 5)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    style={{
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifySelf: 'end', marginTop: '8px', gap: '12px' }}>
                <SecondaryButton
                  type="button"
                  disabled={uploadingEvidence}
                  onClick={() => {
                    setActiveEvidenceOrder(null);
                    setSelectedFiles(null);
                  }}
                >
                  Cerrar
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  disabled={uploadingEvidence || !selectedFiles || selectedFiles.length === 0}
                  loading={uploadingEvidence}
                >
                  Subir fotos
                </PrimaryButton>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Toasts */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: toast.type === 'success' ? '#091426' : '#dc2626',
              color: 'white',
              borderRadius: '10px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              fontSize: '14px',
              fontWeight: '600',
              animation: 'slideInRight 0.25s ease',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <Icon name={toast.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size="sm" />
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};
