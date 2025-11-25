import React from 'react';
import {
  Button,
  Card,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Checkbox,
  Radio,
  Switch,
  Table,
} from 'antd';
import { useTranslation } from 'react-i18next';
const { TextArea } = Input;
const { Option } = (Select as any) || {};

type Node = {
  id: string;
  type: string;
  props?: any;
};

export const ComponentRenderer: React.FC<{
  node: Node;
  onSelect?: (n: Node) => void;
  selectedId?: string | null;
}> = ({ node, onSelect, selectedId }) => {
  const p = node.props || {};
  const { t } = useTranslation();

  const wrapper = (content: React.ReactNode, isHolder = false) => (
    <div
      data-holder-id={isHolder ? node.id : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onSelect && onSelect(node);
      }}
      style={{
        padding: 4,
        border: node.id === selectedId ? '1px solid #1890ff' : 'transparent',
      }}
    >
      {/* render label (if present) above the component */}
      {p.label ? (
        <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
          {p.label}
        </div>
      ) : null}
      {content}
    </div>
  );

  switch (node.type) {
    case 'Button':
      return wrapper(<Button>{p.text ?? t('dnd.Text')}</Button>);
    case 'Card':
      return wrapper(
        <Card title={p.title ?? t('dnd.CardTitle')} style={{ width: '100%' }}>
          {p.content ?? t('dnd.CardContent')}
        </Card>
      );
    case 'Formula':
    case 'Input':
      return wrapper(
        <Input
          placeholder={p.placeholder ?? t('dnd.Type')}
          defaultValue={p.value}
        />
      );
    case 'InputNumber':
      return wrapper(
        <InputNumber style={{ width: '100%' }} defaultValue={p.value} />
      );
    case 'TextArea':
      return wrapper(<TextArea rows={p.rows ?? 3} defaultValue={p.value} />);
    case 'DatePicker':
      return wrapper(<DatePicker defaultValue={undefined as any} />);
    case 'Select':
      return wrapper(
        <Select style={{ width: '100%' }} defaultValue={p.value}>
          {(p.options || []).length
            ? (p.options || []).map((opt: any) => (
                <Option key={opt} value={opt}>
                  {opt}
                </Option>
              ))
            : [
                <Option key="option1" value="option1">
                  A
                </Option>,
                <Option key="option2" value="option2">
                  B
                </Option>,
              ]}
        </Select>
      );
    case 'Checkbox':
      return wrapper(
        <Checkbox defaultChecked={!!p.checked}>
          {p.label ?? 'Checkbox'}
        </Checkbox>
      );
    case 'Radio':
      return wrapper(
        <Radio.Group defaultValue={p.value}>
          {(p.options || []).length
            ? (p.options || []).map((opt: any) => (
                <Radio key={opt} value={opt}>
                  {opt}
                </Radio>
              ))
            : [
                <Radio key="a" value="a">
                  A
                </Radio>,
                <Radio key="b" value="b">
                  B
                </Radio>,
              ]}
        </Radio.Group>
      );
    case 'Switch':
      return wrapper(<Switch defaultChecked={!!p.checked} />);
    case 'Holder':
      return (
        <div
          data-holder-id={node.id}
          style={{ padding: 8, border: '1px dashed #ccc' }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            {(node.props?.children || []).length ? (
              (node.props.children || []).map((child: any) => (
                <div
                  key={child.id}
                  style={{ flex: 1, border: '1px dashed #ddd', padding: 8 }}
                >
                  <ComponentRenderer
                    node={child}
                    onSelect={onSelect}
                    selectedId={selectedId}
                  />
                </div>
              ))
            ) : (
              <div
                style={{
                  flex: 1,
                  border: '1px dashed #eee',
                  padding: 8,
                  color: '#999',
                }}
              >
                {t('dnd.DropComponentsHere')}
              </div>
            )}
          </div>
        </div>
      );
    case 'Label':
      return wrapper(
        <div style={{ padding: '8px 0' }}>{p.text ?? 'Label'}</div>
      );
    case 'Table':
      // ✅ FIX: Tạo headers OBJECT ARRAY
      const defaultHeaders = p.headers || ['Column 1', 'Column 2'];
      const columns = Array.isArray(defaultHeaders)
        ? defaultHeaders.map((header: any, i: number) => {
            const title =
              typeof header === 'string'
                ? header
                : header.title || `Column ${i + 1}`;
            return {
              title,
              dataIndex: `col${i}`,
              key: `col${i}`,
              width: 150,
              render: (value: any, record: any, index: number) => (
                <Input
                  placeholder={`Enter content row ${index + 1}`}
                  defaultValue={p[`col${i}_row${index}`]}
                />
              ),
            };
          })
        : [];

      // Generate dataSource based on rows
      const dataSource = Array.from({ length: p.rows || 2 }).map(
        (_, rowIndex) => ({
          key: rowIndex,
        })
      );

      return wrapper(
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered
          size="small"
          style={{ width: '100%' }}
        />
      );
    default:
      return wrapper(<div>Unknown: {node.type}</div>);
  }
};
