import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColumnSearch } from '../../../../components/Table/tableSearchUtil';
import { ProcessDoc } from '../DefaultPage';

export const useProcessDocTabs = () => {
  const [activeKey, setActiveKey] = useState<string>('1');
  const [processDocs, setProcessDocs] = useState<ProcessDoc[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [openFilterModal, setOpenFilterModal] = useState(false);

  const userNameSearch = useColumnSearch<ProcessDoc>({
    dataIndex: 'fullName',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchUsers(1, pagination.pageSize, newParams);
    },
  });

  const userCodeSearch = useColumnSearch<ProcessDoc>({
    dataIndex: 'userCode',
    onSearchServer: (field, value) => {
      const newParams = { ...searchParams, [field]: value };
      setSearchParams(newParams);
      fetchUsers(1, pagination.pageSize, newParams);
    },
  });

  let currentRequestId = 0;

  const fetchUsers = async (
    page = 1,
    size = 10,
    filters: Record<string, any> = searchParams
  ) => {
    const requestId = ++currentRequestId;
    setLoading(true);
    try {
      // const res = await searchUsers({ page: page - 1, size, ...filters });
      // if (requestId !== currentRequestId) return;
      // if (res?.status === 200 && res?.object) {
      //   setProcessDocs(res.object.content || []);
      //   setTotal(res.object.totalElements || 0);
      // }
      // Mock data
      const mockData: ProcessDoc[] = Array.from({ length: size }, (_, i) => ({
        id: `${(page - 1) * size + i + 1}`,
        title: `Văn bản ${i + 1}`,
        sendBy: `Người gửi ${i + 1}`,
        sendDayStr: '2025-04-01',
        rereceiveBy: 'Người nhận',
        receiveDayStr: '2025-04-02',
        processingBy: 'Xử lý',
        processingDayStr: '2025-04-03',
        documentType: 'Công văn',
        status: 'Đang xử lý',
        role: 'Admin',
      }));
      //setTimeout(() => {
      if (requestId === currentRequestId) {
        setProcessDocs(mockData);
        setTotal(50);
        setLoading(false);
      }
      //}, 300);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, []);

  const handleTableChange = (paginationInfo: any) => {
    const { current, pageSize } = paginationInfo;
    setPagination({ current, pageSize });
    const activeFilters =
      Object.keys(filters).length > 0 ? filters : searchParams;
    fetchUsers(current, pageSize, activeFilters);
  };

  const handleClearAllFilters = () => {
    try {
      (userCodeSearch as any).resetSearch?.();
    } catch {}
    try {
      (userNameSearch as any).resetSearch?.();
    } catch {}
    setSearchParams({});
    setFilters({});
    setSearchInputValue('');
    setPagination((p) => ({ ...p, current: 1 }));
    fetchUsers(1, pagination.pageSize, {});
  };

  const handleFilter = () => setOpenFilterModal(true);
  const handleApplyFilter = (newFilters: Record<string, any>) => {
    setSearchParams({});
    setFilters(newFilters);
    fetchUsers(1, pagination.pageSize, newFilters);
    setOpenFilterModal(false);
  };

  const handleOpenDetail = (processDoc: ProcessDoc) => {
    console.log('Delete:', processDoc.id);
  };

  const handleDownload = (processDoc: ProcessDoc) => {
    console.log('Delete:', processDoc.id);
  };

  const handleDelete = (processDoc: ProcessDoc) => {
    console.log('Delete:', processDoc.id);
  };

  return {
    // State
    activeKey,
    setActiveKey,
    processDocs,
    loading,
    pagination,
    total,
    searchInputValue,
    setSearchInputValue,
    openFilterModal,
    setOpenFilterModal,

    // Logic
    fetchUsers,
    handleTableChange,
    handleClearAllFilters,
    handleFilter,
    handleApplyFilter,
    searchParams,
    filters,

    // Search columns
    userNameSearch,
    userCodeSearch,
    //action
    handleOpenDetail,
    handleDownload,
    handleDelete,
  };
};
