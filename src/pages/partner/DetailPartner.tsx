import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Modal, Button, Divider, Tag } from 'antd';
import { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogDetailPartner } from '../../api/partnerAPI';

interface DetailRoleProps {
  open: boolean;
  role?: any;
  onClose: () => void;
}

export const DetailRole: React.FC<DetailRoleProps> = ({
  open,
  role,
  onClose,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const values = await LogDetailPartner(role.id);
      } catch (err) {
        console.warn('Validation failed:', err);
      }
    };

    if (open) {
      handleSearch();
    }
  }, [role, open]);

  const isOpen = role?.isActive === 1 || role?.isActive;
  const label = isOpen ? t('common.open') : t('common.locked');
  const color = isOpen ? 'green-inverse' : 'volcano-inverse';
  const icon = isOpen ? CheckCircleOutlined : ExclamationCircleOutlined;

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
          <span style={{ fontWeight: 600, fontSize: 18 }}>
            {t('partner.detail', { name: role?.partnerName })}
          </span>
          {role && (
            <Tag
              color={color}
              icon={createElement(icon)}
              style={{
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
      width={700}
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
            <strong>{t('partner.partnerCode')}:</strong> {role.partnerCode}
          </p>
          <p>
            <strong>{t('partner.partnerName')}:</strong> {role.partnerName}
          </p>
          <p>
            <strong>{t('partner.phone')}</strong> {role.phone || '-'}
          </p>
          <p>
            <strong>{t('partner.fax')}:</strong> {role.fax || '-'}
          </p>
          <p>
            <strong>{t('partner.email')}:</strong> {role.email || '-'}
          </p>
          <p>
            <strong>{t('partner.taxCode')}:</strong> {role.taxCode || '-'}
          </p>
          <p>
            <strong>{t('partner.website')}:</strong> {role.website || '-'}
          </p>
          <p>
            <strong>{t('partner.address')}:</strong> {role.address || '-'}
          </p>
        </div>
      ) : (
        <p>{t('common.DataNotFound')}</p>
      )}
      <Divider
        style={{
          margin: '8px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
    </Modal>
  );
};
