import { useTranslation } from 'react-i18next';
import { useStylesContext } from '../../../context';
import { useEffect, useRef, useState } from 'react';
import { usePagePermission } from '../../../hooks';
import { useColumnSearch } from '../../../components/Table/tableSearchUtil';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  notification,
  Popconfirm,
  Row,
  Switch,
  Tooltip,
} from 'antd';
import Table, { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HomeOutlined,
  PieChartOutlined,
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { TableRowSelection } from 'antd/es/table/interface';
import { Helmet } from 'react-helmet-async';
import { PageHeader } from '../../../components';
import {
  checkDeleteMulti,
  createHolidayType,
  deleteHolidayType,
  deleteMultiHolidayType,
  HolidayType,
  lockHolidayType,
  search,
  updateHolidayType,
} from '../../../api/holidayTypeApi';
import { DetailHolidayType } from './DetailHolidayType';
import CreateOrUpdateHolidayType from './CreateOrUpdateHolidayType';
import CommonErrorDeleteModal from '../../../components/ErrorListModal/ErrorModal';
import { useMenuPermission } from '../../../hooks/useMenuPermission';

const HolidayTypePage: React.FC = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();

  const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHolidayType, setSelectedHolidayType] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editHolidayType, setEditHolidayType] = useState<HolidayType | null>(
    null
  );
  const [searchParams, setSearchParams] = useState<{
    holidayTypeName?: string;
    holidayTypeCode?: string;
    description?: string;
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
  const perm = useMenuPermission('HOLIDAYTYPE');
  const handleClearAllFilters = () => {
    try {
      (holidayTypeCodeSearch as any)?.resetSearch?.();
      setSearchParams({});
      fetchHolidayTypes(pagination.current, pagination.pageSize);
    } catch (e) {
      /* ignore */
    }
    try {
      (holidayTypeNameSearch as any)?.resetSearch?.();
    } catch (e) {
      /* ignore */
    }
    try {
      (holidayTypeDesSearch as any)?.resetSearch?.();
    } catch (e) {
      /* ignore */
    }

    setSearchParams({});
    setSearchInputValue('');
    // reset to first page
    setPagination((p) => ({ ...p, current: 1 }));
    fetchHolidayTypes(1, pagination.pageSize, {});
  };

  const holidayTypeNameSearch = useColumnSearch<HolidayType>({
    dataIndex: 'holidayTypeName',
    onSearchServer: (field, value) => {
      setSearchParams((prev) => {
        const newParams = { ...prev, [field]: value };
        fetchHolidayTypes(1, pagination.pageSize, newParams);
        return newParams;
      });
    },
  });

  const holidayTypeCodeSearch = useColumnSearch<HolidayType>({
    dataIndex: 'holidayTypeCode',
    onSearchServer: (field, value) => {
      setSearchParams((prev) => {
        const newParams = { ...prev, [field]: value };
        fetchHolidayTypes(1, pagination.pageSize, newParams);
        return newParams;
      });
    },
  });

  const holidayTypeDesSearch = useColumnSearch<HolidayType>({
    dataIndex: 'description',
    onSearchServer: (field, value) => {
      setSearchParams((prev) => {
        const newParams = { ...prev, [field]: value };
        fetchHolidayTypes(1, pagination.pageSize, newParams);
        return newParams;
      });
    },
  });

  let currentRequestId = 0;

  /** Hàm search */
  const fetchHolidayTypes = async (
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
        setHolidayTypes(res.object.content || []);
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
    fetchHolidayTypes(pagination.current, pagination.pageSize);
  }, []);

  /** Khi đổi trang */
  const handleTableChange = (paginationInfo: any) => {
    const { current, pageSize } = paginationInfo;
    setPagination({ current, pageSize });

    const activeFilters =
      searchParams && Object.keys(searchParams).length > 0 ? searchParams : {};

    fetchHolidayTypes(current, pageSize, activeFilters);
  };

  /** Hàm xóa */
  const handleDelete = async (record: HolidayType) => {
    await perm.exec('delete', async () => {
      try {
        if (record.id) {
          const res = await deleteHolidayType(record.id, record.version);
          if (res.success) {
            if (res?.message?.data?.status === 200) {
              notification.success({
                message: t('common.actionSuccess'),
                description: `${t('common.Delete')} ${
                  record.holidayTypeName
                } ${t('common.success')}`,
              });
              fetchHolidayTypes(pagination.current, pagination.pageSize);
            } else {
              notification.error({
                message: t('common.actionFailed'),
                description: t(res?.message?.data?.message),
              });
            }
          } else {
            notification.error({
              message: t('common.actionFailed'),
              description: `${t('common.Delete')} ${record.holidayTypeName} ${t(
                'common.failed'
              )}`,
            });
          }
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.Delete')} ${record.holidayTypeName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };

  /** Hàm đổi trạng thái */
  const handleStatusClick = async (record: HolidayType) => {
    await perm.exec('edit', async () => {
      try {
        if (record.id) {
          const res = await lockHolidayType(record.id, record.version);
          if (res.success) {
            if (res?.message?.data?.status === 200) {
              notification.success({
                message: t('common.actionSuccess'),
                description: `${t('common.changeStatus')} ${
                  record.holidayTypeName
                } ${t('common.success')}`,
              });
              fetchHolidayTypes(pagination.current, pagination.pageSize);
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
                record.holidayTypeName
              } ${t('common.failed')}`,
            });
          }
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.changeStatus')} ${
            record.holidayTypeName
          } ${t('common.failed')}`,
        });
      }
    });
  };

  const handleOpenAdd = () => {
    perm.exec('add', () => {
      setEditHolidayType(null);
      setOpenAddModal(true);
    });
  };

  const handleCloseAdd = () => setOpenAddModal(false);

  const handleEdit = (record: HolidayType) => {
    perm.exec('edit', () => {
      setEditHolidayType(record);
      setOpenAddModal(true);
    });
  };

  const handleAdd = async (record: HolidayType) => {
    const success = await perm.exec(
      editHolidayType ? 'edit' : 'add',
      async () => {
        try {
          const res = editHolidayType
            ? await updateHolidayType(record)
            : await createHolidayType(record);

          if (res.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: editHolidayType
                ? t('common.UpdateSuccess')
                : t('common.AddSuccess'),
            });
            fetchHolidayTypes(pagination.current, pagination.pageSize);
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
      }
    );
    return success === true;
  };

  /** Xóa nhiều */
  const handleDeleteSelected = async () => {
    if (!selectedRowKeys.length) return;

    const selectedRecords = holidayTypes.filter((holidayTypes) =>
      selectedRowKeys.includes(holidayTypes.id!)
    );

    const itemsToDelete = selectedRecords.map((record) => ({
      id: String(record.id),
      name: record.holidayTypeName,
      code: record.holidayTypeCode,
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
        const deleteRes = await deleteMultiHolidayType(itemsToDelete);
        if (deleteRes.success && deleteRes.message?.data?.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: t('common.DeleteSuccessMutile', {
              count: itemsToDelete.length,
            }),
          });
          fetchHolidayTypes(pagination.current, pagination.pageSize);
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
      setErrorDeleteUrl('/api/holiday-type/deleteMuti');
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
  const COLUMNS: ColumnsType<HolidayType> = [
    {
      title: t('originData.holidayType.code'),
      dataIndex: 'holidayTypeCode',
      key: 'holidayTypeCode',
      align: 'left',
      width: '25%',
      ellipsis: true,
      ...holidayTypeCodeSearch.getColumnSearchProps(),
    },
    {
      title: t('originData.holidayType.name'),
      dataIndex: 'holidayTypeName',
      key: 'holidayTypeName',
      align: 'left',
      width: '25%',
      ellipsis: true,
      ...holidayTypeNameSearch.getColumnSearchProps(),
    },
    {
      title: t('originData.holidayType.description'),
      dataIndex: 'description',
      key: 'description',
      align: 'left',
      width: '25%',
      ellipsis: true,
      ...holidayTypeDesSearch.getColumnSearchProps(),
    },
    {
      title: t('common.isActive'),
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
      render: (_: any, record: HolidayType) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Tooltip title={t('common.Detail')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedHolidayType(record);
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
                title={t('app.ConfirmDelete', { name: record.holidayTypeName })}
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

  const rowSelection: TableRowSelection<HolidayType> = {
    selectedRowKeys,
    onChange: (
      newSelectedRowKeys: React.Key[],
      selectedRows: HolidayType[]
    ) => {
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
                    <title>{t('originData.holidayType.list')}</title>
                  </Helmet>

                  <PageHeader
                    title={t('originData.holidayType.list')}
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
                        const newParams = {
                          ...prev,
                          searchString: sanitized,
                        };
                        fetchHolidayTypes(1, pagination.pageSize, newParams);
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
                <Table<HolidayType>
                  columns={COLUMNS}
                  dataSource={holidayTypes}
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
      <DetailHolidayType
        open={isModalOpen}
        holidayType={selectedHolidayType}
        onClose={() => setIsModalOpen(false)}
      />
      <CreateOrUpdateHolidayType
        open={openAddModal}
        onClose={handleCloseAdd}
        onSubmit={handleAdd}
        holidayTypeData={editHolidayType}
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
          fetchHolidayTypes(pagination.current, pagination.pageSize);
          setSelectedRowKeys([]);
        }}
        title={t('errorModal.holidayType')}
      />
    </div>
  );
};

export default HolidayTypePage;
