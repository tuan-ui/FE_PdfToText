import { Layout } from 'antd';
import { useRef } from 'react';

const { Header } = Layout;

type HeaderNavProps = {
  navFill?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

const HeaderNav = ({ navFill, children, ...others }: HeaderNavProps) => {
  const nodeRef = useRef(null);

  return (
    <Header ref={nodeRef} {...others}>
      {children}
    </Header>
  );
};

export default HeaderNav;
