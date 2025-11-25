import React, { useEffect, useState } from 'react';
import { Modal, Tree, Spin, notification } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  getALlPermisstion,
  getRolePermissionsHalf,
  getRolePermisstion,
  saveRolePermisstion,
} from '../../api/roleApi';

const RolePermissionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  roleId: string | null;
}> = ({ open, onClose, roleId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [checkedHalfKeys, setCheckedHalfKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const getAllKeys = (nodes: TreeDataNode[]): string[] => {
    const keys: string[] = [];
    const traverse = (list: TreeDataNode[]) => {
      list.forEach((node) => {
        keys.push(node.key.toString());
        if (node.children && node.children.length > 0) traverse(node.children);
      });
    };
    traverse(nodes);
    return keys;
  };

  const buildTreeData = (items: any[]): TreeDataNode[] => {
    const map = new Map<string, TreeDataNode>();
    const roots: TreeDataNode[] = [];

    items.forEach((item) => {
      map.set(item.id, {
        key: item.id,
        title: t(item.permissionName) || item.permissionName,
        children: [],
      });
    });

    items.forEach((item) => {
      if (item.permissionParent && map.has(item.permissionParent)) {
        map.get(item.permissionParent)!.children!.push(map.get(item.id)!);
      } else {
        roots.push(map.get(item.id)!);
      }
    });

    return roots;
  };

  const fetchPermissions = async () => {
    if (!roleId) return;
    setLoading(true);
    try {
      const [allRes, roleRes, roleHalfRes] = await Promise.all([
        getALlPermisstion(),
        getRolePermisstion(roleId),
        getRolePermissionsHalf(roleId),
      ]);

      if (allRes?.status === 200 && Array.isArray(allRes.object)) {
        const tree = buildTreeData(allRes.object);
        setTreeData(tree);
        setExpandedKeys(getAllKeys(tree));
      }

      if (roleRes?.status === 200) {
        const permissions = Array.isArray(roleRes.object) ? roleRes.object : [];
        const rolePermIds = permissions.map((p: any) => p.id);
        setCheckedKeys(rolePermIds);
      }
      if (roleHalfRes?.status === 200) {
        const permissionsHalf = Array.isArray(roleHalfRes.object)
          ? roleHalfRes.object
          : [];
        const rolePermIdsHalf = permissionsHalf.map((p: any) => p.id);
        setCheckedHalfKeys(rolePermIdsHalf);
      }
    } catch (err) {
      console.error('Failed to load permissions', err);
      notification.error({
        message: t('common.actionFailed'),
        description: t('common.failed'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await saveRolePermisstion(
        roleId,
        checkedKeys as string[],
        checkedHalfKeys as string[]
      );
      if (res.status === 200) {
        notification.success({
          message: t('common.actionSuccess'),
          description: t('role.UpdatePermissionSuccess'),
        });
        onClose();
      } else {
        notification.error({
          message: t('common.actionFailed'),
          description: t(res?.message),
        });
      }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: t('role.UpdatePermissionFailed'),
      });
    }
  };

  useEffect(() => {
    if (open && roleId) fetchPermissions();
  }, [open, roleId]);

  return (
    <Modal
      title={t('role.RolePermission')}
      open={open}
      onOk={handleSave}
      onCancel={onClose}
      width={700}
      okText={t('common.Save')}
      cancelText={t('common.Close')}
      centered
      styles={{
        body: {
          padding: '16px 24px',
          maxHeight: '70vh',
          overflowY: 'auto',
        },
      }}
    >
      <Spin spinning={loading}>
        <div
          style={{
            maxHeight: '60vh',
            overflowY: 'auto',
            border: '1px solid #f0f0f0',
            padding: '8px 12px',
            borderRadius: 4,
          }}
        >
          <Tree
            checkable
            showLine
            checkStrictly={false}
            switcherIcon={<DownOutlined />}
            treeData={treeData}
            checkedKeys={{
              checked: checkedKeys,
              halfChecked: checkedHalfKeys,
            }}
            onCheck={(checkedKeysValue, info) => {
              const checkedArray = Array.isArray(checkedKeysValue)
                ? checkedKeysValue
                : checkedKeysValue.checked;

              const halfCheckedArray =
                (info?.halfCheckedKeys as React.Key[]) || [];

              setCheckedHalfKeys(halfCheckedArray);
              setCheckedKeys(checkedArray);
            }}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys as React.Key[])}
          />
        </div>
      </Spin>
    </Modal>
  );
};

export default RolePermissionModal;
