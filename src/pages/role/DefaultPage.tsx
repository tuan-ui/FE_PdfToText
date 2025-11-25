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
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  HomeOutlined,
  PieChartOutlined,
  PlusOutlined,
  SettingOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../context';
import {
  searchRoles,
  lockRole,
  createRole,
  deleteRole,
  deleteMultiRole,
  updateRole,
  Role,
  checkDeleteMulti,
} from '../../api/roleApi';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { DetailRole } from './DetailRole';
import AddRole from './AddRole';
import FilterRoleModal from './FilterRoleModal';
import { TableRowSelection } from 'antd/es/table/interface';
import { useColumnSearch } from '../../components/Table/tableSearchUtil';
import Search from 'antd/es/input/Search';
import RolePermissionModal from './RolePermissionModal';
import CommonErrorDeleteModal from '../../components/ErrorListModal/ErrorModal';
import { MenuGuard } from '../../routes/MenuGuard';
import { useMenuPermission } from '../../hooks/useMenuPermission';

export const DefaultRolePage = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();
  const perm = useMenuPermission('ROLE'); // CHỈ 1 DÒNG – LẤY add/edit/delete/assign

  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<Map<string, number>>(
    new Map()
  );
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [searchParams, setSearchParams] = useState<{
    roleName?: string;
    roleCode?: string;
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
  const [openPermissionModal, setOpenPermissionModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const roleNameSearch = useColumnSearch<Role>({
    dataIndex: 'roleName',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchRoles(1, pagination.pageSize, newParams);
    },
  });

  const roleCodeSearch = useColumnSearch<Role>({
    dataIndex: 'roleCode',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchRoles(1, pagination.pageSize, newParams);
    },
  });

  let currentRequestId = 0;

  const fetchRoles = async (
    page = 1,
    size = 10,
    filters: Record<string, any> = searchParams
  ) => {
    const requestId = ++currentRequestId;
    setLoading(true);
    try {
      const res = await searchRoles({ page: page - 1, size, ...filters });
      if (requestId !== currentRequestId) return;
      if (res?.status === 200 && res?.object) {
        setRoles(res.object.content || []);
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

  useEffect(() => {
    fetchRoles(pagination.current, pagination.pageSize);
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

    fetchRoles(current, pageSize, activeFilters);
  };

  const handleDelete = async (record: Role) => {
    await perm.exec('delete', async () => {
      try {
        const res = await deleteRole(record.id as string, record.version);
        if (res.success) {
          if (res?.message?.data?.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: `${t('common.Delete')} ${record.partnerName} ${t(
                'common.success'
              )}`,
            });
            fetchRoles(pagination.current, pagination.pageSize);
          } else {
            notification.error({
              message: t('common.actionFailed'),
              description: t(res?.message?.data?.message),
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

  const handlePermission = (record: Role) => {
    perm.exec('permission', () => {
      setSelectedRoleId(record.id as string);
      setOpenPermissionModal(true);
    });
  };

  const onRowClick = (record: Role) => {
    setSelectedRole(record);
    setIsModalOpen(true);
  };

  const handleStatusClick = async (record: Role) => {
    await perm.exec('edit', async () => {
      try {
        const res = await lockRole(record.id as string, record.version);
        if (res.success) {
          if (res?.message?.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: `${t('common.changeStatus')} ${record.roleName} ${t(
                'common.success'
              )}`,
            });
            fetchRoles(pagination.current, pagination.pageSize);
          } else {
            notification.error({
              message: t('common.actionFailed'),
              description: t(res?.message?.data?.message),
            });
          }
        } else {
          notification.error({
            message: t('common.actionFailed'),
            description: `${t('common.changeStatus')} ${record.roleName} ${t(
              'common.failed'
            )}`,
          });
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.changeStatus')} ${record.roleName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };

  const handleOpenAdd = () => {
    perm.exec('add', () => {
      setEditRole(null);
      setOpenAddModal(true);
    });
  };

  const handleEdit = (record: Role) => {
    perm.exec('edit', () => {
      setEditRole(record);
      setOpenAddModal(true);
    });
  };

  const handleClearAllFilters = () => {
    try {
      (roleNameSearch as any)?.resetSearch?.();
    } catch {}
    try {
      (roleCodeSearch as any)?.resetSearch?.();
    } catch {}

    setSearchParams({});
    setFilters({});
    setSearchInputValue('');
    setPagination((p) => ({ ...p, current: 1 }));
    fetchRoles(1, pagination.pageSize, {});
  };
  const handleCloseAdd = () => setOpenAddModal(false);
  const handleAdd = async (record: Role): Promise<boolean> => {
    const success = await perm.exec(editRole ? 'edit' : 'add', async () => {
      try {
        const res = editRole
          ? await updateRole(record)
          : await createRole(record);

        if (res.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: editRole
              ? t('common.UpdateSuccess')
              : t('common.AddSuccess'),
          });
          handleCloseAdd();
          fetchRoles(pagination.current, pagination.pageSize);
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
      const selectedRecords = roles.filter((roles) =>
        selectedRowKeys.includes(roles.id!)
      );

      const itemsToDelete = selectedRecords.map((record) => ({
        id: String(record.id),
        name: record.roleName,
        code: record.roleCode,
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
        const deleteRes = await deleteMultiRole(itemsToDelete);
        if (deleteRes.success && deleteRes.message?.data?.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: t('common.DeleteSuccessMutile', {
              count: itemsToDelete.length,
            }),
          });
          fetchRoles();
          setSelectedRowKeys([]);
          setSelectedVersions(new Map());
        }
      } else {
        setErrorPayload(payload);
        setErrorDeleteUrl('/api/roles/deleteMuti');
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
    fetchRoles(1, pagination.pageSize, newFilters);
  };

  const COLUMNS: ColumnsType<Role> = [
    {
      title: t('role.RoleName'),
      dataIndex: 'roleName',
      key: 'roleName',
      align: 'left',
      width: '40%',
      ellipsis: true,
      ...roleNameSearch.getColumnSearchProps(),
    },
    {
      title: t('role.RoleCode'),
      dataIndex: 'roleCode',
      key: 'roleCode',
      align: 'left',
      width: '40%',
      ellipsis: true,
      ...roleCodeSearch.getColumnSearchProps(),
    },
    {
      title: t('common.isActive'),
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      render: (_: any, record: Role) => (
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
      render: (_: any, record: Role) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Tooltip title={t('common.Detail')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onRowClick(record)}
            />
          </Tooltip>

          {perm.canAssign && (
            <Tooltip title={t('role.RolePermission')}>
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePermission(record);
                }}
              />
            </Tooltip>
          )}

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
                title={t('app.ConfirmDelete', { name: record.roleName })}
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

  const rowSelection: TableRowSelection<Role> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], selectedRows: Role[]) => {
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
    <MenuGuard menuCode="ROLE">
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
                      <title>{t('role.RoleManager')}</title>
                    </Helmet>

                    <PageHeader
                      title={t('role.RoleManager')}
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
                        fetchRoles(1, pagination.pageSize, newParams);
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
                  <Table<Role>
                    columns={COLUMNS}
                    dataSource={roles}
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
          role={selectedRole}
          onClose={() => setIsModalOpen(false)}
        />

        <AddRole
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSubmit={handleAdd}
          roleData={editRole}
        />

        <FilterRoleModal
          open={openFilterModal}
          onClose={() => setOpenFilterModal(false)}
          onSearch={handleApplyFilter}
          defaultFilters={filters}
        />

        <RolePermissionModal
          open={openPermissionModal}
          onClose={() => setOpenPermissionModal(false)}
          roleId={selectedRoleId}
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
            fetchRoles();
            setSelectedRowKeys([]);
          }}
          title={t('errorModal.role')}
        />
      </div>
    </MenuGuard>
  );
};

export default DefaultRolePage;
