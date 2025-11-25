
import { Button, Result, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATH_AUTH } from '../../constants';

const { Text } = Typography;

export const PasswordResetResultPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { success, messageKey } = (location.state || {}) as {
    success?: boolean;
    messageKey?: string;
  };

  const isSuccess = success !== false;

  const handleBackToLogin = () => {
    navigate(PATH_AUTH.signin, { replace: true });
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to right, #eaf4ff 50%, #ffffff 50%)',
      }}
    >
      {/* Logo góc trên */}
      <div style={{ position: 'absolute', top: 32, left: 48 }}>
        <img src="/The_Natcom_Logo.png" alt="logo" style={{ height: 80 }} />
      </div>

      {/* Ngôn ngữ góc phải */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        {/* Bạn có thể giữ lại Select ngôn ngữ nếu muốn */}
      </div>

      {/* Khung trắng chính - giống hệt trang reset */}
      <div
        style={{
          background: 'white',
          padding: '40px 32px',
          borderRadius: 20,
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          maxWidth: 480,
          width: '90%',
          textAlign: 'center',
        }}
      >
        <Result
          status={isSuccess ? 'success' : 'info'}
          title={
            <span style={{ fontSize: 24, fontWeight: 600 }}>
              {isSuccess
                ? t('authentication.passwordSentTitle')
                : t('authentication.notice')}
            </span>
          }
          subTitle={
            <div style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 16, color: '#555' }}>
                {isSuccess ? (
                  <>
                    {t('authentication.passwordSentToEmail')}
                    <br />
                    <Text strong style={{ color: '#1677ff', fontSize: 18 }}>
                      {t('authentication.checkGmail')}
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 16, color: '#d4380d' }}>
                    {messageKey ? t(messageKey) : t('app.ChangePasswordError')}
                  </Text>
                )}
              </Text>
            </div>
          }
          extra={
            <Button
              type="primary"
              size="large"
              onClick={handleBackToLogin}
              style={{ minWidth: 200, height: 48, fontSize: 16, fontWeight: 500 }}
            >
              {t('authentication.backToSignIn')}
            </Button>
          }
        />
      </div>

      {/* Hình nền trang trí */}
      <img
        src="/icon_left_signIn.svg"
        alt="left"
        style={{ position: 'absolute', left: '14%', width: 280, bottom: '38%' }}
      />
      <img
        src="/icon_right_signIn.svg"
        alt="right"
        style={{ position: 'absolute', right: '17%', width: 280, bottom: '28%' }}
      />

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          textAlign: 'center',
          width: '100%',
          fontSize: 12,
          color: '#999',
        }}
      >
        © 2025 Natcom Corporation. All rights reserved.
      </div>
    </div>
  );
};