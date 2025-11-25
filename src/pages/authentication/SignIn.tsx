import {
  Button,
  Checkbox,
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
import {
  FacebookFilled,
  GoogleOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import { Logo } from '../../components';
import { useMediaQuery } from 'react-responsive';
import { PATH_AUTH, PATH_SYSTEM } from '../../constants';
import { login } from '../../api/authenticationApi';
import {
  setLocalToken,
  setLocalUserInfo,
  setRefreshToken,
} from '../../utils/storage';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const { Title, Text, Link } = Typography;

type FieldType = {
  email?: string;
  password?: string;
  remember?: boolean;
};

export const SignInPage = () => {
  const {
    token: { colorPrimary },
  } = theme.useToken();
  const [form] = Form.useForm();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // localStorage.removeItem('token');
  // localStorage.removeItem('refreshToken');
  // localStorage.removeItem('user');
  localStorage.removeItem('currentPage');
  localStorage.removeItem('partner_id_temp');
  localStorage.removeItem('roles_temp');
  const { t, i18n } = useTranslation();
  const REMEMBER_COOKIE = 'natcom_remember_me';

  // Khi load trang → kiểm tra có cookie nhớ mật khẩu không → điền sẵn
  useEffect(() => {
    const remembered = Cookies.get(REMEMBER_COOKIE);
    if (remembered) {
      try {
        const { email, password, remember } = JSON.parse(remembered);
        form.setFieldsValue({
          email,
          password,
          remember: true,
        });
      } catch (e) {
        Cookies.remove(REMEMBER_COOKIE);
      }
    }
  }, [form]);
  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      // After signup we call login to authenticate the user against backend
      const username = values.email || values.username;
      const password = values.password;
      const resp: any = await login(username, password);

      if (resp?.requires2FA) {
        message.info('Two-factor authentication required.');
        // navigate to 2FA flow if you have one
        navigate(PATH_AUTH.signin);
        return;
      }

      if (resp?.token) {
        setLocalToken(resp.token);
        setRefreshToken(resp.refreshToken);
        setLocalUserInfo({
          username: resp.username,
          fullName: resp.fullName,
          email: resp.email,
        });
        if (values.remember) {
          Cookies.set(
            REMEMBER_COOKIE,
            JSON.stringify({
              email: values.email,
              remember: true,
            }),
            {
              expires: 30,
              secure: true,
              sameSite: 'strict',
            }
          );
        } else {
          // Nếu bỏ tick → xóa cookie
          Cookies.remove(REMEMBER_COOKIE);
        }
        message.success(t('app.signInSuccess'));
        navigate(PATH_SYSTEM.root);
        return;
      } else {
        message.error(t('app.loginFailedAfterSignup'));
      }
    } catch (error: any) {
      console.error('Signup/login error:', error);
      message.error(t('app.loginError'));
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
          <Title level={5} style={{ marginBottom: 0 }}>
            {t('authentication.welcome')}
          </Title>
          <Title
            level={2}
            style={{
              color: '#1677ff',
              margin: '4px 0 24px 0',
              fontWeight: 700,
            }}
          >
            {t('authentication.SignIn')}
          </Title>
        </div>

        <Form<FieldType>
          form={form}
          name="sign-in"
          layout="vertical"
          initialValues={{ remember: false }}
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
            label={t('authentication.Password')}
            name="password"
            rules={[
              { required: true, message: t('authentication.RequiedPassword') },
            ]}
          >
            <Input.Password
              placeholder={t('authentication.PasswordHolder')}
              size="large"
            />
          </Form.Item>

          <Flex
            justify="space-between"
            align="center"
            style={{ marginBottom: 16 }}
          >
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>{t('app.RememberMe')}</Checkbox>
            </Form.Item>
            <Button
              type="link"
              onClick={() => navigate(PATH_AUTH.passwordReset)}
              style={{ padding: 0, color: '#ff4d4f' }}
            >
              {t('authentication.ForgotPassword')}
            </Button>
          </Flex>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            style={{ fontWeight: 500 }}
            loading={loading}
          >
            {t('authentication.SignIn')}
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
              shape="circle"
              icon={
                <GoogleOutlined
                  style={{ fontSize: 14, verticalAlign: 'middle' }}
                />
              }
            />
            <Button
              shape="circle"
              icon={
                <FacebookFilled
                  style={{ fontSize: 14, verticalAlign: 'middle' }}
                />
              }
            />
            <Button
              shape="circle"
              icon={
                <TwitterOutlined
                  style={{ fontSize: 14, verticalAlign: 'middle' }}
                />
              }
            />
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
