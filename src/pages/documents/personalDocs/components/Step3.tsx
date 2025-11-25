import React, { createContext, useContext, useEffect, useState } from 'react';
import { Form, Select, Input, Button, Table, Space, Empty } from 'antd';
import { DeleteOutlined, PlusOutlined, MenuOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { StepContent } from '../interface/Step';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, UserSearch, searchUsers } from '../../../../api/userApi';
import { getAllRole, Role } from '../../../../api/roleApi';
import { getUsersProcess } from '../../../../api/docDocumentApi';

type DragHandleContextValue = {
  attributes: any;
  listeners: any;
} | null;

const DragHandleContext = createContext<DragHandleContextValue>(null);

const DragHandle: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const drag = useContext(DragHandleContext);
  return (
    <MenuOutlined
      {...(drag ? { ...drag.attributes, ...drag.listeners } : {})}
      style={{ cursor: 'grab', color: '#aaa', ...style }}
    />
  );
};

const SortableRow: React.FC<any> = ({
  children,
  'data-row-key': id,
  ...rest
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <DragHandleContext.Provider value={{ attributes, listeners }}>
      <tr ref={setNodeRef as any} style={style} {...rest}>
        {children}
      </tr>
    </DragHandleContext.Provider>
  );
};

const ApprovalProcessStep: React.FC<StepContent> = ({ form ,personalDocEdit}) => {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<{
    index: number;
    values: any;
    key: string | number;
  } | null>(null);
  const [users, setUsers] = useState<User[]>([]);

const [rowRoleOptions, setRowRoleOptions] = useState<Record<number, any[]>>({});

  // const [usersProcess, setUsersProcess] = useState<[]>([]);

  // form.setFieldsValue({approvalSteps: usersProcess,});
  const approvalTypeOptions = [
    { label: 'Tuần tự', value: 'sequential' },
    { label: 'Song song', value: 'parallel' },
  ];

  const sensors = useSensors(useSensor(PointerSensor));

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
    // const getRoles = async () => {
    //   try {
    //     const res = await getAllRole();
    //     if (res?.status === 200 && res?.object) {
    //       setRoleOptions(res.object);
    //     }
    //   } catch (err) {
    //     console.error(err);
    //   } finally {
    //   }
    // };

  useEffect(() => {
    getUsers();
    // getRoles();
    // loadUsersProcess();
  }, []);
  const handleApprovalTypeChange = (value: string, rowIndex: number) => {
    const rows = form.getFieldValue("approvalSteps") || [];

    // Cập nhật approvalType và step của row hiện tại
    rows[rowIndex].approvalType = value;
    rows[rowIndex].step = value === "parallel" ? "--" : null; // để null tạm
    resetIndexStep();
    form.setFieldsValue({
      approvalSteps: rows,
    });
  };
  useEffect(() => {
    resetOptionsRole();
  }, [personalDocEdit, users]);

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
const handleChangeUser = (value: string, rowIndex: number) => {
  // Lấy user mới chọn
  const user = users?.find((n) => n.id === value);
  const lstRole = user?.lstRole || [];

  // Cập nhật roleOptions riêng cho row
  setRowRoleOptions((prev) => ({
    ...prev,
    [rowIndex]: lstRole,
  }));

  // Reset roleId đang chọn trong form
  form.setFields([
    { name: ['approvalSteps', rowIndex, 'roleId'], value: null }
  ]);
};

  function resetIndexStep(){
        const rows = form.getFieldValue("approvalSteps") || [];
        // Đánh lại step cho tất cả row không phải parallel
      let counter = 1;
      rows.forEach((row:any) => {
        if (row.step !== "--") {
          row.step = counter;
          counter++;
        }
      });
  }

  return (
    <Form form={form} wrapperCol={{ span: 24 }}>
      <Form.List name="approvalSteps">
        {(fields, { add, remove, move }) => {
          const ids = fields.map((f) => f.key);

          const handleDragStart = (event: DragStartEvent) => {
            const activeKey = String(event.active.id);
            setActiveId(activeKey);

            // tìm index trong fields để lấy giá trị tương ứng từ form
            const idx = fields.findIndex((f) => String(f.key) === activeKey);
            const allValues = form.getFieldValue('approvalSteps') || [];
            const values = allValues?.[idx] || {};

            setActivePreview({
              index: idx,
              values,
              key: activeKey,
            });
          };

          const handleDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);
            setActivePreview(null);
            if (!over) return;
            if (active.id === over.id) return;

            const oldIndex = fields.findIndex((f) => f.key === active.id);
            const newIndex = fields.findIndex((f) => f.key === over.id);
            if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex);
            resetIndexStep();
            resetOptionsRole();
          };

          // cấu trúc cột cho table chính (giữ nguyên render Form.Item)
          const mainColumns = [
            {
              title: t('doc.personalDoc.step'),
              key: 'step',
              render: (_: any, field: any, index: number) => {
                const approvalSteps = form.getFieldValue("approvalSteps") || [];
                return (
                  <Space>
                    <DragHandle />
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
              render: (_: any, field: any) => (
                <Form.Item
                  name={[field.name, 'userId']}
                  rules={[
                    {
                      required: true,
                      message: t('doc.personalDoc.userNamePlaceholder'),
                    },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    showSearch
                    placeholder={t('doc.personalDoc.userNamePlaceholder')}
                    options={users.map((u) => ({
                      label: u.fullName,
                      value: u.id,
                    }))}
                    onChange={(value) => handleChangeUser(value, field.name)}
                  />
                </Form.Item>
              ),
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
                  <Input
                    disabled
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
              render: (_: any, field: any) => (
                <Form.Item
                  name={[field.name, 'roleId']}
                  rules={[{ required: true, message: t('user.selectRoles') }]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={t('user.selectRoles')}
                     options={(rowRoleOptions[field.name] || []).map((r) => ({
                      label: r.roleName,
                      value: r.id,
                    }))}
                    // onChange={(value) => handleApprovalTypeChange(value, field.name)}
                  />
                </Form.Item>
              ),
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
              render: (_: any, field: any) => (
                <Form.Item
                  name={[field.name, 'approvalType']}
                  initialValue={approvalTypeOptions[0].value}
                  rules={[
                    {
                      required: true,
                      message: t('doc.personalDoc.approvalTypePlaceholder'),
                    },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    placeholder={t('doc.personalDoc.approvalTypePlaceholder')}
                    options={approvalTypeOptions}
                    onChange={(value) => handleApprovalTypeChange(value, field.name)}

                  />
                </Form.Item>
              ),
            },
            {
              title: t('doc.personalDoc.note'),
              dataIndex: 'note',
              key: 'note',
              render: (_: any, field: any) => (
                <Form.Item
                  name={[field.name, 'note']}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder={t('doc.personalDoc.notePlaceholder')} />
                </Form.Item>
              ),
            },
            {
              title: '',
              key: 'action',
              width: '5%',
              render: (_: any, field: any) => (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    remove(field.name);
                    resetIndexStep();
                    }
                  }
                />
              ),
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
            {
              key: 'action',
              width: '5%',
              render: () => (
                <DeleteOutlined style={{ color: '#f5222d', opacity: 0.6 }} />
              ),
            },
          ];

          // dữ liệu preview: nếu có activePreview lấy giá trị, nếu không thì mảng rỗng
          const overlayData = activePreview ? [activePreview.values || {}] : [];

          return (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={ids}
                  strategy={verticalListSortingStrategy}
                >
                  <Table
                    pagination={false}
                    dataSource={fields}
                    rowKey="key"
                    size="small"
                    tableLayout="fixed"
                    components={{
                      body: {
                        row: SortableRow,
                      },
                    }}
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

              <Button
                type="dashed"
                 onClick={() => {
                  const approvalSteps = form.getFieldValue("approvalSteps") || [];
                  let currentStep = 1;
                  approvalSteps.forEach((row: any) => {
                    if (row.step !== "--") currentStep++;
                  });
                  const newRow = {
                    userId: null,
                    deptName: '',
                    roleId: null,
                    approvalType: approvalTypeOptions[0].value, // mặc định sequential
                    note: '',
                    step: currentStep,
                  };
                  add(newRow); // add row mới với step đã chuẩn
                }}
                icon={<PlusOutlined style={{ fontSize: 14, verticalAlign: 'middle' }}/>}
                block
                style={{ marginTop: 12 }}
              >
                {t('log.create')}
              </Button>
            </>
          );
        }}
      </Form.List>
    </Form>
  );
};

export default ApprovalProcessStep;
