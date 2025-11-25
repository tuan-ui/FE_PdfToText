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
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import locale from 'antd/es/date-picker/locale/vi_VN';
import enLocale from 'antd/es/date-picker/locale/en_US';
import { getAllUser, getListAction, getListFunction } from '../../api/logApi';

interface FilterLogModalProps {
  open: boolean;
  onClose: () => void;
  onSearch: (filters: Record<string, any>) => void;
  defaultFilters?: Record<string, any>;
}

export const FilterLogModal: React.FC<FilterLogModalProps> = ({
  open,
  onClose,
  onSearch,
  defaultFilters,
}) => {
  const [form] = Form.useForm();
  const { i18n, t } = useTranslation();
  dayjs.locale(i18n.language === 'vi' ? 'vi' : 'en');
  const dateLocale = i18n.language === 'vi' ? locale : enLocale;

  const [functions, setFunctions] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingFunction, setLoadingFunction] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const fetchAllFunction = async () => {
    setLoadingFunction(true);
    try {
      const res = await getListFunction();
      if (res?.status === 200 && res?.object) {
        setFunctions(res.object);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFunction(false);
    }
  };

  const fetchAllAction = async () => {
    setLoadingAction(true);
    try {
      const res = await getListAction();
      if (res?.status === 200 && res?.object) {
        setActions(res.object);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const fetchAlluser = async () => {
    setLoadingUser(true);
    try {
      const res = await getAllUser();
      if (res?.status === 200 && res?.object) {
        setUsers(res.object);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (open) {
      form.setFieldsValue(defaultFilters || {});
      fetchAllFunction();
      fetchAllAction();
      fetchAlluser();
    }
  }, [open, defaultFilters, form]);

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      const fromDate = values.fromDate ? dayjs(values.fromDate) : null;
      const toDate = values.toDate ? dayjs(values.toDate) : null;

      if (fromDate && toDate && fromDate.isAfter(toDate)) {
        message.warning(t('error.invalidDateRange'));
        return;
      }
      const formattedValues = {
        ...values,
        fromDateStr:
          values.fromDate && dayjs(values.fromDate).isValid()
            ? dayjs(values.fromDate).format('DD/MM/YYYY')
            : null,
        toDateStr:
          values.toDate && dayjs(values.toDate).isValid()
            ? dayjs(values.toDate).format('DD/MM/YYYY')
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
            <Form.Item label={t('user.user')} name="id">
              <Select
                allowClear
                showSearch
                placeholder={t('common.All', {
                  field: t('user.user'),
                })}
                loading={loadingUser}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={users.map((r) => ({
                  value: r.id,
                  label: r.fullName,
                }))}
                notFoundContent={
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span>{t('common.DataNotFound')}</span>}
                  />
                }
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="fromDate" label={t('user.fromDateCreate')}>
              <DatePicker
                style={{ width: '100%' }}
                format={i18n.language === 'vi' ? 'DD/MM/YYYY' : 'YYYY-MM-DD'}
                locale={dateLocale}
                placeholder={t('user.fromDateCreate')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="toDate" label={t('user.toDateCreate')}>
              <DatePicker
                style={{ width: '100%' }}
                format={i18n.language === 'vi' ? 'DD/MM/YYYY' : 'YYYY-MM-DD'}
                locale={dateLocale}
                placeholder={t('user.toDateCreate')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('log.functionList')} name="functionKey">
              <Select
                allowClear
                showSearch
                placeholder={t('common.All', {
                  field: t('log.functionList'),
                })}
                loading={loadingFunction}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={functions.map((key) => ({
                  value: key,
                  label: t(key),
                }))}
                notFoundContent={
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span>{t('common.DataNotFound')}</span>}
                  />
                }
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={t('log.actionList')} name="actionKey">
              <Select
                allowClear
                showSearch
                placeholder={t('common.All', {
                  field: t('log.actionList'),
                })}
                loading={loadingAction}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={actions.map((key) => ({
                  value: key,
                  label: t(key),
                }))}
                notFoundContent={
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span>{t('common.DataNotFound')}</span>}
                  />
                }
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default FilterLogModal;
