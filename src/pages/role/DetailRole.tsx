import { Modal, Button, Divider, Tag } from 'antd';
import { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogDetailRole, Role } from '../../api/roleApi';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

interface DetailRoleProps {
  open: boolean;
  role?: Role | null;
  onClose: () => void;
}

export const DetailRole: React.FC<DetailRoleProps> = ({
  open,
  role,
  onClose,
}) => {
  const { t } = useTranslation();
  const isOpen = role?.isActive;
  const label = isOpen ? t('common.open') : t('common.locked');
  const color = isOpen ? 'green-inverse' : 'volcano-inverse';
  const icon = isOpen ? CheckCircleOutlined : ExclamationCircleOutlined;
  useEffect(() => {
    const handleSearch = async () => {
      try {
        const values = await LogDetailRole(role?.id || null);
      } catch (err) {
        console.warn('Validation failed:', err);
      }
    };

    if (open) {
      handleSearch();
    }
  }, [role]);

  return (
    <Modal
      centered
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 18, maxWidth: '700px' }}>
            {t('role.RoleDetail')} {role ? ` ${role?.roleName}` : ''}
          </span>
          {role && (
            <Tag
              color={color}
              icon={createElement(icon)}
              style={{
                fontSize: 13,
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              {label}
            </Tag>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common.Close')}
        </Button>,
      ]}
    >
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
      {role ? (
        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>{t('role.RoleName')}:</strong> {role.roleName}
          </p>
          <p>
            <strong>{t('role.RoleCode')}:</strong> {role.roleCode}
          </p>
          <p>
            <strong>{t('role.RoleDescription')}:</strong>{' '}
            {role.roleDescription || '-'}
          </p>
        </div>
      ) : (
        <p>{t('common.DataNotFound')}</p>
      )}
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
    </Modal>
  );
};
