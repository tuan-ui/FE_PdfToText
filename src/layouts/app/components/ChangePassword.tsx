import { Button, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { changePasswordCheckOldPwd } from '../../../api/authenticationApi';

interface ChangePasswordProps {
  open: boolean;
  onClose: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleChangePassword = async () => {
    try {
      const values = await form.validateFields();
      const res = await changePasswordCheckOldPwd(
        values.oldPassword,
        values.newPassword
      );
      if (res.status === 200) {
        onClose();
        notification.success({
          message: t('common.actionSuccess'),
          description: t('app.ChangePasswordSuccess'),
        });
        form.resetFields();
      } else {
        console.log('Failed to change password:', res.message);
        notification.error({
          message: t('common.actionFailed'),
          description: t(res?.message),
        });
      }
    } catch (errorInfo) {
      console.log('Failed to change password:', errorInfo);
    }
  };
  return (
    <Modal
      centered
      title={t('user.changePassword')}
      open={open}
      onCancel={onClose}
      width={350}
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto' },
      }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.Close')}
        </Button>,
        <Button key="save" type="primary" onClick={handleChangePassword}>
          {t('common.Save')}
        </Button>,
      ]}
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="oldPassword"
          label={t('user.oldPassword')}
          rules={[{ required: true, message: t('user.RequiredOldPassword') }]}
        >
          <Input type="password" />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label={t('user.newPassword')}
          rules={[
            { required: true, message: t('user.RequiredNewPassword') },
            { min: 8, message: t('error.PasswordMinLength8') },
          ]}
        >
          <Input type="password" />
        </Form.Item>
        <Form.Item
          name="confirmNewPassword"
          label={t('user.confirmNewPassword')}
          dependencies={['newPassword']}
          rules={[
            { required: true, message: t('user.RequiredConfirmNewPassword') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('error.PasswordDoNotMatch')));
              },
            }),
          ]}
        >
          <Input type="password" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePassword;
