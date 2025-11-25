import React from 'react';
import { Form, Input, InputNumber, Switch, Button, Space, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { MinusCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

type Props = {
  selected?: any;
  onChange: (patch: any) => void;
  onDelete?: () => void;
};

const Inspector: React.FC<Props> = ({ selected, onChange, onDelete }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();

  React.useEffect(() => {
    form.resetFields();
    if (selected) {
      const initial = { ...(selected.props || {}) };
      
      // Normalize options array to CSV string
      if (Array.isArray(initial.options)) {
        initial.options = initial.options.join(',');
      }
      
      initial.rows = initial.rows || 2;
      
      if (initial.headers && !Array.isArray(initial.headers)) {
        initial.headers = [initial.headers];
      }
      if (!initial.headers || initial.headers.length === 0) {
        initial.headers = [{ title: 'Column 1' }, { title: 'Column 2' }];
      }
      
      form.setFieldsValue(initial);
    }
  }, [selected, form]);

  if (!selected)
    return <div style={{ padding: 12 }}>{t('dnd.DropComponentsHere')}</div>;

  const onFinish = (values: any) => {
    const patch = { ...values };
    
    // Parse options CSV back to array
    if (patch.options && typeof patch.options === 'string') {
      patch.options = patch.options
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    
    patch.rows = Number(patch.rows) || 2;
    
    if (patch.headers && Array.isArray(patch.headers)) {
      patch.headers = patch.headers.filter((h: { title: string; }) => h && h.title && h.title.trim());
    }
    
    onChange(patch);
  };

  const type = selected.type;
  const removeVietnameseTones = (str: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')                    // tách dấu
    .replace(/[\u0300-\u036f]/g, '')     // bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '_')     // thay ký tự không phải chữ/số bằng _
    .replace(/^_+|_+$/g, '')            // bỏ _ thừa đầu và cuối
    .replace(/_+/g, '_') // gom các _ liên tiếp thành 1
    .toLowerCase();              
};

  return (
    <div style={{ padding: 16 }}>
      <h4>{t('dnd.Inspector')} — {type}</h4>

      <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 8, paddingTop: 8 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{}} onValuesChange={(changedValues, allValues) => {
            if (changedValues.label) {
              // Cập nhật luôn key bằng label
              form.setFieldsValue({ key: removeVietnameseTones(changedValues.label) });
            }
          }}>
          <Form.Item name="key" label={t('dnd.ID')}>
            <Input />
          </Form.Item>
          {/* Label for all components */}
          <Form.Item name="label" label={t('dnd.Label')}>
            <Input />
          </Form.Item>

          {/* COMMON COMPONENTS */}
          {type === 'Button' && (
            <Form.Item name="text" label={t('dnd.Text')}>
              <Input />
            </Form.Item>
          )}

          {type === 'Card' && (
            <>
              <Form.Item name="title" label={t('dnd.CardTitle')}>
                <Input />
              </Form.Item>
              <Form.Item name="content" label={t('dnd.CardContent')}>
                <TextArea rows={3} />
              </Form.Item>
            </>
          )}

          {type === 'Input' && (
            <>
              <Form.Item name="placeholder" label={t('dnd.Placeholder')}>
                <Input />
              </Form.Item>
              <Form.Item name="value" label={t('dnd.Value')}>
                <Input />
              </Form.Item>
            </>
          )}
          {type === 'Formula'  && (
            <>
              <Form.Item name="placeholder" label={t('dnd.Placeholder')}>
                <Input />
              </Form.Item>
              <Form.Item name="formular_value" label={t('dnd.formula')}>
                <TextArea rows={4} />
              </Form.Item>
            </>
          )}

          {type === 'InputNumber' && (
            <Form.Item name="value" label={t('dnd.Value')}>
              <InputNumber defaultValue={0} style={{ width: '100%' }} />
            </Form.Item>
          )}

          {type === 'TextArea' && (
            <>
              <Form.Item name="placeholder" label={t('dnd.Placeholder')}>
                <Input />
              </Form.Item>
              <Form.Item name="rows" label={t('dnd.Rows')}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}

          {type === 'DatePicker' && (
            <Form.Item name="placeholder" label={t('dnd.Placeholder')}>
              <Input />
            </Form.Item>
          )}

          {type === 'Select' && (
            <>
              <Form.Item name="options" label={t('dnd.SelectValue')}>
                <Input placeholder="A,B,C" />
              </Form.Item>
            </>
          )}

          {type === 'Checkbox' && (
            <Form.Item name="label" label={t('dnd.Label')}>
              <Input />
            </Form.Item>
          )}

          {type === 'Radio' && (
            <Form.Item name="options" label={t('dnd.SelectValue')}>
              <Input placeholder="A,B,C" />
            </Form.Item>
          )}

          {type === 'Switch' && (
            <Form.Item name="checked" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}

          {type === 'Label' && (
            <Form.Item name="text" label={t('dnd.Text')}>
              <Input />
            </Form.Item>
          )}

          {type === 'Table' && (
            <div>
              {/* Rows */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="rows"
                    label={t('dnd.TableRows')}
                    rules={[
                      { required: true },
                      { type: 'number', min: 1 },
                      { type: 'number', max: 50 }
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={50}
                      style={{ width: '100%' }}
                      placeholder="2"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Headers */}
              <Form.Item 
                label={t('dnd.TableHeaders')} 
                required
              >
                <Form.List name="headers">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space
                          key={key}
                          style={{ display: 'flex', marginBottom: 8, width: '100%' }}
                          align="baseline"
                        >
                          <Form.Item
                            {...restField}
                            name={[name, 'title']}
                            style={{ width: '85%' }}
                          >
                            <Input 
                              placeholder={`Column ${name + 1}`} 
                            />
                          </Form.Item>
                          {fields.length > 1 && (
                            <MinusCircleOutlined 
                              onClick={() => remove(name)} 
                              style={{ marginLeft: 8 }}
                            />
                          )}
                        </Space>
                      ))}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add({ title: `Column ${fields.length + 1}` })}
                          block
                          icon={<PlusOutlined style={{ fontSize: 14, verticalAlign: 'middle' }}/>}
                        >
                          {t('dnd.AddHeader')}
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </div>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {t('dnd.Apply')}
              </Button>
              {onDelete && (
                <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
                  {t('common.Delete')}
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Inspector;