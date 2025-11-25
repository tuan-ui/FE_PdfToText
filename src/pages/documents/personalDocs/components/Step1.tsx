import React, { useEffect } from 'react';
import { StepContent } from '../interface/Step';
import { Button, Empty, Form, Input, Select, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { getALlPermisstion } from '../../../../api/roleApi';
import { DocType, getAllDocType } from '../../../../api/docTypeApi';
import { DocumentTemplate,getAllDocumentTemplate } from '../../../../api/documentTemplateApi';
import { sanitizeInput } from '../../../../utils/stringUtils';

const OverviewStep: React.FC<StepContent> = ({ form, personalDocEdit,handleSave }) => {
  const { t } = useTranslation();
  const [docType, setDocType] = React.useState<DocType[]>([]);
  const [docTemplate, setDocTemplate] = React.useState<DocumentTemplate[]>([]);
  const handleSaveDraft = async () => {
    try {
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

  const loadData = async () => {
    try {
      const res = await getAllDocType();
      if (res.status === 200) {
        setDocType(res.object || []);
      }
      const resDocTemplate = await getAllDocumentTemplate();
      if (resDocTemplate.status === 200) {
        setDocTemplate(resDocTemplate.object || []);
      }
    } catch (error) {
      console.error('Error setting docType:', error);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  return (
    <>
      <Form.Item
        label={t('doc.personalDoc.sampleContent')}
        name="docTemplateId"
        required
        validateTrigger="onChange"
        rules={[
          { required: true, message: t('doc.personalDoc.requireDocTemplate') },
        ]}
      >
        <Select
          allowClear
          showSearch
          value={personalDocEdit?.docTemplateId}
          maxTagCount="responsive"
          // loading={loadingRole}
          placeholder={t('doc.personalDoc.selectSample')}
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={
            docTemplate?.map((d) => ({
              value: d.id,
              label: d.documentTemplateName,
            })) || []
          }
          notFoundContent={
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span>{t('common.DataNotFound')}</span>}
            />
          }
        />
      </Form.Item>
      <Form.Item
        label={t('doc.personalDoc.docType')}
        name="docTypeId"
        required
        validateTrigger="onChange"
        rules={[
          { required: true, message: t('doc.personalDoc.requireDocType') },
        ]}
      >
        <Select
          allowClear
          showSearch
          maxTagCount="responsive"
          // loading={loadingRole}
          placeholder={t('doc.personalDoc.docType')}
          optionFilterProp="label"
          value={personalDocEdit?.docTypeId}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={
            docType?.map((d) => ({
              value: d.id,
              label: d.docTypeName,
            })) || []
          }
          notFoundContent={
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span>{t('common.DataNotFound')}</span>}
            />
          }
        />
      </Form.Item>
      <Form.Item
        label={t('doc.personalDoc.title')}
        name="documentTitle"
        required
        validateTrigger="onChange"
        rules={[{ required: true, message: t('doc.personalDoc.requireTitle') }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={t('department.department')}
        name="deptName"
        validateTrigger="onChange"
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={t('doc.personalDoc.purpose')}
        name="purpose"
        validateTrigger="onChange"
      >
        <Input.TextArea
          placeholder={t('doc.personalDoc.purposePlaceholder')}
          rows={4}
          value={personalDocEdit?.purpose}
          maxLength={100}
          showCount={{ formatter: ({ count }) => `${count}/100` }}
          autoSize={{ minRows: 3, maxRows: 8 }}
          onChange={(e) => {
            const sanitized = sanitizeInput(e.target.value);
            form.setFieldsValue({ purpose: sanitized });
          }}
        />
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
      </div>
    </>
  );
};

export default OverviewStep;
