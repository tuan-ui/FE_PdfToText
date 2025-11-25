import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Form,
  Input,
  DatePicker,
  Select,
  Upload,
  Avatar,
  Checkbox,
  Empty,
  Divider,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { User, getUserImage } from '../../api/userApi';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import locale from 'antd/es/date-picker/locale/vi_VN';
import enLocale from 'antd/es/date-picker/locale/en_US';
import { Role, getAllRole } from '../../api/roleApi';

interface UserFormProps {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onSubmit?: (values: any) => Promise<boolean> | void;
}

export const AddUser: React.FC<UserFormProps> = ({
  open,
  user,
  onClose,
  onSubmit,
}) => {
  const { i18n, t } = useTranslation();

  dayjs.locale(i18n.language === 'vi' ? 'vi' : 'en');

  const dateLocale = i18n.language === 'vi' ? locale : enLocale;

  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [signatureUrl, setSignatureUrl] = useState<string>();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRole, setLoadingRole] = useState(false);
  const initialValuesRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      initialValuesRef.current = null;
      setAvatarUrl(undefined);
      setSignatureUrl(undefined);
      return;
    }
    const fetchAllRole = async () => {
      setLoadingRole(true);
      try {
        const res = await getAllRole();
        if (res?.status === 200 && res?.object) {
          setRoles(res.object);

          const selectedRoles = res.object.filter(
            (r: Role) => user?.roleIds?.some((ur: string) => ur === r.id)
          );
          form.setFieldValue(
            'roleIds',
            selectedRoles.map((r: Role) => r.id)
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRole(false);
      }
    };

    const loadImages = async () => {
      if (user && user.id) {
        try {
          const [avatarUrl, signatureUrl] = await Promise.all([
            getUserImage(user.id, 'profile'),
            getUserImage(user.id, 'signature'),
          ]);
          setAvatarUrl(avatarUrl);
          setSignatureUrl(signatureUrl);
        } catch (err) {
          console.error('Error loading user images:', err);
        }
      }
    };

    if (user) {
      const initialValues = {
        ...user,
        birthday: user.birthday ? dayjs(user.birthday) : undefined,
        issueDate: user.issueDate ? dayjs(user.issueDate) : undefined,
        gender: user.gender !== null ? (user.gender ? '1' : '0') : null,
      };
      form.setFieldsValue(initialValues);
      initialValuesRef.current = initialValues;
      loadImages();
    } else {
      form.resetFields();
      setAvatarUrl(undefined);
      setSignatureUrl(undefined);
      initialValuesRef.current = {};
    }
    fetchAllRole();
  }, [user, open]);

  const isDirty = () => {
    if (!initialValuesRef.current) return false;
    const keys = [
      'fullName',
      'userCode',
      'phone',
      'email',
      'identifyCode',
      'birthDay',
      'gender',
      'issueDate',
      'issuePlace',
      'userName',
      'password',
      'roleIds',
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
    onClose();
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        const value = values[key];
        if (dayjs.isDayjs(value)) {
          formData.append(key, value.format('YYYY-MM-DD'));
        } else {
          formData.append(key, value ?? '');
        }
      });
      if (user?.id) {
        formData.append('version', user?.version.toString());
      }
      if (values.profileImage && values.profileImage.fileList?.length > 0) {
        const fileObj = values.profileImage.fileList[0].originFileObj;
        if (fileObj) formData.append('profileImage', fileObj);
      }

      if (values.signatureImage && values.signatureImage.fileList?.length > 0) {
        const fileObj = values.signatureImage.fileList[0].originFileObj;
        if (fileObj) formData.append('signatureImage', fileObj);
      }

      const success = await onSubmit?.(formData);
      if (success) {
        form.resetFields();
        onClose();
      }
    });
  };

  return (
    <Modal
      centered
      title={user ? t('user.EditUser') : t('user.AddUser')}
      open={open}
      onCancel={handleClose}
      width={1200}
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto' },
      }}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          {t('common.Close')}
        </Button>,
        <Button key="save" type="primary" onClick={handleOk}>
          {t('common.Save')}
        </Button>,
      ]}
    >
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: '100%',
        }}
      />
      <Form layout="vertical" form={form}>
        <div
          style={{
            display: 'flex',
            gap: 30,
            justifyContent: 'center',
            marginTop: 20,
          }}
        >
          {/* Avatar upload */}
          <Form.Item
            name="profileImage"
            label={t('user.avatar')}
            labelCol={{ span: 24, style: { textAlign: 'center' } }}
            wrapperCol={{ span: 24, style: { textAlign: 'center' } }}
          >
            <Upload
              listType="picture-circle"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={(info) => {
                const file = info.file as unknown as File;
                if (file) {
                  setAvatarUrl(URL.createObjectURL(file));
                  form.setFieldValue('profileImage', file);
                }
              }}
            >
              <Avatar size={100} src={avatarUrl} style={{ cursor: 'pointer' }}>
                {t('common.upload')}
              </Avatar>
            </Upload>
          </Form.Item>

          {/* Signature upload */}
          <Form.Item
            name="signatureImage"
            label={t('user.signature')}
            labelCol={{ span: 24, style: { textAlign: 'center' } }}
            wrapperCol={{ span: 24, style: { textAlign: 'center' } }}
          >
            <Upload
              listType="picture-circle"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={(info) => {
                const file = info.file as unknown as File;
                if (file) {
                  setSignatureUrl(URL.createObjectURL(file));
                  form.setFieldValue('signatureImage', file);
                }
              }}
            >
              <Avatar
                size={100}
                src={signatureUrl}
                style={{ cursor: 'pointer' }}
              >
                {t('common.upload')}
              </Avatar>
            </Upload>
          </Form.Item>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 20,
          }}
        >
          <Form.Item
            name="fullName"
            label={t('user.fullName')}
            rules={[{ required: true, message: t('user.RequiedFullName') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="userCode"
            label={t('user.UserCode')}
            rules={[{ required: true, message: t('user.RequiedUserCode') }]}
          >
            <Input disabled={!!user}/>
          </Form.Item>

          <Form.Item name="phone" label={t('user.phone')}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label={t('user.email')}>
            <Input type="email" />
          </Form.Item>

          <Form.Item name="identifyCode" label={t('user.identifyCode')}>
            <Input />
          </Form.Item>

          <Form.Item
            name="birthday"
            label={t('user.birthday')}
            rules={[{ required: true, message: t('user.RequiedBirthday') }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format={i18n.language === 'vi' ? 'DD/MM/YYYY' : 'YYYY-MM-DD'}
              locale={dateLocale}
              placeholder={t('user.selectBirthday')}
            />
          </Form.Item>

          <Form.Item name="gender" label={t('user.gender')}>
            <Select>
              <Select.Option value="1">{t('common.male')}</Select.Option>
              <Select.Option value="0">{t('common.female')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="issueDate" label={t('user.issueDate')}>
            <DatePicker
              style={{ width: '100%' }}
              format={i18n.language === 'vi' ? 'DD/MM/YYYY' : 'YYYY-MM-DD'}
              locale={dateLocale}
              placeholder={t('user.selectIssueDate')}
            />
          </Form.Item>

          <Form.Item name="issuePlace" label={t('user.issuePlace')}>
            <Input />
          </Form.Item>

          <Form.Item
            name="userName"
            label={t('user.userName')}
            rules={[{ required: true, message: t('user.RequiedUserName') }]}
          >
            <Input disabled={!!user} />
          </Form.Item>

          {!user && (
            <Form.Item
              name="password"
              label={t('user.password')}
              rules={[{ required: true, message: t('user.RequiedPassword') }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          {/* Chọn nhiều vai trò */}
          <Form.Item
            name="roleIds"
            label={t('user.role')}
            rules={[{ required: true, message: t('user.RequiedRole') }]}
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              maxTagCount="responsive"
              loading={loadingRole}
              placeholder={t('user.selectRolesMulti')}
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={
                roles?.map((r) => ({
                  value: r.id,
                  label: r.roleName,
                })) || []
              }
              notFoundContent={
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span>{t('common.DataNotFound')}</span>}
                />
              }
            />
          </Form.Item>
        </div>
      </Form>
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
