import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, SecondaryButton, TextInput } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { useUserStore } from '../../../core/stores/useUserStore';
import { APIUserRepository } from '../../data/repositories/APIUserRepository';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';
import type { CreateUserDto, CreateUserResponse } from '../../domain/entities/UserEntities';

const userRepo = new APIUserRepository();
const adminRepo = new APIAdminRepository();

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, clearAuth } = useAuthStore();
  const { 
    users, 
    roles,
    branches,
    loading, 
    searchValue, 
    setSearchValue,
    setUsers,
    setRoles,
    setBranches,
    setLoading,
    activeModal,
    setActiveModal
  } = useUserStore();

  const [formData, setFormData] = useState<CreateUserDto>({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
    branches: []
  });

  const [usernameEditedManually, setUsernameEditedManually] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    exists?: boolean;
    message?: string;
  }>({ checking: false });
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success / WhatsApp Modal State
  const [successData, setSuccessData] = useState<CreateUserResponse | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const checkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  const fetchUsers = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [usersData, rolesData, branchesData] = await Promise.all([
        userRepo.getUsers(accessToken),
        userRepo.getRoles(accessToken),
        adminRepo.getBranches()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setBranches(branchesData);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [accessToken]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchValue.toLowerCase()) || 
    (u.username && u.username.toLowerCase().includes(searchValue.toLowerCase())) ||
    u.email.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleBranchToggle = (branchId: string) => {
    setFormData(prev => ({
      ...prev,
      branches: prev.branches.includes(branchId) 
        ? prev.branches.filter(id => id !== branchId)
        : [...prev.branches, branchId]
    }));
  };

  // Real-time username check function
  const checkUsernameAvailability = (uname: string) => {
    if (!accessToken) return;
    const trimmed = uname.trim();
    if (!trimmed) {
      setUsernameStatus({ checking: false });
      return;
    }

    setUsernameStatus({ checking: true });

    if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current);

    checkDebounceRef.current = setTimeout(async () => {
      try {
        const res = await userRepo.checkUsername(accessToken, trimmed);
        setUsernameStatus({
          checking: false,
          available: res.available,
          exists: res.exists,
          message: res.available ? 'Nombre de usuario disponible' : 'Nombre de usuario no disponible'
        });
      } catch (err) {
        setUsernameStatus({ checking: false });
      }
    }, 350);
  };

  // Name change handler: auto-generate username if not manually edited
  const handleNameChange = (val: string) => {
    setFormData(prev => ({ ...prev, name: val }));

    if (!usernameEditedManually && accessToken && val.trim().length >= 3) {
      if (generateDebounceRef.current) clearTimeout(generateDebounceRef.current);

      setIsGeneratingUsername(true);
      generateDebounceRef.current = setTimeout(async () => {
        try {
          const genUname = await userRepo.generateUsername(accessToken, val);
          if (genUname) {
            setFormData(prev => ({ ...prev, username: genUname }));
            checkUsernameAvailability(genUname);
          }
        } catch (e) {
          console.error('Error generating username', e);
        } finally {
          setIsGeneratingUsername(false);
        }
      }, 400);
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsernameEditedManually(true);
    setFormData(prev => ({ ...prev, username: val }));
    checkUsernameAvailability(val);
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      roleId: roles.length > 0 ? roles[0].id : '',
      branches: branches.map(b => b.id)
    });
    setUsernameEditedManually(false);
    setUsernameStatus({ checking: false });
    setSubmitError(null);
    setActiveModal('addUser');
  };

  const handleSaveUser = async () => {
    if (!accessToken) return;

    if (!formData.name.trim()) {
      setSubmitError('El nombre completo es requerido');
      return;
    }
    if (!formData.roleId) {
      setSubmitError('Debes seleccionar un rol');
      return;
    }
    if (formData.branches.length === 0) {
      setSubmitError('Debes asignar al menos una sucursal');
      return;
    }
    if (usernameStatus.available === false) {
      setSubmitError('El nombre de usuario no está disponible');
      return;
    }

    setSavingUser(true);
    setSubmitError(null);

    try {
      const response = await userRepo.createUser(accessToken, formData);
      setActiveModal(null);
      setSuccessData(response);
      fetchUsers();
    } catch (err: any) {
      setSubmitError(err.message || 'Error al guardar el usuario');
    } finally {
      setSavingUser(false);
    }
  };

  const handleCopyMessage = () => {
    if (successData?.message) {
      navigator.clipboard.writeText(successData.message);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header */}
        <header style={{ background: 'white', padding: '16px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#091426' }}>Gestión de Usuarios</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <PrimaryButton onClick={handleOpenAddModal}>
              <Icon name="Plus" size="sm" className="mr-2" />
              Nuevo Usuario
            </PrimaryButton>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          
          {/* Search */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '320px' }}>
              <TextInput 
                placeholder="Buscar por nombre, usuario o correo..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>

          {/* Table Area */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando datos...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Nombre</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Usuario</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Correo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Rol</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{u.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#855300', fontWeight: '600' }}>{u.username || '-'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{u.email}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{u.role?.name || '-'}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                          background: u.isActive ? '#f0fdf4' : '#fef2f2',
                          color: u.isActive ? '#16a34a' : '#dc2626'
                        }}>
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                          <Icon name="Edit2" size="sm" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay usuarios registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {activeModal === 'addUser' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '540px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Nuevo Usuario</h2>
            
            {submitError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Nombre completo *</label>
                <TextInput 
                  placeholder="Ej. Juan Pérez" 
                  value={formData.name} 
                  onChange={(e) => handleNameChange(e.target.value)} 
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Nombre de usuario (Opcional)</label>
                  {isGeneratingUsername && <span style={{ fontSize: '11px', color: '#855300' }}>Generando sugerencia...</span>}
                  {usernameStatus.checking && <span style={{ fontSize: '11px', color: '#64748b' }}>Verificando...</span>}
                  {!usernameStatus.checking && usernameStatus.available === true && (
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>✔ Disponible</span>
                  )}
                  {!usernameStatus.checking && usernameStatus.available === false && (
                    <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>❌ No disponible</span>
                  )}
                </div>
                <TextInput 
                  placeholder="juan.perez (Se autogenera si se deja vacío)" 
                  value={formData.username || ''} 
                  onChange={(e) => handleUsernameChange(e.target.value)} 
                />
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Si no se especifica, se autogenera basado en el nombre.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Correo (Opcional)</label>
                  <TextInput 
                    placeholder="juan@ferventa.com" 
                    type="email" 
                    value={formData.email || ''} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Teléfono (Opcional)</label>
                  <TextInput 
                    placeholder="8112345678" 
                    value={formData.phone || ''} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Contraseña (Opcional)</label>
                <TextInput 
                  placeholder="Se genera contraseña temporal si se deja vacía" 
                  type="password" 
                  value={formData.password || ''} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Rol *</label>
                <select 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  value={formData.roleId}
                  onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Sucursales Asignadas *</label>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {branches.map(b => (
                    <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.branches.includes(b.id)}
                        onChange={() => handleBranchToggle(b.id)}
                      /> 
                      {b.name}
                    </label>
                  ))}
                  {branches.length === 0 && <span style={{fontSize: '12px', color: '#94a3b8'}}>No hay sucursales disponibles</span>}
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <SecondaryButton onClick={() => setActiveModal(null)} disabled={savingUser}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleSaveUser} loading={savingUser}>Guardar Usuario</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Success & WhatsApp Modal */}
      {successData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '560px', maxWidth: '90vw', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '52px', height: '52px', background: '#dcfce7', borderRadius: '50%', color: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Icon name="Check" size="md" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>¡Usuario Creado Exitosamente!</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                Se han generado las credenciales de acceso para el nuevo usuario.
              </p>
            </div>

            {/* Credential Details Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Nombre</span>
                  <strong style={{ color: '#0f172a' }}>{successData.user.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Usuario</span>
                  <strong style={{ color: '#855300' }}>{successData.user.username}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Correo</span>
                  <span style={{ color: '#334155' }}>{successData.user.email}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Contraseña Temporal</span>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '700' }}>
                    {successData.tempPassword || 'Definida manualmente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Formatted Message Preview */}
            {successData.message && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Detalles del mensaje:
                </label>
                <div style={{ background: '#f1f5f9', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto' }}>
                  {successData.message}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {successData.whatsappUrl && (
                <button
                  onClick={() => window.open(successData.whatsappUrl, '_blank')}
                  style={{
                    width: '100%',
                    background: '#25D366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(37,211,102,0.3)'
                  }}
                >
                  <Icon name="MessageSquare" size="sm" />
                  Enviar por WhatsApp
                </button>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <SecondaryButton 
                  onClick={handleCopyMessage}
                  className="flex-1 justify-center"
                >
                  <Icon name="Copy" size="xs" className="mr-2" />
                  {copiedMessage ? '¡Copiado!' : 'Copiar mensaje'}
                </SecondaryButton>
                <SecondaryButton 
                  onClick={() => setSuccessData(null)}
                  className="flex-1 justify-center"
                >
                  Cerrar
                </SecondaryButton>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
