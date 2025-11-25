import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  Button,
  Select,
  DatePicker,
  Empty,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import locale from 'antd/es/date-picker/locale/vi_VN';
import enLocale from 'antd/es/date-picker/locale/en_US';

interface FilterUserModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (filters: Record<string, any>) => void;
  defaultFilters?: Record<string, any>;
}

export const FilterUserModal: React.FC<FilterUserModalProps> = ({
  open,
  onClose,
  onSearch,
  defaultFilters,
}) => {
  const [form] = Form.useForm();
  const { i18n, t } = useTranslation();

  dayjs.locale(i18n.language === 'vi' ? 'vi' : 'en');
  const dateLocale = i18n.language === 'vi' ? locale : enLocale;

  useEffect(() => {
    if (open) {
      form.setFieldsValue(defaultFilters || {});
    }
  }, [open]);

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        birthdayStr:
          values.birthday && dayjs(values.birthday).isValid()
            ? dayjs(values.birthday).format('DD/MM/YYYY')
            : null,
      };
      onSearch(formattedValues);
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
            <Form.Item label={t('user.userName')} name="userName">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('user.userName'),
                })}
                maxLength={100}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('user.UserCode')} name="userCode">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('user.UserCode'),
                })}
                maxLength={100}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('user.fullName')} name="fullName">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('user.fullName'),
                })}
                maxLength={100}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('user.phone')} name="phone">
              <Input
                placeholder={t('common.enterKeyword', {
                  field: t('user.phone'),
                })}
                maxLength={100}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="birthday" label={t('user.birthday')}>
              <DatePicker
                style={{ width: '100%' }}
                format={i18n.language === 'vi' ? 'DD/MM/YYYY' : 'YYYY-MM-DD'}
                locale={dateLocale}
                placeholder={t('user.selectBirthday')}
              />
            </Form.Item>
          </Col>
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

export default FilterUserModal;
