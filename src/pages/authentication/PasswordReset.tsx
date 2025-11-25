import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  message,
  Row,
  Select,
  theme,
  Typography,
} from 'antd';
import { Logo } from '../../components';
import { useMediaQuery } from 'react-responsive';
import { PATH_AUTH, PATH_SYSTEM } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Link from 'antd/es/typography/Link';
import { useTranslation } from 'react-i18next';
import { forgetPassword } from '../../api/authenticationApi';

const { Title, Text } = Typography;

type FieldType = {
  email?: string;
};

export const PasswordResetPage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const username = values.email;
      const password = values.phone;
      const resp: any = await forgetPassword(username, password);
      if (resp.status === 200) {
        if (resp.object === null) {
          navigate(PATH_AUTH.passwordResetResult, {
            state: { success: true },
            replace: true,
          });
        } else {
          navigate(PATH_AUTH.passwordResetResult, {
            state: { success: false, messageKey: resp.object },
            replace: true,
          });
        }
      } else {
        message.error(t('app.ChangePasswordError'));
      }
    } catch (error: any) {
      message.error(t('app.ChangePasswordError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Nếu chưa có ngôn ngữ, set mặc định là 'vi'
    const savedLang = localStorage.getItem('i18nextLng');
    if (!savedLang) {
      i18n.changeLanguage('vi');
      localStorage.setItem('i18nextLng', 'vi');
    } else {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
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
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <Select
          size="small"
          style={{ width: 120 }}
          value={i18n.language}
          onChange={(value) => {
            i18n.changeLanguage(value);
            localStorage.setItem('i18nextLng', value);
          }}
          options={[
            { label: 'Tiếng Việt', value: 'vi' },
            { label: 'English', value: 'en' },
          ]}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 48,
        }}
      >
        <img src="/The_Natcom_Logo.png" alt="logo" style={{ height: 80 }} />
      </div>

      {/* Khung login chính */}
      <div
        style={{
          background: 'white',
          padding: '32px 32px',
          borderRadius: 20,
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          maxWidth: 450,
          width: '90%',
          zIndex: 2,
        }}
      >
        <div style={{ textAlign: 'left', marginBottom: 24 }}>
          <Title
            level={2}
            style={{
              color: '#1677ff',
              margin: '4px 0 16px 0',
              fontWeight: 700,
            }}
          >
            {t('authentication.forgotPassword')}
          </Title>
          <Text>{t('authentication.forgotPasswordnoti')}</Text>
        </div>

        <Form<FieldType>
          name="sign-in"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          requiredMark={false}
          autoComplete="off"
        >
          <Form.Item
            label={t('authentication.UserName')}
            name="email"
            rules={[
              { required: true, message: t('authentication.RequiedUserName') },
            ]}
          >
            <Input
              placeholder={t('authentication.UserNameHolder')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            label={t('authentication.Phone')}
            name="phone"
            rules={[
              { required: true, message: t('authentication.RequiedPhone') },
            ]}
          >
            <Input placeholder={t('authentication.PhoneHolder')} size="large" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            style={{ fontWeight: 500 }}
            loading={loading}
          >
            {t('authentication.Confirm')}
          </Button>

          <div
            style={{
              textAlign: 'center',
              margin: '16px 0',
              color: '#999',
              fontSize: 13,
            }}
          >
            {t('authentication.or')}
          </div>

          <Flex justify="center" gap={12}>
            <Button
              type="link"
              loading={loading}
              onClick={() => navigate(PATH_AUTH.signin)}
              style={{ padding: 0, color: '#ff4d4f' }}
            >
              {t('authentication.backToSignIn')}
            </Button>
          </Flex>

          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: 14,
            }}
          >
            {t('authentication.DonthaveAccount')}{' '}
            <Link href={PATH_AUTH.signup} style={{ color: '#ff4d4f' }}>
              {t('authentication.ContactAdmin')}
            </Link>
          </div>
        </Form>
      </div>
      <img
        src="/icon_left_signIn.svg"
        alt="left illustration"
        style={{
          position: 'absolute',
          left: '14%',
          width: 280,
          bottom: '38%',
        }}
      />
      <img
        src="/icon_right_signIn.svg"
        alt="right illustration"
        style={{
          position: 'absolute',
          right: '17%',
          width: 280,
          bottom: '28%',
        }}
      />

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
