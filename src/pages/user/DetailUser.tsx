import { Modal, Button, Avatar, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { getUserImage, LogDetailUser } from '../../api/userApi';
import { useEffect, useState } from 'react';

interface DetailUserProps {
  open: boolean;
  user?: any;
  onClose: () => void;
}

export const DetailUser: React.FC<DetailUserProps> = ({
  open,
  user,
  onClose,
}) => {
  const { t } = useTranslation();
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [signatureUrl, setSignatureUrl] = useState<string>();
  useEffect(() => {
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
    const handleSearch = async () => {
      try {
        const values = await LogDetailUser(user.id);
      } catch (err) {
        console.warn('Validation failed:', err);
      }
    };
    if (open) {
      handleSearch();
    }

    loadImages();
  }, [user]);

  return (
    <Modal
      centered
      title={t('user.userDetail')}
      open={open}
      onCancel={onClose}
      width={800}
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        },
      }}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common.Close')}
        </Button>,
      ]}
    >
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
      {user ? (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '80px',
              marginBottom: '24px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Avatar size={100} src={avatarUrl || undefined}>
                {!user.avatarUrl}
              </Avatar>
              <div style={{ marginTop: 8 }}>{t('user.avatar')}</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Avatar size={100} src={signatureUrl || undefined} style={{}}>
                {!user.signatureUrl}
              </Avatar>
              <div style={{ marginTop: 8 }}>{t('user.signature')}</div>
            </div>
          </div>

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
              <strong>{t('user.phone')}:</strong> {user.phone || '-'}
            </p>
            <p>
              <strong>{t('user.birthday')}:</strong> {user.birthdayStr || '-'}
            </p>
            <p>
              <strong>{t('user.gender')}:</strong>{' '}
              {user.gender
                ? user.gender == 1
                  ? t('common.male')
                  : t('common.female')
                : '-'}
            </p>
            <p>
              <strong>{t('user.identifyCode')}:</strong>{' '}
              {user.identifyCode || '-'}
            </p>
            <p>
              <strong>{t('user.issueDate')}:</strong> {user.issueDateStr || '-'}
            </p>
            <p>
              <strong>{t('user.issuePlace')}:</strong> {user.issuePlace || '-'}
            </p>
          </div>
        </>
      ) : (
        <p>{t('common.DataNotFound')}</p>
      )}
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
