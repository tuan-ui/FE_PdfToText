import { Modal, Button, Divider, Tag } from 'antd';
import { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogDetailDocType } from '../../../api/docTypeApi';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

interface DetailDocTypeProps {
  open: boolean;
  docType?: any;
  onClose: () => void;
}

export const DetailDocType: React.FC<DetailDocTypeProps> = ({
  open,
  docType,
  onClose,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const values = await LogDetailDocType(docType.docTypeCode);
      } catch (err) {
        console.warn('Validation failed:', err);
      }
    };

    if (open) {
      handleSearch();
    }
  }, [docType, open]);

  const isOpen = docType?.isActive === 1 || docType?.isActive;
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
            {t('originData.docType.detail', { name: docType?.docTypeName })}
          </span>
          {docType && (
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
      {docType ? (
        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>{t('originData.docType.code')}:</strong>{' '}
            {docType.docTypeCode}
          </p>
          <p>
            <strong>{t('originData.docType.name')}:</strong>{' '}
            {docType.docTypeName}
          </p>
          <p>
            <strong>{t('originData.docType.description')}:</strong>{' '}
            {docType.docTypeDescription || '-'}
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
