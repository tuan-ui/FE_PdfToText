import { useRef, useState } from 'react';
import { Button, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import { useTranslation } from 'react-i18next';

type GetColumnSearchPropsParams<T> = {
  dataIndex: keyof T;
  onSearchServer: (field: string, value: string) => void;
};

const removeDiacritics = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const sanitizeInput = (str: string): string => {
  return str.replace(/<[^>]*>?/gm, ''); // loại bỏ mọi thẻ HTML
};

export function useColumnSearch<T>({
  dataIndex,
  onSearchServer,
}: GetColumnSearchPropsParams<T>) {
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [inputValue, setInputValue] = useState('');
  const setSelectedKeysRef = useRef<((keys: React.Key[]) => void) | null>(null);
  const clearFiltersRef = useRef<(() => void) | null>(null);
  const searchInput = useRef<InputRef>(null);
  const { t } = useTranslation();

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm']
  ) => {
    confirm();
    const value = selectedKeys[0] || '';
    setSearchText(value);
    setSearchedColumn(dataIndex as string);

    onSearchServer(dataIndex as string, value);
  };

  const handleReset = (
    clearFilters?: () => void,
    confirm?: FilterDropdownProps['confirm'],
    setSelectedKeys?: (keys: React.Key[]) => void
  ) => {
    // clear via provided handlers
    clearFilters?.();
    setSelectedKeys?.([]);
    // also clear stored refs if any
    clearFiltersRef.current?.();
    setSelectedKeysRef.current?.([]);
    setInputValue('');
    setSearchText('');
    setSearchedColumn('');
    confirm?.({ closeDropdown: true });

    if (searchInput.current?.input) {
      searchInput.current.input.value = '';
    }
    onSearchServer(dataIndex as string, '');
  };

  const resetSearch = () => {
    // clear internal state and input
    setInputValue('');
    setSearchText('');
    setSearchedColumn('');
    if (searchInput.current?.input) {
      searchInput.current.input.value = '';
    }
    // clear AntD filter state if dropdown stored handlers
    clearFiltersRef.current?.();
    setSelectedKeysRef.current?.([]);
    onSearchServer(dataIndex as string, '');
  };

  return {
    searchText,
    searchedColumn,
    searchInput,
    resetSearch,
    getColumnSearchProps: () => ({
      // expose current filtered value to AntD so the table knows when this column is filtered
      filteredValue: searchText ? [searchText] : undefined,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => {
        // store these handlers so external resetSearch() can clear AntD filter state
        setSelectedKeysRef.current = setSelectedKeys ?? null;
        clearFiltersRef.current = clearFilters ?? null;
        return (
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              ref={searchInput}
              placeholder={t('common.enterKeyword', { field: t(`search.${String(dataIndex)}`) })}
              value={inputValue}
              maxLength={255}
              onChange={(e) => {
                const sanitized = sanitizeInput(e.target.value);
                setInputValue(sanitized);
                setSelectedKeys && setSelectedKeys(sanitized ? [sanitized] : []);
              }}
              onPressEnter={() => {
                // only search when there's a non-empty value
                if (inputValue && inputValue.trim() !== '') {
                  handleSearch(selectedKeys as string[], confirm);
                  setTimeout(() => {
                    clearFiltersRef.current?.() ?? clearFilters?.();
                    setSelectedKeysRef.current?.([]) ?? (setSelectedKeys && setSelectedKeys([]));
                    setInputValue('');
                    if (searchInput.current?.input) {
                      searchInput.current.input.value = '';
                    }
                  }, 0);
                }
              }}
              style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => {
                  // guard: don't perform search if input is empty
                  if (!inputValue || inputValue.trim() === '') return;
                  handleSearch(selectedKeys as string[], confirm);
                  setTimeout(() => {
                    clearFiltersRef.current?.() ?? clearFilters?.();
                    setSelectedKeysRef.current?.([]) ?? (setSelectedKeys && setSelectedKeys([]));
                    setInputValue('');
                    if (searchInput.current?.input) {
                      searchInput.current.input.value = '';
                    }
                  }, 0);
                }}
                size="small"
                style={{ width: 90 }}
                disabled={!inputValue || inputValue.trim() === ''}
              >
                {t('common.Search')}
              </Button>
              <Button
                onClick={() => handleReset(clearFilters, confirm, setSelectedKeys)}
                size="small"
                style={{ width: 90 }}
              >
                {t('common.resetFilter')}
              </Button>
            </Space>
          </div>
        );
      },
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
      ),
      render: (text: any) => {
        if (searchedColumn !== dataIndex || !searchText) {
          return text;
        }

        const normalizedSearch = removeDiacritics(searchText);

        if (typeof text === 'string') {
          const normalizedText = removeDiacritics(text);
          let indices: number[] = [];
          let start = 0;
          while (start < normalizedText.length) {
            const index = normalizedText.indexOf(normalizedSearch, start);
            if (index === -1) break;
            indices.push(index);
            start = index + normalizedSearch.length;
          }

          if (indices.length === 0) return text;

          return (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape={true}
              textToHighlight={text.toString()}
              findChunks={() => {
                const chunks: any[] = [];
                let currentPos = 0;
                const textStr = text.toString();
                while (currentPos < textStr.length) {
                  const substrNormalized = removeDiacritics(
                    textStr.substring(currentPos)
                  );
                  const matchIndex = substrNormalized.indexOf(normalizedSearch);
                  if (matchIndex === -1) break;
                  const originalStart = currentPos + matchIndex;
                  chunks.push({
                    start: originalStart,
                    end: originalStart + searchText.length,
                    highlight: true,
                  });
                  currentPos = originalStart + searchText.length;
                }
                return chunks;
              }}
            />
          );
        }

        return text;
      },
    }),
  };
}
