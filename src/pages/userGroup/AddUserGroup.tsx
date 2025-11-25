import React, { useEffect, useRef, useState } from 'react';
import { CreateUserGroup } from '../../api/userGroupApi';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Row,
  Table,
  Tooltip,
  Transfer,
  Typography,
} from 'antd';
import type { TableColumnsType, TableProps, TransferProps } from 'antd';
import { searchUsers } from '../../api/userApi';
import { User } from '../../api/partnerAPI';
import { ColumnGroupType, ColumnType } from 'antd/es/table';
import { UserType } from './interface/UserType';
import EllipsisText from './components/ElipsisText';
import TableTransfer from './components/TableTransfer';
import { removeAccents, sanitizeInput } from '../../utils/stringUtils';

interface UserGroupProps {
  open: boolean;
  userGroup?: CreateUserGroup | null;
  onClose: () => void;
  onSubmit: (values: any) => Promise<boolean> | void;
}

const AddUserGroup: React.FC<UserGroupProps> = ({
  open,
  userGroup,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [searchParams, setSearchParams] = useState<{
    username?: string;
    userCode?: string;
    fullName?: string;
  }>({});
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const initialValuesRef = useRef<Record<string, any> | null>(null);

  const fetchUsers = async (
    page = 1,
    size = -1,
    filters: Record<string, any> = searchParams
  ) => {
    try {
      const res = await searchUsers({ page: page - 1, size, ...filters });
      if (res?.status === 200 && res?.object) {
        const usersWithUserName = (res.object.content || []).map(
          (user: User) => ({
            key: String(user.id),
            username: user.username,
            userCode: user.userCode,
            fullName: user.fullName,
          })
        );

        setAllUsers(usersWithUserName);
        if (userGroup && userGroup.id) {
          const userIdsInGroup = new Set(
            userGroup.users?.map((u: User) => String(u.userId)) || []
          );
          const targetKeysInGroup = usersWithUserName
            .filter((user: UserType) => userIdsInGroup.has(user.key || ''))
            .map((user: UserType) => user.key || '');
          setTargetKeys(targetKeysInGroup);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setTargetKeys([]);
      initialValuesRef.current = null;
      return;
    }

    fetchUsers();

    if (userGroup) {
      // ✅ Edit
      form.setFieldsValue({
        groupCode: userGroup.groupCode,
        groupName: userGroup.groupName,
      });
      initialValuesRef.current = {
        groupCode: userGroup.groupCode || '',
        groupName: userGroup.groupName || '',
      };
    } else {
      // ✅ Add
      form.setFieldsValue({
        groupCode: '',
        groupName: '',
      });
      initialValuesRef.current = {
        groupCode: '',
        groupName: '',
      };
      setTargetKeys([]);
    }
  }, [userGroup, open, form]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      const payload = {
        ...values,
        userIds: targetKeys,
        id: userGroup?.id || null,
        version: userGroup?.version || 0,
      };
      const success = await onSubmit?.(payload);
      if (success) {
        form.resetFields();
        setTargetKeys([]);
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const userColumns: TableColumnsType<UserType> = [
    {
      dataIndex: 'username',
      title: t('user.userName'),
      width: 200,
      render: (text: string) => <EllipsisText text={text} maxWidth={180} />,
    },
    {
      dataIndex: 'userCode',
      title: t('user.UserCode'),
      width: 200,
      render: (text: string) => <EllipsisText text={text} maxWidth={180} />,
    },
    {
      dataIndex: 'fullName',
      title: t('user.fullName'),
      width: 200,
      render: (text: string) => <EllipsisText text={text} maxWidth={180} />,
    },
  ];

  const filterOption: any = (input: string, item: UserType) =>
    item.userCode?.toLowerCase().includes(input.toLowerCase()) ||
    item.username.toLowerCase().includes(input.toLowerCase()) ||
    item.fullName?.toLowerCase().includes(input.toLowerCase());

  const isDirty = () => {
    if (!initialValuesRef.current) return false;
    const keys = ['groupCode', 'groupName'];
    for (const k of keys) {
      const init = initialValuesRef.current[k];
      const cur = form.getFieldValue(k);
      const initNorm = init === undefined || init === null ? '' : init;
      const curNorm = cur === undefined || cur === null ? '' : cur;
      if (String(initNorm) !== String(curNorm)) return true;
    }
    return false;
  };

  const handleClose = () => {
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
    setTargetKeys([]);
    onClose();
  };

  return (
    <Modal
      centered
      title={
        userGroup ? t('userGroup.EditUserGroup') : t('userGroup.AddUserGroup')
      }
      open={open}
      onCancel={handleClose}
      width={1200}
      styles={{
        body: { maxHeight: '75vh', overflowY: 'auto' },
      }}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          {t('common.Close')}
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={saving}>
          {t('common.Save')}
        </Button>,
      ]}
      maskClosable={false}
      destroyOnClose
    >
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: '100%',
        }}
      />
      <Form layout="vertical" form={form}>
        <div style={{ overflow: 'hidden' }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="groupCode"
                label={t('userGroup.userGroupCode')}
                validateTrigger="onChange"
                rules={[
                  { required: true, message: t('userGroup.RequiedCode') },
                  // { max: 50, message: t('userGroup.GroupCodeMaxLength50') },
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
                    form.setFieldsValue({ groupCode: value });
                    form.validateFields(['groupCode']).catch(() => {});
                  }}
                  // maxLength={50}
                  disabled={!!userGroup}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="groupName"
                label={t('userGroup.userGroupName')}
                validateTrigger="onChange"
                rules={[
                  { required: true, message: t('userGroup.RequiedName') },
                  // { max: 255, message: t('userGroup.GroupNameMaxLength255') },
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
                    form.setFieldsValue({ groupName: sanitized });
                    form.validateFields(['groupName']).catch(() => {});
                  }}
                  // maxLength={255}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>

      {/* --- Transfer Users Section --- */}
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        {t('userGroup.transferUser')}
      </Typography.Text>
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <TableTransfer
          style={{ width: '100%' }}
          dataSource={allUsers.map((user) => ({
            ...user,
            key: String(user.key || ''),
          }))}
          targetKeys={targetKeys}
          onChange={(nextTargetKeys) =>
            setTargetKeys(nextTargetKeys.map(String))
          }
          filterOption={filterOption}
          leftColumns={userColumns}
          rightColumns={userColumns}
          showSearch
          showSelectAll={false}
        />
      </div>
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: '100%',
        }}
      />
    </Modal>
  );
};

export default AddUserGroup;
