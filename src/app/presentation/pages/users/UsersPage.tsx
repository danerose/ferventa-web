import React, { useEffect, useState, useRef } from 'react';
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
    activeModal,
    setActiveModal,
    selectedUser,
    setSelectedUser,
    isSubmitting,
    submitError,
    successData,
    clearSuccessData,
    usernameStatus,
    loadData,
    createUser,
    updateUser,
    deleteUser,
    checkUsername,
    generateUsername,
  } = useUserStore();

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

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchValue.toLowerCase())) ||
      u.email.toLowerCase().includes(searchValue.toLowerCase())
  );

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
                            <Badge variant="soft" color={u.isActive ? 'success' : 'error'} size="xs">
                              {u.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </Box>
                          <Box as="td" className="py-3 px-4 text-center">
                            <Flex justify="center" gap="xs">
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
                      <Box as="td" colSpan={6} className="py-12 text-center">
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
              placeholder="Se autogenera si se deja vacía"
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
    </PageLayout>
  );
};
