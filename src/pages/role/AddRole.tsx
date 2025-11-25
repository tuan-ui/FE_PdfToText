import React, { useEffect, useRef } from 'react';
import { Modal, Form, Input, Row, Col, Button, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { BuildOutlined } from '@ant-design/icons';
import { removeAccents, sanitizeInput } from '../../utils/stringUtils';

interface AddRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (values: any) => Promise<boolean>;
  roleData?: any;
}

export const AddRoleModal: React.FC<AddRoleModalProps> = ({
  open,
  onClose,
  onSubmit,
  roleData,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [saving, setSaving] = React.useState(false);
  const initialValuesRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (!open) {
      initialValuesRef.current = null;
      form.resetFields();
      return;
    }
    if (roleData) {
      const initialValues = {
        roleCode: roleData.roleCode || '',
        roleName: roleData.roleName || '',
        roleDescription: roleData.roleDescription || '',
      };
      initialValuesRef.current = initialValues;
      form.setFieldsValue(initialValues);
    } else {
      initialValuesRef.current = {
        roleCode: '',
        roleName: '',
        roleDescription: '',
      };
      form.setFieldsValue(initialValuesRef.current);
    }
  }, [open, roleData, form]);

  const isDirty = () => {
    if (!initialValuesRef.current) return false;
    const keys = ['roleCode', 'roleName', 'roleDescription'];
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
        okText: t('common.yes'),
        cancelText: t('common.no'),
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
      title={!roleData?.id ? t('role.AddRole') : t('role.EditRole')}
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
        layout="vertical"
        initialValues={{
          roleType: '1',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('role.RoleCode')}
              name="roleCode"
              validateTrigger="onChange"
              rules={[
                { required: true, message: t('role.RequiedCode') },
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
                onChange={(e) => {
                  let value = e.target.value || '';
                  value = removeAccents(value);
                  value = value.replace(/\s+/g, '');
                  value = value.toUpperCase();
                  form.setFieldsValue({ roleCode: value });
                  form.validateFields(['roleCode']).catch(() => {});
                }}
                disabled={!!roleData}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('role.RoleName')}
              name="roleName"
              validateTrigger="onChange"
              rules={[
                { required: true, message: t('role.RequiedName') },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const sanitized = sanitizeInput(value);
                    if (sanitized.length < 2 || sanitized.length > 255) {
                      return Promise.reject(
                        new Error(
                          t('common.lengthBetween', { min: 2, max: 255 })
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                onChange={(e) => {
                  const sanitized = sanitizeInput(e.target.value);
                  form.setFieldsValue({ roleName: sanitized });
                  form.validateFields(['roleName']).catch(() => {});
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <Form.Item
              label={t('role.RoleDescription')}
              name="roleDescription"
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
                rows={4}
                showCount={{ formatter: ({ count }) => `${count}/500` }}
                autoSize={{ minRows: 3, maxRows: 8 }}
                onChange={(e) => {
                  const sanitized = sanitizeInput(e.target.value);
                  form.setFieldsValue({ roleDescription: sanitized });
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
    </Modal>
  );
};

export default AddRoleModal;
