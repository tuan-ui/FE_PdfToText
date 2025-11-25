import React, { useEffect } from 'react';
import { Modal, Form, Input, Row, Col, Button, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

interface FilterRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (filters: Record<string, any>) => void;
  defaultFilters?: Record<string, any>;
}

export const FilterRoleModal: React.FC<FilterRoleModalProps> = ({
  open,
  onClose,
  onSearch,
  defaultFilters,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(defaultFilters || {});
    }
  }, [open, defaultFilters, form]);

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      onSearch(values);
      onClose();
    } catch (err) {
      console.warn('Validation failed:', err);
    }
  };

  const handleReset = () => {
    form.resetFields();
    onSearch({});
  };

  return (
    <Modal
      centered
      open={open}
      title={
        <>
          <SearchOutlined style={{ marginRight: 8 }} />
          {t('common.Filter')}
        </>
      }
      onCancel={onClose}
      footer={[
        <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
          {t('common.Reset')}
        </Button>,
        <Button key="cancel" onClick={onClose}>
          {t('common.Close')}
        </Button>,
        <Button
          key="search"
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
        >
          {t('common.Search')}
        </Button>,
      ]}
      width={720}
      maskClosable={false}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('role.RoleCode')} name="roleCode">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('role.RoleCode'),
                })}
                maxLength={100}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('role.RoleName')} name="roleName">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('role.RoleName'),
                })}
                maxLength={100}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('common.isActive')} name="status">
              <Select allowClear placeholder={t('common.All')}>
                <Select.Option value={1}>{t('common.open')}</Select.Option>
                <Select.Option value={0}>{t('common.locked')}</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default FilterRoleModal;
