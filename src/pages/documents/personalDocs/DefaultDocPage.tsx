import React, { useEffect, useRef, useState } from 'react';
import { useStylesContext } from '../../../context';
import { useTranslation } from 'react-i18next';
import {
  CreatePersonalDoc,
  DocDocument,
  searchPersonalDocs,
} from '../../../api/docDocumentApi';
import { useColumnSearch } from '../../../components/Table/tableSearchUtil';
import Table, { ColumnsType } from 'antd/es/table';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Radio,
  Row,
  Tabs,
  TabsProps,
  Tooltip,
  UploadFile,
  notification,
} from 'antd';
import { Helmet } from 'react-helmet-async';
import { PageHeader } from '../../../components';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  HomeOutlined,
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { DASHBOARD_ITEMS, DOCS_ITEMS } from '../../../constants';
import { Link } from 'react-router-dom';
import TabPane from 'antd/es/tabs/TabPane';
import DraftDoc from './DraftDoc';
import CompletedDoc from './CompletedDoc';
import AddPersonalDoc from './CreateOrUpdateDoc';
import FilterPersonalDoc from './FilterPersonalDoc';
import DetailPersonalDoc from './DetailPersonalDoc';
import { createOrUpdate } from '../../../api/docDocumentApi';

export const DefaultDocPage = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();

  const [personalDocs, setPesonalDocs] = useState<DocDocument[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('1');
  /** Open modal states */
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);

  const [selectedDoc, setSelectedDoc] = useState<DocDocument | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState<string>('');

  const [filters, setFilters] = useState<Record<string, any>>({});
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(350);

  let currentRequestId = 0;
  /** Hàm search */
  const fetchPersonalDocs = async (
    page = 1,
    size = 10,
    filters: Record<string, any> = searchParams
  ) => {
    const status =
      activeTabKey === '1'
        ? 'draft'
        : activeTabKey === '2'
          ? 'completed'
          : 'activityLog';
    filters = { ...filters, status };
    console.log('Fetching personal docs with filters:', filters);
    setLoading(true);
    const requestId = ++currentRequestId;
    try {
      const res = await searchPersonalDocs({
        page: page - 1,
        size,
        ...filters,
      });
      if (requestId !== currentRequestId) return;
      if (res?.status === 200 && res?.object) {
        setPesonalDocs(res.object.content || []);
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
    fetchPersonalDocs(pagination.current, pagination.pageSize);
  }, []);

  useEffect(() => {
    if (activeTabKey) {
      fetchPersonalDocs(pagination.current, pagination.pageSize);
    }
  }, [activeTabKey]);

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
    fetchPersonalDocs(1, pagination.pageSize, newFilters);
  };

  const handleClearAllFilters = () => {
    // try {
    //   (partnerNameSearch as any)?.resetSearch?.();
    // } catch (e) {}
    // try {
    //   (emailSearch as any)?.resetSearch?.();
    // } catch (e) {}
    // try {
    //   (phoneSearch as any)?.resetSearch?.();
    // } catch (e) {}
    // try {
    //   (addressearch as any)?.resetSearch?.();
    // } catch (e) {}

    setSearchParams({});
    setSearchInputValue('');
    // reset to first page
    setPagination((p) => ({ ...p, current: 1 }));
    fetchPersonalDocs(1, pagination.pageSize, {});
  };

  const handleOpenAdd = () => {
    setSelectedDoc(null);
    setOpenAddModal(true);
  };

  const handleCloseAdd = () => {
    setOpenAddModal(false);
  };

  /**Chọn row mở modal chi tiết*/
  const onRowClick = (record: DocDocument) => {
    setSelectedDoc(record);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: DocDocument) => {
    setSelectedDoc(record);
    setOpenAddModal(true);
  };

  /** Hàm thêm và chỉnh sửa */
  const handleAdd = async (record: DocDocument) => {
    try {
      const res = await createOrUpdate(record);
      if (res.status === 200) {
        notification.success({
          message: t('common.actionSuccess'),
          description: record?.id
            ? t('common.UpdateSuccess')
            : t('common.AddSuccess'),
        });
        // fetchData(pagination.current, pagination.pageSize);
        setSelectedDoc(res.object);
        fetchPersonalDocs(pagination.current, pagination.pageSize);
        return res.object;
      } else {
        notification.error({
          message: t('common.actionFailed'),
          description: t(res?.message),
        });
        return selectedDoc;
      }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: t('common.failed'),
      });
      return selectedDoc;
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowKeys.length) {
      return;
    }
    try {
      // const ids = selectedRowKeys.map((key) => String(key));
      // const res = await checkDeleteMultiPartner(ids);
      // if (res.success) {
      //   if (res?.message?.data?.status === 200) {
      //     if (res?.message?.data?.object === null) {
      //       notification.success({
      //         message: t('common.actionSuccess'),
      //         description: t('common.DeleteSuccessMutile', {
      //           count: ids.length,
      //         }),
      //       });
      //       fetchData(pagination.current, pagination.pageSize);
      //     } else {
      //       try {
      //         const payload = res?.message?.data?.object;
      //         setErrorPayload(payload);
      //         setErrorDeleteUrl('/api/partner/deleteMulti');
      //         setErrorDeleteIds(ids);
      //         setErrorModalOpen(true);
      //       } catch (e) {
      //         console.warn('Failed to parse error payload', e);
      //         notification.error({
      //           message: t('common.actionFailed'),
      //           description: t('common.failed'),
      //         });
      //       }
      //     }
      //   } else {
      //     notification.error({
      //       message: t('common.actionFailed'),
      //       description: t(res?.message?.data?.message),
      //     });
      //   }
      // } else {
      //   notification.error({
      //     message: t('common.actionFailed'),
      //     description: `${t('common.DeleteMuti')} ${t('common.success')}`,
      //   });
      // }
    } catch {
      notification.error({
        message: t('common.actionFailed'),
        description: `${t('common.DeleteMuti')} ${t('common.failed')}`,
      });
    }
  };

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
              <Row justify="space-between" align="middle">
                <Col>
                  <PageHeader
                    title={t('sidebar.personalDoc')}
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
                        const newParams = { ...prev, searchString: sanitized };
                        fetchPersonalDocs(1, pagination.pageSize, newParams);
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
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ marginRight: 8 }}
                    onClick={handleOpenAdd}
                  >
                    {t('common.Add')}
                  </Button>
                  {activeTabKey === '1' && (
                    <Button
                      type="primary"
                      style={{ marginRight: 8 }}
                      icon={<SendOutlined />}
                    >
                      {t('doc.personalDoc.send')}
                    </Button>
                  )}
                  {activeTabKey === '2' && (
                    <Button
                      type="default"
                      danger
                      style={{ marginRight: 8 }}
                      icon={<SearchOutlined />}
                    >
                      {t('doc.personalDoc.archive')}
                    </Button>
                  )}
                  {activeTabKey === '1' && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleDeleteSelected}
                      style={{ marginRight: 8 }}
                      disabled={!selectedRowKeys.length}
                    >
                      {t('common.Delete')}
                    </Button>
                  )}
                  <Button
                    icon={<FilterOutlined />}
                    onClick={handleFilter}
                  ></Button>
                </Col>
              </Row>
              <Radio.Group
                value={activeTabKey}
                onChange={(e) => setActiveTabKey(e.target.value)}
                optionType="button"
                size="middle"
                style={{ marginBottom: 16 }}
              >
                <Radio.Button value="1">
                  {t('doc.personalDoc.draft')}
                </Radio.Button>
                <Radio.Button value="2">
                  {t('doc.personalDoc.completed')}
                </Radio.Button>
                <Radio.Button value="3">
                  {t('doc.personalDoc.activityLog')}
                </Radio.Button>
              </Radio.Group>

              {/* Render nội dung tương ứng */}
              {activeTabKey === '1' && (
                <DraftDoc
                  fetchPersonalDocs={fetchPersonalDocs}
                  loading={loading}
                  total={total}
                  personalDocs={personalDocs}
                  onRowClick={onRowClick}
                  handleOpenEdit={handleOpenEdit}
                />
              )}

              {activeTabKey === '2' && (
                <CompletedDoc
                  fetchDocDocuments={fetchPersonalDocs}
                  loading={loading}
                  total={total}
                  DocDocuments={personalDocs}
                  onRowClick={onRowClick}
                  handleOpenEdit={handleOpenEdit}
                />
              )}

              {activeTabKey === '3' && (
                <div>{t('doc.personalDoc.activityLog')}</div>
              )}
            </>
          </Card>
        </Col>
      </Row>
      {/* Add and Edit Modal */}
      <AddPersonalDoc
        open={openAddModal}
        onClose={handleCloseAdd}
        onSubmit={handleAdd}
        personalDocEdit={selectedDoc || undefined}
      />
      <FilterPersonalDoc
        open={openFilterModal}
        onClose={() => setOpenFilterModal(false)}
        onSearch={(newFilters: Record<string, any>) => {
          setSearchParams({});
          setFilters(newFilters);
          fetchPersonalDocs(1, pagination.pageSize, newFilters);
        }}
        defaultFilters={filters}
      />
      <DetailPersonalDoc
        open={isModalOpen}
        personalDoc={selectedDoc}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
