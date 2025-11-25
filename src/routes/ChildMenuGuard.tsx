import { useEffect, useState, useCallback } from 'react';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { getUserOriginDataPermissions } from '../api/roleApi';

interface ChildMenuGuardProps {
  menuCode: string;
  children: React.ReactNode;
}

export const ChildMenuGuard: React.FC<ChildMenuGuardProps> = ({ menuCode, children }) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const { t } = useTranslation();

  const checkAccess = useCallback(async () => {
    try {
      const res = await getUserOriginDataPermissions();
      if (res?.status !== 200 || !Array.isArray(res.object)) {
        setHasAccess(false);
        return;
      }

      const allowed = res.object.some((p: any) =>
        p.permissionCode === menuCode &&
        p.isMenus === true &&
        p.isDeleted === false
      );

      setHasAccess(allowed);
    } catch (err) {
      setHasAccess(false);
    }
  }, [menuCode]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Real-time check
  useEffect(() => {
    const interval = setInterval(checkAccess, 5000);
    return () => clearInterval(interval);
  }, [checkAccess]);

  if (hasAccess === null) {
    return <Spin tip="..." />;
  }

  if (!hasAccess) {
    return <div style={{ padding: 24, color: '#999', textAlign: 'center' }}>
      {t('error.NoPermission')}
    </div>;
  }

  return <>{children}</>;
};