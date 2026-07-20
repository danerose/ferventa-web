import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, SecondaryButton, TextInput } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { useUserStore } from '../../../core/stores/useUserStore';
import { APIUserRepository } from '../../data/repositories/APIUserRepository';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';
import type { CreateUserDto } from '../../domain/entities/UserEntities';

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
    email: '',
    password: '',
    phone: '',
    roleId: '',
    branches: []
  });

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
    // eslint-disable-next-line
  }, [accessToken]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchValue.toLowerCase()) || 
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
            <PrimaryButton onClick={() => setActiveModal('addUser')}>
              <Icon name="Plus" size="sm" className="mr-2" />
              Nuevo Usuario
            </PrimaryButton>
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          
          {/* Search */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '300px' }}>
              <TextInput 
                placeholder="Buscar por nombre o correo..."
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
                      <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{u.email}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{u.role.name}</td>
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
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay usuarios registrados.</td>
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
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Nuevo Usuario</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Nombre completo</label>
                <TextInput 
                  placeholder="Ej. Juan Pérez" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Correo electrónico</label>
                  <TextInput 
                    placeholder="juan@ferventa.com" 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Teléfono (Opcional)</label>
                  <TextInput 
                    placeholder="8112345678" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Contraseña</label>
                <TextInput 
                  placeholder="••••••••" 
                  type="password" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Rol</label>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Sucursales Asignadas</label>
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
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Selecciona al menos una sucursal para este usuario.</p>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <SecondaryButton onClick={() => setActiveModal(null)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={() => setActiveModal(null)}>Guardar Usuario</PrimaryButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
