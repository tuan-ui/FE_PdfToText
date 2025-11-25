import Table, { ColumnsType } from 'antd/es/table';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocDocument,deleteDoc } from '../../../api/docDocumentApi';
import { Button, Empty, Tooltip, notification,Flex, Progress, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useStylesContext } from '../../../context';
import { useColumnSearch } from '../../../components/Table/tableSearchUtil';
import { TableRowSelection } from 'antd/es/table/interface';

interface DraftDocProps {
  fetchPersonalDocs: (
    page: number,
    pageSize: number,
    filters?: Record<string, any>
  ) => void;
  loading: boolean;
  total: number;
  personalDocs: DocDocument[];
  onRowClick: (doc: DocDocument) => void;
  handleOpenEdit: (doc: DocDocument) => void;
}

const DraftDoc: React.FC<DraftDocProps> = ({
  fetchPersonalDocs,
  loading,
  total,
  personalDocs,
  onRowClick,
  handleOpenEdit,
}) => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  /** Open modal states */
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);

  const [editDoc, setEditDoc] = useState<DocDocument>();
  const [selectedDoc, setSelectedDoc] = useState<DocDocument | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState<string>('');

  const [filters, setFilters] = useState<Record<string, any>>({});
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(350);

  const titleSearch = useColumnSearch<DocDocument>({
    dataIndex: 'documentTitle',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchPersonalDocs(1, pagination.pageSize, newParams);
    },
  });
  const docTypeSearch = useColumnSearch<DocDocument>({
    dataIndex: 'docTypeName',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchPersonalDocs(1, pagination.pageSize, newParams);
    },
  });

  useEffect(() => {
    const compute = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const available = Math.max(window.innerHeight - top - 24, 150);
      const reserved = 200;
      setTableHeight(Math.max(150, Math.floor(available - reserved)));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  /** Khi đổi trang */
  const handleTableChange = (paginationInfo: any) => {
    const { current, pageSize } = paginationInfo;
    setPagination({ current, pageSize });

    const activeFilters =
      filters && Object.keys(filters).length > 0
        ? filters
        : searchParams && Object.keys(searchParams).length > 0
          ? searchParams
          : {};

    fetchPersonalDocs(current, pageSize, activeFilters);
  };

  const handleFilter = () => {
    setOpenFilterModal(true);
  };

  const handleApplyFilter = (newFilters: Record<string, any>) => {
    setSearchParams({});
    setFilters(newFilters);
    fetchPersonalDocs(1, pagination.pageSize, newFilters);
  };

  /** Hàm xóa */
  const handleDelete = async (record: DocDocument) => {
    try {
      const res = await deleteDoc(record.id);
      if (res) {
        notification.success({
          message: t('common.actionSuccess'),
          description: `${t('common.Delete')} ${record.partnerName} ${t(
            'common.success'
          )}`,
        });
        fetchPersonalDocs(pagination.current, pagination.pageSize);
      } else {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.Delete')} ${record.partnerName} ${t(
            'common.failed'
          )}`,
        });
      }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: `${t('common.Delete')} ${record.partnerName} ${t(
          'common.failed'
        )}`,
      });
    }
  };
  /** Hàm đổi trạng thái */
  const handleStatusClick = async (record: DocDocument) => {
    try {
      // const res = await lockPartner(record.id);
      // if (res.success) {
      //   notification.success({
      //     message: t('common.actionSuccess'),
      //     description: `${t('common.changeStatus')} ${record.partnerName} ${t(
      //       'common.success'
      //     )}`,
      //   });
      //   fetchData(pagination.current, pagination.pageSize);
      // } else {
      //   notification.error({
      //     message: t('common.actionFailed'),
      //     description: `${t('common.changeStatus')} ${record.partnerName} ${t(
      //       'common.failed'
      //     )}`,
      //   });
      // }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: `${t('common.changeStatus')} ${record.partnerName} ${t(
          'common.failed'
        )}`,
      });
    }
  };

  const handleCloseAdd = () => {
    setOpenAddModal(false);
    setEditDoc(undefined);
  };
  /** Hàm thêm và chỉnh sửa */
  const handleAdd = async (record: DocDocument) => {
    try {
      // const res = editRole?.id
      //   ? await EditPartnerApi(record)
      //   : await CreatePartner(record);
      // if (res.status === 200) {
      //   notification.success({
      //     message: t('common.actionSuccess'),
      //     description: editRole?.id
      //       ? t('common.UpdateSuccess')
      //       : t('common.AddSuccess'),
      //   });
      //   fetchData(pagination.current, pagination.pageSize);
      //   return true;
      // } else {
      //   notification.error({
      //     message: t('common.actionFailed'),
      //     description: t(res?.message),
      //   });
      //   return false;
      // }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: t('common.failed'),
      });
      return false;
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowKeys.length) {
      return;
    }
    try {
      // const ids = selectedRowKeys.map((key) => String(key));
      // const res = await checkDeleteMultiPartner(ids);
      // if (res.success) {
      //   if (res?.message?.data?.status === 200) {
      //     if (res?.message?.data?.object === null) {
      //       notification.success({
      //         message: t('common.actionSuccess'),
      //         description: t('common.DeleteSuccessMutile', {
      //           count: ids.length,
      //         }),
      //       });
      //       fetchData(pagination.current, pagination.pageSize);
      //     } else {
      //       try {
      //         const payload = res?.message?.data?.object;
      //         setErrorPayload(payload);
      //         setErrorDeleteUrl('/api/partner/deleteMulti');
      //         setErrorDeleteIds(ids);
      //         setErrorModalOpen(true);
      //       } catch (e) {
      //         console.warn('Failed to parse error payload', e);
      //         notification.error({
      //           message: t('common.actionFailed'),
      //           description: t('common.failed'),
      //         });
      //       }
      //     }
      //   } else {
      //     notification.error({
      //       message: t('common.actionFailed'),
      //       description: t(res?.message?.data?.message),
      //     });
      //   }
      // } else {
      //   notification.error({
      //     message: t('common.actionFailed'),
      //     description: `${t('common.DeleteMuti')} ${t('common.success')}`,
      //   });
      // }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: `${t('common.DeleteMuti')} ${t('common.failed')}`,
      });
    }
  };

  const rowSelection: TableRowSelection<DocDocument> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  /** Cột hiển thị */
  const COLUMNS: ColumnsType<DocDocument> = [
    {
      title: t('doc.personalDoc.title'),
      dataIndex: 'documentTitle',
      key: 'documentTitle',
      align: 'left',
      width: '45%',
      ...titleSearch.getColumnSearchProps(),
    },
    {
      title: t('doc.personalDoc.docType'),
      dataIndex: 'docTypeName',
      key: 'docTypeName',
      align: 'left',
      width: '15%',
      ...docTypeSearch.getColumnSearchProps(),
    },
    {
      title: t('doc.personalDoc.createDate'),
      dataIndex: 'createAt',
      key: 'createAt',
      align: 'left',
      width: '15%',
      // ...partnerNameSearch.getColumnSearchProps(),
    },
    {
      title: t('doc.personalDoc.lastUpdateAt'),
      dataIndex: 'lastUpdateAt',
      key: 'lastUpdateAt',
      align: 'left',
      width: '15%',
      // ...partnerNameSearch.getColumnSearchProps(),
    },
    {
      title: t('common.Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: '10%',
      align: 'left' as const,
      render: (_: any, record: DocDocument) => (
        <span>
          <Flex gap="small" vertical>
            <Progress percent={100} />
          </Flex>
        </span>
      ),
    },
    {
      title: t('common.action'),
      key: 'actions',
      align: 'center',
      width: '10%',
      render: (_: any, record: DocDocument) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Tooltip title={t('common.Detail')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => {
                onRowClick(record);
              }}
            />
          </Tooltip>
          <Tooltip title={t('common.Edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(record);
              }}
            />
          </Tooltip>
          <Popconfirm
            placement="topRight"
            title={t('app.ConfirmDelete', { name: record.partnerName })}
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(record);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Tooltip title={t('common.Delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];
  return (
    <div
      ref={wrapperRef}
      style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
    >
      <Table<DocDocument>
        columns={COLUMNS}
        dataSource={personalDocs}
        loading={loading}
        tableLayout="fixed"
        rowKey="id"
        rowSelection={rowSelection}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${t('common.showRecord', {
              num: `${range[0]} - ${range[1]}`,
              records: total,
            })}`,
          locale: { items_per_page: t('common.perPage') },
          position: ['bottomCenter'],
        }}
        scroll={{ y: tableHeight }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span>{t('common.DataNotFound')}</span>}
            />
          ),
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default DraftDoc;
