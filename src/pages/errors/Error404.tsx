import { Result } from 'antd';
import { BackBtn } from '../../components';
import { useTranslation } from 'react-i18next';

export const Error404Page = () => {
   const { t } = useTranslation();
  return (
    <Result
      status="404"
      title="404"
      subTitle={t('error.404Error')}
      extra={<BackBtn type="primary" />}
    />
  );
};
