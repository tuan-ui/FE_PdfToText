import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Row,
  Col,
  Button,
  Space,
  Select,
  Switch,
  Upload,
  message,
  Empty,
  Divider,
  Popconfirm,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  UploadOutlined,
  FileWordOutlined,
  EyeOutlined,
  DeleteOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import {
  createTemp,
  deleteTemp,
  getCollaboraUrl,
  saveFromTemp,
  unlockFile,
  uploadFile,
} from '../../api/collabora';
import { DocType, getAllDocType } from '../../api/docTypeApi';
import { removeAccents, sanitizeInput } from '../../utils/stringUtils';
import AddPermissionModal from './AddPermissionModal';
import { DocumentTemplate } from '../../api/documentTemplateApi';

interface AddDocumentTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (values: any) => Promise<boolean>;
  documentTemplateData?: any;
}

interface UploadedFile {
  key: string;
  name: string;
  url: string;
  wopiUrl?: string;
  attachFileId?: string;
  status: 'uploading' | 'done' | 'error';
}

export const AddDocumentTemplateModal: React.FC<
  AddDocumentTemplateModalProps
> = ({ open, onClose, onSubmit, documentTemplateData }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [loadingDocType, setLoadingDocType] = useState(false);
  const [tempFileId, setTempFileId] = useState<string | null>(null);
  const [lockValue, setLockValue] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [collaboraUrl, setCollaboraUrl] = useState<string | null>(null);
  const [openPermission, setOpenPermission] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<{
    allowedEditors: string[];
    allowedViewers: string[];
  }>({
    allowedEditors: documentTemplateData?.allowedEditors || [],
    allowedViewers: documentTemplateData?.allowedViewers || [],
  });

  useEffect(() => {
    if (documentTemplateData) {
      setTempPermissions({
        allowedEditors: documentTemplateData.allowedEditors || [],
        allowedViewers: documentTemplateData.allowedViewers || [],
      });
    }
  }, [documentTemplateData]);

  useEffect(() => {
    if (open && !collaboraUrl) {
      getCollaboraUrl().then((url) => {
        if (url) setCollaboraUrl(url);
        else message.error(t('common.CollaboraUrlNotFound'));
      });
    }
  }, [open, collaboraUrl, t]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setUploadedFile(null);
      return;
    }

    if (documentTemplateData) {
      const initialValues = {
        documentTemplateCode: documentTemplateData.documentTemplateCode || '',
        documentTemplateName: documentTemplateData.documentTemplateName || '',
        documentTemplateDescription:
          documentTemplateData.documentTemplateDescription || '',
        documentType: documentTemplateData.documentTypeId || undefined,
        isActive: documentTemplateData.isActive ?? true,
      };
      form.setFieldsValue(initialValues);

      // LOAD FILE CŨ TỪ API
      if (documentTemplateData?.attachFile) {
        const file = documentTemplateData.attachFile;
        setUploadedFile({
          key: uuidv4(),
          name: file.attachName || 'file.docx',
          url: file.attachPath || '',
          wopiUrl: file.attachPath || '',
          attachFileId: file.id,
          status: 'done' as const,
        });
      } else {
        setUploadedFile(null);
      }
    } else {
      const defaultValues = {
        documentTemplateCode: '',
        documentTemplateName: '',
        documentTemplateDescription: '',
        documentType: undefined,
        isActive: 1, // MẶC ĐỊNH LÀ 1 (true)
      };
      form.setFieldsValue(defaultValues);
      setUploadedFile(null);
    }
  }, [open, documentTemplateData, form]);

  useEffect(() => {
    setLoadingDocType(true);
    const getDocType = async () => {
      try {
        const res = await getAllDocType();
        if (res.status === 200) {
          setDocTypes(res.object || []);
          const selectedDocTypes = res.object.filter(
            (r: DocType) =>
              documentTemplateData?.documentTypeIds?.some(
                (ur: string) => ur === r.id
              )
          );
          form.setFieldValue(
            'documentTypeIds',
            selectedDocTypes.map((r: DocType) => r.id)
          );
        }
      } catch (error) {
        console.error('Error setting docType:', error);
      } finally {
        setLoadingDocType(false);
      }
    };
    getDocType();
  }, [documentTemplateData, open]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // 1. Lấy documentTypeId
      const documentTypeId = form.getFieldValue('documentTypeIds');
      if (!documentTypeId) {
        message.error(t('documentTemplate.RequiedDocType'));
        return;
      }
      values.documentTypeId = documentTypeId;

      const isActive = form.getFieldValue('isActive');
      values.isActive = isActive !== undefined ? isActive : true;

      // 2. Kiểm tra file bắt buộc (khi thêm mới)
      if (!documentTemplateData && !uploadedFile?.attachFileId) {
        message.error(t('common.PleaseUploadFile'));
        return;
      }

      // 3. Gắn attachFileId nếu có file mới
      if (uploadedFile?.status === 'done' && uploadedFile.attachFileId) {
        values.attachFileId = uploadedFile.attachFileId;
        values.fileName = uploadedFile.name;
        values.wopiUrl = uploadedFile.wopiUrl;
      }
      // Nếu là edit và không thay file → giữ nguyên attachFileId cũ
      else if (documentTemplateData?.attachFileId) {
        values.attachFileId = documentTemplateData.attachFileId;
      }

      // 4. Gắn version nếu edit
      if (documentTemplateData?.id) {
        values.id = documentTemplateData.id;
        values.version = documentTemplateData.version;
      }

      if (tempPermissions?.allowedEditors) {
        values.allowedEditors = tempPermissions.allowedEditors;
      }
      if (tempPermissions?.allowedViewers) {
        values.allowedViewers = tempPermissions.allowedViewers;
      }

      setSaving(true);
      const success = await onSubmit?.(values);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      console.warn('Validation failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (form.isFieldsTouched()) {
      Modal.confirm({
        title: t('common.NotifyCancelChange'),
        onOk: () => {
          form.resetFields();
          setUploadedFile(null);
          onClose();
        },
        okText: t('common.yes'),
        centered: true,
        cancelText: t('common.no'),
      });
    } else {
      onClose();
    }
  };

  const handleFileChange = (file: File) => {
    if (uploadedFile) {
      Modal.confirm({
        title: t('common.ConfirmReplaceFile'),
        content: (
          <div>
            <p
              dangerouslySetInnerHTML={{
                __html: t('common.FileExists', {
                  name: `<strong>${uploadedFile.name}</strong>`,
                  file: `<strong>${file.name}</strong>`,
                }),
              }}
            />
          </div>
        ),
        okText: t('common.Replace'),
        okType: 'danger',
        cancelText: t('common.Close'),
        onOk: () => uploadNewFile(file),
        centered: true,
        width: 480,
      });
    } else {
      uploadNewFile(file);
    }
  };

  const uploadNewFile = async (file: File) => {
    const key = uuidv4();
    const newFile: UploadedFile = {
      key,
      name: file.name,
      url: '',
      wopiUrl: undefined,
      attachFileId: undefined,
      status: 'uploading' as const,
    };
    setUploadedFile(newFile);

    try {
      const response = await uploadFile(file);

      if (response?.status === 200 && response?.id) {
        const fileId = response.id;
        const wopiUrl = response.url;

        const updatedFile: UploadedFile = {
          ...newFile,
          url: wopiUrl,
          wopiUrl: wopiUrl,
          attachFileId: fileId,
          status: 'done' as const,
        };

        setUploadedFile(updatedFile);
        message.success(t('common.uploadedSuccess', { fileName: file.name }));
      } else {
        throw new Error('Upload failed or missing file ID');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadedFile({ ...newFile, status: 'error' as const });
      message.error(t('common.uploadedFaild', { fileName: file.name }));
    }
  };

  const handleDeleteFile = () => {
    Modal.confirm({
      title: t('common.ConfirmDelete'),
      content: t('documentTemplate.ConfirmDeleteFile'),
      okText: t('common.Delete'),
      okType: 'danger',
      cancelText: t('common.Close'),
      onOk: () => {
        setUploadedFile(null);
        message.success(t('common.FileDeleted'));
      },
      centered: true,
    });
  };

  const openViewer = async () => {
    if (!uploadedFile?.attachFileId || !collaboraUrl) {
      message.error(t('common.CantOpenTempFile'));
      return;
    }

    try {
      const data = await createTemp(uploadedFile.attachFileId);
      if (data && data?.id && data?.url) {
        setTempFileId(data.id);
        setViewerUrl(data.url);
        setLockValue(data.lockValue);
        setIsModified(data.isModified);
        setHasUnsavedChanges(false);
        setViewerVisible(true);
      } else if (data === '432') message.error(t('common.error432'));
      else if (data === '403') message.error(t('common.error403'));
      else {
        message.error(t('common.CantOpenTempFile'));
      }
    } catch (error) {
      message.error(t('common.CantOpenTempFile'));
    }
  };
  useEffect(() => {
    if (!viewerVisible || !collaboraUrl) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(collaboraUrl).origin) return;

      const data = event.data;
      if (typeof data === 'string') {
        try {
          const msg = JSON.parse(data);
          if (
            msg.MessageId === 'App_LoadingStatus' &&
            msg.Values?.Status === 3
          ) {
            setHasUnsavedChanges(true);
          }
        } catch {}
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [viewerVisible, collaboraUrl]);

  const saveChanges = async () => {
    if (!tempFileId || !lockValue) return;

    const { success } = await saveFromTemp(tempFileId, lockValue);
    if (success) {
      setIsModified(true);
      setHasUnsavedChanges(false);
      message.success(t('common.Saved'));
    } else {
      message.error(t('common.SaveFailed'));
    }
  };

  const closeViewer = async () => {
    const fileId =
      documentTemplateData?.attachFileId || uploadedFile?.attachFileId;

    if (fileId && lockValue) {
      await unlockFile(fileId, lockValue);
    }
    if (tempFileId) {
      await deleteTemp(tempFileId);
    }

    setViewerVisible(false);
    setTempFileId(null);
    setLockValue(null);
    setIsModified(false);
    setHasUnsavedChanges(false);
  };

  const handleViewerClose = () => {
    // Nếu đã lưu → đóng ngay
    if (isModified && !hasUnsavedChanges) {
      closeViewer();
      return;
    }

    // Nếu có thay đổi chưa lưu → hỏi
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: t('common.SaveChange'),
        content: t('common.NotiSave'),
        okText: t('common.Save'),
        cancelText: t('common.Close'),
        onOk: async () => {
          await saveChanges();
          await closeViewer();
        },
        onCancel: async () => {
          await closeViewer();
        },
        footer: (_, { OkBtn, CancelBtn }) => (
          <>
            <Button onClick={() => Modal.destroyAll()}>
              {t('common.ContinueEdit')}
            </Button>
            <CancelBtn />
            <OkBtn />
          </>
        ),
      });
    } else {
      closeViewer();
    }
  };

  const handleAssignPermission = async (
    editors: string[],
    viewers: string[]
  ): Promise<boolean> => {
    setTempPermissions({ allowedEditors: editors, allowedViewers: viewers });
    message.success(t('documentTemplate.PermissionSavedLocally'));
    return true;
  };

  const uploadProps = {
    accept: '.docx',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file: File) => {
      handleFileChange(file);
      return false;
    },
  };

  return (
    <>
      <Modal
        centered
        title={
          documentTemplateData
            ? t('documentTemplate.EditDocumentTemplate')
            : t('documentTemplate.AddDocumentTemplate')
        }
        open={open}
        onCancel={handleCancel}
        width={960}
        footer={
          <Space>
            <Button onClick={handleCancel}>{t('common.Close')}</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              {t('common.Save')}
            </Button>
          </Space>
        }
        destroyOnClose
      >
        <Divider style={{ margin: '12px 0 20px' }} />

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('documentTemplate.DocumentTemplateCode')}
                name="documentTemplateCode"
                validateTrigger="onChange"
                rules={[
                  {
                    required: true,
                    message: t('documentTemplate.RequiedCode'),
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const sanitized = sanitizeInput(value);
                      if (sanitized.length < 2 || sanitized.length > 50) {
                        return Promise.reject(
                          new Error(
                            t('common.lengthBetween', { min: 2, max: 50 })
                          )
                        );
                      }
                      const regex = /^[A-Z][A-Z0-9_\-]*$/;
                      if (!regex.test(sanitized)) {
                        return Promise.reject(
                          new Error(t('originData.domain.InvalidCodeFormat'))
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder={t('documentTemplate.SelectDocTemplateName')}
                  maxLength={50}
                  disabled={!!documentTemplateData}
                  onChange={(e) => {
                    let value = e.target.value || '';
                    value = removeAccents(value);
                    value = value.replace(/\s+/g, '');
                    value = value.toUpperCase();
                    form.setFieldsValue({ domainCode: value });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('documentTemplate.DocumentTemplateName')}
                name="documentTemplateName"
                validateTrigger="onChange"
                rules={[
                  {
                    required: true,
                    message: t('documentTemplate.RequiedName'),
                  },
                  {
                    validator: (_, value) => {
                      const sanitized = sanitizeInput(value);
                      if (sanitized.length < 2 || sanitized.length > 255) {
                        return Promise.reject(
                          new Error(
                            t('common.lengthBetween', { min: 2, max: 255 })
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder={t('documentTemplate.SelectDocTemplateCode')}
                  maxLength={255}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value);
                    form.setFieldsValue({ domainName: sanitized });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={t('documentTemplate.DocumentTemplateDescription')}
                name="documentTemplateDescription"
                validateTrigger="onChange"
                rules={[
                  {
                    validator: (_, value) => {
                      const sanitized = sanitizeInput(value);
                      if (sanitized.length > 500) {
                        return Promise.reject(
                          new Error(t('common.maxLength', { max: 500 }))
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.TextArea
                  placeholder={t(
                    'documentTemplate.SelectDocTemplateDescription'
                  )}
                  rows={4}
                  maxLength={500}
                  showCount={{ formatter: ({ count }) => `${count}/500` }}
                  autoSize={{ minRows: 3, maxRows: 8 }}
                  onChange={(e) => {
                    const sanitized = sanitizeInput(e.target.value);
                    form.setFieldsValue({ domainDescription: sanitized });
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="documentTypeIds"
                label={t('documentTemplate.DocumentType')}
                rules={[
                  {
                    required: true,
                    message: t('documentTemplate.RequiedDocType'),
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  maxTagCount="responsive"
                  loading={loadingDocType}
                  placeholder={t('documentTemplate.SelectDocType')}
                  optionFilterProp="label"
                  filterOption={(input, docTypes) =>
                    (docTypes?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={
                    docTypes?.map((r) => ({
                      value: r.id,
                      label: r.docTypeName,
                    })) || []
                  }
                  notFoundContent={
                    <Empty description={t('common.DataNotFound')} />
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('common.isActive')}
                name="isActive"
                valuePropName="checked"
              >
                <Switch
                  checked={form.getFieldValue('isActive') === 1}
                  onChange={(checked) => {
                    form.setFieldsValue({ isActive: checked ? 1 : 0 });
                  }}
                  checkedChildren={t('common.Check')}
                  unCheckedChildren={t('common.Uncheck')}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Drag & Drop + Hiển thị file */}
          <Form.Item label={t('common.UploadFile')} required>
            <Upload.Dragger {...uploadProps} height={140}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">
                {t('common.DragFileHereOrClick')}
              </p>
              <p className="ant-upload-hint"> {t('common.uploadFileHint')}</p>
            </Upload.Dragger>

            {uploadedFile && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background:
                    uploadedFile.status === 'done' ? '#f6ffed' : '#fff2f0',
                  border: '1px dashed #d9d9d9',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Tên file + icon Word */}
                <Space>
                  <FileWordOutlined
                    style={{ fontSize: 20, color: '#1890ff' }}
                  />
                  <span
                    style={{
                      fontWeight: 500,
                      maxWidth: 400,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {uploadedFile.name}
                  </span>
                </Space>

                <Space>
                  {uploadedFile.status === 'uploading' && (
                    <span style={{ color: '#1890ff', fontSize: 13 }}>
                      {t('common.uploading')}
                    </span>
                  )}

                  {uploadedFile.status === 'error' && (
                    <span style={{ color: '#ff4d4f', fontSize: 13 }}>
                      {t('common.uploadFailed')}
                    </span>
                  )}

                  {uploadedFile.status === 'done' && (
                    <>
                      <Button
                        type="link"
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={() => setOpenPermission(true)}
                      />

                      <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={openViewer}
                        style={{ color: '#1890ff' }}
                      />

                      <Popconfirm
                        title={t('common.Delete')}
                        description={t('common.ConfirmDelete')}
                        onConfirm={handleDeleteFile}
                        okText={t('common.Delete')}
                        okType="danger"
                        cancelText={t('common.Close')}
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </>
                  )}
                </Space>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* Viewer Modal */}
      <Modal
        title={t('documentTemplate.PreviewDocument')}
        open={viewerVisible}
        onCancel={handleViewerClose}
        footer={null}
        width="95vw"
        style={{ top: 0 }}
        styles={{
          body: { height: '85vh', padding: 0 },
        }}
        destroyOnClose
        centered
      >
        <iframe
          src={viewerUrl}
          title="Document Viewer"
          style={{ width: '100%', height: '100%', border: 'none' }}
          allowFullScreen
        />
      </Modal>
      <AddPermissionModal
        open={openPermission}
        currentEditors={tempPermissions.allowedEditors}
        currentViewers={tempPermissions.allowedViewers}
        onClose={() => setOpenPermission(false)}
        onSubmit={handleAssignPermission}
        getContainer={() => document.body}
        currentFileId={uploadedFile?.attachFileId}
      />
    </>
  );
};

export default AddDocumentTemplateModal;
