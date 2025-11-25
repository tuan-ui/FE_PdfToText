import { Avatar, Button, Form, Modal, Upload, notification } from 'antd';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUserImage,
  getUserProfile,
  updateImage,
} from '../../../api/userApi';
import { User } from '../../../api/userApi';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
}

const EditProfile: React.FC<UserFormProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [user, setUser] = React.useState<User>();
  const [avatarUrl, setAvatarUrl] = React.useState<string>();
  const [signatureUrl, setSignatureUrl] = React.useState<string>();

  const handleOk = async () => {
    form.validateFields().then((values) => {
      const formData = new FormData();
      if (values.profileImage) {
        formData.append('profileImage', values.profileImage);
      }
      if (values.signatureImage) {
        formData.append('signatureImage', values.signatureImage);
      }
      console.log('Form Data:', formData);
      onSubmit(formData);
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      const res = await updateImage(data);
      if (res.status === 200) {
        onClose();
        notification.success({
          message: t('common.actionSuccess'),
          description: t('common.UpdateSuccess'),
        });
        form.resetFields();
      } else {
        notification.error({
          message: t('common.actionFailed'),
          description: t(res?.message),
        });
      }
    } catch (error) {
      console.error('Error updating images:', error);
    }
  };

  useEffect(() => {
    if (!open) return;
    const loadUserProfile = async () => {
      try {
        const res = await getUserProfile();
        if (res.status === 200) {
          setUser(res.object);
          // Load images
          const [avatarUrl, signatureUrl] = await Promise.all([
            getUserImage(res.object.id, 'profile'),
            getUserImage(res.object.id, 'signature'),
          ]);
          setAvatarUrl(avatarUrl);
          setSignatureUrl(signatureUrl);
        }
      } catch (err) {
        console.error('Error loading user images:', err);
      }
    };

    loadUserProfile();
  }, [open]);
  return (
    <Modal
      centered
      title={t('user.PersonalDetail')}
      open={open}
      onCancel={onClose}
      width={1200}
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto' },
      }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.Close')}
        </Button>,
        <Button key="save" type="primary" onClick={handleOk}>
          {t('common.Save')}
        </Button>,
      ]}
    >
      {user ? (
        <>
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
                  <Avatar
                    size={100}
                    src={avatarUrl}
                    style={{ cursor: 'pointer' }}
                  >
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
          </Form>

          {/* ==== Thông tin người dùng ==== */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 24px',
              lineHeight: 1.8,
            }}
          >
            <p>
              <strong>{t('user.fullName')}:</strong> {user.fullName || '-'}
            </p>
            <p>
              <strong>{t('user.UserCode')}:</strong> {user.userCode || '-'}
            </p>
            <p>
              <strong>{t('user.userName')}:</strong> {user.username || '-'}
            </p>
            <p>
              <strong>{t('common.isActive')}:</strong>{' '}
              {user.status === 1 ? t('common.open') : t('common.locked')}
            </p>
            <p>
              <strong>{t('user.email')}:</strong> {user.email || '-'}
            </p>
            <p>
              <strong>{t('user.phone')}:</strong> {user.phoneNumber || '-'}
            </p>
            <p>
              <strong>{t('user.birthday')}:</strong> {user.birthDay || '-'}
            </p>
            <p>
              <strong>{t('user.gender')}:</strong>{' '}
              {user.gender ? t('common.male') : t('common.female')}
            </p>
            <p>
              <strong>{t('user.identifyCode')}:</strong>{' '}
              {user.identifyCode || '-'}
            </p>
            <p>
              <strong>{t('user.issueDate')}:</strong> {user.issueDate || '-'}
            </p>
            <p>
              <strong>{t('user.issuePlace')}:</strong> {user.issuePlace || '-'}
            </p>
          </div>
        </>
      ) : (
        <p>{t('common.DataNotFound')}</p>
      )}
    </Modal>
  );
};

export default EditProfile;
