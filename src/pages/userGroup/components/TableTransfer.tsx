import {
  Button,
  Empty,
  Pagination,
  Table,
  TableColumnsType,
  TableProps,
  Transfer,
  TransferProps,
} from 'antd';
import { ColumnGroupType, ColumnType } from 'antd/es/table/interface';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserType } from '../interface/UserType';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TableRowSelection<T extends object> = TableProps<T>['rowSelection'];

interface TransferItem {
  key: string;
  [name: string]: any;
}

interface TableTransferProps extends TransferProps<TransferItem> {
  dataSource: (UserType & { key: string })[];
  leftColumns: TableColumnsType<UserType>;
  rightColumns: TableColumnsType<UserType>;
  searchPlaceholder?: string;
}

const DraggableRow: React.FC<any> = ({ children, id, container }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      data: { container },
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    display: id?.toString().startsWith('__ghost-') ? 'none' : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </tr>
  );
};

const DroppableBodyWrapper: React.FC<any> = ({
  direction,
  items,
  children,
}) => {
  const { setNodeRef } = useDroppable({
    id: `droppable-${direction}`,
    data: { container: direction },
  });

  return (
    <tbody ref={setNodeRef}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {children}
        {items.length === 1 && items[0].startsWith('__ghost-') && (
          <tr data-id={items[0]} style={{ height: 0, opacity: 0 }}>
            <td />
          </tr>
        )}
      </SortableContext>
    </tbody>
  );
};

const TableTransfer: React.FC<TableTransferProps> = (props) => {
  const { t } = useTranslation();
  const { leftColumns, rightColumns, ...restProps } = props;
  const [leftData, setLeftData] = useState<(UserType & { key: string })[]>([]);
  const [rightData, setRightData] = useState<(UserType & { key: string })[]>(
    []
  );
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(1);
  const pageSize = 10;
  const [activeItem, setActiveItem] = useState<TransferItem | null>(null);
  const [activeDirection, setActiveDirection] = useState<
    'left' | 'right' | null
  >(null);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    const left = props.dataSource.filter(
      (i) => !props.targetKeys?.includes(i.key)
    );
    const right = props.dataSource.filter(
      (i) => props.targetKeys?.includes(i.key)
    );
    setLeftData(left);
    setRightData(right);
  }, [props.dataSource, props.targetKeys]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    const activeId = active.id;
    // Tìm item và xác định container
    const leftItem = leftData.find((i) => i.key === activeId);
    const rightItem = rightData.find((i) => i.key === activeId);
    if (leftItem) {
      setActiveItem(leftItem);
      setActiveDirection('left');
    } else if (rightItem) {
      setActiveItem(rightItem);
      setActiveDirection('right');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setActiveDirection(null);
    if (!over) return;

    const activeContainer = active.data.current?.container;
    const overContainer = over.data.current?.container;
    if (!activeContainer || !overContainer) return;

    // 🔸 Cùng bảng → reorder
    if (activeContainer === overContainer) {
      if (activeContainer === 'left') {
        const oldIndex = leftData.findIndex((i) => i.key === active.id);
        const newIndex = leftData.findIndex((i) => i.key === over.id);
        if (oldIndex !== -1 && newIndex !== -1)
          setLeftData(arrayMove(leftData, oldIndex, newIndex));
      } else {
        const oldIndex = rightData.findIndex((i) => i.key === active.id);
        const newIndex = rightData.findIndex((i) => i.key === over.id);
        if (oldIndex !== -1 && newIndex !== -1)
          setRightData(arrayMove(rightData, oldIndex, newIndex));
      }
      return;
    }

    // 🔸 Khác bảng → chuyển item
    if (activeContainer === 'left' && overContainer === 'right') {
      const item = leftData.find((i) => i.key === active.id);
      if (item) {
        const newTargetKeys = [...(props.targetKeys || []), item.key];
        props.onChange?.(newTargetKeys, 'right', [item.key]);
      }
    } else if (activeContainer === 'right' && overContainer === 'left') {
      const item = rightData.find((i) => i.key === active.id);
      if (item) {
        const newTargetKeys = (props.targetKeys || []).filter(
          (k) => k !== item.key
        );
        props.onChange?.(newTargetKeys, 'left', [item.key]);
      }
    }
  };

  // 🔹 Render 1 bảng
  const renderTable = (
    direction: 'left' | 'right',
    filteredItems: TransferItem[],
    onItemSelectAll: any,
    onItemSelect: any,
    listSelectedKeys: string[],
    listDisabled: boolean
  ) => {
    const columns = direction === 'left' ? leftColumns : rightColumns;
    const currentPage = direction === 'left' ? leftPage : rightPage;
    const setCurrentPage = direction === 'left' ? setLeftPage : setRightPage;
    const total = filteredItems.length;
    const start = (currentPage - 1) * pageSize;
    const paginatedData = filteredItems.slice(start, start + pageSize);

    useEffect(() => {
      if (currentPage > 1 && start >= total) setCurrentPage(1);
    }, [total]);

    // Nếu rỗng, tạo 1 placeholder để làm drop target
    const tableData = paginatedData.length > 0 ? paginatedData : [];

    const itemsForSortable =
      paginatedData.length > 0
        ? paginatedData.map((i) => i.key)
        : [`__ghost-${direction}`];

    const rowSelection: TableRowSelection<TransferItem> = {
      getCheckboxProps: (record: any) => ({
        onClick: (e) => e.stopPropagation(),
        onPointerDown: (e: any) => {
          e.stopPropagation();
          e.preventDefault(); // Ngăn DnD Kit kích hoạt drag khi nhấn vào checkbox
        },
      }),
      onChange(selectedRowKeys: any) {
        onItemSelectAll(selectedRowKeys, 'replace');
      },
      selectedRowKeys: listSelectedKeys,
      selections: [
        Table.SELECTION_ALL,
        Table.SELECTION_INVERT,
        Table.SELECTION_NONE,
      ],
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px dashed #ddd',
        }}
        data-container={direction}
      >
        <SortableContext
          items={itemsForSortable}
          strategy={verticalListSortingStrategy}
        >
          <Table
            rowSelection={rowSelection}
            columns={
              columns as (
                | ColumnGroupType<TransferItem>
                | ColumnType<TransferItem>
              )[]
            }
            dataSource={tableData as any}
            size="small"
            pagination={false}
            rowKey={(record) => record.key}
            components={{
              body: {
                wrapper: (props: any) => (
                  <DroppableBodyWrapper
                    {...props}
                    direction={direction}
                    items={itemsForSortable}
                  />
                ),
                row: (props: any) => (
                  <DraggableRow
                    {...props}
                    id={props['data-row-key']}
                    container={direction}
                  />
                ),
              },
            }}
            onRow={(record: any) => ({
              onClick: () => {
                // không tương tác với placeholder
                if (listDisabled) return;
                onItemSelect(
                  record.key,
                  !listSelectedKeys.includes(record.key)
                );
              },
            })}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span>{t('common.DataNotFound')}</span>}
                />
              ),
            }}
          />
        </SortableContext>
        {paginatedData.length === 0 && (
          <SortableContext
            items={[`__ghost-${direction}`]}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ height: 80 }} />
          </SortableContext>
        )}

        {/* {(direction === 'right' || total > 0) && ( */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
          }}
        >
          {direction === 'right' ? (
            <Button
              danger
              size="small"
              onClick={() => {
                const targetKeys = restProps.targetKeys || [];
                restProps.onChange?.([], 'right', targetKeys);
                setRightPage(1);
              }}
              disabled={!(restProps.targetKeys && restProps.targetKeys.length)}
            >
              {t('common.DeleteAll')}
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                const leftKeys = leftData.map((i) => i.key);
                const newTargetKeys = [
                  ...(restProps.targetKeys || []),
                  ...leftKeys,
                ];
                restProps.onChange?.(newTargetKeys, 'left', leftKeys);
                setLeftPage(1);
              }}
              disabled={leftData.length === 0 || listDisabled}
            >
              {t('common.AddAll')}
            </Button>
          )}
          {total > 0 && (
            <Pagination
              size="small"
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          )}
        </div>
        {/* )} */}
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Transfer<TransferItem>
        style={{ width: '100%' }}
        {...restProps}
        locale={{
          itemsUnit: t('user.user') as string,
          itemUnit: t('user.user') as string,
          searchPlaceholder: t('common.Search') as string,
        }}
      >
        {({
          direction,
          filteredItems,
          onItemSelectAll,
          onItemSelect,
          selectedKeys: listSelectedKeys,
          disabled: listDisabled = false,
        }) =>
          renderTable(
            direction,
            filteredItems,
            onItemSelectAll,
            onItemSelect,
            listSelectedKeys.map(String),
            listDisabled
          )
        }
      </Transfer>
      <DragOverlay>
        {activeItem ? (
          <Table
            size="small"
            columns={
              (activeDirection === 'left' ? leftColumns : rightColumns) as any
            }
            dataSource={[activeItem]}
            pagination={false}
            showHeader={false}
            rowKey="key"
            style={{
              width: '100%',
              background: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: 6,
            }}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TableTransfer;
