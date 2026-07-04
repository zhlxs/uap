import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, Flex, Input, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { listAuditEvents } from '../../api/applications';
import type { AuditEvent } from '../applications/types';

const eventNameMap: Record<string, string> = {
  'iam.user.create': '新增用户',
  'iam.user.update': '编辑用户',
  'iam.user.status.update': '更新用户状态',
  'iam.department.create': '新增部门',
  'iam.department.update': '编辑部门',
  'iam.department.status.update': '更新部门状态',
  'iam.department.delete': '删除部门',
  'iam.user.role.update': '更新成员授权'
};

const targetNameMap: Record<string, string> = {
  iam_user: '用户',
  iam_department: '部门'
};

function displayEventType(eventType: string) {
  return eventNameMap[eventType] ?? eventType;
}

function displayTargetType(targetType: string | null) {
  if (!targetType) {
    return '-';
  }
  return targetNameMap[targetType] ?? targetType;
}

function matchesKeyword(event: AuditEvent, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return [
    displayEventType(event.eventType),
    event.eventType,
    event.targetType,
    event.targetId,
    event.result,
    event.detailJson
  ].some((value) => (value ?? '').toLowerCase().includes(normalized));
}

export function AuditLogList() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setEvents(await listAuditEvents(200));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '加载审计日志失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => matchesKeyword(event, keyword));
  }, [events, keyword]);

  const columns: ColumnsType<AuditEvent> = [
    {
      title: '操作',
      dataIndex: 'eventType',
      width: 180,
      ellipsis: true,
      render: (value: string) => (
        <Typography.Text className="nowrap-cell" strong>
          {displayEventType(value)}
        </Typography.Text>
      )
    },
    {
      title: '对象',
      dataIndex: 'targetType',
      width: 120,
      ellipsis: true,
      render: (value: string | null) => displayTargetType(value)
    },
    {
      title: '对象标识',
      dataIndex: 'targetId',
      width: 220,
      ellipsis: true,
      render: (value: string | null) => value || '-'
    },
    {
      title: '结果',
      dataIndex: 'result',
      width: 100,
      render: (value: string) => <Tag color={value === 'success' ? 'success' : 'error'}>{value === 'success' ? '成功' : '失败'}</Tag>
    },
    {
      title: '明细',
      dataIndex: 'detailJson',
      ellipsis: true,
      render: (value: string | null) => value || '-'
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      width: 190,
      ellipsis: true,
      render: (value: string) => new Date(value).toLocaleString()
    }
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex align="center" justify="space-between" gap={16} wrap="wrap">
        <div>
          <Typography.Text type="secondary">安全审计 / Audit Log</Typography.Text>
          <Typography.Title level={3} style={{ margin: '4px 0 0' }}>
            审计日志
          </Typography.Title>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
          刷新
        </Button>
      </Flex>

      {error && <Alert type="error" showIcon message={error} />}

      <Card
        title="最近操作"
        extra={
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索操作、对象或明细"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ width: 280 }}
          />
        }
      >
        <Table<AuditEvent>
          className="nowrap-table"
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filteredEvents}
          locale={{ emptyText: <Empty description="暂无审计日志" /> }}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Card>
    </Space>
  );
}
