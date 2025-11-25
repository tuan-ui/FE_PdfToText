import React from 'react';
import { Table, Empty, Col, Tooltip, Button } from 'antd';
import { useProcessDocTabs } from './useProcessDocTabs';
import { ProcessDoc } from '../DefaultPage';
import { useTranslation } from 'react-i18next';
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';

interface DefaultProcessedDocsPageProps {
  wrapperRef: React.RefObject<HTMLDivElement>;
  tableHeight: number;
}

export const DefaultProcessedDocsPage: React.FC<
  DefaultProcessedDocsPageProps
> = ({ wrapperRef, tableHeight }) => {
  const {
    processDocs,
    loading,
    pagination,
    total,
    handleTableChange,
    userCodeSearch,
    userNameSearch,
    handleOpenDetail,
    handleDownload,
    handleDelete,
  } = useProcessDocTabs();
  const { t } = useTranslation();

  const COLUMNS = [
    {
      title: t('processDoc.title'),
      dataIndex: 'title',
      width: '15%',
      ...userCodeSearch.getColumnSearchProps(),
    },
    {
      title: t('processDoc.documentType'),
      dataIndex: 'documentType',
      width: '18%',
      ...userNameSearch.getColumnSearchProps(),
    },
    {
      title: t('processDoc.sendBy'),
      dataIndex: 'sendBy',
      width: '18%',
    },
    {
      title: t('processDoc.sendDay'),
      dataIndex: 'sendDayStr',
      width: '18%',
    },
    {
      title: t('processDoc.processingDay'),
      dataIndex: 'processingDayStr',
      width: '18%',
    },
    { title: t('common.Status'), dataIndex: 'status', width: '18%' },
    {
      title: t('common.action'),
      key: 'action',
      width: '12%',
      align: 'center' as const,
      render: (_: any, record: ProcessDoc) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {/* Chi tiết */}
          <Tooltip title={t('common.Detail')} placement="top">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail(record);
              }}
            />
          </Tooltip>

          {/* Download */}
          <Tooltip title={t('common.Download')} placement="top">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(record);
              }}
            />
          </Tooltip>

          {/* Xóa */}
          <Tooltip title={t('common.Delete')} placement="top">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(record);
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Col span={24}>
      <div
        ref={wrapperRef}
        style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
      >
        <Table<ProcessDoc>
          columns={COLUMNS}
          dataSource={processDocs}
          loading={loading}
          rowKey="id"
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
            emptyText: <Empty description={t('common.DataNotFound')} />,
          }}
          onChange={handleTableChange}
        />
      </div>
    </Col>
  );
};
