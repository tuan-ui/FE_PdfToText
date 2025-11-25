// src/pages/lowcode/LowcodeEditor.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Layout,
  Button,
  Input,
  message,
  Space,
  Tooltip,
  Spin,
} from 'antd';
import {
  UndoOutlined,
  RedoOutlined,
  DownloadOutlined,
  ExportOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import 'antd/dist/reset.css';
import { Palette } from './palette';
import { Canvas } from './Canvas';
import Inspector from './Inspector';
import { publishSchema, getContentDnD } from '../../api/dndApi';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const isUUID = (str: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

type LowcodeEditorModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (formId: string, formName: string) => void;
  recordId?: string | null;
};

type LowcodeEditorPageProps = {
  isModal?: false;
  recordId?: string;
};

type LowcodeEditorProps = LowcodeEditorModalProps | LowcodeEditorPageProps;

const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const removeNodeById = (list: any[], id: string): any[] => {
  return list.filter((node) => {
    if (node.id === id) return false;
    if (node.props?.children && Array.isArray(node.props.children)) {
      node.props.children = removeNodeById(node.props.children, id);
    }
    return true;
  });
};

export const LowcodeEditor: React.FC<LowcodeEditorProps> = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isModalMode = 'open' in props && props.open !== undefined;
  const recordId = isModalMode
    ? (props as LowcodeEditorModalProps).recordId
    : null;

  // ==== STATE ====
  const [selected, setSelected] = useState<any | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<
    Array<{ id: string; type: string; props?: any }>
  >([]);
  const [undoStack, setUndoStack] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);
  const [publishVisible, setPublishVisible] = useState(false);
  const [publishName, setPublishName] = useState('');
  const [surveyUrl, setSurveyUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==== LƯU LỊCH SỬ (UNDO/REDO) ====
  const setNodesWithHistory = (updater: React.SetStateAction<any[]>) => {
    setNodes((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      setUndoStack((u) => [...u, current]); // Lưu trạng thái hiện tại
      setRedoStack([]); // Xóa redo khi có thay đổi mới
      return next;
    });
  };

  // ==== UNDO ====
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((u) => u.slice(0, -1));
    setRedoStack((r) => [...r, nodes]);
    setNodes(last);
  };

  // ==== REDO ====
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((u) => [...u, nodes]);
    setNodes(next);
  };

  // ==== TÌM NODE KHI CHỌN ====
  useEffect(() => {
    if (selectedId) {
      const findNode = (list: any[]): any | null => {
        for (const item of list) {
          if (item.id === selectedId) return item;
          const children = item.props?.children || [];
          if (Array.isArray(children) && children.length) {
            const f = findNode(children);
            if (f) return f;
          }
        }
        return null;
      };
      setSelected(findNode(nodes) || null);
    }
  }, [nodes, selectedId]);

  // ==== RESET + LOAD FORM KHI MỞ MODAL MỚI ====
  useEffect(() => {
    if (!isModalMode || !props.open) {
      return;
    }

    // RESET HOÀN TOÀN KHI MỞ MODAL MỚI
    setSurveyUrl('');
    setPublishName('');
    setNodes([]);
    setUndoStack([]);
    setRedoStack([]);
    setCopied(false);
    setSelected(null);
    setSelectedId(null);

    // Nếu không có recordId → tạo mới
    if (!recordId) {
      return;
    }

    // Nếu không phải UUID → tạo mới
    if (!isUUID(recordId)) {
      return;
    }

    // Nếu là UUID → load form cũ
    const loadExistingForm = async () => {
      setLoading(true);
      try {
        const res: any = await getContentDnD(recordId);

        let data = res?.object;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (err) {
            console.error('JSON parse failed:', err);
            data = {};
          }
        }

        if (data?.nodes) {
          setNodes(data.nodes);
          setPublishName(data.title || '');
          const url =
            data.url || `${window.location.origin}/survey/${recordId}`;
          setSurveyUrl(url);
        }
      } catch (err) {
        console.error('Load form failed', err);
        message.error(t('dnd.LoadFormFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadExistingForm();
  }, [open, recordId, isModalMode, t]);

  // ==== COPY AN TOÀN ====
  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {}
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  };

  // ==== ĐÓNG EDITOR ====
  const handleClose = () => {
    if (isModalMode) {
      (props as LowcodeEditorModalProps).onClose();
    } else {
      navigate(-1);
    }
  };

  // ==== PUBLISH ====
  const handlePublish = async () => {
    if (!publishName.trim()) {
      message.warning(t('dnd.PleaseEnterFormName'));
      return;
    }

    try {
      const payload: any = { title: publishName, nodes };
      const id =
        recordId && isUUID(recordId) ? recordId : `survey-${generateId()}`;
      const res: any = await publishSchema(id, payload);

      let formId = res?.id || id;
      let url = `${window.location.origin}/survey/${formId}`;
      if (res?.url) url = res.url;

      setSurveyUrl(url);
      const ok = await copyToClipboard(url);
      if (ok) {
        setCopied(true);
        message.success(t('dnd.PublishAndCopied'));
        setTimeout(() => setCopied(false), 2000);
      } else {
        message.warning(t('dnd.CopyFailedUseManual'));
      }

      if (isModalMode && (props as LowcodeEditorModalProps).onSuccess) {
        (props as LowcodeEditorModalProps).onSuccess!(formId, publishName);
      }

      setPublishVisible(false);
      if (isModalMode) handleClose();
    } catch (err) {
      console.error('Publish failed', err);
      message.error(t('dnd.PublishFailed'));
    }
  };

  // ==== DOWNLOAD SCHEMA ====
  const handleDownload = () => {
    try {
      const payload = JSON.stringify(
        { title: publishName || 'Untitled', nodes },
        null,
        2
      );
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${publishName || 'form'}-schema.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success(t('dnd.DownloadSuccess'));
    } catch (err) {
      message.error(t('dnd.DownloadFailed'));
    }
  };

  // ==== GIAO DIỆN ====
  const EditorContent = (
    <Layout
      style={{
        height: isModalMode ? '80vh' : 'calc(90vh - 64px)',
        background: '#fff',
      }}
    >
      <Sider
        width={220}
        style={{
          background: '#fff',
          padding: 12,
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <Palette />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            <Tooltip title={t('common.Undo')}>
              <Button
                icon={
                  <UndoOutlined
                    style={{ fontSize: 14, verticalAlign: 'middle' }}
                  />
                }
                onClick={handleUndo}
                disabled={undoStack.length === 0}
              />
            </Tooltip>
            <Tooltip title={t('common.Redo')}>
              <Button
                icon={<RedoOutlined />}
                onClick={handleRedo}
                disabled={redoStack.length === 0}
              />
            </Tooltip>
            <Tooltip title={t('common.download')}>
              <Button icon={<DownloadOutlined />} onClick={handleDownload} />
            </Tooltip>
          </Space>

          <Space align="center" style={{ height: '100%' }}>
            <Input
              value={surveyUrl}
              readOnly
              placeholder={t('dnd.PublishToSeeLink')}
              style={{ width: 320, paddingTop: 16, paddingBottom: 16 }}
              onFocus={(e) => e.target.select()}
              addonAfter={
                <Button
                  type="text"
                  size="small"
                  icon={
                    copied ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CopyOutlined />
                    )
                  }
                  onClick={async () => {
                    if (!surveyUrl) return;
                    const ok = await copyToClipboard(surveyUrl);
                    if (ok) {
                      setCopied(true);
                      message.success(t('dnd.LinkCopied'));
                      setTimeout(() => setCopied(false), 2000);
                    } else {
                      message.error(t('dnd.CopyFailed'));
                    }
                  }}
                  disabled={!surveyUrl}
                >
                  {copied ? t('dnd.Copied') : t('dnd.Copy')}
                </Button>
              }
            />
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={() => setPublishVisible(true)}
            >
              {t('dnd.Publish')}
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: 12, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>{t('common.loading')}...</div>
            </div>
          ) : (
            <Canvas
              nodes={nodes}
              setNodes={setNodesWithHistory}
              selectedId={selectedId}
              onSelect={(node) => {
                setSelected(node);
                setSelectedId(node?.id || null);
              }}
            />
          )}
        </Content>
      </Layout>

      <Sider
        width={320}
        style={{
          background: '#fff',
          padding: 12,
          borderLeft: '1px solid #f0f0f0',
        }}
      >
        <Inspector
          selected={selected}
          onChange={(patch) => {
            if (!selectedId) return;
            const updateNodeInTree = (list: any[]): any[] =>
              list.map((node) => {
                if (node.id === selectedId) {
                  return {
                    ...node,
                    props: { ...(node.props || {}), ...patch },
                  };
                }
                const children = node.props?.children;
                if (Array.isArray(children) && children.length) {
                  const updatedChildren = updateNodeInTree(children);
                  return {
                    ...node,
                    props: { ...(node.props || {}), children: updatedChildren },
                  };
                }
                return node;
              });
            setNodesWithHistory((prev: any[]) => updateNodeInTree(prev));
            setSelected((s: any) =>
              s ? { ...s, props: { ...(s.props || {}), ...patch } } : s
            );
          }}
          onDelete={() => {
            if (!selectedId) return;
            setNodesWithHistory((prev: any[]) =>
              removeNodeById(prev, selectedId)
            );
            setSelected(null);
            setSelectedId(null);
          }}
        />
      </Sider>
    </Layout>
  );

  const PublishModal = (
    <Modal
      title={t('dnd.PublishSurvey')}
      open={publishVisible}
      onCancel={() => setPublishVisible(false)}
      onOk={handlePublish}
      okText={t('dnd.Publish')}
      cancelText={t('common.Close')}
      width={500}
    >
      <Input
        placeholder={t('dnd.PlaceholderForm')}
        value={publishName}
        onChange={(e) => setPublishName(e.target.value)}
        maxLength={255}
      />
    </Modal>
  );

  if (isModalMode) {
    return (
      <Modal
        title={
          recordId && isUUID(recordId)
            ? t('dnd.EditForm')
            : t('dnd.CreateNewForm')
        }
        open={(props as LowcodeEditorModalProps).open}
        onCancel={handleClose}
        footer={null}
        width="95%"
        style={{ top: 0 }}
        styles={{
          body: { height: '85vh', padding: 0 },
        }}
        destroyOnClose
        centered
      >
        {EditorContent}
        {PublishModal}
      </Modal>
    );
  }

  return (
    <>
      {EditorContent}
      {PublishModal}
    </>
  );
};

export default LowcodeEditor;
