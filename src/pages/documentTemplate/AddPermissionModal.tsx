import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Table,
  Checkbox,
  Button,
  Space,
  message,
  Spin,
  Empty,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { searchUsers } from '../../api/userApi';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { getAllowspermission } from '../../api/documentTemplateApi';

interface UserType {
  key: string;
  username: string;
  fullName: string;
  userCode: string;
}

interface AddPermissionModalProps {
  open: boolean;
  currentEditors?: string[];
  currentViewers?: string[];
  onClose: () => void;
  onSubmit: (editors: string[], viewers: string[]) => Promise<boolean>;
  getContainer: any;
  currentFileId: string | undefined;
}

const AddPermissionModal: React.FC<AddPermissionModalProps> = ({
  open,
  currentEditors = [],
  currentViewers = [],
  onClose,
  onSubmit,
  getContainer,
  currentFileId,
}) => {
  const { t } = useTranslation();

  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Reset hoàn toàn khi modal mở/đóng
  const [selectedEditors, setSelectedEditors] = useState<Set<string>>(
    new Set()
  );
  const [selectedViewers, setSelectedViewers] = useState<Set<string>>(
    new Set()
  );

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Reset state khi mở modal
  useEffect(() => {
    if (open) {
      // Xóa hết selection trước khi load dữ liệu mới
      setSelectedEditors(new Set());
      setSelectedViewers(new Set());

      fetchUsers(1, 10);
      if (currentFileId) {
        fetchAllowspermission(currentFileId);
      }
    } else {
      // Khi đóng modal: reset data
      setUsers([]);
      setSelectedEditors(new Set());
      setSelectedViewers(new Set());
      setPagination({ current: 1, pageSize: 10, total: 0 });
    }
  }, [open, currentFileId]);

  const fetchUsers = async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const res = await searchUsers({ page: page - 1, size: pageSize });
      if (res?.status === 200 && res?.object?.content) {
        const userList = res.object.content.map((u: any) => ({
          key: String(u.id),
          username: u.username || '-',
          fullName: u.fullName || '-',
          userCode: u.userCode || '-',
        }));
        setUsers(userList);
        setPagination((prev) => ({
          ...prev,
          total: res.object.totalElements || 0,
          current: page,
          pageSize,
        }));
      }
    } catch (err) {
      message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Sửa lỗi chính: lấy đúng editorId / viewerId từ API
  const fetchAllowspermission = async (fileId: string) => {
    setLoading(true);
    try {
      const res = await getAllowspermission(fileId);
      if (res?.status === 200 && res?.object) {
        const editorIds =
          res.object.Editors?.map((item: any) => item.editorId).filter(
            Boolean
          ) || [];
        const viewerIds =
          res.object.Viewers?.map((item: any) => item.viewerId).filter(
            Boolean
          ) || [];

        // Cập nhật state sau khi đã có danh sách user (tránh race condition)
        setSelectedEditors(new Set(editorIds));
        setSelectedViewers(new Set(viewerIds));
      }
    } catch (err) {
      message.error(t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any) => {
    fetchUsers(pagination.current, pagination.pageSize);
  };

  const handleEditorChange = (userId: string, checked: boolean) => {
    setSelectedEditors((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });

    // Nếu bật CanEdit → tự động bật CanView
    if (checked) {
      setSelectedViewers((prev) => new Set(prev).add(userId));
    }
  };

  const handleViewerChange = (userId: string, checked: boolean) => {
    setSelectedViewers((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
        // Nếu bỏ CanView → phải bỏ luôn CanEdit (nếu có)
        setSelectedEditors((ePrev) => {
          const eNew = new Set(ePrev);
          eNew.delete(userId);
          return eNew;
        });
      }
      return newSet;
    });
  };

  const selectAllEditors = () => {
    const allIds = users.map((u) => u.key);
    setSelectedEditors((prev) => new Set([...prev, ...allIds]));
    setSelectedViewers((prev) => new Set([...prev, ...allIds]));
  };

  const selectAllViewers = () => {
    const allIds = users.map((u) => u.key);
    setSelectedViewers((prev) => new Set([...prev, ...allIds]));
  };

  const handleSave = async () => {
    const success = await onSubmit(
      Array.from(selectedEditors),
      Array.from(selectedViewers)
    );
    if (success) onClose();
  };

  const columns = [
    {
      title: t('user.userName'),
      dataIndex: 'username',
      align: 'left' as const,
      ellipsis: true,
      width: '20%',
    },
    {
      title: t('user.fullName'),
      dataIndex: 'fullName',
      align: 'left' as const,
      ellipsis: true,
      width: '20%',
    },
    {
      title: t('user.UserCode'),
      dataIndex: 'userCode',
      align: 'left' as const,
      ellipsis: true,
      width: '20%',
    },
    {
      title: (
        <Space>
          <Checkbox
            checked={
              users.length > 0 && users.every((u) => selectedEditors.has(u.key))
            }
            indeterminate={
              users.some((u) => selectedEditors.has(u.key)) &&
              !users.every((u) => selectedEditors.has(u.key))
            }
            onChange={(e) =>
              e.target.checked
                ? selectAllEditors()
                : setSelectedEditors((prev) => {
                    const newSet = new Set(prev);
                    users.forEach((u) => newSet.delete(u.key));
                    return newSet;
                  })
            }
          />
          {t('documentTemplate.CanEdit')}
        </Space>
      ),
      width: '20%',
      align: 'center' as const,
      render: (_: any, record: UserType) => (
        <Checkbox
          checked={selectedEditors.has(record.key)}
          onChange={(e) => handleEditorChange(record.key, e.target.checked)}
        />
      ),
    },
    {
      title: (
        <Space>
          <Checkbox
            checked={
              users.length > 0 && users.every((u) => selectedViewers.has(u.key))
            }
            indeterminate={
              users.some((u) => selectedViewers.has(u.key)) &&
              !users.every((u) => selectedViewers.has(u.key))
            }
            onChange={(e) => {
              if (e.target.checked) {
                selectAllViewers();
              } else {
                setSelectedViewers((prev) => {
                  const newSet = new Set(prev);
                  users.forEach((user) => {
                    if (!selectedEditors.has(user.key)) {
                      newSet.delete(user.key);
                    }
                  });
                  return newSet;
                });
              }
            }}
          />
          {t('documentTemplate.CanView')}
        </Space>
      ),
      width: 150,
      align: 'center' as const,
      render: (_: any, record: UserType) => (
        <Checkbox
          checked={selectedViewers.has(record.key)}
          disabled={selectedEditors.has(record.key)}
          onChange={(e) => handleViewerChange(record.key, e.target.checked)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={t('documentTemplate.SetFilePermission')}
      open={open}
      onCancel={onClose}
      width={950}
      zIndex={9999}
      getContainer={getContainer}
      footer={
        <Space>
          <Button onClick={onClose}>{t('common.Close')}</Button>
          <Button type="primary" onClick={handleSave}>
            {t('common.Save')}
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <div
          ref={wrapperRef}
          style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
        >
          <Table
            columns={columns}
            dataSource={users}
            rowKey="key"
            tableLayout="fixed"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${t('common.showRecord', {
                  num: `${range[0]} - ${range[1]}`,
                  records: total,
                })}`,
              locale: { items_per_page: t('common.perPage') },
            }}
            onChange={handleTableChange}
            scroll={{ y: 500 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span>{t('common.DataNotFound')}</span>}
                />
              ),
            }}
            size="small"
          />
        </div>
      </Spin>
    </Modal>
  );
};

export default AddPermissionModal;
