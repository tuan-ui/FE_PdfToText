import React, { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Empty, Modal, Table, Tag } from 'antd';
import { UserGroup, saveLogDetailUserGroup } from '../../api/userGroupApi';
import EllipsisText from './components/ElipsisText';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

interface DetailUserGroupProps {
  open: boolean;
  userGroup?: UserGroup | null;
  onClose: () => void;
}

const DetailUserGroup: React.FC<DetailUserGroupProps> = ({
  open,
  userGroup,
  onClose,
}) => {
  const { t } = useTranslation();
  const isOpen = userGroup?.isActive;
  const label = isOpen ? t('common.open') : t('common.locked');
  const color = isOpen ? 'green-inverse' : 'volcano-inverse';
  const icon = isOpen ? CheckCircleOutlined : ExclamationCircleOutlined;
  useEffect(() => {
    if (open && userGroup) {
      saveLogDetailUserGroup(userGroup?.id || null).catch((err) => {
        console.warn('Validation failed:', err);
      });
    }
  }, [open, userGroup]);
  const columns = [
    {
      title: t('user.userName'),
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => <EllipsisText text={text} maxWidth={150} />,
    },
    {
      title: t('user.UserCode'),
      dataIndex: 'userCode',
      key: 'userCode',
      render: (text: string) => <EllipsisText text={text} maxWidth={150} />,
    },
    {
      title: t('user.fullName'),
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text: string) => <EllipsisText text={text} maxWidth={150} />,
    },
  ];
  return (
    <Modal
      centered
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 18, maxWidth: '700px' }}>
            {t('userGroup.userGroupDetail')}{' '}
            {userGroup ? ` ${userGroup?.groupName}` : ''}
          </span>
          {userGroup && (
            <Tag
              color={color}
              icon={createElement(icon)}
              style={{
                fontSize: 13,
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              {label}
            </Tag>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
          maxWidth: '90vw',
          overflowX: 'hidden',
        },
      }}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common.Close')}
        </Button>,
      ]}
    >
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
      {/* ==== Thông tin nhóm người dùng ==== */}
      {userGroup ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 24px',
              lineHeight: 1.8,
            }}
          >
            <p>
              <strong>{t('userGroup.userGroupCode')}:</strong>{' '}
              {userGroup.groupCode || '-'}
            </p>
            <p>
              <strong>{t('userGroup.userGroupName')}:</strong>{' '}
              {userGroup.groupName || '-'}
            </p>
          </div>
          {/* Thông tin user trong nhóm */}
          <p style={{ fontWeight: 'bold' }}>{t('userGroup.listUserInGroup')}</p>
          <Table
            size="small"
            style={{ marginTop: 15 }}
            columns={columns}
            dataSource={
              userGroup.users && userGroup.users.length > 0
                ? userGroup.users.map((user) => ({
                    key: user.userId,
                    username: user.username,
                    userCode: user.userCode,
                    fullName: user.fullName,
                  }))
                : []
            }
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span>{t('common.DataNotFound')}</span>}
                />
              ),
            }}
          />
        </>
      ) : (
        <p>{t('common.DataNotFound')}</p>
      )}
      <Divider
        style={{
          margin: '12px -24px 20px',
          borderColor: '#F0F0F0',
          width: 'calc(100% + 46px)',
        }}
      />
    </Modal>
  );
};

export default DetailUserGroup;
