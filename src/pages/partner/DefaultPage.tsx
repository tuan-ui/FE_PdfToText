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
  Popconfirm,
} from 'antd';
import { Card, PageHeader } from '../../components';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  HomeOutlined,
  PieChartOutlined,
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../context';
import {
  search,
  lockPartner,
  CreatePartner,
  deletePartner,
  EditPartnerApi,
  checkDeleteMultiPartner,
  deleteMultiPartner,
  Partner,
} from '../../api/partnerAPI';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { DetailRole } from './DetailPartner';
import CreateOrUpdatePartner from './CreateOrUpdatePartner';
import CommonErrorDeleteModal from '../../components/ErrorListModal/ErrorModal';
import FilterPartnerModal from './FilterPartnerModal';
import { TableRowSelection } from 'antd/es/table/interface';
import { useColumnSearch } from '../../components/Table/tableSearchUtil';
import Search from 'antd/es/input/Search';
import { MenuGuard } from '../../routes/MenuGuard';
import { useMenuPermission } from '../../hooks/useMenuPermission';

export const PartnerPage = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();
  const perm = useMenuPermission('PARTNER'); // LẤY add/edit/delete

  const [partners, setPartners] = useState<Partner[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<Map<string, number>>(
    new Map()
  );
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);
  const [searchParams, setSearchParams] = useState<{
    partnerName?: string;
    email?: string;
    phone?: string;
    address?: string;
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
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(350);

  const partnerNameSearch = useColumnSearch<Partner>({
    dataIndex: 'partnerName',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchPartners(1, pagination.pageSize, newParams);
    },
  });

  const emailSearch = useColumnSearch<Partner>({
    dataIndex: 'email',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchPartners(1, pagination.pageSize, newParams);
    },
  });

  const phoneSearch = useColumnSearch<Partner>({
    dataIndex: 'phone',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchPartners(1, pagination.pageSize, newParams);
    },
  });

  const addressSearch = useColumnSearch<Partner>({
    dataIndex: 'address',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchPartners(1, pagination.pageSize, newParams);
    },
  });

  let currentRequestId = 0;

  const fetchPartners = async (
    page = 1,
    size = 10,
    filters: Record<string, any> = searchParams
  ) => {
    const requestId = ++currentRequestId;
    setLoading(true);
    try {
      const result = await search({ page: page - 1, size, ...filters });
      if (requestId !== currentRequestId) return;
      if (result?.status === 200 && result?.data) {
        setPartners(result.data.content || []);
        setTotal(result.data.totalElements || 0);
      }
      if (result.data.totalElements === 0 && Object.keys(filters).length > 0) {
        notification.info({
          message: t('common.Info'),
          description: `${t('common.NoDataFilter')}`,
        });
      }
    } catch (err) {
      console.error(err);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (paginationInfo: any) => {
    const { current, pageSize } = paginationInfo;
    setPagination({ current, pageSize });

    const activeFilters =
      Object.keys(filters).length > 0
        ? filters
        : Object.keys(searchParams).length > 0
          ? searchParams
          : {};

    fetchPartners(current, pageSize, activeFilters);
  };

  const handleDelete = async (record: Partner) => {
    await perm.exec('delete', async () => {
      try {
        const res = await deletePartner(record.id as string, record.version);
        if (res.success) {
          if (res?.message?.data?.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: `${t('common.Delete')} ${record.partnerName} ${t(
                'common.success'
              )}`,
            });
            fetchPartners(pagination.current, pagination.pageSize);
          } else {
            notification.error({
              message: t('common.actionFailed'),
              description: t(res?.message?.data?.object),
            });
          }
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
    });
  };

  const onRowClick = (record: Partner) => {
    setSelectedPartner(record);
    setIsModalOpen(true);
  };

  const handleStatusClick = async (record: Partner) => {
    await perm.exec('edit', async () => {
      try {
        const res = await lockPartner(record.id as string, record.version);
        if (res.success) {
          if (res?.message?.data.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: `${t('common.changeStatus')} ${
                record.partnerName
              } ${t('common.success')}`,
            });
            fetchPartners(pagination.current, pagination.pageSize);
          } else {
            notification.error({
              message: t('common.actionFailed'),
              description: t(res?.message?.data?.data),
            });
          }
        } else {
          notification.error({
            message: t('common.actionFailed'),
            description: `${t('common.changeStatus')} ${record.partnerName} ${t(
              'common.failed'
            )}`,
          });
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.changeStatus')} ${record.partnerName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };

  const handleOpenAdd = () => {
    perm.exec('add', () => {
      setEditPartner(null);
      setOpenAddModal(true);
    });
  };

  const handleEdit = (record: Partner) => {
    perm.exec('edit', () => {
      setEditPartner(record);
      setOpenAddModal(true);
    });
  };

  const handleClearAllFilters = () => {
    try {
      (partnerNameSearch as any)?.resetSearch?.();
    } catch {}
    try {
      (emailSearch as any)?.resetSearch?.();
    } catch {}
    try {
      (phoneSearch as any)?.resetSearch?.();
    } catch {}
    try {
      (addressSearch as any)?.resetSearch?.();
    } catch {}

    setSearchParams({});
    setFilters({});
    setSearchInputValue('');
    setPagination((p) => ({ ...p, current: 1 }));
    fetchPartners(1, pagination.pageSize, {});
  };

  const handleAdd = async (record: Partner): Promise<boolean> => {
    const success = await perm.exec(editPartner ? 'edit' : 'add', async () => {
      try {
        const res = editPartner
          ? await EditPartnerApi(record)
          : await CreatePartner(record);

        if (res.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: editPartner
              ? t('common.UpdateSuccess')
              : t('common.AddSuccess'),
          });
          setOpenAddModal(false);
          fetchPartners(pagination.current, pagination.pageSize);
          return true;
        } else {
          notification.error({
            message: t('common.actionFailed'),
            description: t(res?.data),
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

  const handleDeleteSelected = async () => {
    if (!selectedRowKeys.length) return;

    await perm.exec('delete', async () => {
      const selectedRecords = partners.filter((partners) =>
        selectedRowKeys.includes(partners.id!)
      );

      const itemsToDelete = selectedRecords.map((record) => ({
        id: String(record.id),
        name: record.partnerName,
        code: record.partnerCode,
        version: selectedVersions.get(String(record.id)) ?? 0,
      }));

      const checkRes = await checkDeleteMultiPartner(itemsToDelete);
      if (!checkRes.success || !checkRes.message?.data) {
        notification.error({
          message: t('common.actionFailed'),
          description: t('common.failed'),
        });
        return;
      }

      const { object: payload, hasError } = checkRes.message.data;

      if (!hasError && payload === null) {
        const deleteRes = await deleteMultiPartner(itemsToDelete);
        if (deleteRes.success && deleteRes.message?.data?.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: t('common.DeleteSuccessMutile', {
              count: itemsToDelete.length,
            }),
          });
          fetchPartners();
          setSelectedRowKeys([]);
          setSelectedVersions(new Map());
        }
      } else {
        setErrorPayload(payload);
        setErrorDeleteUrl('/api/partner/deleteMulti');
        setErrorDeleteIds(itemsToDelete.map((i) => i.id));
        setErrorDeleteItems(itemsToDelete);
        setErrorModalOpen(true);
      }
    });
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

  const handleFilter = () => setOpenFilterModal(true);
  const handleApplyFilter = (newFilters: Record<string, any>) => {
    setSearchParams({});
    setFilters(newFilters);
    fetchPartners(1, pagination.pageSize, newFilters);
  };

  const COLUMNS: ColumnsType<Partner> = [
    {
      title: t('partner.partnerName'),
      dataIndex: 'partnerName',
      key: 'partnerName',
      align: 'left',
      width: '20%',
      ellipsis: true,
      ...partnerNameSearch.getColumnSearchProps(),
    },
    {
      title: t('partner.Email'),
      dataIndex: 'email',
      key: 'email',
      align: 'left',
      width: '20%',
      ellipsis: true,
      ...emailSearch.getColumnSearchProps(),
    },
    {
      title: t('partner.phone'),
      dataIndex: 'phone',
      key: 'phone',
      align: 'left',
      width: '20%',
      ellipsis: true,
      ...phoneSearch.getColumnSearchProps(),
    },
    {
      title: t('partner.address'),
      dataIndex: 'address',
      key: 'address',
      align: 'left',
      width: '20%',
      ellipsis: true,
      ...addressSearch.getColumnSearchProps(),
    },
    {
      title: t('common.isActive'),
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      render: (_: any, record: Partner) => (
        <Switch
          checked={!!record.isActive}
          checkedChildren={t('common.Check')}
          unCheckedChildren={t('common.Uncheck')}
          disabled={!perm.canEdit}
          onChange={(_checked, e) => {
            e?.stopPropagation();
            void handleStatusClick(record);
          }}
        />
      ),
    },
    {
      title: t('common.action'),
      key: 'action',
      align: 'center',
      render: (_: any, record: Partner) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Tooltip title={t('common.Detail')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onRowClick(record)}
            />
          </Tooltip>

          {perm.canEdit && (
            <Tooltip title={t('common.Edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}

          {perm.canDelete && (
            <Tooltip title={t('common.Delete')}>
              <Popconfirm
                placement="topRight"
                title={t('app.ConfirmDelete', { name: record.partnerName })}
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

  const rowSelection: TableRowSelection<Partner> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], selectedRows: Partner[]) => {
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
    <MenuGuard menuCode="PARTNER">
      <div style={{ overflow: 'hidden' }}>
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
                      <title>{t('sidebar.partner')}</title>
                    </Helmet>

                    <PageHeader
                      title={t('partner.title')}
                      breadcrumbs={undefined}
                    />
                  </Col>
                  <Col>
                    <Search
                      placeholder={t('common.Search')}
                      allowClear
                      value={searchInputValue}
                      onChange={(e) => setSearchInputValue(e.target.value)}
                      onSearch={(value) => {
                        const newParams = {
                          ...searchParams,
                          searchString: value,
                        };
                        setSearchParams(newParams);
                        fetchPartners(1, pagination.pageSize, newParams);
                      }}
                      style={{
                        width: '400px',
                        marginLeft: '.5rem',
                        marginRight: 8,
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
                    />
                    {perm.canAdd && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        style={{ marginRight: 8 }}
                        onClick={handleOpenAdd}
                      >
                        {t('common.Add')}
                      </Button>
                    )}
                    {perm.canDelete && (
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
                    <Button
                      icon={
                        <FilterOutlined
                          style={{ fontSize: 14, verticalAlign: 'middle' }}
                        />
                      }
                      onClick={handleFilter}
                    />
                  </Col>
                </Row>

                <div
                  ref={wrapperRef}
                  style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
                >
                  <Table<Partner>
                    columns={COLUMNS}
                    dataSource={partners}
                    loading={loading || perm.loading}
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
                    onRow={() => ({ style: { cursor: 'pointer' } })}
                  />
                </div>
              </>
            </Card>
          </Col>
        </Row>

        <DetailRole
          open={isModalOpen}
          role={selectedPartner}
          onClose={() => setIsModalOpen(false)}
        />

        <CreateOrUpdatePartner
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSubmit={handleAdd}
          roleData={editPartner}
        />

        <FilterPartnerModal
          open={openFilterModal}
          onClose={() => setOpenFilterModal(false)}
          onSearch={handleApplyFilter}
          defaultFilters={filters}
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
            fetchPartners();
            setSelectedRowKeys([]);
          }}
          title={t('errorModal.partner')}
        />
      </div>
    </MenuGuard>
  );
};

export default PartnerPage;
