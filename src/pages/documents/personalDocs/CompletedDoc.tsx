import React, { useState } from 'react';
import { DocDocument } from '../../../api/docDocumentApi';
import { useTranslation } from 'react-i18next';
import Table, { ColumnsType } from 'antd/es/table';
import { Button, Empty, Tooltip } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useColumnSearch } from '../../../components/Table/tableSearchUtil';
import { TableRowSelection } from 'antd/es/table/interface';

interface CompletedDocProps {
  fetchDocDocuments: (
    page: number,
    pageSize: number,
    filters?: Record<string, any>
  ) => void;
  loading: boolean;
  total: number;
  DocDocuments: DocDocument[];
  onRowClick: (record: DocDocument) => void;
  handleOpenEdit: (record: DocDocument) => void;
}

const CompletedDoc: React.FC<CompletedDocProps> = ({
  fetchDocDocuments,
  loading,
  total,
  DocDocuments,
  onRowClick,
  handleOpenEdit,
}) => {
  const { t } = useTranslation();
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState<number>(350);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});

  const [selectedDoc, setSelectedDoc] = useState<DocDocument | null>(null);
  const [editDoc, setEditDoc] = useState<DocDocument | null>(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const titleSearch = useColumnSearch<DocDocument>({
    dataIndex: 'title',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchDocDocuments(1, pagination.pageSize, newParams);
    },
  });
  const docTypeSearch = useColumnSearch<DocDocument>({
    dataIndex: 'docType',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchDocDocuments(1, pagination.pageSize, newParams);
    },
  });

  const handleTableChange = (paginationInfo: any) => {
    const { current, pageSize } = paginationInfo;
    setPagination({ current, pageSize });

    const activeFilters =
      filters && Object.keys(filters).length > 0
        ? filters
        : searchParams && Object.keys(searchParams).length > 0
          ? searchParams
          : {};

    fetchDocDocuments(current, pageSize, activeFilters);
  };

  const rowSelection: TableRowSelection<DocDocument> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  /** Cột hiển thị */
  const COLUMNS: ColumnsType<DocDocument> = [
    {
      title: t('doc.DocDocument.title'),
      dataIndex: 'title',
      key: 'title',
      align: 'left',
      width: '45%',
      ...titleSearch.getColumnSearchProps(),
    },
    {
      title: t('doc.DocDocument.docType'),
      dataIndex: 'docType',
      key: 'docType',
      align: 'left',
      width: '15%',
      ...docTypeSearch.getColumnSearchProps(),
    },
    {
      title: t('common.test'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: '15%',
      align: 'left' as const,
    },
    {
      title: t('doc.DocDocument.approvalDate'),
      dataIndex: 'approvalDate',
      key: 'approvalDate',
      align: 'left',
      width: '15%',
      // ...partnerNameSearch.getColumnSearchProps(),
    },
    {
      title: t('common.action'),
      key: 'actions',
      align: 'center',
      width: '10%',
      render: (_: any, record: DocDocument) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Tooltip title={t('common.Detail')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={(e) => {
                onRowClick(record);
              }}
            />
          </Tooltip>
          <Tooltip title={t('common.Edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(record);
              }}
            />
          </Tooltip>
          {/* <Popconfirm
            placement="topRight"
            title={t('app.ConfirmDelete', { name: record.partnerName })}
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(record);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Tooltip title={t('common.Delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm> */}
        </div>
      ),
    },
  ];
  return (
    <div
      ref={wrapperRef}
      style={{ flex: 1, overflow: 'hidden', background: '#fff' }}
    >
      <Table<DocDocument>
        columns={COLUMNS}
        dataSource={DocDocuments}
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
  );
};

export default CompletedDoc;
