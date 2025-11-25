import React, { useEffect, useState, useRef } from 'react';
import { Modal, Form, Input, Button, Switch, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { removeAccents, sanitizeInput } from '../../../utils/stringUtils';

interface AddDomainModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (values: any) => Promise<boolean> | void;
  domainData?: any;
}

export const AddDomainModal: React.FC<AddDomainModalProps> = ({
  open,
  onClose,
  onSubmit,
  domainData,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const initialValuesRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (open && domainData) {
      form.setFieldsValue(domainData);
      initialValuesRef.current = {
        domainCode: domainData.domainCode ?? '',
        domainName: domainData.domainName ?? '',
        domainDescription: domainData.domainDescription ?? '',
        isActive: domainData.isActive ?? 0,
      };
    } else if (open) {
      form.setFieldsValue({ isActive: 1 });
      initialValuesRef.current = {
        domainCode: '',
        domainName: '',
        domainDescription: '',
        isActive: 1,
      };
    } else {
      form.resetFields();
      initialValuesRef.current = null;
    }
  }, [open, domainData, form]);

  const isDirty = () => {
    if (!initialValuesRef.current) return false;
    const keys = ['domainCode', 'domainName', 'domainDescription', 'isActive'];
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
      values.domainCode = sanitizeInput(values.domainCode);
      values.domainName = sanitizeInput(values.domainName);
      values.domainDescription = sanitizeInput(values.domainDescription);

      if (domainData?.id) {
        values.id = domainData.id;
        values.version = domainData.version;
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
        !domainData?.domainCode
          ? t('originData.domain.AddDomain')
          : t('originData.domain.EditDomain')
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
          label={t('originData.domain.DomainCode')}
          name="domainCode"
          validateTrigger="onChange"
          rules={[
            { required: true, message: t('originData.domain.RequiedCode') },
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
                    new Error(t('originData.domain.InvalidCodeFormat'))
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder={t('originData.domain.DomainCode')}
            maxLength={50}
            disabled={!!domainData}
            onChange={(e) => {
              let value = e.target.value || '';
              value = removeAccents(value);
              value = value.replace(/\s+/g, '');
              value = value.toUpperCase();
              form.setFieldsValue({ domainCode: value });
            }}
          />
        </Form.Item>

        {/* DOMAIN NAME */}
        <Form.Item
          label={t('originData.domain.DomainName')}
          name="domainName"
          validateTrigger="onChange"
          rules={[
            { required: true, message: t('originData.domain.RequiedName') },
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
            placeholder={t('originData.domain.DomainName')}
            maxLength={255}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value);
              form.setFieldsValue({ domainName: sanitized });
            }}
          />
        </Form.Item>

        {/* DOMAIN DESCRIPTION */}
        <Form.Item
          label={t('originData.domain.DomainDescription')}
          name="domainDescription"
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
            placeholder={t('originData.domain.DomainDescription')}
            rows={4}
            maxLength={500}
            showCount={{ formatter: ({ count }) => `${count}/500` }}
            autoSize={{ minRows: 3, maxRows: 8 }}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value);
              form.setFieldsValue({ domainDescription: sanitized });
            }}
          />
        </Form.Item>

        {/* STATUS */}
        <Form.Item
          label={t('common.isActive')}
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

export default AddDomainModal;
