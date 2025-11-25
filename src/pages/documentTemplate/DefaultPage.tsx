import { useEffect, useMemo, useRef, useState } from 'react';
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
  Tag,
  message,
} from 'antd';
import { Card, PageHeader } from '../../components';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  FormOutlined,
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
  searchDocumentTemplates,
  lockDocumentTemplate,
  createDocumentTemplate,
  deleteDocumentTemplate,
  deleteMultiDocumentTemplate,
  updateDocumentTemplate,
  DocumentTemplate,
  checkDeleteMulti,
} from '../../api/documentTemplateApi';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import DetailDocumentTemplate from './DetailDocumentTemplate';
import { AddDocumentTemplateModal } from './AddDocumentTemplate';
import FilterDocumentTemplateModal from './FilterDocumentTemplateModal';
import { TableRowSelection } from 'antd/es/table/interface';
import { useColumnSearch } from '../../components/Table/tableSearchUtil';
import Search from 'antd/es/input/Search';
import CommonErrorDeleteModal from '../../components/ErrorListModal/ErrorModal';
import { MenuGuard } from '../../routes/MenuGuard';
import { useMenuPermission } from '../../hooks/useMenuPermission';
import { DocType, getAllDocType } from '../../api/docTypeApi';
import LowcodeEditor from '../lowcode/LowcodeEditor';
import { createStyles } from 'antd-style';

interface DocTypeTagsProps {
  docTypes: DocType[];
  maxVisible?: number;
}

const DocTypeTags: React.FC<DocTypeTagsProps> = ({
  docTypes,
  maxVisible = 2,
}) => {
  const { visibleTags, hiddenTags, hasMore } = useMemo(() => {
    const visible = docTypes.slice(0, maxVisible);
    const hidden = docTypes.slice(maxVisible);
    return {
      visibleTags: visible,
      hiddenTags: hidden,
      hasMore: hidden.length > 0,
    };
  }, [docTypes, maxVisible]);

  if (!docTypes || docTypes.length === 0) {
    return <Tag color="default">—</Tag>;
  }

  return (
    <div className="flex flex-wrap items-center" style={{ gap: '8px' }}>
      {visibleTags.map((dt) => (
        <Tag
          key={dt.id}
          color="blue"
          className="text-xs px-2 py-0.5"
          style={{ margin: 4 }}
        >
          {dt.docTypeName}
        </Tag>
      ))}

      {hasMore && (
        <Tooltip
          title={
            <div className="flex flex-col overflow-y-auto">
              {hiddenTags.map((dt) => (
                <Tag
                  key={dt.id}
                  color="blue"
                  style={{ margin: 4, display: 'inline-block' }}
                >
                  {dt.docTypeName}
                </Tag>
              ))}
            </div>
          }
          placement="top"
          overlayClassName="doc-type-tooltip"
        >
          <Tag
            color="blue"
            className="text-xs cursor-pointer hover:bg-gray-200"
            style={{ margin: 4 }}
          >
            +{hiddenTags.length}
          </Tag>
        </Tooltip>
      )}
    </div>
  );
};

const useTableStyle = createStyles(({ css, token }) => {
  return {
    customTable: css`
      .ant-table-container {
        display: flex;
        flex-direction: column;
      }

      /* Fix cột fixed right bị lệch / rơi xuống dưới */
      .ant-table-cell-fix-right {
        position: sticky !important;
        right: 1;
        background: white !important;
        z-index: 1;
      }

      .ant-table-cell-fix-right-first::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 30px;
        pointer-events: none;
      }

      /* Scrollbar đẹp */
      .ant-table-body {
        scrollbar-width: thin;
        scrollbar-color: #d9d9d9 transparent;

        &::-webkit-scrollbar {
          height: 8px;
        }
        &::-webkit-scrollbar-thumb {
          background: #d9d9d9;
          border-radius: 4px;
        }
      }
    `,
  };
});

export const DefaultDocumentTemplatePage = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();
  const perm = useMenuPermission('DOCUMENTTEMPLATE');
  const [docTypes, setDocTypes] = useState<DocType[]>([]);

  const [documentTemplates, setDocumentTemplates] = useState<
    DocumentTemplate[]
  >([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocumentTemplate, setSelectedDocumentTemplate] =
    useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<Map<string, number>>(
    new Map()
  );
  const [openAddModal, setOpenAddModal] = useState(false);
  const [editDocumentTemplate, setEditDocumentTemplate] =
    useState<DocumentTemplate | null>(null);
  const [searchParams, setSearchParams] = useState<{
    documentTemplateName?: string;
    documentTemplateCode?: string;
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
  const [selectedDocumentTemplateId, setSelectedDocumentTemplateId] = useState<
    string | null
  >(null);
  const [loadingDocType, setLoadingDocType] = useState<boolean>(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

  const { styles } = useTableStyle();

  const documentTemplateNameSearch = useColumnSearch<DocumentTemplate>({
    dataIndex: 'documentTemplateName',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchDocumentTemplates(1, pagination.pageSize, newParams);
    },
  });

  const documentTemplateCodeSearch = useColumnSearch<DocumentTemplate>({
    dataIndex: 'documentTemplateCode',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchDocumentTemplates(1, pagination.pageSize, newParams);
    },
  });

  let currentRequestId = 0;

  const fetchDocumentTemplates = async (
    page = 1,
    size = 10,
    filters: Record<string, any> = searchParams
  ) => {
    const requestId = ++currentRequestId;
    setLoading(true);
    try {
      const res = await searchDocumentTemplates({
        page: page - 1,
        size,
        ...filters,
      });
      if (requestId !== currentRequestId) return;
      if (res?.status === 200 && res?.object) {
        setDocumentTemplates(res.object.content || []);
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
    const fetchDocTypes = async () => {
      setLoadingDocType(true);
      try {
        const res = await getAllDocType();
        if (res.status === 200) {
          setDocTypes(res.object || []);
        }
      } catch (error) {
        console.error('Error fetching doc types:', error);
        notification.error({
          message: t('common.Error'),
          description: t('common.FailedToLoadData'),
        });
      } finally {
        setLoadingDocType(false);
      }
    };

    fetchDocTypes();
  }, []);

  useEffect(() => {
    fetchDocumentTemplates(pagination.current, pagination.pageSize);
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

    fetchDocumentTemplates(current, pageSize, activeFilters);
  };

  const handleDelete = async (record: DocumentTemplate) => {
    await perm.exec('delete', async () => {
      try {
        const res = await deleteDocumentTemplate(
          record.id as string,
          record.version
        );
        if (res.success) {
          if (res?.message?.data?.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: `${t('common.Delete')} ${record.fullName} ${t(
                'common.success'
              )}`,
            });
            fetchDocumentTemplates(pagination.current, pagination.pageSize);
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
          description: `${t('common.Delete')} ${record.fullName} ${t(
            'common.failed'
          )}`,
        });
      }
    });
  };

  const onRowClick = (record: DocumentTemplate) => {
    setSelectedDocumentTemplate(record);
    setIsModalOpen(true);
  };

  const handleStatusClick = async (record: DocumentTemplate) => {
    await perm.exec('edit', async () => {
      try {
        const res = await lockDocumentTemplate(
          record.id as string,
          record.version
        );
        if (res.success) {
          if (res?.message?.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: `${t('common.changeStatus')} ${
                record.documentTemplateName
              } ${t('common.success')}`,
            });
            fetchDocumentTemplates(pagination.current, pagination.pageSize);
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
              record.documentTemplateName
            } ${t('common.failed')}`,
          });
        }
      } catch {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.changeStatus')} ${
            record.documentTemplateName
          } ${t('common.failed')}`,
        });
      }
    });
  };

  const handleOpenAdd = () => {
    perm.exec('add', () => {
      setEditDocumentTemplate(null);
      setOpenAddModal(true);
    });
  };

  const handleEdit = (record: DocumentTemplate) => {
    perm.exec('edit', () => {
      setEditDocumentTemplate(record);
      setOpenAddModal(true);
    });
  };

  const handleClearAllFilters = () => {
    try {
      (documentTemplateNameSearch as any)?.resetSearch?.();
    } catch {}
    try {
      (documentTemplateCodeSearch as any)?.resetSearch?.();
    } catch {}

    setSearchParams({});
    setFilters({});
    setSearchInputValue('');
    setPagination((p) => ({ ...p, current: 1 }));
    fetchDocumentTemplates(1, pagination.pageSize, {});
  };
  const handleCloseAdd = () => setOpenAddModal(false);
  const handleAdd = async (record: DocumentTemplate): Promise<boolean> => {
    const success = await perm.exec(
      editDocumentTemplate ? 'edit' : 'add',
      async () => {
        try {
          const res = editDocumentTemplate
            ? await updateDocumentTemplate(record)
            : await createDocumentTemplate(record);

          if (res.status === 200) {
            notification.success({
              message: t('common.actionSuccess'),
              description: editDocumentTemplate
                ? t('common.UpdateSuccess')
                : t('common.AddSuccess'),
            });
            handleCloseAdd();
            fetchDocumentTemplates(pagination.current, pagination.pageSize);
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
      const selectedRecords = documentTemplates.filter((documentTemplates) =>
        selectedRowKeys.includes(documentTemplates.id!)
      );

      const itemsToDelete = selectedRecords.map((record) => ({
        id: String(record.id),
        name: record.documentTemplateName,
        code: record.documentTemplateCode,
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
        const deleteRes = await deleteMultiDocumentTemplate(itemsToDelete);
        if (deleteRes.success && deleteRes.message?.data?.status === 200) {
          notification.success({
            message: t('common.actionSuccess'),
            description: t('common.DeleteSuccessMutile', {
              count: itemsToDelete.length,
            }),
          });
          fetchDocumentTemplates();
          setSelectedRowKeys([]);
          setSelectedVersions(new Map());
        }
      } else {
        setErrorPayload(payload);
        setErrorDeleteUrl('/api/documentTemplates/deleteMuti');
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
    fetchDocumentTemplates(1, pagination.pageSize, newFilters);
  };

  const COLUMNS: ColumnsType<DocumentTemplate> = [
    {
      title: t('documentTemplate.DocumentTemplateCode'),
      dataIndex: 'documentTemplateCode',
      key: 'documentTemplateCode',
      align: 'left',
      ellipsis: true,
      width: '15%',
      ...documentTemplateCodeSearch.getColumnSearchProps(),
    },
    {
      title: t('documentTemplate.DocumentTemplateName'),
      dataIndex: 'documentTemplateName',
      key: 'documentTemplateName',
      align: 'left',
      ellipsis: true,
      width: '15%',
      ...documentTemplateNameSearch.getColumnSearchProps(),
    },
    {
      title: t('documentTemplate.DocumentTemplateDescription'),
      dataIndex: 'documentTemplateDescription',
      key: 'documentTemplateDescription',
      align: 'left',
      ellipsis: true,
      width: '20%',
    },
    {
      title: t('documentTemplate.DocumentType'),
      key: 'DocumentType',
      align: 'left',
      render: (_, record) => {
        if (loadingDocType) {
          return <Tag color="processing">...</Tag>;
        }
        const selectedDocTypes = docTypes.filter(
          (dt) => record.documentTypeIds?.includes(dt.id)
        );

        return <DocTypeTags docTypes={selectedDocTypes} />;
      },
    },
    {
      title: t('common.isActive'),
      dataIndex: 'isActive',
      key: 'isActive',
      fixed: 'right' as const,
      width: 100,
      align: 'left' as const,
      render: (_: any, record: DocumentTemplate) => {
        const isOpen = record.isActive;

        return (
          <Switch
            checked={!!isOpen}
            checkedChildren={t('common.Check')}
            unCheckedChildren={t('common.Uncheck')}
            disabled={!perm.edit}
            onChange={(_checked, e) => {
              e?.stopPropagation();
              void handleStatusClick(record);
            }}
          />
        );
      },
    },
    {
      title: t('documentTemplate.Design'),
      key: 'Design',
      width: 80,
      align: 'center',
      fixed: 'right' as const,
      render: (_: any, record: DocumentTemplate) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Tooltip title={t('common.Detail')} placement="bottom">
            <Button
              type="text"
              icon={<FormOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentRecordId(record.id);
                setEditorOpen(true);
              }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: t('common.action'),
      key: 'action',
      align: 'center',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: DocumentTemplate) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Tooltip title={t('common.Detail')} placement="bottom">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => onRowClick(record)}
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

  const rowSelection: TableRowSelection<DocumentTemplate> = {
    selectedRowKeys,
    onChange: (
      newSelectedRowKeys: React.Key[],
      selectedRows: DocumentTemplate[]
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
    <MenuGuard menuCode="DOCUMENTTEMPLATE">
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
                      <title>
                        {t('documentTemplate.documentTemplateManager')}
                      </title>
                    </Helmet>

                    <PageHeader
                      title={t('documentTemplate.documentTemplateManager')}
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
                        fetchDocumentTemplates(
                          1,
                          pagination.pageSize,
                          newParams
                        );
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
                  <Table<DocumentTemplate>
                    columns={COLUMNS}
                    dataSource={documentTemplates}
                    loading={loading || perm.loading}
                    className={styles.customTable}
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
                    scroll={{ y: tableHeight, x: 1200 }}
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

        <DetailDocumentTemplate
          open={isModalOpen}
          documentTemplateData={selectedDocumentTemplate}
          onClose={() => setIsModalOpen(false)}
        />

        <AddDocumentTemplateModal
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          onSubmit={handleAdd}
          documentTemplateData={editDocumentTemplate}
        />

        <FilterDocumentTemplateModal
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
            fetchDocumentTemplates();
            setSelectedRowKeys([]);
          }}
          title={t('errorModal.documentTemplate')}
        />
        <LowcodeEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          recordId={currentRecordId}
          onSuccess={(formId, formName) => {
            setEditorOpen(false);
            // Refresh danh sách
            //fetchRoles();
            message.success(`${formName} đã được tạo!`);
          }}
        />
      </div>
    </MenuGuard>
  );
};

export default DefaultDocumentTemplatePage;
