import { useEffect, useState, useRef } from 'react';
import { Button, Col, Row, Table, Empty, notification } from 'antd';
import { Card, PageHeader } from '../../components';
import {
  FilterOutlined,
  HomeOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../context';
import { searchLogs, getListFunction, getListAction } from '../../api/logApi';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import FilterLogModal from './FilterLogModal';
import dayjs from 'dayjs';
import { useColumnSearch } from '../../components/Table/tableSearchUtil';

interface Log {
  id: number;
  templateKey: string;
  params: {
    actor: string;
    actionKey: string;
    object: string;
  };
  createdAt: string;
}

export const DefaultLogPage = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();

  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [searchParams, setSearchParams] = useState<{
    roleName?: string;
    roleCode?: string;
  }>({});
  const [openFilterModal, setOpenFilterModal] = useState(false);

  const [filters, setFilters] = useState<Record<string, any>>({});
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(350);

  const search = useColumnSearch<Log>({
    dataIndex: 'params',
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
      const res = await searchLogs({ page: page - 1, size, ...filters });
      if (requestId !== currentRequestId) return;
      if (res?.status === 200 && res?.object) {
        setLogs(res.object.content || []);
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
    fetchRoles(pagination.current, pagination.pageSize);
  }, []);

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

    fetchRoles(current, pageSize, activeFilters);
  };

  const handleFilter = () => {
    setOpenFilterModal(true);
  };

  const handleApplyFilter = (newFilters: Record<string, any>) => {
    setSearchParams({});
    setFilters(newFilters);
    fetchRoles(1, pagination.pageSize, newFilters);
  };

  /** Cột hiển thị */
  const COLUMNS: ColumnsType<Log> = [
    {
      title: t('common.NO'),
      key: 'index',
      render: (_: any, __: any, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: '5%',
      align: 'center',
    },
    {
      title: t('log.actionTitle'),
      dataIndex: 'actionKey',
      key: 'actionKey',
      width: '65%',
      render: (_: string, record: any) => {
        const actor = record.params.actor;
        const object =
          record.actionKey === 'log.login' || record.actionKey === 'log.logout'
            ? ''
            : ' ' + record.params.object;
        const actionText = t(record.params.action);
        const template = t('log.template');

        return template
          .replace('{{actor}}', ' ' + actor)
          .replace('{{action}}', ' ' + actionText)
          .replace('{{object}}', object);
      },
    },
    {
      title: t('log.time'),
      dataIndex: 'createAt',
      align: 'center',
      width: '30%',
      key: 'createAt',
      render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm:ss'),
    },
  ];

  return (
    <div
      style={{
        overflow: 'hidden',
      }}
    >
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
                    <title>{t('log.log')}</title>
                  </Helmet>

                  <PageHeader title={t('log.log')} breadcrumbs={undefined} />
                </Col>

                <Col>
                  <Button
                    icon={
                      <FilterOutlined
                        style={{ fontSize: 14, verticalAlign: 'middle' }}
                      />
                    }
                    onClick={handleFilter}
                  ></Button>
                </Col>
              </Row>
              <div
                ref={wrapperRef}
                style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
              >
                <Table<Log>
                  columns={COLUMNS}
                  dataSource={logs}
                  loading={loading}
                  tableLayout="fixed"
                  rowKey="roleId"
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
      <FilterLogModal
        open={openFilterModal}
        onClose={() => setOpenFilterModal(false)}
        onSearch={handleApplyFilter}
        defaultFilters={filters}
      />
    </div>
  );
};
