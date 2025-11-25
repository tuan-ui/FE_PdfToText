import React, { useCallback } from 'react';
import { ComponentRenderer } from './ComponentRenderer';
import type { PaletteItem } from './palette';
import { useTranslation } from 'react-i18next';

const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

type Node = {
  id: string;
  type: string;
  props?: any;
  children?: Node[];
};

export const Canvas: React.FC<{
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  onSelect?: (node: Node | null) => void;
  selectedId?: string | null;
}> = ({ nodes, setNodes, onSelect, selectedId }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();
  const removeVietnameseTones = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')                    // tách dấu
    .replace(/[\u0300-\u036f]/g, '')     // bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '_')     // thay ký tự không phải chữ/số bằng _
    .replace(/^_+|_+$/g, '')            // bỏ _ thừa đầu và cuối
    .replace(/_+/g, '_')               // gom các _ liên tiếp thành 1
    .toLowerCase();    
};
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;
      try {
        const item: PaletteItem = JSON.parse(json);
        
        const defaultProps = { label: t('dnd.LabelType', { type: item.title }),key: removeVietnameseTones(t('dnd.LabelType', { type: item.type })) };
        const node: Node = {
          id: generateId(),
          type: item.type,
          props: defaultProps,
        };

        // check if drop target indicates a holder id
        const holderId = (e.target as HTMLElement)
          .closest('[data-holder-id]')
          ?.getAttribute('data-holder-id');

        if (holderId) {
          // when inserting into a holder, include default label on the child
          const child = {
            ...node,
            props: {
              ...(node.props || {}),
              label: t('dnd.LabelType', { type: item.type }),
            },
          };
          setNodes((prev) =>
            prev.map((n) =>
              n.id === holderId
                ? {
                    ...n,
                    props: {
                      ...(n.props || {}),
                      children: [...(n.props?.children || []), child],
                    },
                  }
                : n
            )
          );
        } else {
          // root-level drop
          setNodes((prev) => [...prev, node]);
        }
      } catch (err) {
        // ignore
      }
    },
    [setNodes]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        ref={containerRef}
        style={{
          maxHeight: 'calc(80vh - 48px)',
          overflowY: 'auto',
          border: '2px dashed #ccc',
          padding: 12,
        }}
      >
        {nodes.length === 0 ? (
          <div
            style={{
              color: '#999',
              fontSize: 16,
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            {t('dnd.DragnDrop')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {nodes.map((n) => (
              <div
                key={n.id}
                style={{
                  marginBottom: 12,
                  padding: 8,
                  border:
                    n.id === selectedId
                      ? '1px solid #1890ff'
                      : '1px dashed transparent',
                }}
                onClick={() => {
                  onSelect && onSelect(n);
                }}
              >
                <ComponentRenderer
                  node={n}
                  onSelect={onSelect}
                  selectedId={selectedId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
