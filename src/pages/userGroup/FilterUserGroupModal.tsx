import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Modal, Row, Select } from 'antd';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface FilterUserGroupProps {
  open: boolean;
  onClose: () => void;
  onSearch: (filters: Record<string, any>) => void;
  defaultFilters?: Record<string, any>;
}

const FilterUserGroupModal: React.FC<FilterUserGroupProps> = ({
  open,
  onClose,
  onSearch,
  defaultFilters,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();

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

  useEffect(() => {
    if (open) {
      form.setFieldsValue(defaultFilters || {});
    }
  }, [open]);
  return (
    <Modal
      open={open}
      centered
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
            <Form.Item label={t('userGroup.userGroupCode')} name="groupCode">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('userGroup.userGroupCode'),
                })}
                maxLength={100}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('userGroup.userGroupName')} name="groupName">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('userGroup.userGroupName'),
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

export default FilterUserGroupModal;
