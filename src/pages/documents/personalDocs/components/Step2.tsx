import React, { useEffect,useState } from 'react';
import { StepContent } from '../interface/Step';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  Upload,
  Card,
  Table,
  notification,
  UploadFile
} from 'antd';
import { sanitizeInput } from '../../../../utils/stringUtils';
import { Helmet } from 'react-helmet-async';
import { UploadOutlined } from '@ant-design/icons';
import { getContentDnD } from '../../../../api/dndApi';
import { forEach } from 'lodash';
import { getAttachs } from '../../../../api/docDocumentApi';

const { Option } = Select;
type Node = {
  id: string;
  type: string;
  props?: any;
};

const ContentAttachmentsStep: React.FC<StepContent> = ({
  form,
  personalDocEdit,
  handleSave
}) => {
   const { t } = useTranslation();
  //  const [files, setFiles] = useState<UploadFile[]>([]);
    const [schema, setSchema] = React.useState<Node[] | null>();
    const [formTitle, setFormTitle] = React.useState<string | null>();
    const [responses, setResponses] = React.useState<Record<string, any>>({});
    const [removedFiles, setRemovedFiles] = useState<string[]>([]);
    const title = formTitle || (schema && schema[0] && schema[0].props && schema[0].props.title) || `Survey: ${personalDocEdit?.docTemplateId}`;

      const loadSchema = async () => {
              if (!personalDocEdit?.docTemplateId ) return;
          let mounted = true;
          (async () => {
            try {
              // const values = await form.validateFields();
              // const payload = values.schema;
              // if (payload) return;
              console.debug('[SurveyRunner] fetching schema for id=', personalDocEdit.docTemplateId);
              const resp: any = await getContentDnD(personalDocEdit.docTemplateId as string);
              console.debug('[SurveyRunner] getContentDnD response:', resp);
      
              if (resp && resp.success === false) {
                if (mounted) form.setFieldsValue({ schema: null });
                return;
              }
      
              let content: any = resp?.object ?? resp?.data?.content ?? resp?.content ?? resp?.data ?? resp;
      
              if (content == null) {
                if (mounted) form.setFieldsValue({ schema: null });
                return;
              }
      
              if (typeof content === 'string') {
                try {
                  content = JSON.parse(content);
                } catch (e) {
                  if (mounted) form.setFieldsValue({ schema: null });
                  return;
                }
              }
      
              // Extract title + nodes
              let normalized: any[] | null = null;
              let title: string | null = null;
              if (Array.isArray(content)) {
                normalized = content;
              } else if (typeof content === 'object') {
                if (typeof (content as any).title === 'string') {
                  title = (content as any).title;
                }
                const maybeNodes = (content as any).nodes || (content as any).content || (content as any).schema;
                if (Array.isArray(maybeNodes)) {
                  normalized = maybeNodes;
                } else {
                  if ((content as any).id && (content as any).type) {
                    normalized = [content];
                  } else if (maybeNodes && typeof maybeNodes === 'object') {
                    normalized = Array.isArray(maybeNodes) ? maybeNodes : [maybeNodes];
                  } else {
                    normalized = null;
                  }
                }
              }
      
              if (mounted) {
               if (title) form.setFieldsValue({ schemaTitle: title });
                console.debug('[SurveyRunner] normalized schema:', normalized, 'title=', title);
                form.setFieldsValue({ schema: normalized });
                let formData=personalDocEdit?.formData;
                if(formData){
                  const formObj = JSON.parse(formData);
                  const updatedNormalized = normalized?.map((n) => {
                    const key = n.props.key;
                    if (key in formObj) {
                      return {
                        ...n,
                        props: {
                          ...n.props,
                          value: formObj[key], // cập nhật value từ formData
                        },
                      };
                    }
                    return n;
                  });
                  setSchema(updatedNormalized);
                }else{
                  setSchema(normalized);
                }
               
                
              }
            } catch (err) {
              console.error('Failed to load survey schema from server', err);
              if (mounted)  form.setFieldsValue({ schema: null });
             
            }
          })();
          return () => {
            mounted = false;
          };
      };
    useEffect(()=>{
      loadSchema();
    },[personalDocEdit])
    const handleChange = (node: Node, value: any) => {
      const p = node.props || {};
      const key = p.key ||p.label || p.title || `${node.type}:${node.id}`;
      setResponses((r) => ({ ...r, [key]: value }));
      setSchema(prev => {
      if (!prev) return prev;
  
      // updateNodeValue là hàm bạn viết để update value node theo key
      let updated = updateNodeValue(prev, key, value);
      const formulaNodes = findNodesByType(updated, 'Formula');    // Cập nhật luôn node Luong
      // Lặp qua từng công thức để tính lại
      for (const formulaNode of formulaNodes) {
        const formula = formulaNode.props?.formular_value;
        if (!formula) continue;
  
        const result = evaluateFormula(formula, updated);
  
        // Giả sử mỗi node công thức có props.outputKey để biết kết quả ghi vào đâu (vd: 'Luong')
        const outputKey = formulaNode.props?.key || 'Formula';
        setResponses((r) => ({ ...r, [outputKey]: result }));

        updated = updateNodeValue(updated, outputKey, result);
      }
      return updated;
    });
    form.setFieldsValue({ formData: JSON.stringify(responses) });
    };
    const findNodeByKey = (nodes: Node[], targetKey: string): Node | null => {
    for (const node of nodes) {
      if ((node.props?.key || node.id) === targetKey) return node;
      if (node.props?.children) {
        const found = findNodeByKey(node.props.children as Node[], targetKey);
        if (found) return found;
      }
    }
    return null;
  };
  
    const evaluateFormula = (formula: string, nodes: Node[]): number => {
    if (!formula) return 0;
  
    // Tìm tất cả biến trong công thức, ví dụ: so_luong, don_gia
    const variablePattern = /[a-zA-Z_]\w*/g;
    const variables = formula.match(variablePattern) || [];
  
    // Tạo object map biến -> giá trị
    const values: Record<string, number> = {};
    for (const v of variables) {
      const node = findNodeByKey(nodes, v);
      let val: any = node?.props?.value;
  
      if (node?.type === 'DatePicker' && val) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          val = date.getTime() / (1000 * 60 * 60 * 24); // 👈 số ngày từ epoch
        } else {
          val = 0;
        }
      } else {
        val = Number(val || 0);
      }
  
      values[v] = val;
    }
  
    // Tạo biểu thức thay thế
    const expression = formula.replace(variablePattern, (match) => {
      return String(values[match] ?? 0);
    });
  
  
    // Tính toán an toàn
    try {
      // Không dùng eval trực tiếp, dùng Function để giới hạn scope
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${expression}`)();
      return isNaN(result) ? 0 : result;
    } catch (err) {
      console.error('Invalid formula:', formula, err);
      return 0;
    }
  };
  const findNodesByType = (nodes: Node[], targetType: string): Node[] => {
    let result: Node[] = [];
  
    for (const node of nodes) {
      // Nếu node hiện tại khớp type
      if ((node.props?.type || node.type) === targetType) {
        result.push(node);
      }
  
      // Nếu có children → tìm đệ quy
      if (node.props?.children) {
        result = result.concat(findNodesByType(node.props.children as Node[], targetType));
      }
    }
  
    return result;
  };
    const updateNodeValue = (nodes: Node[], targetId: string, newValue: any): Node[] => {
    return nodes.map(node => {
      // nếu đúng node thì cập nhật value
      if ((node.props?.key || node.id) === targetId) {
        return {
          ...node,
          props: {
            ...node.props,
            value: newValue
          }
        };
      }
  
      // nếu node có children, update đệ quy
      if (node.props?.children) {
        return {
          ...node,
          props: {
            ...node.props,
            children: updateNodeValue(node.props.children as Node[], targetId, newValue)
          }
        };
      }
  
      return node; // node không thay đổi
    });
  };
  
    
    const handleTableCellChange = (node: Node, rowIndex: number, colIndex: number, value: string) => {
      const tableKey = `${node.props?.label || `Table:${node.id}`}`;
      setResponses((r) => {
        const currentTableData = r[tableKey] || [];
        const newTableData = [...currentTableData];
        if (!newTableData[rowIndex]) {
          newTableData[rowIndex] = {};
        }
        newTableData[rowIndex][`col${colIndex}`] = value;
        return { ...r, [tableKey]: newTableData };
      });
    };
  
    const renderNodeAsInput = (node: Node) => {
      const p = node.props || {};
      
      switch (node.type) {
        case 'Formula':
        case 'Input':
          return (
            <Input
              id={p.key}
              value={p.value}
              onChange={(e) => handleChange(node, e.target.value)}
            />
          );
        case 'InputNumber':
          return (
            <InputNumber
              style={{ width: '100%' }}
              defaultValue={p.value || 0}
              onChange={(v) => handleChange(node, v)}
            />
          );
        case 'TextArea':
          return (
            <Input.TextArea
              rows={p.rows ?? 3}
              defaultValue={p.value}
              onChange={(e) => handleChange(node, e.target.value)}
            />
          );
        case 'DatePicker':
          return <DatePicker onChange={(_d, s) => handleChange(node, s)} />;
        case 'Select':
          return (
            <Select style={{ width: '100%' }} onChange={(v) => handleChange(node, v)}>
              {(p.options || []).length
                ? (p.options || []).map((opt: any) => (
                    <Option key={opt} value={opt}>
                      {opt}
                    </Option>
                  ))
                : null}
            </Select>
          );
        case 'Checkbox':
          return (
            <Checkbox 
              defaultChecked={!!p.checked} 
              onChange={(e) => handleChange(node, e.target.checked)}
            >
              {p.label}
            </Checkbox>
          );
        case 'Radio':
          return (
            <Radio.Group onChange={(e) => handleChange(node, e.target.value)}>
              {(p.options || []).map((opt: any) => (
                <Radio key={opt} value={opt}>
                  {opt}
                </Radio>
              ))}
            </Radio.Group>
          );
        case 'Switch':
          return <Switch defaultChecked={!!p.checked} onChange={(v) => handleChange(node, v)} />;
        case 'Label':
          return <div>{p.text}</div>;
        case 'Button':
          return <Button>{p.text ?? 'Button'}</Button>;
        case 'Card':
          return <Card title={p.title}>{p.content}</Card>;
        case 'Holder':
          return (
            <div style={{ display: 'flex', gap: 12 }}>
              {(node.props?.children || []).map((c: any) => (
                <div key={c.id} style={{ flex: 1 }}>
                  {renderNodeAsInput(c)}
                </div>
              ))}
            </div>
          );
        
        case 'Table':
          const headers = Array.isArray(p.headers) 
            ? p.headers.map((h: any) => typeof h === 'string' ? h : h.title)
            : ['Column 1', 'Column 2'];
          
          const numRows = p.rows || 2;
          const tableKey = p.label || `Table:${node.id}`;
          const tableData = responses[tableKey] || [];
          
          const columns = headers.map((header: string, colIndex: number) => ({
            title: header,
            dataIndex: `col${colIndex}`,
            key: `col${colIndex}`,
            width: 150,
            render: (text: any, record: any, rowIndex: number) => (
              <Input
                placeholder={`Enter ${header}`}
                defaultValue={tableData[rowIndex]?.[`col${colIndex}`] || ''}
                onChange={(e) => handleTableCellChange(node, rowIndex, colIndex, e.target.value)}
              />
            ),
          }));
  
          const dataSource = Array.from({ length: numRows }).map((_, rowIndex) => ({
            key: rowIndex,
          }));
  
          return (
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
          return <div>Unsupported: {node.type}</div>;
      }
    };
    const submit = () => {
    if (!personalDocEdit?.docTemplateId) return;
    try {
      const payloadEntry = { at: Date.now(), responses };
      console.log(payloadEntry);
    } catch (err) {
    }
  };

    const handleSaveDraft = async () => {
      try {
        form.setFieldsValue({ removedFiles: removedFiles });
        form.setFieldsValue({ formData: JSON.stringify(responses) });
        const values = await form.validateFields();
        const success = await handleSave?.(values);
        if (success) {
          notification.success({
            message: t('common.actionSuccess'),
            description: values?.id
              ? t('common.UpdateSuccess')
              : t('common.AddSuccess'),
          });
        }
        console.log('Form values:', values);
      } catch (errorInfo) {
        console.log('Validation Failed:', errorInfo);
      }
    };

  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <Form.Item name="schemaTitle">{form.getFieldValue("schemaTitle")}</Form.Item>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {schema?.map(node => (
          <div key={node.id} style={{ padding: 8, border: "1px solid #eee" }}>
            {renderNodeAsInput(node)}
          </div>
        ))}
      </div>

      <Form.Item
        label="File Upload"
        name="files"
        required
        validateTrigger="onChange"
        valuePropName="fileList"
        getValueFromEvent={(e) => e.fileList}
      >
        <Upload
          multiple
          // fileList={files}
         // Thêm từ beforeUpload
          beforeUpload={(file) => {
            const uploadFile: UploadFile = {
              uid: file.uid || file.name,
              name: file.name,
              status: 'done', // hoặc 'uploading' nếu muốn show đang upload
              size: file.size,
              originFileObj: file, // lưu file gốc
            };
          const current = form.getFieldValue("files") || [];
          form.setFieldsValue({
            files: [...current, uploadFile],
          });
            return Upload.LIST_IGNORE; // ngăn tự upload
          }}

          onPreview={(file) => {
            if (file.type?.startsWith('image/')) {
              const url =
                file.url ||
                (file.originFileObj
                  ? URL.createObjectURL(file.originFileObj)
                  : '');
              const img = new Image();
              img.src = url;
              const imgWindow = window.open(url);
              imgWindow?.document.write(img.outerHTML);
            }
          }}
           onRemove={(file) => {
             const current = form.getFieldValue("files") || [];
            form.setFieldsValue({
              files: current.filter((f:any) => f.uid !== file.uid),
            });
            form.setFieldsValue({ removedFiles: removedFiles });
            setRemovedFiles((prev) => [...prev, file.uid]);
          }}
        >
          <Button icon={<UploadOutlined />}>Upload</Button>
        </Upload>
      </Form.Item>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <Button
          type="primary"
          onClick={handleSaveDraft}
          style={{
            padding: '0 auto',
          }}
        >
          {t('common.SaveDraft')}
        </Button>
        <Form.Item hidden>
        <Form.Item name="formData" hidden></Form.Item>
        <Form.Item name="files" hidden></Form.Item>
        <Form.Item name="removedFiles" hidden></Form.Item>
        <Input />
      </Form.Item>

      </div>
    </div>
  );
};

export default ContentAttachmentsStep;
