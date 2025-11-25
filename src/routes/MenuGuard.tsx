// src/components/MenuGuard.tsx
import { useEffect, useState, useCallback } from 'react';
import { Spin, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserPermissions } from '../api/roleApi';

interface Permission {
  permissionCode: string;
  isMenus: boolean;
  isDeleted: boolean;
}

interface MenuGuardProps {
  menuCode: string;
  children: React.ReactNode;
}

export const MenuGuard: React.FC<MenuGuardProps> = ({ menuCode, children }) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const checkAccess = useCallback(async () => {
    try {
      const res = await getUserPermissions();

      if (res?.status !== 200 || !Array.isArray(res?.object)) {
        setHasAccess(false);
        if (location.pathname.includes(menuCode.toLowerCase())) {
          notification.warning({
            message: t('common.Warning'),
            description: t('error.NoPermission'),
            duration: 5,
          });
          navigate('/home', { replace: true });
        }
        return;
      }

      const permissions: Permission[] = res.object;
      const allowed = permissions.some(
        (p: Permission) =>
          p.permissionCode === menuCode &&
          p.isMenus === true &&
          p.isDeleted === false
      );

      setHasAccess(allowed);
      if (!allowed) {
        notification.warning({
          message: t('common.Warning'),
          description: t('error.NoPermission'),
          duration: 5,
        });
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setHasAccess(false);
      navigate('/home', { replace: true });
    }
  }, [menuCode, navigate, location.pathname, t]);

  // CHECK LẦN ĐẦU
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAccess();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkAccess]);

  useEffect(() => {
    const handlePermissionChange = () => checkAccess();
    window.addEventListener('permissionChanged', handlePermissionChange);
    return () =>
      window.removeEventListener('permissionChanged', handlePermissionChange);
  }, [checkAccess]);

  if (hasAccess === null) {
    return (
      <Spin
        tip="..."
        style={{ margin: '100px auto', display: 'block' }}
      />
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};
