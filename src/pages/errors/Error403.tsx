import { Result } from 'antd';
import { BackBtn } from '../../components';
import { useTranslation } from 'react-i18next';

export const Error403Page = () => {
  const { t } = useTranslation();
  return (
    <Result
      status="403"
      title="403"
      subTitle={t('error.403Error')}
      extra={<BackBtn type="primary" />}
    />
  );
};
