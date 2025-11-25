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
import { Card, PageHeader } from '../../../components';
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
import { useStylesContext } from '../../../context';
import {
  searchDomains,
  lockDomain,
  createDomain,
  deleteDomain,
  deleteMultiDomain,
  updateDomain,
  Domain,
  checkDeleteMulti,
} from '../../../api/domainApi';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { DetailDomain } from './DetailDomain';
import AddDomain from './AddDomain';
import { TableRowSelection } from 'antd/es/table/interface';
import { useColumnSearch } from '../../../components/Table/tableSearchUtil';
import Search from 'antd/es/input/Search';
import CommonErrorDeleteModal from '../../../components/ErrorListModal/ErrorModal';
import { MenuGuard } from '../../../routes/MenuGuard';
import { useMenuPermission } from '../../../hooks/useMenuPermission';
import { ChildMenuGuard } from '../../../routes/ChildMenuGuard';

export const DomainPage = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();
  const perm = useMenuPermission('DOMAIN'); // LẤY add/edit/delete

  const [domains, setDomains] = useState<Domain[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<Map<string, number>>(
    new Map()
  );
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editDomain, setEditDomain] = useState<Domain | null>(null);
  const [searchParams, setSearchParams] = useState<{
    domainName?: string;
    domainCode?: string;
    domainDescription?: string;
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
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(350);

  const domainCodeSearch = useColumnSearch<Domain>({
    dataIndex: 'domainCode',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchDomains(1, pagination.pageSize, newParams);
    },
  });

  const domainNameSearch = useColumnSearch<Domain>({
    dataIndex: 'domainName',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchDomains(1, pagination.pageSize, newParams);
    },
  });

  const domainDesSearch = useColumnSearch<Domain>({
    dataIndex: 'domainDescription',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchDomains(1, pagination.pageSize, newParams);
    },
  });

  let currentRequestId = 0;

  const fetchDomains = async (
    page = 1,
    size = 10,
    filters: Record<string, any> = searchParams
  ) => {
    const requestId = ++currentRequestId;
    setLoading(true);
    try {
      const res = await searchDomains({ page: page - 1, size, ...filters });
      if (requestId !== currentRequestId) return;
      if (res?.status === 200 && res?.object) {
        setDomains(res.object.content || []);
        setTotal(res.object.totalElements || 0);
      } else {
        setDomains([]);
        setTotal(0);
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

  useEffect(() => {
    fetchDomains(pagination.current, pagination.pageSize);
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

    fetchDomains(current, pageSize, activeFilters);
  };

  const handleDelete = async (record: Domain) => {
    await perm.exec('delete', async () => {
      try {
        const res = await deleteDomain(record.id as string, record.version);
        if (res.success && res?.message?.data?.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: `${t('common.Delete')} ${record.domainName} ${t(
              'common.success'
            )}`,
          });
          fetchDomains(pagination.current, pagination.pageSize);
        } else {
          notification.error({
            message: t('common.actionFailed'),
            description: t(res?.message?.data?.message),
          });
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.Delete')} ${record.domainName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };

  const onRowClick = (record: Domain) => {
    setSelectedDomain(record);
    setIsModalOpen(true);
  };

  const handleStatusClick = async (record: Domain) => {
    await perm.exec('edit', async () => {
      try {
        const res = await lockDomain(record.id as string, record.version);
        if (res.success && res?.message?.data?.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: `${t('common.changeStatus')} ${record.domainName} ${t(
              'common.success'
            )}`,
          });
          fetchDomains(pagination.current, pagination.pageSize);
        } else {
          notification.error({
            message: t('common.actionFailed'),
            description: t(res?.message?.data?.message),
          });
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.changeStatus')} ${record.domainName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };

  const handleOpenAdd = () => {
    perm.exec('add', () => {
      setEditDomain(null);
      setOpenAddModal(true);
    });
  };

  const handleEdit = (record: Domain) => {
    perm.exec('edit', () => {
      setEditDomain(record);
      setOpenAddModal(true);
    });
  };

  const handleClearAllFilters = () => {
    try {
      (domainCodeSearch as any)?.resetSearch?.();
    } catch {}
    try {
      (domainNameSearch as any)?.resetSearch?.();
    } catch {}
    try {
      (domainDesSearch as any)?.resetSearch?.();
    } catch {}

    setSearchParams({});
    setFilters({});
    setSearchInputValue('');
    setPagination((p) => ({ ...p, current: 1 }));
    fetchDomains(1, pagination.pageSize, {});
  };

  const handleAdd = async (values: any): Promise<boolean> => {
    const success = await perm.exec(editDomain ? 'edit' : 'add', async () => {
      try {
        const res = editDomain
          ? await updateDomain(values)
          : await createDomain(values);

        if (res.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: editDomain
              ? t('common.UpdateSuccess')
              : t('common.AddSuccess'),
          });
          setOpenAddModal(false);
          fetchDomains(pagination.current, pagination.pageSize);
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

  const handleDeleteSelected = async () => {
    if (!selectedRowKeys.length) return;

    await perm.exec('delete', async () => {
      const selectedRecords = domains.filter((domain) =>
        selectedRowKeys.includes(domain.id!)
      );

      const itemsToDelete = selectedRecords.map((record) => ({
        id: String(record.id),
        name: record.domainName,
        code: record.domainCode,
        version: selectedVersions.get(String(record.id)) ?? 0,
      }));

      const checkRes = await checkDeleteMulti(itemsToDelete);
      if (!checkRes.success || !checkRes.message?.data) {
        notification.error({
          message: t('common.actionFailed'),
          description: t('common.failed'),
        });
        return;
      }

      const { object: payload, hasError } = checkRes.message.data;

      if (!hasError && payload === null) {
        const deleteRes = await deleteMultiDomain(itemsToDelete);
        if (deleteRes.success && deleteRes.message?.data?.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: t('common.DeleteSuccessMutile', {
              count: itemsToDelete.length,
            }),
          });
          fetchDomains();
          setSelectedRowKeys([]);
          setSelectedVersions(new Map());
        }
      } else {
        setErrorPayload(payload);
        setErrorDeleteUrl('/api/domains/deleteMuti');
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

  const handleFilter = () => {
    // Nếu bạn có FilterModal riêng thì mở ở đây
    notification.info({ message: 'Filter sẽ được thêm sau' });
  };

  const COLUMNS: ColumnsType<Domain> = [
    {
      title: t('originData.domain.DomainCode'),
      dataIndex: 'domainCode',
      key: 'domainCode',
      align: 'left',
      width: '25%',
      ellipsis: true,
      ...domainCodeSearch.getColumnSearchProps(),
    },
    {
      title: t('originData.domain.DomainName'),
      dataIndex: 'domainName',
      key: 'domainName',
      align: 'left',
      width: '25%',
      ellipsis: true,
      ...domainNameSearch.getColumnSearchProps(),
    },
    {
      title: t('originData.domain.DomainDescription'),
      dataIndex: 'domainDescription',
      key: 'domainDescription',
      align: 'left',
      width: '25%',
      ellipsis: true,
      ...domainDesSearch.getColumnSearchProps(),
    },
    {
      title: t('common.isActive'),
      dataIndex: 'isActive',
      fixed: 'right',
      key: 'isActive',
      align: 'center',
      render: (_: any, record: Domain) => (
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
      fixed: 'right',
      render: (_: any, record: Domain) => (
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
                title={t('app.ConfirmDelete', { name: record.domainName })}
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

  const rowSelection: TableRowSelection<Domain> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], selectedRows: Domain[]) => {
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
    <ChildMenuGuard menuCode="DOMAIN">
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
                      <title>{t('originData.domain.DomainManager')}</title>
                    </Helmet>

                    <PageHeader
                      title={t('originData.domain.DomainManager')}
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
                        fetchDomains(1, pagination.pageSize, newParams);
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
                  <Table<Domain>
                    columns={COLUMNS}
                    dataSource={domains}
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

        <DetailDomain
          open={isModalOpen}
          domain={selectedDomain}
          onClose={() => setIsModalOpen(false)}
        />

        <AddDomain
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSubmit={handleAdd}
          domainData={editDomain}
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
            fetchDomains();
            setSelectedRowKeys([]);
          }}
          title={t('errorModal.domain')}
        />
      </div>
    </ChildMenuGuard>
  );
};

export default DomainPage;
