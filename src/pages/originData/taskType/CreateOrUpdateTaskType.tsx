import React, { useEffect, useState, useRef } from 'react';
import { Modal, Form, Input, Button, Switch, Divider, Select, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { removeAccents, sanitizeInput } from '../../../utils/stringUtils';

interface AddTaskTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (values: any) => Promise<boolean> | void;
  taskTypeData?: any;
}

export const AddTaskTypeModal: React.FC<AddTaskTypeModalProps> = ({
  open,
  onClose,
  onSubmit,
  taskTypeData,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const initialValuesRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (open && taskTypeData) {
      form.setFieldsValue(taskTypeData);
      initialValuesRef.current = {
        taskTypeCode: taskTypeData.taskTypeCode ?? '',
        taskTypeName: taskTypeData.taskTypeName ?? '',
        taskTypeDescription: taskTypeData.taskTypeDescription ?? '',
        taskTypePriority: taskTypeData.taskTypePriority ?? '',
        isActive: taskTypeData.isActive ?? 0,
      };
    } else if (open) {
      form.setFieldsValue({ isActive: 1 });
      initialValuesRef.current = {
        taskTypeCode: '',
        taskTypeName: '',
        taskTypeDescription: '',
        taskTypePriority: '',
        isActive: 1,
      };
    } else {
      form.resetFields();
      initialValuesRef.current = null;
    }
  }, [open, taskTypeData, form]);

  const isDirty = () => {
    if (!initialValuesRef.current) return false;
    const keys = [
      'taskTypeCode',
      'taskTypeName',
      'taskTypeDescription',
      'taskTypePriority',
      'isActive',
    ];
    for (const k of keys) {
      const init = initialValuesRef.current[k];
      const cur = form.getFieldValue(k);
      const initNorm = init === undefined || init === null ? '' : init;
      const curNorm = cur === undefined || cur === null ? '' : cur;
      if (String(initNorm) !== String(curNorm)) return true;
    }
    return false;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Sanitize all
      values.taskTypeCode = sanitizeInput(values.taskTypeCode);
      values.taskTypeName = sanitizeInput(values.taskTypeName);
      values.taskTypeDescription = sanitizeInput(values.taskTypeDescription);
      values.taskTypePriority = Number(values.taskTypePriority) || 0;

      if (taskTypeData?.id) {
        values.id = taskTypeData.id;
        values.version = taskTypeData.version;
      }
      if (typeof values.status === 'boolean') {
        values.status = values.status ? 1 : 0;
      }

      setSaving(true);
      const success = await onSubmit?.(values);
      if (success) {
        form.resetFields();
        onClose();
      }
    } catch (err) {
      console.warn('Validation failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty()) {
      Modal.confirm({
        title: t('common.NotifyCancelChange'),
        centered: true,
        onOk() {
          form.resetFields();
          onClose();
        },
        onCancel() {},
        okText: 'Có',
        cancelText: 'Không',
      });
      return;
    }

    form.resetFields();
    onClose();
  };

  const options = [
    {
      value: 0,
      label: <Tag color="default">{t('common.priority.default')}</Tag>,
    },
    {
      value: 1,
      label: <Tag color="green">{t('common.priority.low')}</Tag>,
    },
    {
      value: 2,
      label: <Tag color="gold">{t('common.priority.medium')}</Tag>,
    },
    {
      value: 3,
      label: <Tag color="red">{t('common.priority.high')}</Tag>,
    },
  ];

  return (
    <Modal
      centered
      open={open}
      title={
        !taskTypeData?.taskTypeCode
          ? t('originData.taskType.create')
          : t('originData.taskType.update')
      }
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {t('common.Close')}
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>
          {t('common.Save')}
        </Button>,
      ]}
      width={720}
      maskClosable={false}
      destroyOnClose
    >
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        {/* DOMAIN CODE */}
        <Form.Item
          label={t('originData.taskType.code')}
          name="taskTypeCode"
          validateTrigger="onChange"
          rules={[
            { required: true, message: t('originData.taskType.RequiedCode') },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const sanitized = sanitizeInput(value);
                if (sanitized.length < 2 || sanitized.length > 50) {
                  return Promise.reject(
                    new Error(t('common.lengthBetween', { min: 2, max: 50 }))
                  );
                }
                const regex = /^[A-Z][A-Z0-9_\-]*$/;
                if (!regex.test(sanitized)) {
                  return Promise.reject(
                    new Error(t('originData.taskType.InvalidCodeFormat'))
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder={t('originData.taskType.code')}
            maxLength={50}
            disabled={taskTypeData?.taskTypeCode?.length}
            onChange={(e) => {
              let value = e.target.value || '';
              value = removeAccents(value);
              value = value.replace(/\s+/g, '');
              value = value.toUpperCase();
              form.setFieldsValue({ taskTypeCode: value });
            }}
          />
        </Form.Item>

        {/* DOMAIN NAME */}
        <Form.Item
          label={t('originData.taskType.name')}
          name="taskTypeName"
          validateTrigger="onChange"
          rules={[
            { required: true, message: t('originData.taskType.name') },
            {
              validator: (_, value) => {
                const sanitized = sanitizeInput(value);
                if (sanitized.length < 2 || sanitized.length > 255) {
                  return Promise.reject(
                    new Error(t('common.lengthBetween', { min: 2, max: 255 }))
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder={t('originData.taskType.name')}
            maxLength={255}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value);
              form.setFieldsValue({ taskTypeName: sanitized });
            }}
          />
        </Form.Item>

        {/* DOMAIN DESCRIPTION */}
        <Form.Item
          label={t('originData.taskType.description')}
          name="taskTypeDescription"
          validateTrigger="onChange"
          rules={[
            {
              validator: (_, value) => {
                const sanitized = sanitizeInput(value);
                if (sanitized.length > 500) {
                  return Promise.reject(
                    new Error(t('common.maxLength', { max: 500 }))
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input.TextArea
            placeholder={t('originData.taskType.description')}
            rows={4}
            maxLength={500}
            showCount={{ formatter: ({ count }) => `${count}/500` }}
            autoSize={{ minRows: 3, maxRows: 8 }}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value);
              form.setFieldsValue({ taskTypeDescription: sanitized });
            }}
          />
        </Form.Item>

        <Form.Item
          label={t('originData.taskType.priority')}
          name="taskTypePriority"
          validateTrigger="onChange"
          rules={[
            {
              required: true,
              message: t('originData.taskType.requiredPriority'),
            },
          ]}
        >
          <Select
            placeholder={t('originData.taskType.priority')}
            allowClear
            style={{ width: '100%' }}
            options={options}
          />
        </Form.Item>

        {/* STATUS */}
        <Form.Item
          label={t('common.Status')}
          name="isActive"
          valuePropName="checked"
        >
          <Switch
            checked={form.getFieldValue('isActive') === 1}
            onChange={(checked) => {
              form.setFieldsValue({ isActive: checked ? 1 : 0 });
            }}
            checkedChildren={t('common.Check')}
            unCheckedChildren={t('common.Uncheck')}
          />
        </Form.Item>
      </Form>
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

export default AddTaskTypeModal;
