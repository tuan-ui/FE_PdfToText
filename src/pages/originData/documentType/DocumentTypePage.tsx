import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Col,
  notification,
  Row,
  Table,
  Tooltip,
  Empty,
  Switch,
  Input,
  Popconfirm,
} from 'antd';
import { Card, PageHeader } from '../../../components';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HomeOutlined,
  PieChartOutlined,
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../../context';
import {
  search,
  lockDocType,
  createDocType,
  deleteDocType,
  deleteMultiDocType,
  updateDocType,
  DocType,
  checkDeleteMulti,
} from '../../../api/docTypeApi';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { DetailDocType } from './DetailDocType';
import CreateOrUpdateDocType from './CreateOrUpdateDocType';
import { TableRowSelection } from 'antd/es/table/interface';
import { useColumnSearch } from '../../../components/Table/tableSearchUtil';
import { usePagePermission } from '../../../hooks/usePagePermission';
import CommonErrorDeleteModal from '../../../components/ErrorListModal/ErrorModal';
import { ChildMenuGuard } from '../../../routes/ChildMenuGuard';
import { useMenuPermission } from '../../../hooks/useMenuPermission';

const DocTypePage: React.FC = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();

  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editDocType, setEditDocType] = useState<DocType | null>(null);
  const [searchParams, setSearchParams] = useState<{
    docTypeName?: string;
    docTypeCode?: string;
    docTypeDescription?: string;
  }>({});
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorPayload, setErrorPayload] = useState<any | null>(null);
  const [errorDeleteUrl, setErrorDeleteUrl] = useState<string | undefined>(
    undefined
  );
  const [errorDeleteIds, setErrorDeleteIds] = useState<string[] | undefined>(
    undefined
  );
  const [errorDeleteItems, setErrorDeleteItems] = useState<
    {
      id: string;
      name: string | undefined;
      code: string | undefined;
      version: number;
    }[]
  >([]);
  const [selectedVersions, setSelectedVersions] = useState<Map<string, number>>(
    new Map()
  );
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(350);
  const [searchInputValue, setSearchInputValue] = useState('');
  const perm = useMenuPermission('DOCUMENTTYPE');

  const handleClearAllFilters = () => {
    try {
      (docTypeCodeSearch as any)?.resetSearch?.();
      setSearchParams({});
      fetchDocTypes(pagination.current, pagination.pageSize);
    } catch (e) {
      /* ignore */
    }
    try {
      (docTypeNameSearch as any)?.resetSearch?.();
    } catch (e) {
      /* ignore */
    }
    try {
      (docTypeDesSearch as any)?.resetSearch?.();
    } catch (e) {
      /* ignore */
    }

    setSearchParams({});
    setSearchInputValue('');
    // reset to first page
    setPagination((p) => ({ ...p, current: 1 }));
    fetchDocTypes(1, pagination.pageSize, {});
  };

  const docTypeNameSearch = useColumnSearch<DocType>({
    dataIndex: 'docTypeName',
    onSearchServer: (field, value) => {
      setSearchParams((prev) => {
        const newParams = { ...prev, [field]: value };
        fetchDocTypes(1, pagination.pageSize, newParams);
        return newParams;
      });
    },
  });

  const docTypeCodeSearch = useColumnSearch<DocType>({
    dataIndex: 'docTypeCode',
    onSearchServer: (field, value) => {
      setSearchParams((prev) => {
        const newParams = { ...prev, [field]: value };
        fetchDocTypes(1, pagination.pageSize, newParams);
        return newParams;
      });
    },
  });

  const docTypeDesSearch = useColumnSearch<DocType>({
    dataIndex: 'docTypeDescription',
    onSearchServer: (field, value) => {
      setSearchParams((prev) => {
        const newParams = { ...prev, [field]: value };
        fetchDocTypes(1, pagination.pageSize, newParams);
        return newParams;
      });
    },
  });
  let currentRequestId = 0;
  /** Hàm search */
  const fetchDocTypes = async (
    page = 1,
    size = 10,
    filters: Record<string, any> = searchParams
  ) => {
    const requestId = ++currentRequestId;
    setLoading(true);
    try {
      const res = await search({ page: page - 1, size, ...filters });
      if (requestId !== currentRequestId) return;
      if (res?.status === 200 && res?.object) {
        setDocTypes(res.object.content || []);
        setTotal(res.object.totalElements || 0);
      }
      if (res.object.totalElements === 0 && Object.keys(filters).length > 0) {
        notification.info({
          message: t('common.Info'),
          description: `${t('common.NoDataFilter')}`,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /** Load lần đầu */
  useEffect(() => {
    fetchDocTypes(pagination.current, pagination.pageSize);
  }, []);

  /** Khi đổi trang */
  const handleTableChange = (paginationInfo: any) => {
    const { current, pageSize } = paginationInfo;
    setPagination({ current, pageSize });

    const activeFilters =
      searchParams && Object.keys(searchParams).length > 0 ? searchParams : {};

    fetchDocTypes(current, pageSize, activeFilters);
  };
  /** Hàm xóa */
  const handleDelete = async (record: DocType) => {
    await perm.exec('delete', async () => {
      try {
        if (record.id) {
          const res = await deleteDocType(record.id, record.version);
          if (res.success) {
            if (res?.message?.data?.status === 200) {
              notification.success({
                message: t('common.actionSuccess'),
                description: `${t('common.Delete')} ${record.docTypeName} ${t(
                  'common.success'
                )}`,
              });
              fetchDocTypes(pagination.current, pagination.pageSize);
            } else {
              notification.error({
                message: t('common.actionFailed'),
                description: t(res?.message?.data?.message),
              });
            }
          } else {
            notification.error({
              message: t('common.actionFailed'),
              description: `${t('common.Delete')} ${record.docTypeName} ${t(
                'common.failed'
              )}`,
            });
          }
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.Delete')} ${record.docTypeName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };
  /** Hàm đổi trạng thái */
  const handleStatusClick = async (record: DocType) => {
    await perm.exec('edit', async () => {
      try {
        if (record.id) {
          const res = await lockDocType(record.id, record.version);
          if (res.success) {
            if (res?.message?.data?.status === 200) {
              notification.success({
                message: t('common.actionSuccess'),
                description: `${t('common.changeStatus')} ${
                  record.docTypeName
                } ${t('common.success')}`,
              });
              fetchDocTypes(pagination.current, pagination.pageSize);
            } else {
              notification.error({
                message: t('common.actionFailed'),
                description: t(res?.message?.data?.message),
              });
            }
          } else {
            notification.error({
              message: t('common.actionFailed'),
              description: `${t('common.changeStatus')} ${
                record.docTypeName
              } ${t('common.failed')}`,
            });
          }
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.changeStatus')} ${record.docTypeName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };
  const handleOpenAdd = () => {
    perm.exec('add', () => {
      setEditDocType(null);
      setOpenAddModal(true);
    });
  };

  const handleEdit = (record: DocType) => {
    perm.exec('edit', () => {
      setEditDocType(record);
      setOpenAddModal(true);
    });
  };
  const handleCloseAdd = () => setOpenAddModal(false);
  /** Hàm thêm và chỉnh sửa */
  const handleAdd = async (record: DocType) => {
    const success = await perm.exec(editDocType ? 'edit' : 'add', async () => {
      try {
        const res = editDocType
          ? await updateDocType(record)
          : await createDocType(record);

        if (res.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: editDocType
              ? t('common.UpdateSuccess')
              : t('common.AddSuccess'),
          });
          setOpenAddModal(false);
          fetchDocTypes(pagination.current, pagination.pageSize);
          return true;
        } else {
          notification.error({
            message: t('common.actionFailed'),
            description: t(res?.message),
          });
          return false;
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: t('common.failed'),
        });
        return false;
      }
    });
    return success === true;
  };
  /** Xóa nhiều */
  const handleDeleteSelected = async () => {
    if (!selectedRowKeys.length) return;

    const selectedRecords = docTypes.filter((docTypes) =>
      selectedRowKeys.includes(docTypes.id!)
    );

    const itemsToDelete = selectedRecords.map((record) => ({
      id: String(record.id),
      name: record.docTypeName,
      code: record.docTypeCode,
      version: selectedVersions.get(String(record.id)) ?? 0,
    }));

    try {
      // BƯỚC 1: GỌI CHECK (không xóa)
      const checkRes = await checkDeleteMulti(itemsToDelete);

      if (!checkRes.success || !checkRes.message?.data) {
        notification.error({
          message: t('common.actionFailed'),
          description: t('common.failed'),
        });
        return;
      }

      const payload = checkRes.message.data.object;
      const hasError = checkRes.message.data.hasError;

      // TH1: KHÔNG LỖI → XÓA LUÔN
      if (!hasError && payload === null) {
        const deleteRes = await deleteMultiDocType(itemsToDelete);
        if (deleteRes.success && deleteRes.message?.data?.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: t('common.DeleteSuccessMutile', {
              count: itemsToDelete.length,
            }),
          });
          fetchDocTypes(pagination.current, pagination.pageSize);
          setSelectedRowKeys([]);
          setSelectedVersions(new Map());
        } else {
          notification.error({
            message: t('common.actionFailed'),
            description: t('common.failed'),
          });
        }
        return;
      }

      // TH2: CÓ LỖI → MỞ POPUP
      setErrorPayload(payload);
      setErrorDeleteUrl('/api/doc-type/deleteMuti');
      setErrorDeleteIds(itemsToDelete.map((i) => i.id));
      setErrorDeleteItems(itemsToDelete);
      setErrorModalOpen(true);
    } catch (err) {
      notification.error({
        message: t('common.actionFailed'),
        description: t('common.failed'),
      });
    }
  };

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

  /** Cột hiển thị */
  const COLUMNS: ColumnsType<DocType> = [
    {
      title: t('originData.docType.code'),
      dataIndex: 'docTypeCode',
      key: 'docTypeCode',
      align: 'left',
      width: '25%',
      ellipsis: true,
      ...docTypeCodeSearch.getColumnSearchProps(),
    },
    {
      title: t('originData.docType.name'),
      dataIndex: 'docTypeName',
      key: 'docTypeName',
      align: 'left',
      width: '25%',
      ellipsis: true,
      ...docTypeNameSearch.getColumnSearchProps(),
    },
    {
      title: t('originData.docType.description'),
      dataIndex: 'docTypeDescription',
      key: 'docTypeDescription',
      align: 'left',
      width: '25%',
      ellipsis: true,
      ...docTypeDesSearch.getColumnSearchProps(),
    },
    {
      title: t('common.Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      fixed: 'right',
      align: 'left' as const,
      render: (_: any, record: any) => {
        const isOpen = _ === 1 || _;
        return (
          <Switch
            checked={!!isOpen}
            checkedChildren={t('common.Check')}
            unCheckedChildren={t('common.Uncheck')}
            disabled={!perm.canEdit}
            onChange={(_checked, e) => {
              e?.stopPropagation();
              void handleStatusClick(record);
            }}
          />
        );
      },
    },

    {
      title: t('common.action'),
      key: 'actions',
      align: 'center',
      fixed: 'right',
      render: (_: any, record: DocType) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Tooltip title={t('common.Detail')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDocType(record);
                setIsModalOpen(true);
              }}
            />
          </Tooltip>
          {perm.edit && (
            <Tooltip title={t('common.Edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(record);
                }}
              />
            </Tooltip>
          )}
          {perm.canDelete && (
            <Tooltip title={t('common.Delete')}>
              <Popconfirm
                placement="topRight"
                title={t('app.ConfirmDelete', { name: record.docTypeName })}
                okText={t('common.yes')}
                cancelText={t('common.no')}
                onConfirm={() => handleDelete(record)}
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const rowSelection: TableRowSelection<DocType> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], selectedRows: DocType[]) => {
      setSelectedRowKeys(newSelectedRowKeys);

      const newVersions = new Map<string, number>();
      selectedRows.forEach((row) => {
        if (row.id && row.version != null) {
          newVersions.set(String(row.id), row.version);
        }
      });
      setSelectedVersions(newVersions);
    },
  };

  return (
    <div>
      <Row {...stylesContext?.rowProps}>
        <Col span={24}>
          <Card>
            <>
              <Row
                justify="space-between"
                align="middle"
                style={{ marginBottom: 16 }}
              >
                <Col>
                  <Helmet>
                    <title>{t('originData.docType.list')}</title>
                  </Helmet>

                  <PageHeader
                    title={t('originData.docType.list')}
                    breadcrumbs={undefined}
                  />
                </Col>
                <Col>
                  <Input.Search
                    placeholder={t('common.Search')}
                    style={{
                      width: '400px',
                      marginLeft: '.5rem',
                      marginRight: 8,
                    }}
                    size="middle"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    onSearch={(value) => {
                      const sanitized = value
                        ? value.replace(/<[^>]*>?/gm, '').trim()
                        : '';
                      // update searchParams with a searchString field and fetch
                      setSearchParams((prev) => {
                        const newParams = { ...prev, searchString: sanitized };
                        fetchDocTypes(1, pagination.pageSize, newParams);
                        return newParams;
                      });
                    }}
                  />
                  <Button
                    onClick={handleClearAllFilters}
                    style={{ marginRight: 8 }}
                    icon={
                      <UndoOutlined
                        style={{ fontSize: 14, verticalAlign: 'middle' }}
                      />
                    }
                  ></Button>
                  {perm.add && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ marginRight: 8 }}
                      onClick={handleOpenAdd}
                    >
                      {t('common.Add')}
                    </Button>
                  )}
                  {perm.delete && (
                    <Popconfirm
                      placement="topRight"
                      title={t('app.ConfirmDeleteMultiple', {
                        count: selectedRowKeys.length,
                      })}
                      okText={t('common.yes')}
                      cancelText={t('common.no')}
                      onConfirm={handleDeleteSelected}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        style={{ marginRight: 8 }}
                        disabled={!selectedRowKeys.length}
                      >
                        {t('common.Delete')}
                      </Button>
                    </Popconfirm>
                  )}
                </Col>
              </Row>
              <div
                ref={wrapperRef}
                style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
              >
                <Table<DocType>
                  columns={COLUMNS}
                  dataSource={docTypes}
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
            </>
          </Card>
        </Col>
      </Row>
      <DetailDocType
        open={isModalOpen}
        docType={selectedDocType}
        onClose={() => setIsModalOpen(false)}
      />
      <CreateOrUpdateDocType
        open={openAddModal}
        onClose={handleCloseAdd}
        onSubmit={handleAdd}
        docTypeData={editDocType}
      />
      <CommonErrorDeleteModal
        open={errorModalOpen}
        onClose={() => {
          setErrorModalOpen(false);
          setErrorPayload(null);
          setErrorDeleteUrl(undefined);
          setErrorDeleteIds(undefined);
        }}
        payload={errorPayload}
        deleteUrl={errorDeleteUrl}
        deleteIds={errorDeleteIds}
        errorDeleteItems={errorDeleteItems}
        onDeleteSuccess={() => {
          fetchDocTypes(pagination.current, pagination.pageSize);
          setSelectedRowKeys([]);
        }}
        title={t('errorModal.documentType')}
      />
    </div>
  );
};

export default DocTypePage;
