import { Button, Col, Row, UploadProps,message, Upload  } from 'antd';
import {
  PageHeader,
} from '../../components';
import { UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  HomeOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { getWopiUrl,uploadFile } from '../../api/collabora';
import { DASHBOARD_ITEMS } from '../../constants';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';


export const ProjectsDashboardPage = () => {
  const filename="demo.docx";
  const [iframeUrl, setIframeUrl] = useState("");

  useEffect(() => {
    getWopiUrl(filename).then((data) => {
      if (data?.Url) {
        setIframeUrl(data.Url);
      }
    });
  }, [filename]);

  if (!iframeUrl) return <div>Đang tải file...</div>;
    const props: UploadProps = {
      onChange(info) {
        if (info.file.status !== 'uploading') {
          const file = info.file.originFileObj;
          uploadFile(file).then((respone) => {
            if (respone?.status===200) {
              message.success(`${info.file.name} file uploaded successfully`);
              setIframeUrl(respone.url);
            }
          });
        }
        if (info.file.status === 'done') {
          message.success(`${info.file.name} file uploaded successfully`);
        } else if (info.file.status === 'error') {
          message.error(`${info.file.name} file upload failed.`);
        }
      },
    };
  return (
    <div>
      <Helmet>
        <title>Chỉnh sửa file word online</title>
      </Helmet>
      
      <PageHeader
        title="Chỉnh sửa file word online"
        breadcrumbs={[
          {
            title: (
              <>
                <HomeOutlined />
                <span>home</span>
              </>
            ),
            path: '/',
          },
          {
            title: (
              <>
                <PieChartOutlined />
                <span>dashboards</span>
              </>
            ),
            menu: {
              items: DASHBOARD_ITEMS.map((d) => ({
                key: d.title,
                title: <Link to={d.path}>{d.title}</Link>,
              })),
            },
          },
          {
            title: 'projects',
          },
        ]}
      />
      <Row
        gutter={[
          { xs: 8, sm: 16, md: 24, lg: 32 },
          { xs: 8, sm: 16, md: 24, lg: 32 },
        ]}
      >
        <Col xs={24} sm={12} lg={24} span={50}>
        <Upload {...props}>
          <Button icon={<UploadOutlined />}>Click to Upload</Button>
        </Upload>
         <iframe
          src={iframeUrl}
          title="NOffice Document Viewer"
          width="100%"
          height="100%"
          allow="autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
         style={{
          border: "none",
          width: "100%",
          height: "calc(100vh - 100px)", // chiếm gần hết màn hình
          background: "#f5f5f5"
        }}
          ></iframe>
        </Col>
       
      </Row>
    </div>
  );
};
