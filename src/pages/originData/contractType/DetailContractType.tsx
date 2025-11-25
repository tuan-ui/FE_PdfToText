import { Modal, Button, Divider, Tag } from 'antd';
import { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogDetailContractType } from '../../../api/contractTypeApi';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

interface DetailContractTypeProps {
  open: boolean;
  contractType?: any;
  onClose: () => void;
}

export const DetailContractType: React.FC<DetailContractTypeProps> = ({
  open,
  contractType,
  onClose,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const values = await LogDetailContractType(contractType.contractTypeCode);
      } catch (err) {
        console.warn('Validation failed:', err);
      }
    };

    if (open) {
      handleSearch();
    }
  }, [contractType, open]);

  const isOpen = contractType?.isActive === 1 || contractType?.isActive;
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
            {t('originData.contractType.detail', { name: contractType?.contractTypeName })}
          </span>
          {contractType && (
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
      {contractType ? (
        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>{t('originData.contractType.code')}:</strong>{' '}
            {contractType.contractTypeCode}
          </p>
          <p>
            <strong>{t('originData.contractType.name')}:</strong>{' '}
            {contractType.contractTypeName}
          </p>
          <p>
            <strong>{t('originData.contractType.description')}:</strong>{' '}
            {contractType.contractTypeDescription || '-'}
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
