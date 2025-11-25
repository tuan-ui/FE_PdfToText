import React from 'react';
import { Card } from 'antd';
import { useTranslation } from 'react-i18next';

export type PaletteItem = {
  id: string;
  type: string;
  title: string;
};

const ITEMS: PaletteItem[] = [
  { id: 'btn', type: 'Button', title: 'Button' },
  { id: 'card', type: 'Card', title: 'Card' },
  { id: 'input', type: 'Input', title: 'Input' },
  { id: 'inputnumber', type: 'InputNumber', title: 'InputNumber' },
  { id: 'textarea', type: 'TextArea', title: 'TextArea' },
  { id: 'datepicker', type: 'DatePicker', title: 'DatePicker' },
  { id: 'select', type: 'Select', title: 'Select' },
  { id: 'checkbox', type: 'Checkbox', title: 'Checkbox' },
  { id: 'radio', type: 'Radio', title: 'Radio' },
  { id: 'switch', type: 'Switch', title: 'Switch' },
  { id: 'label', type: 'Label', title: 'Label' },
  { id: 'holder', type: 'Holder', title: 'Holder' },
  { id: 'table', type: 'Table', title: 'Table' },
  { id: 'formula', type: 'Formula', title: 'Formula' },
];

export const Palette: React.FC = () => {
  const onDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };
  const { t } = useTranslation();
  const listRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <h4 style={{ padding: 16 }}>{t('dnd.Palette')}</h4>
      <div>
        <div
          ref={listRef}
          className="palette-scroll"
          style={{
            maxHeight: 'calc(100vh - 240px)',
            overflowY: 'scroll',
            paddingRight: 8,
          }}
        >
          {ITEMS.map((it) => (
            <Card key={it.id} size="small" style={{ marginBottom: 8 }}>
              <div
                draggable
                onDragStart={(e) => onDragStart(e, it)}
                style={{ cursor: 'grab' }}
              >
                {it.title}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
