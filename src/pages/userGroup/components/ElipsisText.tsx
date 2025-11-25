import { Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';

interface EllipsisTextProps {
  text?: string;
  maxWidth?: number;
}

const EllipsisText: React.FC<EllipsisTextProps> = ({
  text = '',
  maxWidth = 180,
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      // Kiểm tra xem text có bị cắt không
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [text]);

  const textNode = (
    <Typography.Text
      ref={textRef}
      ellipsis
      style={{
        display: 'inline-block',
        maxWidth,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'middle',
      }}
    >
      {text}
    </Typography.Text>
  );

  return isTruncated ? <Tooltip title={text}>{textNode}</Tooltip> : textNode;
};

export default EllipsisText;
