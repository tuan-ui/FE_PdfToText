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
  searchUserGroups,
  updateStatusUserGroup,
  saveUserGroup,
  deleteUserGroup,
  deleteMultipleUserGroups,
  checkDeleteMultiple,
  UserGroup,
  CreateUserGroup,
} from '../../api/userGroupApi';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import DetailUserGroup from './DetailUserGroup';
import AddUserGroup from './AddUserGroup';
import FilterUserGroupModal from './FilterUserGroupModal';
import CommonErrorDeleteModal from '../../components/ErrorListModal/ErrorModal';
import { TableRowSelection } from 'antd/es/table/interface';
import { useColumnSearch } from '../../components/Table/tableSearchUtil';
import Search from 'antd/es/input/Search';
import { MenuGuard } from '../../routes/MenuGuard';
import { useMenuPermission } from '../../hooks/useMenuPermission';

export const DefaultUserGroupPage = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();
  const perm = useMenuPermission('USERGROUP'); // LẤY add/edit/delete

  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserGroup, setSelectedUserGroup] = useState<UserGroup | null>(
    null
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<Map<string, number>>(
    new Map()
  );
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editUserGroup, setEditUserGroup] = useState<UserGroup | null>(null);
  const [searchParams, setSearchParams] = useState<{
    groupName?: string;
    groupCode?: string;
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

  const groupNameSearch = useColumnSearch<UserGroup>({
    dataIndex: 'groupName',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchUserGroups(1, pagination.pageSize, newParams);
    },
  });

  const groupCodeSearch = useColumnSearch<UserGroup>({
    dataIndex: 'groupCode',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchUserGroups(1, pagination.pageSize, newParams);
    },
  });

  let currentRequestId = 0;

  const fetchUserGroups = async (
    page = 1,
    size = 10,
    filters: Record<string, any> = searchParams
  ) => {
    const requestId = ++currentRequestId;
    setLoading(true);
    try {
      const res = await searchUserGroups({ page: page - 1, size, ...filters });
      if (requestId !== currentRequestId) return;
      if (res?.status === 200 && res?.object) {
        setUserGroups(res.object.datas || []);
        setTotal(res.object.total || 0);
      } else {
        setUserGroups([]);
        setTotal(0);
      }
    } catch (err) {
      console.error(err);
      setUserGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserGroups(pagination.current, pagination.pageSize);
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

    fetchUserGroups(current, pageSize, activeFilters);
  };

  const handleDelete = async (record: UserGroup) => {
    await perm.exec('delete', async () => {
      try {
        const res = await deleteUserGroup(record.id as string, record.version);
        if (res.success) {
          if (res?.message?.data?.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: `${t('common.Delete')} ${record.fullName} ${t(
                'common.success'
              )}`,
            });
            fetchUserGroups(pagination.current, pagination.pageSize);
          } else {
            notification.error({
              message: t('common.actionFailed'),
              description: t(res?.message?.data?.message),
            });
          }
        } else {
          notification.error({
            message: t('common.actionFailed'),
            description: `${t('common.Delete')} ${record.fullName} ${t(
              'common.failed'
            )}`,
          });
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.Delete')} ${record.groupName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };

  const onRowClick = (record: UserGroup) => {
    setSelectedUserGroup(record);
    setIsModalOpen(true);
  };

  const handleStatusClick = async (record: UserGroup) => {
    await perm.exec('edit', async () => {
      try {
        const res = await updateStatusUserGroup(
          record.id as string,
          record.version
        );
        if (res.success) {
          if (res?.message?.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: `${t('common.changeStatus')} ${record.groupName} ${t(
                'common.success'
              )}`,
            });
            fetchUserGroups(pagination.current, pagination.pageSize);
          } else {
            notification.error({
              message: t('common.actionFailed'),
              description: t(res?.message?.data?.message),
            });
          }
        } else {
          notification.error({
            message: t('common.actionFailed'),
            description: `${t('common.changeStatus')} ${record.groupName} ${t(
              'common.failed'
            )}`,
          });
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.changeStatus')} ${record.groupName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };

  const handleOpenAdd = () => {
    perm.exec('add', () => {
      setEditUserGroup(null);
      setOpenAddModal(true);
    });
  };

  const handleEdit = (record: UserGroup) => {
    perm.exec('edit', () => {
      setEditUserGroup(record);
      setOpenAddModal(true);
    });
  };

  const handleClearAllFilters = () => {
    try {
      (groupNameSearch as any)?.resetSearch?.();
    } catch {}
    try {
      (groupCodeSearch as any)?.resetSearch?.();
    } catch {}

    setSearchParams({});
    setFilters({});
    setSearchInputValue('');
    setPagination((p) => ({ ...p, current: 1 }));
    fetchUserGroups(1, pagination.pageSize, {});
  };

  const handleAdd = async (values: CreateUserGroup): Promise<boolean> => {
    const success = await perm.exec(
      editUserGroup ? 'edit' : 'add',
      async () => {
        try {
          const res = await saveUserGroup(values);
          if (res.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: editUserGroup
                ? t('common.UpdateSuccess')
                : t('common.AddSuccess'),
            });
            setOpenAddModal(false);
            fetchUserGroups(pagination.current, pagination.pageSize);
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

  const handleDeleteSelected = async () => {
    if (!selectedRowKeys.length) return;

    await perm.exec('delete', async () => {
      const selectedRecords = userGroups.filter((userGroups) =>
        selectedRowKeys.includes(userGroups.id!)
      );

      const itemsToDelete = selectedRecords.map((record) => ({
        id: String(record.id),
        name: record.groupName,
        code: record.groupCode,
        version: selectedVersions.get(String(record.id)) ?? 0,
      }));

      const checkRes = await checkDeleteMultiple(itemsToDelete);
      if (!checkRes.success || !checkRes.message?.data) {
        notification.error({
          message: t('common.actionFailed'),
          description: t('common.failed'),
        });
        return;
      }

      const { object: payload, hasError } = checkRes.message.data;

      if (!hasError && payload === null) {
        const deleteRes = await deleteMultipleUserGroups(itemsToDelete);
        if (deleteRes.success && deleteRes.message?.data?.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: t('common.DeleteSuccessMutile', {
              count: itemsToDelete.length,
            }),
          });
          fetchUserGroups();
          setSelectedRowKeys([]);
          setSelectedVersions(new Map());
        }
      } else {
        setErrorPayload(payload);
        setErrorDeleteUrl('/api/userGroups/deleteMultiple');
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
    fetchUserGroups(1, pagination.pageSize, newFilters);
  };

  const COLUMNS: ColumnsType<UserGroup> = [
    {
      title: t('userGroup.userGroupCode'),
      dataIndex: 'groupCode',
      key: 'groupCode',
      align: 'left',
      width: '40%',
      ellipsis: true,
      ...groupCodeSearch.getColumnSearchProps(),
    },
    {
      title: t('userGroup.userGroupName'),
      dataIndex: 'groupName',
      key: 'groupName',
      align: 'left',
      width: '40%',
      ellipsis: true,
      ...groupNameSearch.getColumnSearchProps(),
    },
    {
      title: t('common.isActive'),
      dataIndex: 'isActive',
      key: 'isActive',
      align: 'center',
      render: (_: any, record: UserGroup) => (
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
      render: (_: any, record: UserGroup) => (
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
                title={t('app.ConfirmDelete', { name: record.groupName })}
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

  const rowSelection: TableRowSelection<UserGroup> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], selectedRows: UserGroup[]) => {
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
    <MenuGuard menuCode="USERGROUP">
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
                      <title>{t('userGroup.userGroupManager')}</title>
                    </Helmet>

                    <PageHeader
                      title={t('userGroup.userGroupManager')}
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
                        fetchUserGroups(1, pagination.pageSize, newParams);
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
                          onClick={handleDeleteSelected}
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
                  <Table<UserGroup>
                    columns={COLUMNS}
                    dataSource={userGroups}
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

        <DetailUserGroup
          open={isModalOpen}
          userGroup={selectedUserGroup}
          onClose={() => setIsModalOpen(false)}
        />

        <AddUserGroup
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSubmit={handleAdd}
          userGroup={editUserGroup}
        />

        <FilterUserGroupModal
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
            fetchUserGroups();
            setSelectedRowKeys([]);
          }}
          title={t('errorModal.userGroup')}
        />
      </div>
    </MenuGuard>
  );
};

export default DefaultUserGroupPage;
