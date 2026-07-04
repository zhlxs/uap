import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tree,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import { useEffect, useMemo, useState } from 'react';
import {
  createDepartment,
  createUser,
  deleteDepartment,
  disableDepartment,
  disableUser,
  enableDepartment,
  enableUser,
  getUser,
  listDepartmentTree,
  listUsers,
  lockUser,
  updateDepartment,
  updateUser
} from '../../api/applications';
import type {
  Department,
  DepartmentCreateInput,
  DepartmentTree,
  User,
  UserCreateInput,
  UserDetail
} from '../applications/types';

const userStatusMap: Record<string, { color: string; text: string }> = {
  active: { color: 'success', text: '已启用' },
  disabled: { color: 'default', text: '已禁用' },
  locked: { color: 'error', text: '已锁定' },
  pending: { color: 'warning', text: '待激活' }
};

function statusTag(statusValue: string) {
  const status = userStatusMap[statusValue] ?? { color: 'default', text: statusValue };
  return <Tag color={status.color}>{status.text}</Tag>;
}

function userDescription(user: User, departmentName: string) {
  return [departmentName, user.employeeNo, user.email, user.mobile].filter(Boolean).join(' · ') || '暂无联系方式';
}

function matchesDepartment(department: Department, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return [department.name, department.code].some((value) => value.toLowerCase().includes(normalized));
}

function collectMatchedDepartmentIds(departments: Department[], keyword: string) {
  const matchedIds = new Set<string>();
  const departmentMap = new Map(departments.map((department) => [department.id, department]));
  departments.forEach((department) => {
    if (!matchesDepartment(department, keyword)) {
      return;
    }
    matchedIds.add(department.id);
    let parentId = department.parentId;
    while (parentId) {
      matchedIds.add(parentId);
      parentId = departmentMap.get(parentId)?.parentId ?? null;
    }
  });
  return matchedIds;
}

function flattenDepartmentTree(tree: DepartmentTree[]): Department[] {
  return tree.flatMap((department) => {
    const { children, ...current } = department;
    return [current, ...flattenDepartmentTree(children)];
  });
}

function buildDepartmentTree(departments: Department[], keyword: string): DataNode[] {
  const nodeMap = new Map<string, DataNode>();
  const visibleIds = collectMatchedDepartmentIds(departments, keyword);
  departments.forEach((department) => {
    if (!visibleIds.has(department.id)) {
      return;
    }
    nodeMap.set(department.id, {
      key: department.id,
      title: (
        <div className="org-tree-node">
          <Typography.Text ellipsis className="org-tree-node-name">
            {department.name}
          </Typography.Text>
          {department.status !== 'active' && <Tag>禁用</Tag>}
        </div>
      ),
      children: []
    });
  });

  const roots: DataNode[] = [];
  departments.forEach((department) => {
    const node = nodeMap.get(department.id);
    if (!node) {
      return;
    }
    if (department.parentId && nodeMap.has(department.parentId)) {
      nodeMap.get(department.parentId)?.children?.push(node);
      return;
    }
    roots.push(node);
  });

  return [
    {
      key: 'all',
      title: (
        <div className="org-tree-node">
          <Typography.Text ellipsis className="org-tree-node-name">
            全部部门
          </Typography.Text>
        </div>
      ),
      children: roots
    }
  ];
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [selectedDetail, setSelectedDetail] = useState<UserDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDepartmentDrawer, setShowDepartmentDrawer] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [keyword, setKeyword] = useState('');
  const [departmentKeyword, setDepartmentKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createForm] = Form.useForm<UserCreateInput>();
  const [editForm] = Form.useForm<UserCreateInput>();
  const [departmentForm] = Form.useForm<DepartmentCreateInput>();

  const departmentNameMap = useMemo(() => {
    return new Map(departments.map((department) => [department.id, department.name]));
  }, [departments]);

  const departmentOptions = useMemo(() => {
    return departments.map((department) => ({
      label: department.name,
      value: department.id,
      disabled: department.status !== 'active'
    }));
  }, [departments]);

  const selectedDepartment = useMemo(() => {
    return departments.find((department) => department.id === selectedDepartmentId) ?? null;
  }, [departments, selectedDepartmentId]);

  const departmentTree = useMemo(() => {
    return buildDepartmentTree(departments, departmentKeyword);
  }, [departments, departmentKeyword]);

  async function refresh(nextDepartmentId = selectedDepartmentId) {
    setLoading(true);
    setError(null);
    try {
      const departmentId = nextDepartmentId === 'all' ? undefined : nextDepartmentId;
      const [userData, departmentTreeData] = await Promise.all([
        listUsers({ departmentId, keyword }),
        listDepartmentTree()
      ]);
      setUsers(userData);
      setDepartments(flattenDepartmentTree(departmentTreeData));
      setSelectedDetail((current) => {
        if (!current) {
          return current;
        }
        const updatedUser = userData.find((user) => user.id === current.user.id);
        return updatedUser ? { ...current, user: updatedUser } : null;
      });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '加载用户与组织失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [selectedDepartmentId, keyword]);

  const activeCount = useMemo(() => users.filter((user) => user.status === 'active').length, [users]);
  const disabledCount = useMemo(() => users.filter((user) => user.status === 'disabled').length, [users]);
  const lockedCount = useMemo(() => users.filter((user) => user.status === 'locked').length, [users]);

  function departmentName(departmentId?: string | null) {
    if (!departmentId) {
      return '未分配部门';
    }
    return departmentNameMap.get(departmentId) ?? '未知部门';
  }

  function fillEditForm(detail: UserDetail) {
    editForm.setFieldsValue({
      displayName: detail.user.displayName,
      employeeNo: detail.user.employeeNo ?? undefined,
      email: detail.user.email ?? undefined,
      mobile: detail.user.mobile ?? undefined,
      departmentId: detail.user.departmentId ?? undefined
    });
  }

  async function openDetail(userId: string, editAfterOpen = false) {
    setDetailLoading(true);
    setEditing(editAfterOpen);
    try {
      const detail = await getUser(userId);
      setSelectedDetail(detail);
      if (editAfterOpen) {
        fillEditForm(detail);
      }
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '加载用户详情失败');
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedDetail(null);
    setEditing(false);
  }

  function startEdit() {
    if (!selectedDetail) {
      return;
    }
    fillEditForm(selectedDetail);
    setEditing(true);
  }

  function openDepartmentCreate() {
    setEditingDepartment(null);
    departmentForm.setFieldsValue({
      parentId: selectedDepartmentId === 'all' ? undefined : selectedDepartmentId,
      sortOrder: 0
    });
    setShowDepartmentDrawer(true);
  }

  function openDepartmentEdit() {
    if (!selectedDepartment) {
      return;
    }
    setEditingDepartment(selectedDepartment);
    departmentForm.setFieldsValue({
      parentId: selectedDepartment.parentId ?? undefined,
      name: selectedDepartment.name,
      code: selectedDepartment.code,
      sortOrder: selectedDepartment.sortOrder
    });
    setShowDepartmentDrawer(true);
  }

  function closeDepartmentDrawer() {
    setShowDepartmentDrawer(false);
    setEditingDepartment(null);
    departmentForm.resetFields();
  }

  async function handleCreate(values: UserCreateInput) {
    setSaving(true);
    setError(null);
    try {
      const created = await createUser(values);
      setShowCreate(false);
      createForm.resetFields();
      await refresh();
      await openDetail(created.id);
      void message.success('用户已创建');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '创建用户失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(values: UserCreateInput) {
    if (!selectedDetail) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUser(selectedDetail.user.id, values);
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      setSelectedDetail((current) => (current ? { ...current, user: updated } : current));
      setEditing(false);
      void message.success('用户信息已保存');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '保存用户失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDepartmentSubmit(values: DepartmentCreateInput) {
    setSaving(true);
    setError(null);
    try {
      const saved = editingDepartment
        ? await updateDepartment(editingDepartment.id, values)
        : await createDepartment(values);
      closeDepartmentDrawer();
      setSelectedDepartmentId(saved.id);
      await refresh(saved.id);
      void message.success(editingDepartment ? '部门已保存' : '部门已创建');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '保存部门失败');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(user: User, action: 'enable' | 'disable' | 'lock') {
    setSaving(true);
    try {
      const updated =
        action === 'enable' ? await enableUser(user.id) : action === 'disable' ? await disableUser(user.id) : await lockUser(user.id);
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedDetail((current) => (current?.user.id === updated.id ? { ...current, user: updated } : current));
      void message.success('用户状态已更新');
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '更新用户状态失败');
    } finally {
      setSaving(false);
    }
  }

  async function updateDepartmentStatus(department: Department) {
    setSaving(true);
    try {
      const updated =
        department.status === 'active'
          ? await disableDepartment(department.id)
          : await enableDepartment(department.id);
      setDepartments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      void message.success(updated.status === 'active' ? '部门已启用' : '部门已禁用');
    } catch (exception) {
      void message.error(exception instanceof Error ? exception.message : '更新部门状态失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDepartment(department: Department) {
    setSaving(true);
    setError(null);
    try {
      await deleteDepartment(department.id);
      setSelectedDepartmentId('all');
      await refresh('all');
      void message.success('部门已删除');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '删除部门失败');
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'displayName',
      ellipsis: true,
      render: (_, record) => (
        <Typography.Text className="nowrap-cell">
          <Typography.Text strong>{record.displayName}</Typography.Text>
          <Typography.Text type="secondary"> · {userDescription(record, departmentName(record.departmentId))}</Typography.Text>
        </Typography.Text>
      )
    },
    {
      title: '所属部门',
      dataIndex: 'departmentId',
      width: 160,
      ellipsis: true,
      render: (value: string | null) => departmentName(value)
    },
    {
      title: '工号',
      dataIndex: 'employeeNo',
      width: 120,
      ellipsis: true,
      render: (value: string | null) => value || '-'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      render: (value: string | null) => value || '-'
    },
    {
      title: '手机号',
      dataIndex: 'mobile',
      width: 140,
      ellipsis: true,
      render: (value: string | null) => value || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: statusTag
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 320,
      render: (_, record) => (
        <Space size={4} className="nowrap-actions">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => void openDetail(record.id)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => void openDetail(record.id, true)}>
            编辑
          </Button>
          {record.status === 'disabled' ? (
            <Button type="link" size="small" onClick={() => void updateStatus(record, 'enable')} loading={saving}>
              启用
            </Button>
          ) : record.status === 'locked' ? (
            <Button type="link" size="small" onClick={() => void updateStatus(record, 'enable')} loading={saving}>
              解除锁定
            </Button>
          ) : (
            <Popconfirm title="禁用适用于离职、停用等管理动作，确认禁用该用户？" onConfirm={() => void updateStatus(record, 'disable')}>
              <Button type="link" size="small" icon={<StopOutlined />} loading={saving}>
                禁用
              </Button>
            </Popconfirm>
          )}
          {record.status !== 'locked' && (
            <Popconfirm title="锁定适用于异常登录、风险处置等安全动作，确认锁定该用户？" onConfirm={() => void updateStatus(record, 'lock')}>
              <Button type="link" size="small" danger icon={<LockOutlined />} loading={saving}>
                锁定
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex align="center" justify="space-between" gap={16} wrap="wrap">
        <div>
          <Typography.Text type="secondary">身份中心 / Identity Center</Typography.Text>
          <Typography.Title level={3} style={{ margin: '4px 0 0' }}>
            用户与组织
          </Typography.Title>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void refresh()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
            新增用户
          </Button>
        </Space>
      </Flex>

      {error && <Alert type="error" showIcon message={error} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="用户总数" value={users.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="组织部门" value={departments.length} prefix={<ApartmentOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="已启用" value={activeCount} suffix={`/ ${users.length}`} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="已锁定" value={lockedCount} suffix={`禁用 ${disabledCount}`} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={6}>
          <Card
            className="org-panel"
            title="组织架构"
            extra={
              <Space size={4}>
                <Button type="text" size="small" icon={<PlusOutlined />} onClick={openDepartmentCreate}>
                  新增
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索部门名称或编码"
                value={departmentKeyword}
                onChange={(event) => setDepartmentKeyword(event.target.value)}
              />
              <Tree
                blockNode
                showIcon
                defaultExpandAll
                className="org-tree"
                selectedKeys={[selectedDepartmentId]}
                treeData={departmentTree}
                icon={({ expanded }) => (expanded ? <FolderOpenOutlined /> : <FolderOutlined />)}
                onSelect={(keys) => setSelectedDepartmentId(String(keys[0] ?? 'all'))}
              />
              <div className="org-actions">
                <Flex align="center" justify="space-between" gap={12}>
                  <Typography.Text ellipsis type="secondary">
                    已选：{selectedDepartment?.name ?? '全部部门'}
                  </Typography.Text>
                  <Space size={4}>
                    <Button type="link" size="small" disabled={!selectedDepartment} onClick={openDepartmentEdit}>
                      编辑
                    </Button>
                    {selectedDepartment && (
                      <Button type="link" size="small" loading={saving} onClick={() => void updateDepartmentStatus(selectedDepartment)}>
                        {selectedDepartment.status === 'active' ? '禁用' : '启用'}
                      </Button>
                    )}
                    {selectedDepartment && (
                      <Popconfirm
                        title="删除部门"
                        description="仅空部门可删除；存在子部门或已分配用户时系统会拒绝删除。"
                        onConfirm={() => void handleDeleteDepartment(selectedDepartment)}
                      >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} loading={saving}>
                          删除
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                </Flex>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card
            title={selectedDepartment ? `${selectedDepartment.name} · 用户清单` : '用户清单'}
            extra={
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索姓名、工号、邮箱或手机号"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                style={{ width: 280 }}
              />
            }
          >
            <Table<User>
              className="nowrap-table"
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={users}
              locale={{ emptyText: <Empty description="暂无用户，请先新增用户" /> }}
              scroll={{ x: 1280 }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              onRow={(record) => ({
                onDoubleClick: () => void openDetail(record.id)
              })}
            />
          </Card>
        </Col>
      </Row>

      <UserFormModal
        open={showCreate}
        form={createForm}
        departments={departmentOptions}
        saving={saving}
        onCancel={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />

      <DepartmentFormDrawer
        open={showDepartmentDrawer}
        form={departmentForm}
        departments={departmentOptions.filter((department) => department.value !== editingDepartment?.id)}
        editingDepartment={editingDepartment}
        saving={saving}
        onCancel={closeDepartmentDrawer}
        onSubmit={handleDepartmentSubmit}
      />

      <Drawer
        title={selectedDetail ? `${selectedDetail.user.displayName} · 用户详情` : '用户详情'}
        width={760}
        open={selectedDetail !== null}
        loading={detailLoading}
        onClose={closeDetail}
        extra={
          selectedDetail && !editing && (
            <Space>
              <Button icon={<EditOutlined />} onClick={startEdit}>
                编辑
              </Button>
              {selectedDetail.user.status === 'disabled' ? (
                <Button onClick={() => void updateStatus(selectedDetail.user, 'enable')}>启用</Button>
              ) : selectedDetail.user.status === 'locked' ? (
                <Button onClick={() => void updateStatus(selectedDetail.user, 'enable')}>解除锁定</Button>
              ) : (
                <Button icon={<StopOutlined />} onClick={() => void updateStatus(selectedDetail.user, 'disable')}>
                  禁用
                </Button>
              )}
              {selectedDetail.user.status !== 'locked' && (
                <Button danger icon={<LockOutlined />} onClick={() => void updateStatus(selectedDetail.user, 'lock')}>
                  锁定
                </Button>
              )}
            </Space>
          )
        }
      >
        {selectedDetail && (
          editing ? (
            <EditUserForm
              form={editForm}
              departments={departmentOptions}
              saving={saving}
              onCancel={() => setEditing(false)}
              onSubmit={handleUpdate}
            />
          ) : (
            <UserDetailView detail={selectedDetail} departmentName={departmentName(selectedDetail.user.departmentId)} />
          )
        )}
      </Drawer>
    </Space>
  );
}

type UserFormModalProps = {
  open: boolean;
  form: ReturnType<typeof Form.useForm<UserCreateInput>>[0];
  departments: Array<{ label: string; value: string; disabled: boolean }>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: UserCreateInput) => Promise<void>;
};

function UserFormModal({ open, form, departments, saving, onCancel, onSubmit }: UserFormModalProps) {
  return (
    <Drawer
      title="新增用户"
      width={520}
      open={open}
      onClose={onCancel}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            创建
          </Button>
        </Space>
      }
    >
      <UserFields form={form} departments={departments} onSubmit={onSubmit} />
    </Drawer>
  );
}

type EditUserFormProps = {
  form: ReturnType<typeof Form.useForm<UserCreateInput>>[0];
  departments: Array<{ label: string; value: string; disabled: boolean }>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: UserCreateInput) => Promise<void>;
};

function EditUserForm({ form, departments, saving, onCancel, onSubmit }: EditUserFormProps) {
  return (
    <Card size="small" title="编辑用户">
      <UserFields form={form} departments={departments} onSubmit={onSubmit} />
      <Space>
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" loading={saving} onClick={() => form.submit()}>
          保存
        </Button>
      </Space>
    </Card>
  );
}

type UserFieldsProps = {
  form: ReturnType<typeof Form.useForm<UserCreateInput>>[0];
  departments: Array<{ label: string; value: string; disabled: boolean }>;
  onSubmit: (values: UserCreateInput) => Promise<void>;
};

function UserFields({ form, departments, onSubmit }: UserFieldsProps) {
  return (
    <Form form={form} layout="vertical" requiredMark={false} onFinish={(values) => void onSubmit(values)}>
      <Form.Item label="显示名称" name="displayName" rules={[{ required: true, message: '请输入显示名称' }]}>
        <Input placeholder="例如：张三" maxLength={128} />
      </Form.Item>
      <Form.Item label="所属部门" name="departmentId">
        <Select allowClear placeholder="请选择部门" options={departments} />
      </Form.Item>
      <Form.Item label="工号" name="employeeNo">
        <Input placeholder="可选，例如：E10001" maxLength={64} />
      </Form.Item>
      <Form.Item label="邮箱" name="email">
        <Input placeholder="可选，例如：zhangsan@example.com" maxLength={255} />
      </Form.Item>
      <Form.Item label="手机号" name="mobile">
        <Input placeholder="可选" maxLength={32} />
      </Form.Item>
    </Form>
  );
}

type DepartmentFormDrawerProps = {
  open: boolean;
  form: ReturnType<typeof Form.useForm<DepartmentCreateInput>>[0];
  departments: Array<{ label: string; value: string; disabled: boolean }>;
  editingDepartment: Department | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: DepartmentCreateInput) => Promise<void>;
};

function DepartmentFormDrawer({
  open,
  form,
  departments,
  editingDepartment,
  saving,
  onCancel,
  onSubmit
}: DepartmentFormDrawerProps) {
  return (
    <Drawer
      title={editingDepartment ? '编辑部门' : '新增部门'}
      width={480}
      open={open}
      onClose={onCancel}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            保存
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={(values) => void onSubmit(values)}>
        <Form.Item label="上级部门" name="parentId">
          <Select allowClear placeholder="不选择则作为一级部门" options={departments} />
        </Form.Item>
        <Form.Item label="部门名称" name="name" rules={[{ required: true, message: '请输入部门名称' }]}>
          <Input placeholder="例如：产品研发部" maxLength={128} />
        </Form.Item>
        <Form.Item label="部门编码" name="code" rules={[{ required: true, message: '请输入部门编码' }]}>
          <Input placeholder="例如：RD" maxLength={64} />
        </Form.Item>
        <Form.Item label="排序" name="sortOrder">
          <InputNumber min={0} max={9999} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

type UserDetailViewProps = {
  detail: UserDetail;
  departmentName: string;
};

function UserDetailView({ detail, departmentName }: UserDetailViewProps) {
  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label="显示名称">{detail.user.displayName}</Descriptions.Item>
        <Descriptions.Item label="所属部门">{departmentName}</Descriptions.Item>
        <Descriptions.Item label="工号">{detail.user.employeeNo || '-'}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{detail.user.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="手机号">{detail.user.mobile || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">{statusTag(detail.user.status)}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{new Date(detail.user.createdAt).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{new Date(detail.user.updatedAt).toLocaleString()}</Descriptions.Item>
      </Descriptions>

      <Card size="small" title={`应用授权关系 (${detail.authorizations.length})`}>
        <List
          dataSource={detail.authorizations}
          locale={{ emptyText: <Empty description="该用户暂未被授予任何应用角色" /> }}
          renderItem={(authorization) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space wrap>
                    <Typography.Text strong>{authorization.appName}</Typography.Text>
                    <Typography.Text type="secondary">{authorization.appCode}</Typography.Text>
                    <Tag>{authorization.permissionMode}</Tag>
                    {statusTag(authorization.status)}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={6}>
                    <Typography.Text type="secondary">
                      协议：{authorization.protocol.toUpperCase()}；应用类型：{authorization.appType}
                    </Typography.Text>
                    <Space wrap>
                      {authorization.roles.map((role) => (
                        <Tag key={role.id} color="blue">
                          {role.roleName} · {role.roleCode}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
