import React, { createElement, useEffect, useState } from 'react';
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
  UploadFile,
  Divider,
  Tag,
  Modal,
  Space
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileOutlined,
  LinkOutlined,
  MenuOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SendOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DocDocument, getAttachs, getUsersProcess } from '../../../api/docDocumentApi';
import ContentAttachmentsStep from './components/Step2';
import { Helmet } from 'react-helmet-async';
import { getContentDnD } from '../../../api/dndApi';
import { searchUsers, User, UserSearch } from '../../../api/userApi';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

interface DetailPersonalDocProps {
  open: boolean;
  personalDoc?: DocDocument | null;
  onClose: () => void;
}
type Node = {
  id: string;
  type: string;
  props?: any;
};
const { Option } = Select;
const DetailPersonalDoc: React.FC<DetailPersonalDocProps> = ({
  open,
  personalDoc,
  onClose,
}) => {
  const { t } = useTranslation();
  const isOpen = personalDoc?.isActive;
  const label = isOpen ? t('common.open') : t('common.locked');
  const color = isOpen ? 'green-inverse' : 'volcano-inverse';
  const icon = isOpen ? CheckCircleOutlined : ExclamationCircleOutlined;
  const [responses, setResponses] = React.useState<Record<string, any>>({});
  const [schema, setSchema] = React.useState<Node[] | null>();
  // const [approveSteps, setApproveSteps] = React.useState<any[] | null>();
  const [title, setTitle] = React.useState<string | null>();
    const [activePreview, setActivePreview] = useState<{
      index: number;
      values: any;
      key: string | number;
    } | null>(null);
    const [form] = Form.useForm();
    const loadSchema = async () => {
            if (!personalDoc?.docTemplateId ) return;
        let mounted = true;
        (async () => {
          try {
            console.debug('[SurveyRunner] fetching schema for id=', personalDoc?.docTemplateId);
            const resp: any = await getContentDnD(personalDoc?.docTemplateId as string);
            console.debug('[SurveyRunner] getContentDnD response:', resp);
    
            if (resp && resp.success === false) {
              if (mounted) setSchema(null);
              return;
            }
    
            let content: any = resp?.object ?? resp?.data?.content ?? resp?.content ?? resp?.data ?? resp;
    
            if (content == null) {
              if (mounted) setSchema(null);
              return;
            }
    
            if (typeof content === 'string') {
              try {
                content = JSON.parse(content);
              } catch (e) {
                if (mounted) setSchema(null);
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
             if (title) setTitle(title);
              console.debug('[SurveyRunner] normalized schema:', normalized, 'title=', title);
              let formData=personalDoc.formData;
              const formObj = JSON.parse(formData);
              if(formData){
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
            if (mounted)   setSchema(null);
           
          }
        })();
        return () => {
          mounted = false;
        };
    };
    const loadUsersProcess = async () => {
          try {
            const res = await getUsersProcess(personalDoc?.id);
            if (res?.status === 200 && res?.object) {
                 const normalized = res.object.map((item: any, index: number) => ({
                  id: item.id ?? null,
                  userId: item.userId ?? null,
                  deptName: item.deptName ?? "",
                  deptId: item.deptId ?? null,
    
                  roleId: item.roleId ?? null,   // 🔥 sửa đúng field
                  approvalType: item.approveType ?? "sequential", // 🔥 backend là approveType
                  note: item.note ?? "",
    
                  step: item.step === "--" ? "--" : Number(item.step) || index + 1,
                }));
                //  setApproveSteps(normalized);
                 form.setFieldsValue({ approvalSteps: normalized });
            }
          } catch (err) {
            console.error(err);
          } finally {
          }
        };
    useEffect(() => {
      loadSchema();
      loadAttachs();
      getUsers();
      loadUsersProcess();
      resetOptionsRole();
    }, [open]);
      const approvalTypeOptions = [
        { label: 'Tuần tự', value: 'sequential' },
        { label: 'Song song', value: 'parallel' },
      ];
    
      const [users, setUsers] = useState<User[]>([]);
    const [rowRoleOptions, setRowRoleOptions] = useState<Record<number, any[]>>({});
    
function resetOptionsRole() {
     const approveStep=form.getFieldValue("approvalSteps")|| [];
    if (!approveStep || users.length === 0) return;

    const map: Record<number, any[]> = {};

    approveStep.forEach((step: any, rowIndex: number) => {
      const user = users.find((n) => n.id === step.userId);
      map[rowIndex] = user?.lstRole || [];
    });

    setRowRoleOptions(map);
}
    const files: UploadFile[] = form.getFieldValue("files") || [];

    const handlePreview = (file: UploadFile) => {
      if (file.type?.startsWith("image/")) {
        const url =
          file.url ||
          (file.originFileObj ? URL.createObjectURL(file.originFileObj) : '');
        const img = new Image();
        img.src = url;
        const imgWindow = window.open(url);
        imgWindow?.document.write(img.outerHTML);
      }
    };

    const columns = [
      { title: t('doc.personalDoc.content&attachments'), dataIndex: 'name', key: 'name' }
    ];

  const loadAttachs= async ()=>{
        try{
          if(personalDoc?.id){
              const res=await getAttachs(personalDoc?.id);
              if(res.status===200){
                console.log(res.object);
                const list = res.object.map((f:any) => ({
                    uid: f.id.toString(),
                    name: f.attachName,
                    url: '',
                    status: "done",
                    size: f.size ?? 0,
                  }));
  
                  form.setFieldsValue({
                    files: list,
                  });
              }
          }
        }catch{
          console.log("load attach error");
        }
      } ;
      const getUsers = async () => {
        try {
          const payload: UserSearch = {
            page: 0,
            size: -1,
            status: 1,
          };
          const res = await searchUsers(payload);
          if (res.status === 200) {
            setUsers(res.object.content || []);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
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
            />
          );
        case 'InputNumber':
          return (
            <InputNumber
              style={{ width: '100%' }}
              defaultValue={p.value || 0}
            />
          );
        case 'TextArea':
          return (
            <Input.TextArea
              rows={p.rows ?? 3}
              defaultValue={p.value}
            />
          );
        case 'DatePicker':
          return <DatePicker  />;
        case 'Select':
          return (
            <Select style={{ width: '100%' }} >
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
             
            >
              {p.label}
            </Checkbox>
          );
        case 'Radio':
          return (
            <Radio.Group >
              {(p.options || []).map((opt: any) => (
                <Radio key={opt} value={opt}>
                  {opt}
                </Radio>
              ))}
            </Radio.Group>
          );
        case 'Switch':
          return <Switch defaultChecked={!!p.checked} />;
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
  return (
    <Modal
      centered
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 18 }}>
            {t('doc.docDetail', { name: personalDoc?.title })}
          </span>
          {personalDoc && (
            <Tag
              color={color}
              icon={createElement(icon)}
              style={{
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              {label}
            </Tag>
          )}
        </div>
      }
      open={open}
      width={900}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common.Close')}
        </Button>,
      ]}
    >
      <Divider
        style={{
          margin: '8px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
            {personalDoc ? (
        <div style={{ lineHeight: 1.8 }}>
           <p>
            <strong>{t('doc.personalDoc.sampleContent')}:</strong> {personalDoc.docTemplateName}
          </p>
          <p>
            <strong>{t('doc.personalDoc.docType')}:</strong> {personalDoc.docTypeName}
          </p>
           <p>
            <strong>{t('doc.personalDoc.title')}:</strong> {personalDoc.documentTitle}
          </p>
          <p>
            <strong>{t('department.department')}:</strong> {personalDoc.deptName}
          </p>
           <p>
            <strong>{t('doc.personalDoc.purpose')}:</strong> {personalDoc.purpose}
          </p>
        </div>

      ) : (
        <p>{t('common.DataNotFound')}</p>
      )}
      <Helmet>
        <title>{title}</title>
      </Helmet>
      {/* <Form.Item name="schemaTitle">{form.getFieldValue("schemaTitle")}</Form.Item> */}
      <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.schema !== currentValues.schema}>
        {({ getFieldValue }) => {
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {schema?.map((node: Node) => (
                <div key={node.id} style={{ padding: 8, border: "1px solid #eee" }}>
                  {renderNodeAsInput(node)}
                </div>
              ))}
            </div>
          );
        }}
      </Form.Item>
    <Form form={form}>
      {/* tiep dinh kem */}
      {/* <p> 
        <strong>
         {t('doc.personalDoc.content&attachments')}
         </strong>
      </p> */}
      <Table
        columns={columns}
        dataSource={files}
        rowKey="uid"
        pagination={false}
        size="small"
        style={{ marginTop: 12 }}
      />
      {/* nguoi xu ly */}
      <p> 
        <strong>
         {t('doc.personalDoc.approvalProcess')}
         </strong>
      </p>

       <Form.List name="approvalSteps">
        {(fields) => {
          const ids = fields.map((f) => f.key);
          const mainColumns = [
            {
              title: t('doc.personalDoc.step'),
              key: 'step',
              render: (_: any, field: any, index: number) => {
                const approvalSteps = form.getFieldValue("approvalSteps") || [];
                return (
                  <Space>
                    {approvalSteps[index]?.step ?? index + 1}
                  </Space>
                );
              }
            },

            {
              title: (
                <span>
                  <span style={{ color: 'red' }}>*</span>{' '}
                  {t('doc.personalDoc.userName')}
                </span>
              ),
              dataIndex: 'userId',
              key: 'userId',
              render: (_: any, field: any, index: number) => {
                const approvalSteps = form.getFieldValue("approvalSteps") || [];
                const userId = approvalSteps[index]?.userId;

                const user = users.find((u) => u.id === userId);

                return <span>{user?.fullName ?? "--"}</span>;
              },

            },
            {
              title: t('doc.personalDoc.department'),
              dataIndex: 'deptName',
              key: 'deptName',
              render: (_: any, field: any) => (
                <Form.Item
                  name={[field.name, 'deptName']}
                  style={{ marginBottom: 0, width: '100%' }}
                >
                  <label
                    placeholder={t('doc.personalDoc.department')}
                  />
                </Form.Item>
              ),
            },
            {
              title: (
                <span>
                  <span style={{ color: 'red' }}>*</span> {t('sidebar.role')}
                </span>
              ),
              dataIndex: 'roleId',
              key: 'roleId',
              render: (_: any, field: any, index: number) => {
              const approvalSteps = form.getFieldValue("approvalSteps") || [];
              const roleId = approvalSteps[index]?.roleId;
              const optionsForRow = rowRoleOptions[index] || [];
              const role = optionsForRow.find((r) => r.id === roleId);

              return <span>{role?.roleName ?? "--"}</span>;
            }
            },
            {
              title: (
                <span>
                  <span style={{ color: 'red' }}>*</span>{' '}
                  {t('doc.personalDoc.approvalType')}
                </span>
              ),
              dataIndex: 'approvalType',
              key: 'approvalType',
              render: (_: any, field: any, index: number) => {
              const approvalSteps = form.getFieldValue("approvalSteps") || [];
              const value = approvalSteps[index]?.approvalType;
              const label = approvalTypeOptions.find((o) => o.value === value)?.label;
              
              return <span>{label ?? "--"}</span>;
            }

            },
            {
              title: t('doc.personalDoc.note'),
              dataIndex: 'note',
              key: 'note',
              render: (_: any, field: any, index: number) => {
                const approvalSteps = form.getFieldValue("approvalSteps") || [];
                const note = approvalSteps[index]?.note;
                return <span>{note ?? "--"}</span>;
              }
            },
          ];

          // cột cho DragOverlay (readonly, lấy từ activePreview.values)
          const overlayColumns = [
            {
              key: 'step',
              width: '10%',
              render: (_: any, __: any, index: number) => (
                <Space>
                  <MenuOutlined style={{ color: '#aaa' }} />
                  <span>
                    {t('doc.personalDoc.step')}{' '}
                    {activePreview ? activePreview.index + 1 : index + 1}
                  </span>
                </Space>
              ),
            },
            {
              key: 'userId',
              render: (_: any, record: any) => {
                const v = record.userId;
                const found = users.find((u) => String(u.value) === String(v));
                return <span>{found ? found.label : v || '-'}</span>;
              },
            },
            {
              key: 'deptName',
              render: (_: any, record: any) => (
                <span>{record.deptName || '-'}</span>
              ),
            },
            {
              key: 'roleId',
              render: (_: any, record: any, index: number) => {
                const v = record.roleId;
                // Lấy roleOptions tương ứng với row hiện tại (activePreview.index nếu dùng DragOverlay)
                const optionsForRow = rowRoleOptions[activePreview?.index ?? index] || [];
                const found = optionsForRow.find((o) => String(o.value) === String(v));
                return <span>{found ? found.label : v || '-'}</span>;
              },
            },
            {
              key: 'approvalType',
              render: (_: any, record: any) => {
                const v = record.approvalType;
                const found = approvalTypeOptions.find(
                  (o) => String(o.value) === String(v)
                );
                return <span>{found ? found.label : v || '-'}</span>;
              },
            },
            {
              key: 'note',
              render: (_: any, record: any) => (
                <span>{record.note || '-'}</span>
              ),
            },
          ];

          // dữ liệu preview: nếu có activePreview lấy giá trị, nếu không thì mảng rỗng
          const overlayData = activePreview ? [activePreview.values || {}] : [];

          return (
            <>
              <DndContext
                
              >
                <SortableContext
                  items={ids}
                >
                  <Table
                    pagination={false}
                    dataSource={fields}
                    rowKey="key"
                    size="small"
                    tableLayout="fixed"
                    columns={mainColumns}
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

                {/* Drag preview overlay: hiển thị như 1 hàng thực (readonly) */}
                <DragOverlay>
                  {activePreview ? (
                    <div
                      style={{
                        background: '#fff',
                        padding: 4,
                        borderRadius: 6,
                        boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
                        border: '1px solid #eee',
                        width: '100%',
                        // ensure overlay appears above content
                        zIndex: 9999,
                      }}
                    >
                      <Table
                        columns={overlayColumns as any}
                        dataSource={overlayData}
                        pagination={false}
                        showHeader={false}
                        rowKey={() => 'preview-row'}
                        size="small"
                        style={{ margin: 0 }}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          );
        }}
      </Form.List>
      </Form>
    </Modal>
  );
};

export default DetailPersonalDoc;
