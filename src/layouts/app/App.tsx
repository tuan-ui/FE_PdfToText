import {
  Button,
  Dropdown,
  Flex,
  FloatButton,
  Input,
  Layout,
  MenuProps,
  message,
  theme,
  Tooltip,
} from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { logOut } from '../../api/authenticationApi';
import { clearLocalStorage } from '../../utils/storage.ts';
import {
  LockOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
// page transition removed to prevent automatic smooth scrolling on route change
import { useMediaQuery } from 'react-responsive';
import SideNav from './SideNav.tsx';
import HeaderNav from './HeaderNav.tsx';
import { NProgress } from '../../components';
import { PATH_AUTH } from '../../constants';
import { useTranslation } from 'react-i18next';
import ReactCountryFlag from 'react-country-flag';
import EditProfile from './components/EditProfile.tsx';
import ChangePassword from './components/ChangePassword.tsx';
const { Content } = Layout;

type AppLayoutProps = {
  children: ReactNode;
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { t, i18n } = useTranslation();
  const {
    token: { borderRadius },
  } = theme.useToken();
  const isMobile = useMediaQuery({ maxWidth: 769 });
  const [isOpenEditProfile, setIsOpenEditProfile] = useState(false);
  const [isOpenChangePassword, setIsOpenChangePassword] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [navFill, setNavFill] = useState(false);
  const [isLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const floatBtnRef = useRef(null);
  const items: MenuProps['items'] = [
    {
      key: 'user-profile-link',
      label: t('user.profile'),
      icon: <UserOutlined />,
      onClick: () => setIsOpenEditProfile(true),
    },
    {
      key: 'user-settings-link',
      label: t('user.settings'),
      icon: <SettingOutlined />,
    },
    {
      key: 'user-change-password-link',
      label: t('user.changePassword'),
      icon: <LockOutlined />,
      onClick: () => setIsOpenChangePassword(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'user-logout-link',
      label: t('user.logout'),
      icon: <LogoutOutlined />,
      danger: true,
      onClick: async () => {
        try {
          await logOut();
          clearLocalStorage();
          navigate(PATH_AUTH.signin, { replace: true });
          message.success(t('app.onSignOut'));
        } catch (error) {}
      },
    },
  ];

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  useEffect(() => {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 5) {
        setNavFill(true);
      } else {
        setNavFill(false);
      }
    });
  }, []);

  return (
    <>
      <NProgress isAnimating={isLoading} key={location.key} />
      <Layout
        style={{
          minHeight: '100vh',
          // backgroundColor: 'white',
        }}
      >
        <SideNav
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        />
        <Layout
          style={
            {
              // background: 'none',
            }
          }
        >
          <HeaderNav
            style={{
              marginLeft: collapsed ? '80px' : '200px',
              padding: '0 2rem 0 0',
              background: navFill ? 'rgba(255, 255, 255, .5)' : 'none',
              backdropFilter: navFill ? 'blur(8px)' : 'none',
              boxShadow: navFill ? '0 0 8px 2px rgba(0, 0, 0, 0.05)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 1,
              gap: 8,
              transition: 'all .25s',
            }}
          >
            <Flex align="center">
              <Tooltip
                title={`${
                  collapsed ? t('sidebar.expand') : t('sidebar.collapse')
                } `}
              >
                <Button
                  type="text"
                  icon={
                    collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
                  }
                  onClick={() => setCollapsed(!collapsed)}
                  style={{
                    fontSize: '16px',
                    width: 64,
                    height: 64,
                  }}
                />
              </Tooltip>
              <Input.Search
                placeholder={t('common.Search')}
                style={{
                  width: isMobile ? '100%' : '400px',
                  marginLeft: isMobile ? 0 : '.5rem',
                }}
                size="middle"
              />
            </Flex>
            <Flex align="center" gap="small">
              <Tooltip title={t('common.language')}>
                <Button
                  type="text"
                  onClick={() =>
                    i18n.changeLanguage(i18n.language === 'en' ? 'vi' : 'en')
                  }
                >
                  {i18n.language === 'vi' ? (
                    <ReactCountryFlag
                      countryCode="VN"
                      svg
                      style={{ width: '1.5em', height: '1.5em' }}
                    />
                  ) : (
                    <ReactCountryFlag
                      countryCode="GB"
                      svg
                      style={{ width: '1.5em', height: '1.5em' }}
                    />
                  )}
                </Button>
              </Tooltip>
              <Dropdown menu={{ items }} trigger={['click']}>
                <Flex>
                  <img
                    src="/me.jpg"
                    alt="user profile photo"
                    height={36}
                    width={36}
                    style={{ borderRadius, objectFit: 'cover' }}
                  />
                </Flex>
              </Dropdown>
            </Flex>
          </HeaderNav>
          <Content
            style={{
              margin: `0 0 0 ${collapsed ? '80px' : '200px'}`,
              // background: '#ebedf0',
              borderRadius: collapsed ? 0 : borderRadius,
              transition: 'all .25s',
              padding: '24px 24px',
              minHeight: 360,
            }}
          >
            <div style={{ background: 'none' }}>{children}</div>
            <div ref={floatBtnRef}>
              <FloatButton.BackTop />
            </div>
          </Content>
        </Layout>
      </Layout>
      {/* Edit Profile Modal */}
      <EditProfile
        open={isOpenEditProfile}
        onClose={() => setIsOpenEditProfile(false)}
      />
      {/* Change Password Modal */}
      <ChangePassword
        open={isOpenChangePassword}
        onClose={() => setIsOpenChangePassword(false)}
      />
    </>
  );
};
