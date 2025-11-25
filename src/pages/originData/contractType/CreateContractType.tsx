import React, { useEffect, useState, useRef } from 'react';
import { Modal, Form, Input, Button, Switch, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { removeAccents, sanitizeInput } from '../../../utils/stringUtils';

interface AddContractTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (values: any) => Promise<boolean> | void;
  contractTypeData?: any;
}

export const AddContractTypeModal: React.FC<AddContractTypeModalProps> = ({
  open,
  onClose,
  onSubmit,
  contractTypeData,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const initialValuesRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (open && contractTypeData) {
      form.setFieldsValue(contractTypeData);
      initialValuesRef.current = {
        contractTypeCode: contractTypeData.contractTypeCode ?? '',
        contractTypeName: contractTypeData.contractTypeName ?? '',
        contractTypeDescription: contractTypeData.contractTypeDescription ?? '',
        isActive: contractTypeData.isActive ?? 0,
      };
    } else if (open) {
      form.setFieldsValue({ isActive: 1 });
      initialValuesRef.current = {
        contractTypeCode: '',
        contractTypeName: '',
        contractTypeDescription: '',
        isActive: 1,
      };
    } else {
      form.resetFields();
      initialValuesRef.current = null;
    }
  }, [open, contractTypeData, form]);

  const isDirty = () => {
    if (!initialValuesRef.current) return false;
    const keys = [
      'contractTypeCode',
      'contractTypeName',
      'contractTypeDescription',
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
      values.contractTypeCode = sanitizeInput(values.contractTypeCode);
      values.contractTypeName = sanitizeInput(values.contractTypeName);
      values.contractTypeDescription = sanitizeInput(values.contractTypeDescription);

      if (contractTypeData?.id) {
        values.id = contractTypeData.id;
        values.version = contractTypeData.version;
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

  return (
    <Modal
      centered
      open={open}
      title={
        !contractTypeData?.contractTypeCode
          ? t('originData.contractType.create')
          : t('originData.contractType.update')
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
          label={t('originData.contractType.code')}
          name="contractTypeCode"
          validateTrigger="onChange"
          rules={[
            { required: true, message: t('originData.contractType.RequiedCode') },
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
                    new Error(t('originData.contractType.InvalidCodeFormat'))
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder={t('originData.contractType.code')}
            maxLength={50}
            disabled={contractTypeData?.contractTypeCode?.length}
            onChange={(e) => {
              let value = e.target.value || '';
              value = removeAccents(value);
              value = value.replace(/\s+/g, '');
              value = value.toUpperCase();
              form.setFieldsValue({ contractTypeCode: value });
            }}
          />
        </Form.Item>

        {/* DOMAIN NAME */}
        <Form.Item
          label={t('originData.contractType.name')}
          name="contractTypeName"
          validateTrigger="onChange"
          rules={[
            { required: true, message: t('originData.contractType.name') },
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
            placeholder={t('originData.contractType.name')}
            maxLength={255}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value);
              form.setFieldsValue({ contractTypeName: sanitized });
            }}
          />
        </Form.Item>

        {/* DOMAIN DESCRIPTION */}
        <Form.Item
          label={t('originData.contractType.description')}
          name="contractTypeDescription"
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
            placeholder={t('originData.contractType.description')}
            rows={4}
            maxLength={500}
            showCount={{ formatter: ({ count }) => `${count}/500` }}
            autoSize={{ minRows: 3, maxRows: 8 }}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value);
              form.setFieldsValue({ contractTypeDescription: sanitized });
            }}
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

export default AddContractTypeModal;
