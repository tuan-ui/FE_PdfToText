import { useEffect, useState, useCallback } from 'react';
import { getUserPermissions, getPermissionsCurrent } from '../api/roleApi';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

export interface MenuActions {
  add: boolean;
  edit: boolean;
  delete: boolean;
  permission: boolean;
}

export const useMenuPermission = (menuCode: string) => {
  const [actions, setActions] = useState<MenuActions>({
    add: false,
    edit: false,
    delete: false,
    permission: false,
  });
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPermissionsCurrent(menuCode);
      setActions({
        add: !!res?.add,
        edit: !!res?.edit,
        delete: !!res?.delete,
        permission: !!res?.permission,
      });
    } catch (err) {
      setActions({ add: false, edit: false, delete: false, permission: false });
    } finally {
      setLoading(false);
    }
  }, [menuCode]);

  const checkMenuAccess = async (): Promise<boolean> => {
    try {
      const res = await getUserPermissions();
      if (!res?.object) return false;
      return res.object.some(
        (p: any) => p.permissionCode === menuCode && p.isMenus && !p.isDeleted
      );
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  useEffect(() => {
    if (loading) return;
    const isAddEdit = /\/(add|edit)(\/.*)?$/.test(location.pathname);
    if (isAddEdit && !actions.edit) {
      notification.warning({
        message: t('common.Warning'),
        description: t('error.NoPermissToAction'),
        duration: 5,
      });
      const listPath = location.pathname.replace(/\/(add|edit)(\/.*)?$/, '');
      navigate(listPath || '/home', { replace: true });
    }
  }, [actions, loading, location.pathname, navigate, t]);

  const can = async (action: keyof MenuActions): Promise<boolean> => {
    await fetchActions();
    return actions[action];
  };

  const exec = async <T = void>(
    action: keyof MenuActions,
    callback: () => Promise<T> | T,
    onForbidden?: () => void
  ): Promise<T extends void ? boolean : T> => {
    const allowed = await can(action);
    if (!allowed) {
      notification.warning({
        message: t('common.Warning'),
        description: t('error.NoPermissToAction'),
        duration: 5,
      });
      onForbidden?.();
      return false as any;
    }

    const result = callback();
    const finalResult = result instanceof Promise ? await result : result;
    return (finalResult === undefined ? true : finalResult) as any;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchActions();
    }, 5000);

    const handlePermissionChange = () => fetchActions();
    window.addEventListener('permissionChanged', handlePermissionChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('permissionChanged', handlePermissionChange);
    };
  }, [fetchActions]);

  return {
    ...actions,
    loading,
    refetch: fetchActions,
    checkMenuAccess,
    canAdd: actions.add,
    canEdit: actions.edit,
    canDelete: actions.delete,
    canAssign: actions.permission,
    can,
    exec,
  };
};
