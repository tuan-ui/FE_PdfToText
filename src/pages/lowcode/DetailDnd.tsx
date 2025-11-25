import { Modal, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface DetailDepartmentProps {
  open: boolean;
  dnd?: any;
  onClose: () => void;
}

export const DetailDnD: React.FC<DetailDepartmentProps> = ({ open, dnd, onClose }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('dnd.dndFormDetail')}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common.Close')}
        </Button>,
      ]}
    >
      {/* {department ? (
        <div style={{ lineHeight: 1.8 }}>
          <p><strong>{t('department.departmentName')}:</strong> {department.departmentName}</p>
          <p><strong>{t('department.departmentCode')}:</strong> {department.departmentCode}</p>
          <p><strong>{t('department.departmentParent')}:</strong> {department.parentName || '-'}</p>
          <p><strong>{t('common.isActive')}:</strong> {department.status === 1 ? t('common.open') : t('common.locked')}</p>
          <p><strong>{t('common.Partner')}:</strong> {department.partnerName || '-'}</p>
        </div>
      ) : (
        <p>{t('common.DataNotFound')}</p>
      )} */}
    </Modal>
  );
};
