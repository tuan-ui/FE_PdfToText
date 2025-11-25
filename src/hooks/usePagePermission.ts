import { useEffect, useState, useCallback } from 'react';
import { getPermissionsCurrent } from '../api/roleApi';

export interface PagePermission {
  add: boolean;
  edit: boolean;
  delete: boolean;
  permission: boolean;
}

export const usePagePermission = (menuCode: string) => {
  const [permissions, setPermissions] = useState<PagePermission>({
    add: false,
    edit: false,
    delete: false,
    permission: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchPermission = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPermissionsCurrent(menuCode);
      setPermissions(res || { add: false, edit: false, delete: false, permission: false });
    } catch (e) {
      console.error('Error fetching permissions', e);
      setPermissions({ add: false, edit: false, delete: false, permission: false });
    } finally {
      setLoading(false);
    }
  }, [menuCode]);

  useEffect(() => {
    if (menuCode) {
      fetchPermission();
    }
  }, [menuCode, fetchPermission]);

  return { permissions, loading, refetch: fetchPermission };
};