import {
  createBrowserRouter,
  useNavigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
import { useEffect } from 'react';
import { notification } from 'antd';
import { refreshToken } from '../api/authenticationApi';
import { useTranslation } from 'react-i18next';
import {
  DefaultDashboardPage,
  Error400Page,
  Error403Page,
  Error404Page,
  Error500Page,
  Error503Page,
  ErrorPage,
  PasswordResetPage,
  ProjectsDashboardPage,
  SignInPage,
  SignUpPage,
  DefaultRolePage,
  LowcodeEditorPage,
  DefaultFormSchemaPage,
  DefaultUserPage,
  PartnerPage,
  DefaultUserGroupPage,
  DefaultLogPage,
  OriginDataPage,
  DefaultProcessDocsPage,
} from '../pages';
import { DashboardLayout } from '../layouts';
import React, { ReactNode, Suspense } from 'react';
import { PATH_SYSTEM } from '../constants';
import ProtectedRoute from './ProtectedRoute';
import { DefaultDocumentTemplatePage } from '../pages/documentTemplate';
import { DefaultDocPage } from '../pages/documents/personalDocs';
import { PasswordResetResultPage } from '../pages/authentication/ForgotPasswordModal';

// Custom scroll restoration function

type PageProps = {
  children: ReactNode;
};

// Create an HOC to wrap your route components with ScrollToTop
const PageWrapper = ({ children }: PageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      const refresh = localStorage.getItem('refreshToken');

      if (!token) {
        navigate('/');
        return;
      }

      try {
        const [, payloadBase64] = token.split('.');
        const payload = JSON.parse(atob(payloadBase64));
        const now = Math.floor(Date.now() / 1000);

        // Token hết hạn
        if (payload.exp && payload.exp < now) {
          if (refresh) {
            try {
              const res = await refreshToken(refresh);
              if (res.object?.accessToken) {
                localStorage.setItem('token', res.object.accessToken);
                if (res.refreshToken) {
                  localStorage.setItem('refreshToken', res.refreshToken);
                }
                navigate(PATH_SYSTEM.root);
              } else {
                notification.error({
                  message: t('error.connectTimeOut'),
                  description: t('error.expiredToken'),
                });
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                navigate('/');
                return;
              }
            } catch (error) {
              notification.error({
                message: t('error.connectTimeOut'),
                description: t('error.expiredToken'),
              });
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              navigate('/');
              return;
            }
          } else {
            notification.error({
              message: t('error.connectTimeOut'),
              description: t('error.expiredToken'),
            });
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            navigate('/');
            return;
          }
        } else {
          const path = location?.pathname || '';
          const isGuestPath =
            path === '/' || path.startsWith('/auth') || path === '';
          if (isGuestPath) {
            navigate(PATH_SYSTEM.root);
          }
        }
      } catch (err) {
        notification.error({
          message: t('error.connectTimeOut'),
          description: t('error.expiredToken'),
        });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        navigate('/');
        return;
      }
    };

    verifyToken();
  }, [navigate]);

  return <>{children}</>;
};

// Create the router
const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: '',
        element: <SignInPage />,
      },
    ],
  },
  {
    path: '/home',
    element: <PageWrapper children={<DashboardLayout />} />,
    children: [
      {
        index: true,
        path: '',
        element: <DefaultDashboardPage />,
      },
    ],
  },
  {
    path: '/system',
    element: <PageWrapper children={<DashboardLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: 'default',
        element: <DefaultDashboardPage />,
      },
      {
        path: 'partner',
        element: (
          <ProtectedRoute required="PARTNER">
            <PartnerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'origin-data',
        element: (
          <ProtectedRoute required="ORIGINDATA">
            <OriginDataPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'origin-data/:menu',
        element: <OriginDataPage />,
      },
      {
        path: 'words',
        element: (
          <ProtectedRoute required="WORD">
            <ProjectsDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <ProtectedRoute required="ROLE">
            <DefaultRolePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute required="USER">
            <DefaultUserPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'user-groups',
        element: (
          <ProtectedRoute required="USERGROUP">
            <DefaultUserGroupPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'logs',
        element: (
          <ProtectedRoute required="LOG">
            <DefaultLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'documentTemplate',
        element: (
          <ProtectedRoute required="DOCUMENTTEMPLATE">
            <DefaultDocumentTemplatePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/docs',
    element: <PageWrapper children={<DashboardLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: 'personal-docs',
        element: (
          <ProtectedRoute required="PERSONALDOC">
            <DefaultDocPage />
          </ProtectedRoute>
        ),
      },
      {
        index: true,
        path: 'process-docs',
        element: (
          <ProtectedRoute required="PROCESSDOC">
            <DefaultProcessDocsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/dnd',
    element: <PageWrapper children={<DashboardLayout />} />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        path: 'lowcode-editor',
        element: (
          <ProtectedRoute required="DnDHome">
            <LowcodeEditorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'default',
        element: (
          <ProtectedRoute required="ManagerDnD">
            <DefaultFormSchemaPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/survey/:id',
    element: (
      <PageWrapper
        children={
          <Suspense fallback={<div>Loading...</div>}>
            {React.createElement(
              React.lazy(() => import('../pages/lowcode/SurveyRunner')) as any
            )}
          </Suspense>
        }
      />
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/auth',
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'signup',
        element: <SignUpPage />,
      },
      {
        path: 'signin',
        element: <SignInPage />,
      },
      {
        path: 'password-reset',
        element: <PasswordResetPage />,
      },
      {
        path: 'passwordResetResult',
        element: <PasswordResetResultPage />,
      },
    ],
  },
  {
    path: 'errors',
    errorElement: <ErrorPage />,
    children: [
      {
        path: '400',
        element: <Error400Page />,
      },
      {
        path: '403',
        element: <Error403Page />,
      },
      {
        path: '404',
        element: <Error404Page />,
      },
      {
        path: '500',
        element: <Error500Page />,
      },
      {
        path: '503',
        element: <Error503Page />,
      },
    ],
  },
]);

export default router;
