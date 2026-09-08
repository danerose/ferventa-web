import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Icon,
  PageLayout,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  TextInput,
  Select,
  Checkbox,
  Modal,
  Box,
  Flex,
  Grid,
  Stack,
  Heading,
  Text,
  Badge,
  KbdBadge,
} from '@/app/presentation/components';

import { useAuthStore, useUserStore } from '@/app/presentation/stores';

import { translateRole, cleanPhoneDigits, formatPhoneInput } from '@/core/utils/index';

import type { CreateUserDto, UpdateUserDto, User } from '@/app/domain';


import {
  MODULE_THEMES,
  USER_ROLE_COLORS,
  UserRole,
} from '@/core';

import { useShallow } from 'zustand/react/shallow';

export const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const {
    users,
    roles,
    branches,
    loading,
    searchValue,
    setSearchValue,
    activeModal,
    setActiveModal,
    selectedUser,
    setSelectedUser,
    isSubmitting,
    submitError,
    successData,
    clearSuccessData,
    resetSuccessData,
    clearResetSuccessData,
    usernameStatus,
    loadData,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    checkUsername,
    generateUsername,
  } = useUserStore(
    useShallow((s) => ({
      users: s.users,
      roles: s.roles,
      branches: s.branches,
      loading: s.loading,
      searchValue: s.searchValue,
      setSearchValue: s.setSearchValue,
      activeModal: s.activeModal,
      setActiveModal: s.setActiveModal,
      selectedUser: s.selectedUser,
      setSelectedUser: s.setSelectedUser,
      isSubmitting: s.isSubmitting,
      submitError: s.submitError,
      successData: s.successData,
      clearSuccessData: s.clearSuccessData,
      resetSuccessData: s.resetSuccessData,
      clearResetSuccessData: s.clearResetSuccessData,
      usernameStatus: s.usernameStatus,
      loadData: s.loadData,
      createUser: s.createUser,
      updateUser: s.updateUser,
      deleteUser: s.deleteUser,
      resetPassword: s.resetPassword,
      checkUsername: s.checkUsername,
      generateUsername: s.generateUsername,
    }))
  );

  // ── Ephemeral Form State (UI Only) ────────────────────────────────────
  const [formData, setFormData] = useState<CreateUserDto>({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
    branches: [],
  });

  const [usernameEditedManually, setUsernameEditedManually] = useState(false);
  const [isGeneratingUsername, setIsGeneratingUsername] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    roleId?: string;
    branches?: string;
  }>({});

  const [editForm, setEditForm] = useState<UpdateUserDto>({});
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [copiedMessage, setCopiedMessage] = useState(false);

  // ── Password Visibility & Reset State ─────────────────────────────────
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedPasswordUserId, setCopiedPasswordUserId] = useState<string | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [showResetInput, setShowResetInput] = useState(false);
  const [copiedResetMessage, setCopiedResetMessage] = useState(false);
  const [copiedResetPassword, setCopiedResetPassword] = useState(false);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCopyPassword = (userId: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPasswordUserId(userId);
    setTimeout(() => setCopiedPasswordUserId(null), 2000);
  };

  const handleOpenResetModal = (targetUser: User) => {
    setSelectedUser(targetUser);
    setResetPasswordInput('');
    setShowResetInput(false);
    setActiveModal('resetPassword');
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedUser?.id || !accessToken) return;
    try {
      await resetPassword(accessToken, selectedUser.id, resetPasswordInput);
    } catch {
      // Handled in store
    }
  };

  const handleCopyResetMessage = () => {
    if (resetSuccessData?.message) {
      navigator.clipboard.writeText(resetSuccessData.message);
      setCopiedResetMessage(true);
      setTimeout(() => setCopiedResetMessage(false), 2000);
    }
  };

  const handleCopyResetPassword = () => {
    if (resetSuccessData?.tempPassword) {
      navigator.clipboard.writeText(resetSuccessData.tempPassword);
      setCopiedResetPassword(true);
      setTimeout(() => setCopiedResetPassword(false), 2000);
    }
  };


  const generateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  useEffect(() => {
    if (accessToken) {
      loadData(accessToken).catch((err) => {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const filteredUsers = useMemo(() => {
    const q = searchValue.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, searchValue]);

  const handleBranchToggle = (branchId: string) => {
    setFormData((prev) => {
      const nextBranches = prev.branches.includes(branchId)
        ? prev.branches.filter((id) => id !== branchId)
        : [...prev.branches, branchId];
      if (nextBranches.length > 0) {
        setFieldErrors((e) => ({ ...e, branches: undefined }));
      } else {
        setFieldErrors((e) => ({ ...e, branches: 'Debes asignar al menos una sucursal al usuario' }));
      }
      return { ...prev, branches: nextBranches };
    });
  };

  const handleNameChange = (val: string) => {
    setFormData((prev) => ({ ...prev, name: val }));
    if (val.trim().length >= 3) {
      setFieldErrors((e) => ({ ...e, name: undefined }));
    }

    if (!usernameEditedManually && val.trim().length >= 2 && accessToken) {
      setIsGeneratingUsername(true);
      if (generateDebounceRef.current) clearTimeout(generateDebounceRef.current);
      generateDebounceRef.current = setTimeout(async () => {
        try {
          const generatedName = await generateUsername(accessToken, val);
          setFormData((prev) => ({ ...prev, username: generatedName }));
        } catch {
          // Ignore error
        } finally {
          setIsGeneratingUsername(false);
        }
      }, 500);
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsernameEditedManually(true);
    setFormData((prev) => ({ ...prev, username: val }));
    setFieldErrors((e) => ({ ...e, username: undefined }));
    if (accessToken) {
      checkUsername(accessToken, val);
    }
  };

  const handleEmailChange = (val: string) => {
    setFormData((prev) => ({ ...prev, email: val }));
    setFieldErrors((e) => ({ ...e, email: undefined }));
  };

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhoneInput(val);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    setFieldErrors((e) => ({ ...e, phone: undefined }));
  };

  const validateForm = () => {
    const errs: typeof fieldErrors = {};
    if (!formData.name.trim()) errs.name = 'El nombre es obligatorio';
    if (!formData.email?.trim() && !formData.phone?.trim()) {
      errs.email = 'Debes ingresar un correo o un teléfono';
    }
    if (formData.phone?.trim()) {
      const digits = cleanPhoneDigits(formData.phone);
      if (digits.length > 0 && digits.length < 10) {
        errs.phone = 'El teléfono debe tener 10 dígitos';
      }
    }
    if (!formData.roleId) errs.roleId = 'Debes seleccionar un rol';
    if (formData.branches.length === 0) errs.branches = 'Debes asignar al menos una sucursal';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      roleId: '',
      branches: [],
    });
    setFieldErrors({});
    setUsernameEditedManually(false);
    setActiveModal('addUser');
  };

  const handleSaveUser = async () => {
    if (!validateForm() || !accessToken) return;
    try {
      await createUser(accessToken, formData);
    } catch {
      // Error handled in store
    }
  };

  const handleOpenEditModal = (targetUser: User) => {
    setSelectedUser(targetUser);
    setEditForm({
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone || '',
      roleId: targetUser.role?.id || '',
      branches: targetUser.branches?.map((b: unknown) => (typeof b === 'string' ? b : (b as { id?: string; _id?: string }).id || (b as { id?: string; _id?: string })._id || '')) || [],
      isActive: targetUser.isActive,
    });
    setEditFieldErrors({});
    setActiveModal('editUser');
  };

  const handleEditBranchToggle = (branchId: string) => {
    setEditForm((prev) => {
      const current = prev.branches || [];
      const next = current.includes(branchId)
        ? current.filter((id) => id !== branchId)
        : [...current, branchId];
      return { ...prev, branches: next };
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedUser?.id || !accessToken) return;

    if (!editForm.name?.trim()) {
      setEditFieldErrors({ name: 'El nombre es obligatorio' });
      return;
    }

    try {
      await updateUser(accessToken, selectedUser.id, editForm);
    } catch {
      // Error handled in store
    }
  };

  const handleOpenDeleteModal = (targetUser: User) => {
    setSelectedUser(targetUser);
    setActiveModal('deleteUser');
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser?.id || !accessToken) return;
    try {
      await deleteUser(accessToken, selectedUser.id);
    } catch {
      // Error handled in store
    }
  };

  const handleCopyMessage = () => {
    if (successData?.message) {
      navigator.clipboard.writeText(successData.message);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const moduleMeta = MODULE_THEMES.users;

  const roleSelectOptions = [
    { value: '', label: 'Selecciona un rol' },
    ...roles.map((r) => ({
      value: r.id || r.name,
      label: translateRole(r.name),
    })),
  ];

  return (
    <PageLayout userName={user?.name || 'Admin'}>
        {/* Top Header */}
        <Flex
          as="header"
          align="center"
          justify="between"
          className="h-16 px-6 bg-base-100 border-b border-base-300 shrink-0 z-10"
        >
          <Flex align="center" gap="sm">
            <Box className={`w-8 h-8 rounded-DEFAULT ${moduleMeta.bgSoft} ${moduleMeta.text} flex items-center justify-center`}>
              <Icon name={moduleMeta.icon} size="sm" />
            </Box>
            <Heading level={2} className="font-bold tracking-tight">
              {moduleMeta.title}
            </Heading>
          </Flex>
          <PrimaryButton
            size="sm"
            color="primary"
            onClick={handleOpenAddModal}
            iconStart={<Icon name="Plus" size="xs" />}
          >
            Nuevo Usuario
          </PrimaryButton>
        </Flex>

        <Box as="main" className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Subtitle & Search */}
          <Flex justify="between" align="center" className="flex-wrap gap-4">
            <Text variant="muted" size="sm">
              {moduleMeta.subtitle}
            </Text>
            <Box className="w-full sm:w-80">
              <TextInput
                placeholder="Buscar por nombre, usuario o correo..."
                size="sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </Box>
          </Flex>

          {/* Table Container */}
          <Box bg="base-100" rounded="DEFAULT" className="border border-base-300 overflow-hidden shadow-xs">
            {loading ? (
              <Box className="p-12 text-center">
                <Text variant="muted">Cargando datos...</Text>
              </Box>
            ) : (
              <Box as="table" className="table w-full">
                <Box as="thead" className="bg-base-200/50 text-base-content/70">
                  <Box as="tr">
                    <Box as="th" className="py-3 px-4 text-left text-xs font-semibold uppercase">
                      Nombre
                    </Box>
                    <Box as="th" className="py-3 px-4 text-left text-xs font-semibold uppercase">
                      Usuario
                    </Box>
                    <Box as="th" className="py-3 px-4 text-left text-xs font-semibold uppercase">
                      Correo
                    </Box>
                    <Box as="th" className="py-3 px-4 text-left text-xs font-semibold uppercase">
                      Rol
                    </Box>
                    <Box as="th" className="py-3 px-4 text-left text-xs font-semibold uppercase">
                      Contraseña / Acceso
                    </Box>
                    <Box as="th" className="py-3 px-4 text-left text-xs font-semibold uppercase">
                      Estado
                    </Box>
                    <Box as="th" className="py-3 px-4 text-center text-xs font-semibold uppercase">
                      Acciones
                    </Box>
                  </Box>
                </Box>
                <Box as="tbody">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => {
                      const roleKey = u.role?.name?.toLowerCase() || '';
                      const roleColor = USER_ROLE_COLORS[roleKey] || USER_ROLE_COLORS[UserRole.User];
                      const isDefault = !!u.isDefaultPassword;
                      const hasDefaultPassword = !!u.defaultPassword;

                      return (
                        <Box as="tr" key={u.id} className="border-b border-base-200 hover:bg-base-200/30 transition-colors">
                          <Box as="td" className="py-3 px-4 text-sm font-semibold">
                            {u.name}
                          </Box>
                          <Box as="td" className="py-3 px-4 text-sm font-medium font-data-mono text-primary">
                            {u.username || '-'}
                          </Box>
                          <Box as="td" className="py-3 px-4 text-sm text-base-content/70">
                            {u.email}
                          </Box>
                          <Box as="td" className="py-3 px-4">
                            <Badge variant="soft" color={roleColor.badgeColor} size="xs">
                              {translateRole(u.role?.name)}
                            </Badge>
                          </Box>
                          <Box as="td" className="py-3 px-4">
                            {isDefault && hasDefaultPassword ? (
                              <Flex align="center" gap="xs" className="flex-wrap">
                                <span className="font-mono bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/25 px-2 py-0.5 rounded text-xs">
                                  {visiblePasswords[u.id] ? u.defaultPassword : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(u.id)}
                                  className="p-1 rounded text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors"
                                  title={visiblePasswords[u.id] ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                  <Icon name={visiblePasswords[u.id] ? 'EyeOff' : 'Eye'} size="xs" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPassword(u.id, u.defaultPassword!)}
                                  className="p-1 rounded text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors"
                                  title="Copiar contraseña"
                                >
                                  <Icon
                                    name={copiedPasswordUserId === u.id ? 'Check' : 'Copy'}
                                    size="xs"
                                    className={copiedPasswordUserId === u.id ? 'text-success' : ''}
                                  />
                                </button>
                                <Badge variant="soft" color="warning" size="xs">
                                  Temporal
                                </Badge>
                              </Flex>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                <Icon name="Lock" size="xs" className="shrink-0" />
                                Contraseña privada
                              </span>
                            )}
                          </Box>
                          <Box as="td" className="py-3 px-4">
                            <Badge variant="soft" color={u.isActive ? 'success' : 'error'} size="xs">
                              {u.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </Box>
                          <Box as="td" className="py-3 px-4 text-center">
                            <Flex justify="center" gap="xs">
                              <TertiaryButton
                                size="xs"
                                onClick={() => handleOpenResetModal(u)}
                                title="Restablecer contraseña"
                              >
                                <Icon name="Key" size="xs" />
                              </TertiaryButton>
                              <TertiaryButton
                                size="xs"
                                onClick={() => handleOpenEditModal(u)}
                                title="Editar usuario"
                              >
                                <Icon name="Edit2" size="xs" />
                              </TertiaryButton>
                              <TertiaryButton
                                size="xs"
                                color="error"
                                onClick={() => handleOpenDeleteModal(u)}
                                title={u.isActive ? 'Desactivar usuario' : 'Usuario ya inactivo'}
                                disabled={!u.isActive}
                              >
                                <Icon name="UserX" size="xs" />
                              </TertiaryButton>
                            </Flex>
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Box as="tr">
                      <Box as="td" colSpan={7} className="py-12 text-center">
                        <Text variant="muted">
                          {searchValue
                            ? `No se encontraron usuarios con "${searchValue}".`
                            : 'No hay usuarios registrados.'}
                        </Text>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>

            )}
          </Box>
        </Box>

      {/* ── Add User Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={activeModal === 'addUser'}
        onClose={() => setActiveModal(null)}
        title="Nuevo Usuario"
        maxWidth="540px"
      >
        <Stack spacing="md">
          {submitError && (
            <Box bg="base-200" rounded="DEFAULT" className="p-3 border border-error/30 text-error text-sm">
              <Text variant="error">{submitError}</Text>
            </Box>
          )}

          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Nombre completo *
            </Text>
            <TextInput
              placeholder="Ej. Juan Pérez"
              size="sm"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              errorMessage={fieldErrors.name}
            />
          </Box>

          <Box>
            <Flex justify="between" align="center" className="mb-1">
              <Text as="label" size="xs" weight="semibold" variant="muted">
                Nombre de usuario (Opcional)
              </Text>
              {isGeneratingUsername && <Text size="xs" variant="muted">Generando sugerencia...</Text>}
              {usernameStatus.checking && <Text size="xs" variant="muted">Verificando...</Text>}
              {!usernameStatus.checking && usernameStatus.available === true && (
                <Text size="xs" variant="success" weight="bold">✔ Disponible</Text>
              )}
              {!usernameStatus.checking && usernameStatus.available === false && (
                <Text size="xs" variant="error" weight="bold">❌ No disponible</Text>
              )}
            </Flex>
            <TextInput
              placeholder="juan.perez (Se autogenera si se deja vacío)"
              size="sm"
              value={formData.username || ''}
              onChange={(e) => handleUsernameChange(e.target.value)}
              errorMessage={fieldErrors.username}
            />
            <Text size="xs" variant="muted" className="mt-1">
              Si no se especifica, se autogenera basado en el nombre.
            </Text>
          </Box>

          <Grid cols={{ base: 1, sm: 2 }} gap="md">
            <Box>
              <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                Correo
              </Text>
              <TextInput
                placeholder="juan@ferventa.com"
                type="email"
                size="sm"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                errorMessage={fieldErrors.email}
              />
            </Box>
            <Box>
              <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                Teléfono (10 dígitos)
              </Text>
              <TextInput
                placeholder="99 1234 5678"
                type="tel"
                size="sm"
                maxLength={12}
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                errorMessage={fieldErrors.phone}
              />
            </Box>
          </Grid>

          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Contraseña (Opcional)
            </Text>
            <TextInput
              placeholder="Opcional: Se generará una automáticamente si se deja vacío"
              type="password"
              size="sm"
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
            />
          </Box>

          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Rol del Usuario *
            </Text>
            <Select
              options={roleSelectOptions}
              value={formData.roleId}
              onChange={(e) => {
                setFormData((p) => ({ ...p, roleId: e.target.value }));
                setFieldErrors((f) => ({ ...f, roleId: undefined }));
              }}
              size="sm"
              isError={!!fieldErrors.roleId}
            />
            {fieldErrors.roleId && (
              <Text size="xs" variant="error" className="mt-1">{fieldErrors.roleId}</Text>
            )}
          </Box>

          {/* Branches checklist */}
          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Sucursales Asignadas *
            </Text>
            <Box rounded="DEFAULT" className="p-3 border border-base-300 max-h-36 overflow-y-auto space-y-2">
              {branches.length > 0 ? (
                branches.map((b) => (
                  <Checkbox
                    key={b.id}
                    size="sm"
                    label={b.name}
                    checked={formData.branches.includes(b.id)}
                    onChange={() => handleBranchToggle(b.id)}
                  />
                ))
              ) : (
                <Text size="xs" variant="muted">No hay sucursales disponibles.</Text>
              )}
            </Box>
            {fieldErrors.branches && (
              <Text size="xs" variant="error" className="mt-1">
                {fieldErrors.branches}
              </Text>
            )}
          </Box>

          <Flex justify="end" gap="sm" className="pt-3 border-t border-base-300">
            <SecondaryButton size="sm" onClick={() => setActiveModal(null)} disabled={isSubmitting}>
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              color="primary"
              onClick={handleSaveUser}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Crear Usuario <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </Flex>
        </Stack>
      </Modal>

      {/* ── Edit User Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={activeModal === 'editUser' && selectedUser !== null}
        onClose={() => {
          setActiveModal(null);
          setSelectedUser(null);
        }}
        title={`Editar Usuario: ${selectedUser?.name || ''}`}
        maxWidth="540px"
      >
        <Stack spacing="md">
          {submitError && (
            <Box bg="base-200" rounded="DEFAULT" className="p-3 border border-error/30 text-error text-sm">
              <Text variant="error">{submitError}</Text>
            </Box>
          )}

          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Nombre completo *
            </Text>
            <TextInput
              placeholder="Nombre"
              size="sm"
              value={editForm.name || ''}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              errorMessage={editFieldErrors.name}
            />
          </Box>

          <Grid cols={{ base: 1, sm: 2 }} gap="md">
            <Box>
              <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                Correo
              </Text>
              <TextInput
                placeholder="correo@ejemplo.com"
                type="email"
                size="sm"
                value={editForm.email || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              />
            </Box>
            <Box>
              <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                Teléfono (10 dígitos)
              </Text>
              <TextInput
                placeholder="99 1234 5678"
                type="tel"
                size="sm"
                maxLength={12}
                value={editForm.phone || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, phone: formatPhoneInput(e.target.value) }))}
              />
            </Box>
          </Grid>

          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Rol del Usuario
            </Text>
            <Select
              options={roleSelectOptions}
              value={editForm.roleId || ''}
              onChange={(e) => setEditForm((p) => ({ ...p, roleId: e.target.value }))}
              size="sm"
            />
          </Box>

          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
              Sucursales Asignadas
            </Text>
            <Box rounded="DEFAULT" className="p-3 border border-base-300 max-h-32 overflow-y-auto space-y-2">
              {branches.map((b) => (
                <Checkbox
                  key={b.id}
                  size="sm"
                  label={b.name}
                  checked={(editForm.branches || []).includes(b.id)}
                  onChange={() => handleEditBranchToggle(b.id)}
                />
              ))}
            </Box>
          </Box>

          <Box>
            <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-2">
              Estado del Usuario
            </Text>
            <Flex gap="md">
              <PrimaryButton
                size="xs"
                color={editForm.isActive ? 'success' : 'neutral'}
                onClick={() => setEditForm((p) => ({ ...p, isActive: true }))}
              >
                ✓ Activo
              </PrimaryButton>
              <PrimaryButton
                size="xs"
                color={!editForm.isActive ? 'error' : 'neutral'}
                onClick={() => setEditForm((p) => ({ ...p, isActive: false }))}
              >
                ✗ Inactivo
              </PrimaryButton>
            </Flex>
          </Box>

          <Flex justify="end" gap="sm" className="pt-3 border-t border-base-300">
            <SecondaryButton
              size="sm"
              onClick={() => {
                setActiveModal(null);
                setSelectedUser(null);
              }}
              disabled={isSubmitting}
            >
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              color="primary"
              onClick={handleSaveEdit}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Guardar Cambios <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </Flex>
        </Stack>
      </Modal>

      {/* ── Soft Delete Confirm Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={activeModal === 'deleteUser' && selectedUser !== null}
        onClose={() => {
          setActiveModal(null);
          setSelectedUser(null);
        }}
        title="Desactivar Usuario"
        maxWidth="420px"
      >
        <Stack spacing="md" className="text-center items-center">
          <Box className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
            <Icon name="UserX" size="md" />
          </Box>
          <Text size="sm">
            ¿Estás seguro de desactivar a <Text as="strong" weight="bold">{selectedUser?.name}</Text>?
          </Text>
          <Box bg="base-200" rounded="DEFAULT" className="p-3 border border-base-300">
            <Text size="xs" variant="muted">
              El usuario no podrá iniciar sesión, pero su historial de ventas y datos permanecerán intactos.
            </Text>
          </Box>
          <Flex justify="center" gap="sm" className="w-full pt-2">
            <SecondaryButton
              size="sm"
              onClick={() => {
                setActiveModal(null);
                setSelectedUser(null);
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              color="error"
              onClick={handleConfirmDelete}
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              Sí, Desactivar <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </Flex>
        </Stack>
      </Modal>

      {/* ── Success & WhatsApp Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={activeModal === 'success' && successData !== null}
        onClose={() => {
          clearSuccessData();
          setActiveModal(null);
        }}
        title="¡Usuario Creado Exitosamente!"
        maxWidth="540px"
      >
        {successData && (
          <Stack spacing="md">
            <Box className="text-center">
              <Box className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-2">
                <Icon name="Check" size="md" />
              </Box>
              <Text size="xs" variant="muted">
                Se han generado las credenciales de acceso para el nuevo usuario.
              </Text>
            </Box>

            <Box bg="base-200" rounded="DEFAULT" className="p-4 border border-base-300">
              <Grid cols={{ base: 1, sm: 2 }} gap="sm" className="text-xs">
                <Box>
                  <Text size="xs" variant="muted" className="uppercase font-semibold">
                    Nombre
                  </Text>
                  <Text weight="bold">{successData.user.name}</Text>
                </Box>
                <Box>
                  <Text size="xs" variant="muted" className="uppercase font-semibold">
                    Usuario
                  </Text>
                  <Text weight="bold" variant="mono" className="text-primary">
                    {successData.user.username}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" variant="muted" className="uppercase font-semibold">
                    Correo
                  </Text>
                  <Text>{successData.user.email}</Text>
                </Box>
                <Box>
                  <Text size="xs" variant="muted" className="uppercase font-semibold">
                    Contraseña Temporal
                  </Text>
                  <Badge variant="soft" color="warning" size="xs" className="font-mono font-bold">
                    {successData.tempPassword || 'Definida manualmente'}
                  </Badge>
                </Box>
              </Grid>
            </Box>

            {successData.message && (
              <Box>
                <Text size="xs" weight="semibold" variant="muted" className="mb-1 block">
                  Detalles del mensaje:
                </Text>
                <Box bg="base-200" rounded="DEFAULT" className="p-3 text-xs max-h-36 overflow-y-auto whitespace-pre-wrap font-mono">
                  {successData.message}
                </Box>
              </Box>
            )}

            <Stack spacing="sm" className="pt-2 border-t border-base-300">
              {successData.whatsappUrl && (
                <PrimaryButton
                  size="sm"
                  color="success"
                  onClick={() => window.open(successData.whatsappUrl, '_blank')}
                  iconStart={<Icon name="MessageSquare" size="xs" />}
                >
                  Enviar por WhatsApp
                </PrimaryButton>
              )}

              <Flex gap="sm">
                <SecondaryButton
                  size="sm"
                  onClick={handleCopyMessage}
                  className="flex-1"
                  iconStart={<Icon name="Copy" size="xs" />}
                >
                  {copiedMessage ? '¡Copiado!' : 'Copiar mensaje'}
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  onClick={() => {
                    clearSuccessData();
                    setActiveModal(null);
                  }}
                  className="flex-1"
                >
                  Cerrar
                </SecondaryButton>
              </Flex>
            </Stack>
          </Stack>
        )}
      </Modal>

      {/* ── Reset Password Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={activeModal === 'resetPassword' && selectedUser !== null}
        onClose={() => {
          setActiveModal(null);
          setSelectedUser(null);
        }}
        title={`Restablecer Contraseña: ${selectedUser?.name || ''}`}
        maxWidth="480px"
        headerVariant="warning"
      >
        <Stack spacing="md">
          {submitError && (
            <Box bg="base-200" rounded="DEFAULT" className="p-3 border border-error/30 text-error text-sm">
              <Text variant="error">{submitError}</Text>
            </Box>
          )}

          <Box className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex gap-3 items-start">
            <Icon name="Key" size="sm" className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <Text size="xs" className="text-amber-800 dark:text-amber-200 leading-relaxed">
              Al restablecer la contraseña, se invalidará la anterior y se asignará una clave provisional. Podrás enviársela directamente por WhatsApp o copiarla.
            </Text>
          </Box>

          <Box bg="base-200" rounded="DEFAULT" className="p-3 border border-base-300">
            <Text size="xs" variant="muted" className="block mb-1">
              Usuario a restablecer:
            </Text>
            <Text size="sm" weight="bold">
              {selectedUser?.name}{' '}
              <Text as="span" variant="mono" className="text-primary text-xs font-normal">
                (@{selectedUser?.username || '-'})
              </Text>
            </Text>
            <Text size="xs" variant="muted">
              {selectedUser?.email}
            </Text>
          </Box>

          <Box>
            <Flex justify="between" align="center" className="mb-1">
              <Text as="label" size="xs" weight="semibold" variant="muted">
                Nueva Contraseña (Opcional)
              </Text>
              <Text size="xs" variant="muted">
                Dejar vacío para autogenerar
              </Text>
            </Flex>
            <div className="relative flex items-center">
              <TextInput
                type={showResetInput ? 'text' : 'password'}
                placeholder="Dejar en blanco para autogenerar"
                size="sm"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowResetInput(!showResetInput)}
                className="absolute right-3 top-2.5 text-base-content/40 hover:text-base-content"
                title={showResetInput ? 'Ocultar' : 'Mostrar'}
              >
                <Icon name={showResetInput ? 'EyeOff' : 'Eye'} size="xs" />
              </button>
            </div>
          </Box>

          <Flex justify="end" gap="sm" className="pt-3 border-t border-base-300">
            <SecondaryButton
              size="sm"
              onClick={() => {
                setActiveModal(null);
                setSelectedUser(null);
              }}
              disabled={isSubmitting}
            >
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton
              size="sm"
              color="warning"
              onClick={handleConfirmResetPassword}
              loading={isSubmitting}
              disabled={isSubmitting}
              iconStart={<Icon name="Key" size="xs" />}
            >
              Restablecer Contraseña <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </Flex>
        </Stack>
      </Modal>

      {/* ── Reset Password Success Modal ──────────────────────────────────── */}
      <Modal
        isOpen={activeModal === 'resetSuccess' && resetSuccessData !== null}
        onClose={() => {
          clearResetSuccessData();
          setActiveModal(null);
          setSelectedUser(null);
        }}
        title="¡Contraseña Restablecida Con Éxito!"
        maxWidth="540px"
        headerVariant="success"
      >
        {resetSuccessData && (
          <Stack spacing="md">
            <Box className="text-center">
              <Box className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-2">
                <Icon name="Check" size="md" />
              </Box>
              <Text size="xs" variant="muted">
                Se ha asignado una nueva contraseña temporal para el usuario.
              </Text>
            </Box>

            <Box bg="base-200" rounded="DEFAULT" className="p-4 border border-base-300">
              <Grid cols={{ base: 1, sm: 2 }} gap="sm" className="text-xs">
                <Box>
                  <Text size="xs" variant="muted" className="uppercase font-semibold">
                    Usuario
                  </Text>
                  <Text weight="bold">{resetSuccessData.user.name}</Text>
                  <Text variant="mono" size="xs" className="text-primary">
                    @{resetSuccessData.user.username || '-'}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" variant="muted" className="uppercase font-semibold">
                    Nueva Contraseña Temporal
                  </Text>
                  <Flex align="center" gap="xs" className="mt-1">
                    <span className="font-mono bg-amber-500/10 text-amber-900 dark:text-amber-100 border border-amber-500/30 px-2 py-1 rounded text-sm font-bold">
                      {resetSuccessData.tempPassword}
                    </span>
                    <TertiaryButton
                      size="xs"
                      onClick={handleCopyResetPassword}
                      title="Copiar contraseña"
                    >
                      <Icon
                        name={copiedResetPassword ? 'Check' : 'Copy'}
                        size="xs"
                        className={copiedResetPassword ? 'text-success' : ''}
                      />
                    </TertiaryButton>
                  </Flex>
                </Box>
              </Grid>
            </Box>

            {resetSuccessData.message && (
              <Box>
                <Text size="xs" weight="semibold" variant="muted" className="mb-1 block">
                  Mensaje generado:
                </Text>
                <Box bg="base-200" rounded="DEFAULT" className="p-3 text-xs max-h-36 overflow-y-auto whitespace-pre-wrap font-mono">
                  {resetSuccessData.message}
                </Box>
              </Box>
            )}

            <Stack spacing="sm" className="pt-2 border-t border-base-300">
              {resetSuccessData.whatsappUrl && (
                <PrimaryButton
                  size="sm"
                  color="success"
                  onClick={() => window.open(resetSuccessData.whatsappUrl, '_blank')}
                  iconStart={<Icon name="MessageSquare" size="xs" />}
                >
                  Enviar credenciales por WhatsApp
                </PrimaryButton>
              )}

              <Flex gap="sm">
                <SecondaryButton
                  size="sm"
                  onClick={handleCopyResetMessage}
                  className="flex-1"
                  iconStart={<Icon name="Copy" size="xs" />}
                >
                  {copiedResetMessage ? '¡Mensaje Copiado!' : 'Copiar mensaje'}
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  onClick={() => {
                    clearResetSuccessData();
                    setActiveModal(null);
                    setSelectedUser(null);
                  }}
                  className="flex-1"
                >
                  Cerrar
                </SecondaryButton>
              </Flex>
            </Stack>
          </Stack>
        )}
      </Modal>
    </PageLayout>
  );
};

