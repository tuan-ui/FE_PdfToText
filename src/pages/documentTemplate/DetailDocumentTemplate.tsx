import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  Spin,
  Space,
  Typography,
  Divider,
  Button,
  message,
  Card,
  Grid,
  Drawer,
} from 'antd';
import { MenuOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DocType } from '../../api/docTypeApi';
import { getDocumentDetail } from '../../api/documentTemplateApi';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface DetailDocumentTemplateProps {
  open: boolean;
  onClose: () => void;
  documentTemplateData?: any;
}

const SideCard: React.FC<{ title: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => (
  <Card
    size="small"
    bordered={false}
    bodyStyle={{ padding: 12 }}
    style={{
      border: '2px solid rgba(100, 100, 100, 0.15)',
      borderRadius: 6,
    }}
  >
    <Title level={5} style={{ margin: 0 }}>
      {title}
    </Title>
    <Divider
      style={{
        margin: '12px 0',
        border: '1px solid rgba(100, 100, 100, 0.15)',
      }}
    />
    <div>{children}</div>
  </Card>
);

const DetailDocumentTemplate: React.FC<DetailDocumentTemplateProps> = ({
  open,
  onClose,
  documentTemplateData,
}) => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [selectedDocTypes, setSelectedDocTypes] = useState<DocType[]>([]);
  const [formSchema, setFormSchema] = useState<any>(null);
  const [selectedField, setSelectedField] = useState<any>(null);

  useEffect(() => {
    if (!open) {
      // QUAN TRỌNG: Reset tất cả state khi modal đóng
      setPreviewUrl('');
      setSelectedDocTypes([]);
      setLoading(false);
      setLeftOpen(false);
      setRightOpen(false);
      return;
    }

    // Khi mở modal → reset và load lại từ đầu
    setSelectedDocTypes([]);
    setLoading(true);

    const loadPreview = async () => {
      if (!documentTemplateData?.attachFile?.id) {
        setPreviewUrl('');
        setLoading(false);
        return;
      }

      try {
        const url = await getDocumentDetail(documentTemplateData.id);
        setPreviewUrl(url.object.wopiUrl);
        setSelectedDocTypes(url.object.documentTypes);
        let schema = null;

        try {
          schema = JSON.parse(url.object.formSchema.formContent || '{}');
        } catch (err) {
          console.error('Invalid formSchema JSON:', err);
          schema = { title: '', nodes: [] };
        }

        setFormSchema(schema);

        if (schema?.nodes?.length > 0) {
          setSelectedField(schema.nodes[0]);
        }
      } catch (err) {
        message.error(t('common.LoadDocumentFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [open, documentTemplateData, t]);

  // Build left & right contents as memoized to keep JSX tidy
  const leftContent = useMemo(
    () => (
      <Space direction="vertical" style={{ width: '100%' }}>
        <SideCard title={t('documentTemplate.generalInfo')}>
          <div style={{ marginBottom: 12 }}>
            <Text>{t('documentTemplate.DocumentTemplateName')}:</Text>
            <div style={{ marginTop: 6, fontWeight: 700 }}>
              {documentTemplateData?.documentTemplateName || '-'}
            </div>
          </div>

          <div>
            <Text>{t('documentTemplate.DocumentTemplateCode')}:</Text>
            <div style={{ marginTop: 6, fontWeight: 700 }}>
              {documentTemplateData?.documentTemplateCode || '-'}
            </div>
          </div>

          <div>
            <Text>{t('documentTemplate.DocumentTemplateDescription')}:</Text>
            <div style={{ marginTop: 6, fontWeight: 700 }}>
              {documentTemplateData?.documentTemplateDescription || '-'}
            </div>
          </div>
        </SideCard>

        <SideCard title={t('documentTemplate.DocumentTypeAttach')}>
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {loading ? (
              <Spin size="small" />
            ) : selectedDocTypes.length > 0 ? (
              selectedDocTypes.map((dt) => (
                <div
                  key={dt.id}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: 6,
                    width: '100%',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {dt.docTypeName}
                </div>
              ))
            ) : (
              <Text>-</Text>
            )}
          </div>
        </SideCard>
      </Space>
    ),
    [documentTemplateData, t, loading, selectedDocTypes]
  );

  const rightContent = useMemo(() => {
    if (!formSchema) return null;

    const fields = formSchema.nodes || [];

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* CARD 1: Danh sách trường */}
        {loading ? (
          <Spin size="small" />
        ) : (
          <SideCard title={t('documentTemplate.infoField')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fields.map((f: any) => {
                const isActive = selectedField?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedField(f)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      border: isActive
                        ? '1px solid #1890ff'
                        : '1px solid #e0e0e0',
                      background: isActive ? '#e6f7ff' : '#fff',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {f.props.label || '(No Label)'}
                  </div>
                );
              })}
            </div>
          </SideCard>
        )}

        {/* CARD 2: Chi tiết trường */}
        {selectedField && (
          <SideCard title={t('documentTemplate.informationAttribute')}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                fontSize: 14,
              }}
            >
              {/* Luôn hiện "key" đầu tiên */}
              {selectedField.props?.key && (
                <div>
                  <Text strong>{t('dnd.Key')}</Text>
                  <div style={{ marginTop: 6, fontWeight: 500 }}>
                    {String(selectedField.props.key)}
                  </div>
                </div>
              )}

              {/* Các field còn lại (trừ key) */}
              {Object.entries(selectedField.props || {})
                .filter(([k]) => k !== 'key')
                .map(([key, value]) => (
                  <div key={key}>
                    <Text strong>
                      {t('dnd.' + key.charAt(0).toUpperCase() + key.slice(1))}
                    </Text>
                    <div style={{ marginTop: 6 }}>{String(value || '-')}</div>
                  </div>
                ))}
            </div>
          </SideCard>
        )}
      </Space>
    );
  }, [formSchema, selectedField, t]);

  // If small screen (md === false), hide sidebars and use Drawer buttons
  const isSmall = !screens.md;

  return (
    <Modal
      title={
        <div
          style={{
            display: 'flex',
            gap: 12,
          }}
        >
          <div>
            {t('documentTemplate.PreviewDocument') || 'Xem trước tài liệu'}
          </div>

          {isSmall && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                icon={<MenuOutlined />}
                onClick={() => setLeftOpen(true)}
              />
              <Button
                icon={<InfoCircleOutlined />}
                onClick={() => setRightOpen(true)}
              />
            </div>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width="95vw"
      footer={null}
      destroyOnClose
      maskClosable={false}
      centered
      style={{ top: 0 }}
      styles={{
        body: {
          height: '90vh',
          padding: 0,
          display: 'flex',
          overflow: 'hidden',
        },
      }}
    >
      <div style={{ display: 'flex', width: '100%' }}>
        {/* LEFT: show only when not small */}
        {!isSmall && (
          <div
            style={{
              flex: '0 0 20%',
              minWidth: 260,
              background: '#fffffff',
              borderRight: '1px solid #e8e8e8',
              padding: 16,
              paddingLeft: 1,
              paddingTop: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {leftContent}
          </div>
        )}

        {/* CENTER */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: 'relative',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Spin spinning={loading} tip={t('common.Loading')} size="large">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title="Document Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                  minHeight: '90vh',
                }}
                allowFullScreen
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 16,
                  color: '#999',
                }}
              >
                <div style={{ fontSize: 48 }}>{t('common.NoFile')}</div>
                <Text type="secondary">{t('common.NoFileInfo')}</Text>
              </div>
            )}
          </Spin>
        </div>

        {/* RIGHT: show only when not small */}
        {!isSmall && (
          <div
            style={{
              flex: '0 0 20%',
              minWidth: 260,
              background: '#fffffff',
              borderLeft: '1px solid #e8e8e8',
              padding: 16,
              paddingRight: 1,
              paddingTop: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {rightContent}
          </div>
        )}

        {/* DRAWERS for small screens */}
        <Drawer
          title={t('documentTemplateData.generalInfo') || 'Thông tin'}
          placement="left"
          onClose={() => setLeftOpen(false)}
          open={leftOpen}
          width="80%"
        >
          <div style={{ padding: 8 }}>{leftContent}</div>
        </Drawer>

        <Drawer
          title={t('documentTemplateData.infoField') || 'Chi tiết'}
          placement="right"
          onClose={() => setRightOpen(false)}
          open={rightOpen}
          width="80%"
        >
          <div style={{ padding: 8 }}>{rightContent}</div>
        </Drawer>
      </div>
    </Modal>
  );
};

export default DetailDocumentTemplate;
