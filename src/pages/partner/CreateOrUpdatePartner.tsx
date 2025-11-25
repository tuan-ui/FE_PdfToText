import React, { useEffect, useRef } from 'react';
import { Modal, Form, Input, Row, Col, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { removeAccents, sanitizeInput } from '../../utils/stringUtils';
import { Partner } from '../../api/partnerAPI';

interface CreateOrUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (values: any) => Promise<boolean>;
  roleData?: any;
}
export const CreateOrUpdateModal: React.FC<CreateOrUpdateModalProps> = ({
  open,
  onClose,
  onSubmit,
  roleData,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    if (open && roleData) {
      form.setFieldsValue(roleData);
      // snapshot initial values for dirty-check
      initialValuesRef.current = { ...roleData };
    } else if (open) {
      // opening in create mode: set defaults and snapshot empty values
      form.resetFields();
      initialValuesRef.current = {
        partnerCode: '',
        partnerName: '',
        phone: '',
        fax: '',
        email: '',
        taxCode: '',
        website: '',
        address: '',
      };
    } else {
      form.resetFields();
      initialValuesRef.current = null;
    }
  }, [open, roleData, form]);

  const initialValuesRef = useRef<Record<string, any> | null>(null);

  const isDirty = () => {
    if (!initialValuesRef.current) return false;
    const keys = Object.keys(initialValuesRef.current);
    for (const k of keys) {
      const init = initialValuesRef.current![k];
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
      // sanitize all string inputs before submit
      values.partnerCode = sanitizeInput(
        String(values.partnerCode || '') || ''
      );
      values.partnerCode = removeAccents(values.partnerCode)
        .replace(/\s+/g, '')
        .toUpperCase();
      values.partnerName = sanitizeInput(String(values.partnerName || ''));
      values.phone = sanitizeInput(String(values.phone || ''));
      values.fax = sanitizeInput(String(values.fax || ''));
      values.email = sanitizeInput(String(values.email || ''));
      values.taxCode = sanitizeInput(String(values.taxCode || ''));
      values.website = sanitizeInput(String(values.website || ''));
      values.address = sanitizeInput(String(values.address || ''));

      if (roleData?.id) {
        values.id = roleData.id;
        values.version = roleData.version;
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
      title={!roleData?.id ? t('partner.AddPartner') : t('partner.EditPartner')}
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
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          roleType: '1',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('partner.partnerCode')}
              name="partnerCode"
              validateTrigger="onChange"
              rules={[
                { required: true, message: t('partner.requiredCode') },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const sanitized = sanitizeInput(value);
                    if (sanitized.length < 2 || sanitized.length > 50) {
                      return Promise.reject(
                        new Error(
                          t('common.lengthBetween', { min: 2, max: 50 })
                        )
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
                maxLength={51}
                disabled={!!roleData}
                onChange={(e) => {
                  let v = String(e.target.value || '');
                  v = removeAccents(v);
                  v = v.replace(/\s+/g, '');
                  v = v.toUpperCase();
                  form.setFieldsValue({ partnerCode: v });
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('partner.partnerName')}
              name="partnerName"
              validateTrigger="onChange"
              rules={[
                { required: true, message: t('partner.requiredName') },
                {
                  validator: (_, value) => {
                    if (value && value.length > 255) {
                      return Promise.reject(
                        new Error(t('common.maxLength', { max: 255 }))
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input maxLength={256} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('partner.phone')}
              name="phone"
              validateTrigger="onChange"
              rules={[
                { required: true, message: t('partner.requiredPhone') },
                {
                  validator: (_, value) => {
                    if (value && value.length > 20) {
                      return Promise.reject(
                        new Error(t('common.maxLength', { max: 20 }))
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input maxLength={21} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('partner.fax')}
              name="fax"
              validateTrigger="onChange"
              rules={[
                {
                  validator: (_, value) => {
                    if (value && value.length > 50) {
                      return Promise.reject(
                        new Error(t('common.maxLength', { max: 50 }))
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input maxLength={51} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('partner.Email')}
              name="email"
              validateTrigger="onChange"
              rules={[
                {
                  validator: (_, value) => {
                    if (value && value.length > 50) {
                      return Promise.reject(
                        new Error(t('common.maxLength', { max: 50 }))
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input maxLength={51} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('partner.taxCode')}
              name="taxCode"
              validateTrigger="onChange"
              rules={[
                {
                  validator: (_, value) => {
                    if (value && value.length > 50) {
                      return Promise.reject(
                        new Error(t('common.maxLength', { max: 50 }))
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input maxLength={51} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('partner.website')}
              name="website"
              validateTrigger="onChange"
              rules={[
                {
                  validator: (_, value) => {
                    if (value && value.length > 255) {
                      return Promise.reject(
                        new Error(t('common.maxLength', { max: 255 }))
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input maxLength={256} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('partner.address')}
              name="address"
              validateTrigger="onChange"
              rules={[
                {
                  validator: (_, value) => {
                    if (value && value.length > 255) {
                      return Promise.reject(
                        new Error(t('common.maxLength', { max: 255 }))
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input maxLength={256} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateOrUpdateModal;
