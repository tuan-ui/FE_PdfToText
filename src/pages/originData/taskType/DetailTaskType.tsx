import { Modal, Button, Divider, Tag } from 'antd';
import { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { LogDetailTaskType } from '../../../api/taskTypeApi';

interface DetailTaskTypeProps {
  open: boolean;
  taskType?: any;
  onClose: () => void;
}

export const DetailTaskType: React.FC<DetailTaskTypeProps> = ({
  open,
  taskType,
  onClose,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const values = await LogDetailTaskType(taskType.taskTypeCode);
      } catch (err) {
        console.warn('Validation failed:', err);
      }
    };

    if (open) {
      handleSearch();
    }
  }, [taskType, open]);

  const isOpen = taskType?.isActive === 1 || taskType?.isActive;
  const label = isOpen ? t('common.open') : t('common.locked');
  const color = isOpen ? 'green-inverse' : 'volcano-inverse';
  const icon = isOpen ? CheckCircleOutlined : ExclamationCircleOutlined;

  const getPriorityTag = (value: number) => {
    switch (value) {
      case 0:
        return <Tag color="default">{t('common.priority.default')}</Tag>;
      case 1:
        return <Tag color="green">{t('common.priority.low')}</Tag>;
      case 2:
        return <Tag color="gold">{t('common.priority.medium')}</Tag>;
      case 3:
        return <Tag color="red">{t('common.priority.high')}</Tag>;
      default:
        return <Tag color="default">{t('common.priority.invalid')}</Tag>;
    }
  };

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
            {t('originData.taskType.detail', { name: taskType?.taskTypeName })}
          </span>
          {taskType && (
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
      {taskType ? (
        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>{t('originData.taskType.code')}:</strong>{' '}
            {taskType.taskTypeCode}
          </p>
          <p>
            <strong>{t('originData.taskType.name')}:</strong>{' '}
            {taskType.taskTypeName}
          </p>
          <p>
            <strong>{t('originData.taskType.description')}:</strong>{' '}
            {taskType.taskTypeDescription || '-'}
          </p>
          <p>
            <strong>{t('originData.taskType.priority')}:</strong>{' '}
            {getPriorityTag(taskType.taskTypePriority)}
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
