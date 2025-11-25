import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input, Divider, Spin, Result, Button, Typography } from 'antd';
import { SearchOutlined, HomeOutlined } from '@ant-design/icons';
import { PATH_SYSTEM } from '../../constants';
import { useTranslation } from 'react-i18next';
import { getUserOriginDataPermissions } from '../../api/roleApi';
import DomainPage from './domain/DomainPage';
import DocumentTypePage from './documentType/DocumentTypePage';
import HolidayTypePage from './holidayType/HolidayTypePage';
import TaskTypePage from './taskType/TaskTypePage';
import ContractTypePage from './contractType/ContractTypePage';
import { ChildMenuGuard } from '../../routes/ChildMenuGuard';

const { Text } = Typography;

interface Permission {
  id: string;
  permissionName: string;
  permissionCode: string;
  permissionUrl: string | null;
  isMenus: boolean;
}

const OriginDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { menu } = useParams<{ menu?: string }>();
  const { t } = useTranslation();

  const [menus, setMenus] = useState<Permission[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false); // MẶC ĐỊNH FALSE

  useEffect(() => {
    async function loadPermissions() {
      try {
        const res = await getUserOriginDataPermissions();

        if (
          res?.status === 200 &&
          Array.isArray(res.object) &&
          res.object.length > 0
        ) {
          const validMenus = res.object.filter(
            (m: any) => m.isMenus && !m.isDeleted
          );

          setMenus(validMenus);
          setHasAccess(true); // CÓ MENU CON → CHO VÀO

          if (!menu && validMenus.length > 0) {
            navigate(PATH_SYSTEM.originDataMenu(validMenus[0].permissionCode), {
              replace: true,
            });
          }
        } else {
          setHasAccess(false);
        }
      } catch (err) {
        console.error('Load OriginData permissions failed', err);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [menu, navigate]);

  const handleClick = (code: string) => {
    navigate(PATH_SYSTEM.originDataMenu(code), { replace: false });
  };

  const renderPage = (code: string) => {
    const upper = code.toUpperCase();
    switch (upper) {
      case 'DOMAIN':
        return <DomainPage />;
      case 'DOCUMENTTYPE':
        return <DocumentTypePage />;
      case 'HOLIDAYTYPE':
        return <HolidayTypePage />;
      case 'TASKTYPE':
        return <TaskTypePage />;
      case 'CONTRACTTYPE':
        return <ContractTypePage />;
      default:
        return <div>{t('common.noData')}</div>;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (!hasAccess) {
      return (
        <Result
          status="403"
          title={t('error.NoPermission')}
          extra={
            <Button
              type="primary"
              icon={<HomeOutlined />}
              onClick={() => navigate('/home')}
            >
              {t('common.backHome')}
            </Button>
          }
        />
      );
    }

    const currentCode = menu?.toUpperCase();
    const currentMenu = menus.find(
      (m) => m.permissionCode.toUpperCase() === currentCode
    );

    if (currentMenu) {
      return (
        <ChildMenuGuard menuCode={currentMenu.permissionCode}>
          {renderPage(currentMenu.permissionCode)}
        </ChildMenuGuard>
      );
    }

    // Fallback: trang đầu tiên
    const first = menus[0];
    return first ? (
      <ChildMenuGuard menuCode={first.permissionCode}>
        {renderPage(first.permissionCode)}
      </ChildMenuGuard>
    ) : null;
  };

  const filteredMenus = menus.filter((m) =>
    m.permissionName.toLowerCase().includes(searchValue.toLowerCase())
  );

  // HIỆN THÔNG BÁO NẾU KHÔNG CÓ QUYỀN
  if (!hasAccess && !loading) {
    return renderContent();
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#fff' }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: '20%',
          borderLeft: '1px solid #f0f0f0',
          padding: 12,
          boxSizing: 'border-box',
          background: '#fff',
        }}
      >
        <Input
          allowClear
          placeholder={t('common.Search')}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
          style={{ marginBottom: 8, marginTop: 8 }}
        />
        <Divider style={{ margin: '8px 0' }} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : filteredMenus.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}
          >
            {t('common.noData')}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredMenus.map((m) => {
              const isActive =
                menu?.toUpperCase() === m.permissionCode.toUpperCase();
              return (
                <li key={m.permissionCode} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => handleClick(m.permissionCode)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      border: isActive
                        ? '2px solid #1890ff'
                        : '1px solid #d9d9d9',
                      background: isActive ? '#e6f7ff' : '#fff',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: isActive ? '#1890ff' : '#000',
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.2s',
                      boxShadow: isActive
                        ? '0 2px 8px rgba(24,144,255,0.2)'
                        : 'none',
                    }}
                  >
                    {t(m.permissionName)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          padding: 0,
          minWidth: 0,
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default OriginDataPage;
