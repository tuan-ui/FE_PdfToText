import React from 'react';
import { Button } from 'antd';
import Search from 'antd/es/input/Search';
import {
  UndoOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useProcessDocTabs } from './useProcessDocTabs';
import { useTranslation } from 'react-i18next';

export const ToolPageProcessing: React.FC = () => {
  const {
    searchInputValue,
    setSearchInputValue,
    searchParams,
    pagination,
    fetchUsers,
    handleFilter,
  } = useProcessDocTabs();
  const { t } = useTranslation();

  const handleSearch = (value: string) => {
    const newParams = { ...searchParams, searchString: value };
    fetchUsers(1, pagination.pageSize, newParams);
  };

  return (
    <>
      <Search
        placeholder={t('common.Search')}
        allowClear
        value={searchInputValue}
        onChange={(e) => setSearchInputValue(e.target.value)}
        onSearch={handleSearch}
        style={{
          width: '400px',
          marginLeft: '.5rem',
          marginRight: 8,
        }}
      />
      <Button
        style={{ marginRight: 8 }}
        icon={<CheckCircleOutlined />}
        type="primary"
      >
        {t('processDoc.approve')}
      </Button>

      <Button
        style={{ marginRight: 8 }}
        icon={<CloseCircleOutlined />}
        type="primary"
        danger
      >
        {t('processDoc.deny')}
      </Button>

      <Button
                      icon={
                        <FilterOutlined
                          style={{ fontSize: 14, verticalAlign: 'middle' }}
                        />
                      }
                      onClick={handleFilter}
                    />
    </>
  );
};
