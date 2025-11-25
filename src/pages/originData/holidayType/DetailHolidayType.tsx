import { Modal, Button, Divider, Tag } from 'antd';
import { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LogDetailHolidayType } from '../../../api/holidayTypeApi';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

interface DetailHolidayTypeProps {
  open: boolean;
  holidayType?: any;
  onClose: () => void;
}

export const DetailHolidayType: React.FC<DetailHolidayTypeProps> = ({
  open,
  holidayType,
  onClose,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const values = await LogDetailHolidayType(holidayType.holidayTypeCode);
      } catch (err) {
        console.warn('Validation failed:', err);
      }
    };

    if (open) {
      handleSearch();
    }
  }, [holidayType, open]);

  const isOpen = holidayType?.isActive === 1 || holidayType?.isActive;
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
            {t('originData.holidayType.detail', { name: holidayType?.holidayTypeName })}
          </span>
          {holidayType && (
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
      {holidayType ? (
        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>{t('originData.holidayType.code')}:</strong>{' '}
            {holidayType.holidayTypeCode}
          </p>
          <p>
            <strong>{t('originData.holidayType.name')}:</strong>{' '}
            {holidayType.holidayTypeName}
          </p>
          <p>
            <strong>{t('originData.holidayType.description')}:</strong>{' '}
            {holidayType.description || '-'}
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
