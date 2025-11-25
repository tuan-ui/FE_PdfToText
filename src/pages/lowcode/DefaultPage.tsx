import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Col,
  notification,
  Row,
  Table,
  Tag,
  TagProps,
  Tooltip,
  Empty,
} from 'antd';
import { Card, PageHeader } from '../../components';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  HomeOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { DND_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../context';
import { createElement } from 'react';
import {
  searchFormSchemas,
  lockFormSchema,
  deleteFormSchema,
  deleteMultiFormSchema,
} from '../../api/dndApi';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import { DetailDnD } from './DetailDnd';
import { TableRowSelection } from 'antd/es/table/interface';
import { useColumnSearch } from '../../components/Table/tableSearchUtil';
import FilterDndModal from './FilterDndModal';

interface FormSchema {
  id: number;
  formCode: string;
  formName: string;
  formContent: string;
  status: number;
  parentId?: number | null;
}

export const DefaultFormSchemaPage = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();

  const [formSchema, setFormSchema] = useState<FormSchema[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormSchema, setSelectedFormSchema] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchParams, setSearchParams] = useState<{
    formName?: string;
    formCode?: string;
  }>({});
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(350);

  const roleNameSearch = useColumnSearch<FormSchema>({
    dataIndex: 'formName',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchRoles(1, pagination.pageSize, newParams);
    },
  });

  const roleCodeSearch = useColumnSearch<FormSchema>({
    dataIndex: 'formCode',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchRoles(1, pagination.pageSize, newParams);
    },
  });
  let currentRequestId = 0;
  /** Hàm search */
  const fetchRoles = async (
    page = 1,
    size = 10,
    filters: Record<string, any> = searchParams
  ) => {
    const requestId = ++currentRequestId;
    setLoading(true);
    try {
      const res = await searchFormSchemas({ page: page - 1, size, ...filters });
      if (requestId !== currentRequestId) return;
      if (res?.status === 200 && res?.object) {
        setFormSchema(res.object.content || []);
        setTotal(res.object.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /** Load lần đầu */
  useEffect(() => {
    fetchRoles(pagination.current, pagination.pageSize);
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

    fetchRoles(current, pageSize, activeFilters);
  };
  /** Hàm xóa */
  const handleDelete = async (record: FormSchema) => {
    try {
      const res = await deleteFormSchema(record.id);
      if (res) {
        notification.success({
          message: t('common.actionSuccess'),
          description: `${t('common.Delete')} ${record.formName} ${t(
            'common.success'
          )}`,
        });
        fetchRoles(pagination.current, pagination.pageSize);
      } else {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.Delete')} ${record.formName} ${t(
            'common.failed'
          )}`,
        });
      }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: `${t('common.Delete')} ${record.formName} ${t(
          'common.failed'
        )}`,
      });
    }
  };

  /**Chọn row mở modal chi tiết*/
  const onRowClick = (record: FormSchema) => {
    setSelectedFormSchema(record);
    setIsModalOpen(true);
  };
  /** Hàm đổi trạng thái */
  const handleStatusClick = async (record: FormSchema) => {
    try {
      const res = await lockFormSchema(record.id);
      if (res) {
        notification.success({
          message: t('common.actionSuccess'),
          description: `${t('common.changeStatus')} ${record.formName} ${t(
            'common.success'
          )}`,
        });
        fetchRoles(pagination.current, pagination.pageSize);
      } else {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.changeStatus')} ${record.formName} ${t(
            'common.failed'
          )}`,
        });
      }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: `${t('common.changeStatus')} ${record.formName} ${t(
          'common.failed'
        )}`,
      });
    }
  };

  /** Xóa nhiều */
  const handleDeleteSelected = async () => {
    if (!selectedRowKeys.length) {
      return;
    }
    try {
      const ids = selectedRowKeys.map((key) => Number(key));
      const res = await deleteMultiFormSchema(ids);
      if (res) {
        notification.success({
          message: t('common.actionSuccess'),
          description: `${t('common.DeleteMuti')} ${t('common.success')}`,
        });
        setSelectedRowKeys([]);
        fetchRoles(pagination.current, pagination.pageSize);
      } else {
        notification.error({
          message: t('common.actionFailed'),
          description: `${t('common.DeleteMuti')} ${t('common.failed')}`,
        });
      }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: `${t('common.DeleteMuti')} ${t('common.failed')}`,
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

  const handleFilter = () => {
    setOpenFilterModal(true);
  };

  const handleApplyFilter = (newFilters: Record<string, any>) => {
    setSearchParams({});
    setFilters(newFilters);
    fetchRoles(1, pagination.pageSize, newFilters);
  };

  /** Cột hiển thị */
  const COLUMNS: ColumnsType<FormSchema> = [
    {
      title: t('common.NO'),
      key: 'index',
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: '5%',
      align: 'center',
    },
    {
      title: t('dnd.formName'),
      dataIndex: 'formName',
      key: 'formName',
      align: 'left',
      width: '30%',
      ...roleNameSearch.getColumnSearchProps(),
    },
    {
      title: t('dnd.formCode'),
      dataIndex: 'formCode',
      key: 'formCode',
      align: 'left',
      width: '30%',
      ...roleCodeSearch.getColumnSearchProps(),
    },
    {
      title: t('common.isActive'),
      dataIndex: 'isActive',
      width: '15%',
      key: 'isActive',
      align: 'left' as const,
      render: (_: any, record: any) => {
        const isOpen = _ === 1 || _;
        const label = isOpen ? t('common.open') : t('common.locked');
        const color: TagProps['color'] = isOpen
          ? 'green-inverse'
          : 'volcano-inverse';
        const icon = isOpen ? CheckCircleOutlined : ExclamationCircleOutlined;

        return (
          <Tag
            className="text-capitalize"
            color={color}
            icon={createElement(icon)}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              handleStatusClick(record);
            }}
          >
            {label}
          </Tag>
        );
      },
    },
    {
      title: t('common.Delete'),
      key: 'delete',
      align: 'center',
      width: '15%',
      render: (_: any, record: FormSchema) => (
        <Tooltip title={t('common.Delete')}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  const rowSelection: TableRowSelection<FormSchema> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div>
      <Helmet>
        <title>{t('dnd.ManagerDnD')}</title>
      </Helmet>

      <PageHeader
        title={t('dnd.ManagerDnD')}
        breadcrumbs={undefined}
      />

      <Row {...stylesContext?.rowProps}>
        <Col span={24}>
          <Card>
            <>
              <Row
                justify="space-between"
                align="middle"
                style={{ marginBottom: 16 }}
              >
                <Col></Col>
                <Col>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteSelected}
                    style={{ marginRight: 8 }}
                    disabled={!selectedRowKeys.length}
                  >
                    {t('common.Delete')}
                  </Button>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={handleFilter}
                  ></Button>
                </Col>
              </Row>
              <div style={{ flex: 1, overflow: 'hidden', background: '#fff' }}>
                <Table<FormSchema>
                  columns={COLUMNS}
                  dataSource={formSchema}
                  loading={loading}
                  tableLayout="fixed"
                  rowKey="roleId"
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
                  onRow={(record) => ({
                    onClick: () => onRowClick(record),
                    style: { cursor: 'pointer' },
                  })}
                />
              </div>
            </>
          </Card>
        </Col>
      </Row>
      <DetailDnD
        open={isModalOpen}
        dnd={selectedFormSchema}
        onClose={() => setIsModalOpen(false)}
      />
      <FilterDndModal
        open={openFilterModal}
        onClose={() => setOpenFilterModal(false)}
        onSearch={handleApplyFilter}
        defaultFilters={filters}
      />
    </div>
  );
};
