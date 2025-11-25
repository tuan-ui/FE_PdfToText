import { useEffect, useRef, useState } from 'react';
import { Card, Col, Radio, Row, Tabs, TabsProps } from 'antd';
import { DefaultProcessingDocsPage } from './ProcessingDocs/DefaultPage';
import { DefaultProcessedDocsPage } from './ProcessedDocs/DefaultPage';
import { ToolPageProcessing } from './ProcessingDocs/ToolPage';
import { ToolPageProcessed } from './ProcessedDocs/ToolPage';
import { PageHeader } from '../../../components';
import { Helmet } from 'react-helmet-async';
import { useStylesContext } from '../../../context';
import { useTranslation } from 'react-i18next';
import { useProcessDocTabs } from './ProcessingDocs/useProcessDocTabs';

export interface ProcessDoc {
  id: string;
  title: string;
  sendBy: string;
  sendDayStr: string;
  rereceiveBy: string;
  receiveDayStr: string;
  processingBy: string;
  processingDayStr: string;
  documentType: string;
  status: String;
  role: string;
  [key: string]: any;
}
export const DefaultProcessDocsPage = () => {
  const stylesContext = useStylesContext();
  const { t } = useTranslation();
  const { activeKey, setActiveKey } = useProcessDocTabs();

  // ---------- 1. ref riêng cho mỗi tab ----------
  const wrapperRef1 = useRef<HTMLDivElement>(null);
  const wrapperRef2 = useRef<HTMLDivElement>(null);
  const getCurrentRef = () => (activeKey === '1' ? wrapperRef1 : wrapperRef2);

  // ---------- 2. height riêng cho mỗi tab ----------
  const [tableHeights, setTableHeights] = useState<Record<string, number>>({
    '1': 350,
    '2': 350,
  });

  // ---------- 3. hàm tính height ----------
  const computeHeight = () => {
    const el = getCurrentRef().current;
    if (!el) return; // ← quan trọng
    const rect = el.getBoundingClientRect();
    const height = Math.max(150, window.innerHeight - rect.top - 264);
    setTableHeights((prev) => ({ ...prev, [activeKey]: height }));
  };

  // ---------- 4. tính ngay sau mount (tab mới) ----------
  useEffect(() => {
    // Đợi 1 frame → DOM đã có trong cây
    const raf = requestAnimationFrame(() => {
      computeHeight();
    });
    return () => cancelAnimationFrame(raf);
  }, [activeKey]);

  // ---------- 5. tự động điều chỉnh khi resize ----------
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      // debounce 1 frame
      requestAnimationFrame(computeHeight);
    });

    const cur = getCurrentRef().current;
    if (cur) ro.observe(cur);

    const onWinResize = () => setTimeout(computeHeight, 50);
    window.addEventListener('resize', onWinResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWinResize);
    };
  }, [activeKey]);

  const handleTabChange = (e: any) => setActiveKey(e.target.value);

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: t('processDoc.processingDocs'),
      children: (
        <DefaultProcessingDocsPage
          wrapperRef={wrapperRef1}
          tableHeight={tableHeights['1']}
        />
      ),
    },
    {
      key: '2',
      label: t('processDoc.processedDocs'),
      children: (
        <DefaultProcessedDocsPage
          wrapperRef={wrapperRef2}
          tableHeight={tableHeights['2']}
        />
      ),
    },
  ];
  
  return (
    <div style={{ overflow: 'hidden' }}>
      <Row {...stylesContext?.rowProps}>
        <Col span={24}>
          <Card>
            <>
              <Row justify="space-between" align="middle">
                <Col span={8}>
                  <Helmet>
                    <title>{t('processDoc.processDocs')}</title>
                  </Helmet>
                  <PageHeader
                    title={t('processDoc.processDocs')}
                    breadcrumbs={undefined}
                  />
                </Col>
                <Col span={16}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {activeKey === '1' && <ToolPageProcessing />}
                    {activeKey === '2' && <ToolPageProcessed />}
                  </div>
                </Col>
              </Row>

              <Radio.Group
                value={activeKey}
                onChange={handleTabChange}
                optionType="button"
                size="middle"
                style={{ marginBottom: 16 }}
              >
                <Radio.Button value="1">
                  {t('processDoc.processingDocs')}
                </Radio.Button>
                <Radio.Button value="2">
                  {t('processDoc.processedDocs')}
                </Radio.Button>
              </Radio.Group>

              <div>
                {activeKey === '1' && (
                  <DefaultProcessingDocsPage
                    wrapperRef={wrapperRef1}
                    tableHeight={tableHeights['1']}
                  />
                )}
                {activeKey === '2' && (
                  <DefaultProcessedDocsPage
                    wrapperRef={wrapperRef2}
                    tableHeight={tableHeights['2']}
                  />
                )}
              </div>
            </>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
