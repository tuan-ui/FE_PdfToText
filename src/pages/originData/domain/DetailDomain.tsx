import { Modal, Button, Divider, Tag } from 'antd';
import { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogDetailDomain } from '../../../api/domainApi';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

interface DetailDomainProps {
  open: boolean;
  domain?: any;
  onClose: () => void;
}

export const DetailDomain: React.FC<DetailDomainProps> = ({
  open,
  domain,
  onClose,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const values = await LogDetailDomain(domain.domainCode);
      } catch (err) {
        console.warn('Validation failed:', err);
      }
    };

    if (open) {
      handleSearch();
    }
  }, [domain, open]);

  const isOpen = domain?.isActive === 1 || domain?.isActive;
  const label = isOpen ? t('common.open') : t('common.locked');
  const color = isOpen ? 'green-inverse' : 'volcano-inverse';
  const icon = isOpen ? CheckCircleOutlined : ExclamationCircleOutlined;

  return (
    <Modal
      centered
      width={700}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common.Close')}
        </Button>,
      ]}
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 18 }}>
            {t('originData.domain.DomainDetail', { name: domain?.domainName })}
          </span>
          {domain && (
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
    >
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
      {domain ? (
        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>{t('originData.domain.DomainCode')}:</strong>{' '}
            {domain.domainCode}
          </p>
          <p>
            <strong>{t('originData.domain.DomainName')}:</strong>{' '}
            {domain.domainName}
          </p>
          <p>
            <strong>{t('originData.domain.DomainDescription')}:</strong>{' '}
            {domain.domainDescription || '-'}
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
