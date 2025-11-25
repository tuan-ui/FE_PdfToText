import React, { useEffect } from 'react';
import { Modal, Form, Input, Row, Col, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchOutlined, UndoOutlined } from '@ant-design/icons';

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
        <Button key="reset"                       icon={
                        <UndoOutlined
                          style={{ fontSize: 14, verticalAlign: 'middle' }}
                        />
                      } onClick={handleReset}>
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
            <Form.Item label={t('partner.partnerName')} name="partnerName">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('partner.partnerName'),
                })}
                maxLength={100}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email" name="email">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: 'Email',
                })}
                maxLength={100}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('partner.phone')} name="phone">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('partner.phone'),
                })}
                maxLength={11}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('partner.address')} name="address">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('partner.address'),
                })}
                maxLength={11}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default FilterRoleModal;
