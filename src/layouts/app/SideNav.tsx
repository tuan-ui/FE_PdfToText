import React, { useEffect, useState } from 'react';
import { ConfigProvider, Layout, Menu, MenuProps, Tooltip } from 'antd';
import {
  PieChartOutlined,
  HomeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Logo } from '../../components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUserPermissions } from '../../api/roleApi';
type MenuItem = Required<MenuProps>['items'][number];

const { Sider } = Layout;

// ---- Interface ----
interface Permission {
  id: string;
  permissionName: string;
  permissionCode: string;
  permissionUrl: string | null;
  permissionParent: string | null;
  position: number;
  isMenus: boolean;
}

// ---- Build tree menu từ danh sách phẳng ----
function buildPermissionTree(data: Permission[]): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  data.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  data.forEach((item) => {
    if (item.permissionParent && map.has(item.permissionParent)) {
      map.get(item.permissionParent).children.push(map.get(item.id));
    } else {
      roots.push(map.get(item.id));
    }
  });

  // Sắp xếp theo position
  const sortTree = (nodes: any[]) => {
    nodes.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    nodes.forEach((n) => n.children && sortTree(n.children));
  };
  sortTree(roots);

  return roots;
}
function convertToMenuItems(
  tree: any[],
  t: any,
  collapsed: boolean
): MenuItem[] {
  return tree.map((node) => {
    // Xác định icon
    let icon: React.ReactNode = (
      <span className="anticon">
        {node.permissionCode === 'HOME' ? (
          <HomeOutlined />
        ) : node.permissionCode === 'SYS' ? (
          <PieChartOutlined />
        ) : node.permissionCode === 'DOC' ? (
          <FileTextOutlined />
        ) : (
          <PieChartOutlined />
        )}
      </span>
    );

    // Nếu menu đang mở rộng và là node con -> ẩn icon
    if (node.permissionParent != null) {
      icon = null;
    }
    // Khi collapsed = true → có tooltip
    if (!collapsed) {
      return {
        key: node.permissionUrl || node.permissionCode,
        label: node.permissionUrl ? (
          <Tooltip title={t(node.permissionName)} placement="bottom">
            <Link to={node.permissionUrl}>
              <span style={{ color: 'inherit' }}>{t(node.permissionName)}</span>
            </Link>
          </Tooltip>
        ) : (
          t(node.permissionName)
        ),
        icon,
        children:
          node.children && node.children.length > 0
            ? convertToMenuItems(node.children, t, collapsed)
            : undefined,
      } as MenuItem;
    }

    // Khi collapsed = false → không có tooltip
    return {
      key: node.permissionUrl || node.permissionCode,
      label: node.permissionUrl ? (
        <Link to={node.permissionUrl}>
          <span style={{ color: 'inherit' }}>{t(node.permissionName)}</span>
        </Link>
      ) : (
        t(node.permissionName)
      ),
      icon, // vẫn giữ icon để đồng nhất cấu trúc
      children:
        node.children && node.children.length > 0
          ? convertToMenuItems(node.children, t, collapsed)
          : undefined,
    } as MenuItem;
  });
}

interface SideNavProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const SideNav: React.FC<SideNavProps> = ({
  collapsed: propCollapsed,
  onCollapse,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Dùng giá trị từ props, fallback về true nếu không có
  const collapsed = propCollapsed ?? true;

  useEffect(() => {
    async function fetchMenus() {
      try {
        const res = await getUserPermissions();
        if (res?.status === 200 && Array.isArray(res.object)) {
          const allPermissions = res.object;
          const menus = allPermissions.filter((p: Permission) => p.isMenus);
          const tree = buildPermissionTree(menus);
          const items = convertToMenuItems(tree, t, collapsed);
          setMenuItems(items);
        }
      } catch (err) {
        console.error('Load menu failed', err);
      }
    }
    fetchMenus();
  }, [t, collapsed]);

  useEffect(() => {
    if (!menuItems.length || !pathname) return;

    const allKeys = getAllKeys(menuItems);

    function getAllKeys(items: MenuItem[]): string[] {
      const keys: string[] = [];
      items.forEach((item: any) => {
        if (item.key) keys.push(item.key);
        if (item.children) keys.push(...getAllKeys(item.children));
      });
      return keys;
    }

    // Tìm key dài nhất mà pathname bắt đầu bằng key đó
    let matchedKey = '';
    let maxLength = 0;

    allKeys.forEach((key) => {
      if (pathname.startsWith(key) && key.length > maxLength) {
        maxLength = key.length;
        matchedKey = key;
      }
    });

    // Nếu không tìm thấy, fallback về pathname (trường hợp route chính xác)
    if (!matchedKey && allKeys.includes(pathname)) {
      matchedKey = pathname;
    }

    // Tìm parent keys
    const findParentKeys = (items: MenuItem[], target: string): string[] => {
      const parents: string[] = [];

      const traverse = (nodes: MenuItem[]): boolean => {
        for (const node of nodes) {
          if (!node || !('key' in node)) continue;

          if (node.key === target) {
            parents.push(node.key as string);
            return true;
          }

          if (node && 'children' in node && Array.isArray(node.children)) {
            if (traverse(node.children)) {
              parents.push(node.key as string);
              return true;
            }
          }
        }
        return false;
      };

      traverse(items);
      return parents;
    };

    const parentKeys = findParentKeys(menuItems, matchedKey);

    setOpenKeys(parentKeys);
    setSelectedKeys(matchedKey ? [matchedKey] : []);
  }, [pathname, menuItems]);

  // Gọi onCollapse khi Sider tự thay đổi (nếu cần)
  const handleCollapse = (collapsed: boolean) => {
    onCollapse?.(collapsed);
  };

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="80"
      collapsed={collapsed}
      onCollapse={handleCollapse}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <Logo
        color="blue"
        asLink
        href="/home"
        justify="center"
        gap="small"
        imgSize={{ h: 28, w: 28 }}
        style={{ padding: '1rem 0' }}
        collapsed={collapsed}
      />
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
          },
          components: {
            Menu: {
              itemColor: '#2c2c2c',
              itemSelectedColor: '#2c2c2c', //  khi chọn
              itemHoverColor: '#1677ff', // hover
              itemSelectedBg: '#bae0ff',
              itemHoverBg: '#e6f4ff',
              iconMarginInlineEnd: 8,
            },
          },
        }}
      >
        <Menu
          theme="light"
          mode="inline"
          items={menuItems}
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          onClick={(e) => navigate(e.key)}
          style={{
            border: 'none',
            background: '#fff',
          }}
        />
      </ConfigProvider>
    </Sider>
  );
};

export default SideNav;
