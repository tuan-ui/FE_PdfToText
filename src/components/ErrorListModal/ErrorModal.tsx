import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Table,
  Input,
  Row,
  Col,
  Button,
  Empty,
  notification,
  Divider,
  Popconfirm,
  Spin,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { API, standardResponse } from '../../utils/middleware';

interface ErrorResponse {
  id: string;
  code: string;
  name: string;
  errorMessage: string;
  version?: number;
}

interface ErrorPayload {
  errors: ErrorResponse[];
  total: number;
  hasError: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  payload?: ErrorPayload | null;
  deleteUrl?: string;
  deleteIds?: string[];
  onDeleteSuccess?: () => void;
  title?: string;
  errorDeleteItems?: { id: string; version: number }[];
}

const { Search } = Input;

const CommonErrorDeleteModal: React.FC<Props> = ({
  open,
  onClose,
  payload,
  deleteUrl,
  deleteIds,
  onDeleteSuccess,
  errorDeleteItems,
  title,
}) => {
  const { t } = useTranslation();

  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 5,
  });
  const [deleting, setDeleting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(
    deleteIds || []
  );

  useEffect(() => {
    if (open && payload?.errors) {
      const defaultFromProps = deleteIds || [];

      const safeIdsFromData = payload.errors
        .filter(
          (r) => r.errorMessage == null || String(r.errorMessage).trim() === ''
        )
        .map((r) => r.id);

      const validDefaultIds = defaultFromProps.filter((id) =>
        safeIdsFromData.includes(String(id))
      );

      const finalSelected =
        validDefaultIds.length > 0 ? validDefaultIds : safeIdsFromData;

      setSelectedRowKeys(finalSelected.map(String));
    } else if (!open) {
      // Reset khi đóng
      setSearchText('');
      setPagination({ current: 1, pageSize: 5 });
      setSelectedRowKeys([]);
    }
  }, [open, payload?.errors, deleteIds]);

  const data: ErrorResponse[] = payload?.errors || [];

  const filtered = useMemo(() => {
    if (!searchText) return data;
    const s = searchText.toLowerCase();
    return data.filter(
      (r) =>
        (r.code || '').toLowerCase().includes(s) ||
        (r.name || '').toLowerCase().includes(s)
    );
  }, [data, searchText]);

  // disable delete if any selected row has an error message
  const anySelectedHasError = useMemo(() => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) return false;
    const setKeys = new Set(selectedRowKeys.map(String));
    return data.some(
      (r) =>
        setKeys.has(String(r.id)) &&
        r.errorMessage &&
        String(r.errorMessage).trim() !== ''
    );
  }, [selectedRowKeys, data]);

  const handleTableChange = (p: TablePaginationConfig) => {
    setPagination(p);
  };

  const start = ((pagination.current || 1) - 1) * (pagination.pageSize || 5);
  const end = start + (pagination.pageSize || 5);
  const pageData = filtered.slice(start, end);

  const columns: ColumnsType<ErrorResponse> = [
    {
      title: t('errorModal.code', { code: title }),
      dataIndex: 'code',
      key: 'code',
      width: '25%',
    },
    {
      title: t('errorModal.name', { name: title }),
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: t('errorModal.errorMessage'),
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      width: '40%',
      render: (v: any) => t(v) || '--',
    },
  ];

  return (
    <Modal
      centered
      open={open}
      onCancel={onClose}
      title={t('errorModal.DeleteMultiError', { title: title })}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Button key="cancel" onClick={onClose} disabled={deleting}>
            {t('common.Close')}
          </Button>

          <Popconfirm
            placement="topRight"
            title={t('errorModal.confirmDelete', {
              count: selectedRowKeys.length,
              title: title,
            })}
            onConfirm={async (e) => {
              e?.stopPropagation();

              if (deleting) return;

              if (!deleteUrl) {
                notification.error({
                  message: t('common.actionFailed'),
                  description: t('common.missingDeleteUrl'),
                });
                return;
              }

              // LẤY DANH SÁCH id + version TỪ payload.errors
              const itemsToDelete = (errorDeleteItems || [])
                .filter((item) => selectedRowKeys.map(String).includes(item.id))
                .map((item) => ({ id: item.id, version: item.version }));

              if (itemsToDelete.length === 0) {
                notification.error({
                  message: t('common.actionFailed'),
                  description: t('common.noRowsSelected'),
                });
                return;
              }

              try {
                setDeleting(true);

                // DÙNG POST + BODY THAY VÌ GET + QUERY
                const resp = await API.post(deleteUrl, itemsToDelete);
                const wrapped = standardResponse(true, resp);

                if (wrapped && wrapped.success) {
                  notification.success({
                    message: t('common.actionSuccess'),
                    description: t('common.DeleteSuccessMutile', {
                      count: itemsToDelete.length,
                    }),
                  });
                  onClose();
                  onDeleteSuccess?.();
                } else {
                  notification.error({
                    message: t('common.actionFailed'),
                    description: String(wrapped?.message) || t('common.failed'),
                  });
                }
              } catch (err: any) {
                // XỬ LÝ 409: BỎ CHỌN CÁC BẢN GHI LỖI
                if (err.response?.status === 409) {
                  const failedIds = err.response?.data?.data || [];
                  const remaining = selectedRowKeys.filter(
                    (key) => !failedIds.includes(String(key))
                  );
                  setSelectedRowKeys(remaining);
                  notification.warning({
                    message: t('common.Conflict'),
                    description: t('common.SomeRecordsChanged'),
                  });
                } else {
                  notification.error({
                    message: t('common.actionFailed'),
                    description: t('common.failed'),
                  });
                }
              } finally {
                setDeleting(false);
              }
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText={t('common.yes')}
            cancelText={t('common.no')}
            disabled={deleting || anySelectedHasError}
          >
            <Button
              key="delete"
              type="primary"
              danger
              loading={deleting}
              disabled={
                deleting || anySelectedHasError || selectedRowKeys.length === 0
              }
            >
              {t('common.Delete')}
            </Button>
          </Popconfirm>
        </div>
      }
      width={900}
      maskClosable={false}
      destroyOnClose
    >
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
      <Row style={{ marginBottom: 12 }} gutter={12} justify="space-between">
        <Col>{t('errorModal.ListDeleted')}</Col>
        <Col>
          <Input.Search
            placeholder={t('common.Search')}
            style={{
              width: '400px',
              marginLeft: '.5rem',
              marginRight: 8,
            }}
            size="middle"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(v) => setSearchText(v)}
          />
        </Col>
      </Row>

      <Table<ErrorResponse>
        rowSelection={{
          selectedRowKeys,
          onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
        }}
        columns={columns}
        dataSource={pageData}
        rowKey={(r) => r.id}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filtered.length,
          showTotal: (total, range) =>
            `${t('common.showRecord', {
              num: `${range[0]} - ${range[1]}`,
              records: total,
            })}`,
        }}
        onChange={(p) => handleTableChange(p)}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('common.DataNotFound')}
            />
          ),
        }}
      />
      <Divider
        style={{
          margin: '8px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
    </Modal>
  );
};

export default CommonErrorDeleteModal;
