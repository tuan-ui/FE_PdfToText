import React, { useEffect, useRef } from 'react';
import { DocDocument, getAttachs, getUsersProcess } from '../../../api/docDocumentApi';
import { useTranslation } from 'react-i18next';
import { Button, Form, Modal, notification, Steps } from 'antd';
import OverviewStep from './components/Step1';
import ContentAttachmentsStep from './components/Step2';
import ApprovalProcessStep from './components/Step3';
import { EyeFilled } from '@ant-design/icons';
import { getContentDnD } from '../../../api/dndApi';

interface AddPersonalDocProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: ((values: any) => Promise<DocDocument> | null) | null;
  personalDocEdit?: DocDocument;
}

const AddPersonalDoc: React.FC<AddPersonalDocProps> = ({
  open,
  onClose,
  onSubmit,
  personalDocEdit,
}) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [saving, setSaving] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const initialValuesRef = useRef<Record<string, any> | null>(null);

  const handleNext = () => {
    switch (step) {
      case 0:
          handleContinue();
        return;
      case 1:
          handleContinue();
        return;
      case 2:
        form
          .validateFields()
          .then(() => {
            console.log('values step3:', form.getFieldsValue());
          })
          .catch((errorInfo) => {
            console.log('Validation Failed:', errorInfo);
          });
        return;
      default:
        break;
    }
  };

  const handlePrevious = () => {
     Modal.confirm({
        title: t('common.ResetCancelChange',{ step: step + 1 }),
        centered: true,
        onOk() {
          setStep((prevStep) => Math.max(prevStep - 1, 0));
        },
        onCancel() {},
        okText: t('common.yes'),
        cancelText: t('common.no'),
      });
   
  };

  const createOrUpdate = async (saveData:DocDocument)=>{
    try {
          setSaving(true);
          const values = await form.validateFields();
          console.log('Final form values to submit:', form.getFieldsValue(true));
          if(personalDocEdit?.id){
            values.id = personalDocEdit.id;
          }
          const success = await onSubmit?.(values);
          if (success) {
            form.resetFields();
            onClose();
          }
        } catch (errorInfo) {
          console.log('Failed:', errorInfo);
        } finally {
          setSaving(false);
        }
  };
    const handleContinue = async ()=>{
    try {
          const values = await form.validateFields();
          if(values){
            console.log('Final form values to submit:', form.getFieldsValue(true));
            if(personalDocEdit?.id){
              values.id = personalDocEdit.id;
            }
            const success = await onSubmit?.(values);
            console.log('save draft success:', success);
            setStep((prevStep) => prevStep + 1);

          }     
        } catch (errorInfo) {
          console.log('Failed:', errorInfo);
        } finally {
          
        }
  };
  const handleSave = async () => {
   const values = await form.validateFields();
   if(step===2){
    if(!values.approvalSteps||values?.approvalSteps.length==0){
        notification.error({
          message: t('common.actionFailed'),
          description: t('doc.personalDoc.notChooseUser'),
        });
        return;
    }
   }
   createOrUpdate(values);
  };

  const isDirty = () => {
    if (!initialValuesRef.current) return false;
    const keys = [
      'sampleContent',
      'docType',
      'title',
      'department',
      'purpose',
      'approvalSteps',
    ];
    for (const k of keys) {
      const init = initialValuesRef.current[k];
      const cur = form.getFieldValue(k);
      const initNorm = init === undefined || init === null ? '' : init;
      const curNorm = cur === undefined || cur === null ? '' : cur;
      if (String(initNorm) !== String(curNorm)) return true;
    }
    return false;
  };

  const handleCancel = () => {
    if (isDirty()) {
      Modal.confirm({
        title: t('common.NotifyCancelChange'),
        centered: true,
        onOk() {
          form.resetFields();
          onClose();
        },
        onCancel() {},
        okText: t('common.yes'),
        cancelText: t('common.no'),
      });
      return;
    }
    form.resetFields();
    onClose();
  };
  const loadUsersProcess = async () => {
      try {
        const res = await getUsersProcess(personalDocEdit?.id);
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
              form.setFieldsValue({
                approvalSteps: normalized,
              });
              // setUsersProcess(normalized);
        }
      } catch (err) {
        console.error(err);
      } finally {
      }
    };
  const loadAttachs= async ()=>{
        try{
          if(personalDocEdit?.id){
              const res=await getAttachs(personalDocEdit?.id);
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
  const loadSchema = async () => {
          if (!personalDocEdit?.docTemplateId ) return;
      let mounted = true;
      (async () => {
        try {
          const values = await form.validateFields();
          const payload = values.schema;
          if (payload) return;
          console.debug('[SurveyRunner] fetching schema for id=', personalDocEdit?.docTemplateId);
          const resp: any = await getContentDnD(personalDocEdit?.docTemplateId as string);
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
            let formData=personalDocEdit.formData;
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
            form.setFieldsValue({ schema: updatedNormalized });
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
  useEffect(() => {
    if (!open) {
      setStep(0);
      form.resetFields();
      form.setFieldsValue({});
      initialValuesRef.current = null;
      return;
    }
    if (personalDocEdit) {
      form.setFieldsValue(personalDocEdit);
      initialValuesRef.current = personalDocEdit;
      loadUsersProcess();
      loadAttachs();
      loadSchema();
    } else {
      form.setFieldsValue({});
      initialValuesRef.current = {};
    }
  }, [open, personalDocEdit, form]);
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
            <OverviewStep form={form} personalDocEdit={personalDocEdit ?? null} handleSave={handleSave} open={open}/>
        );
      case 1:
        return (
          <ContentAttachmentsStep form={form} personalDocEdit={personalDocEdit ?? null} handleSave={handleSave} open={open}/>

        );
      case 2:
        return (
          <ApprovalProcessStep form={form} personalDocEdit={personalDocEdit ?? null} open={open} />

        );
      default:
        return null;
    }
  };
  return (
    <Modal
      centered
      open={open}
      title={!personalDocEdit?.id ? t('doc.addDoc') : t('doc.editDoc')}
      onCancel={handleCancel}
      footer={[
        <Button
          key="previous"
          onClick={handlePrevious}
          disabled={step === 0} // Disable "Previous" on the first step
        >
          {t('common.Previous')}
        </Button>,
        <>
          {step === 2 ? (
            <>
              <Button
                key="save"
                type="primary"
                onClick={handleSave}
                loading={saving}
              >
                {t('common.SaveDraft')}
              </Button>
              <Button
                key="preview"
                type="primary"
                onClick={handleSave}
                loading={saving}
                icon={<EyeFilled></EyeFilled>}
              >
                {t('common.preview')}
              </Button>
            </>
          ) : (
            <Button
              key="next"
              type="primary"
              onClick={handleNext}
              disabled={step === 2} // Disable "Next" on the last step
            >
              {t('common.Next')}
            </Button>
          )}
        </>,
      ]}
      width={1200}
      maskClosable={false}
      styles={{
        body: { maxHeight: '75vh', overflowY: 'auto' },
      }}
    >
      
      <Form
        form={form}
        preserve={true}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 12 }}
        initialValues={{
        docTypeId: personalDocEdit?.docTypeId,
        docTemplateId: personalDocEdit?.docTemplateId,
        documentTitle: personalDocEdit?.documentTitle,
        deptName: personalDocEdit?.deptName,
        purpose: personalDocEdit?.purpose,
      }}
      >
        <Steps current={step} style={{ marginBottom: 24 }}>
          <Steps.Step title={t('doc.personalDoc.overview')} />
          <Steps.Step title={t('doc.personalDoc.content&attachments')} />
          <Steps.Step title={t('doc.personalDoc.approvalProcess')} />
        </Steps>
        {/* {renderStepContent()} */}
        <div style={{ display: step === 0 ? 'block' : 'none' }}>
            <OverviewStep form={form} personalDocEdit={personalDocEdit ?? null} handleSave={handleSave} open={open}/>
          </div>

          <div style={{ display: step === 1 ? 'block' : 'none' }}>
            <ContentAttachmentsStep form={form} personalDocEdit={personalDocEdit ?? null} handleSave={handleSave} open={open}/>
          </div>

          <div style={{ display: step === 2 ? 'block' : 'none' }}>
            <ApprovalProcessStep form={form} personalDocEdit={personalDocEdit ?? null} open={open} />
          </div>
      </Form>
    </Modal>
  );
};

export default AddPersonalDoc;
