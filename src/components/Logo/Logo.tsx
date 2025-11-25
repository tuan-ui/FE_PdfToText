import { Flex, FlexProps, theme, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { CSSProperties } from 'react';

import './styles.css';

type LogoProps = {
  color: CSSProperties['color'];
  imgSize?: {
    h?: number | string;
    w?: number | string;
  };
  asLink?: boolean;
  href?: string;
  bgColor?: CSSProperties['backgroundColor'];
  collapsed?: boolean;
} & Partial<FlexProps>;

export const Logo = ({
  asLink,
  color,
  href,
  imgSize,
  bgColor,
  collapsed,
  ...others
}: LogoProps) => {
  const {
    token: { borderRadius },
  } = theme.useToken();

  return asLink ? (
    <Link to={href || '#'} className="logo-link">
      <Flex gap={others.gap || 'small'} align="center" {...others}>
        <img
          src="/logo-no-background.png"
          alt="design sparx logo"
          height={imgSize?.h || 48}
        />
        {!collapsed ? (
          <Typography.Title
            level={5}
            type="secondary"
            style={{
              color,
              margin: 0,
              padding: `4px 8px`,
              backgroundColor: bgColor,
              borderRadius,
            }}
          >
            N-OFFICE
          </Typography.Title>
        ) : null}
      </Flex>
    </Link>
  ) : (
    <Flex gap={others.gap || 'small'} align="center" {...others}>
      <img
        src="/logo-no-background.png"
        alt="design sparx logo"
        height={imgSize?.h || 48}
      />
      <Typography.Title
        level={4}
        type="secondary"
        style={{
          color,
          margin: 0,
          padding: `4px 8px`,
          backgroundColor: bgColor,
          borderRadius,
        }}
      >
        Antd Admin
      </Typography.Title>
    </Flex>
  );
};
