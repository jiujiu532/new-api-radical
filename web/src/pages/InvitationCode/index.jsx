/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    Modal,
    Form,
    InputNumber,
    Input,
    Select,
    DatePicker,
    Popconfirm,
    Typography,
    Tooltip,
    Row,
    Col,
    Dropdown,
    Tabs,
    TabPane,
    Collapsible,
} from '@douyinfe/semi-ui';
import {
    IconPlus,
    IconRefresh,
    IconDelete,
    IconCopy,
    IconDownload,
    IconSearch,
    IconTickCircle,
    IconClock,
    IconChevronDown,
    IconChevronUp,
} from '@douyinfe/semi-icons';
import { API, showError, showSuccess, copy } from '@/helpers';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// 自定义统计组件
const StatItem = ({ title, value, color }) => (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <Text type="tertiary" style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>{title}</Text>
        <Text style={{ fontSize: 28, fontWeight: 600, color: color || 'var(--semi-color-text-0)' }}>{value}</Text>
    </div>
);

// 注册码类型
const CODE_TYPES = {
    1: { text: '注册码', color: 'green' },
    2: { text: '解封码', color: 'blue' },
};

// 注册码状态
const CODE_STATUS = {
    1: { text: '有效', color: 'green', icon: <IconTickCircle /> },
    2: { text: '已用完', color: 'grey', icon: null },
    4: { text: '已过期', color: 'orange', icon: <IconClock /> },
};

const InvitationCode = () => {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filterType, setFilterType] = useState(0);
    const [filterStatus, setFilterStatus] = useState(0);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    // 当前标签页
    const [activeTab, setActiveTab] = useState('codes');

    // 生成弹窗
    const [generateVisible, setGenerateVisible] = useState(false);
    const [generateForm, setGenerateForm] = useState({
        type: 1,
        count: 10,
        max_uses: 1,
        note: '',
        expired_at: null,
        batch_name: '',
    });

    // 批次相关状态
    const [batches, setBatches] = useState([]);
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchTotal, setBatchTotal] = useState(0);
    const [batchPage, setBatchPage] = useState(1);
    const [batchFilterType, setBatchFilterType] = useState(0);
    const [expandedBatchId, setExpandedBatchId] = useState(null);
    const [batchCodes, setBatchCodes] = useState({});

    // 使用记录弹窗
    const [usageLogsVisible, setUsageLogsVisible] = useState(false);
    const [usageLogs, setUsageLogs] = useState([]);
    const [usageLogsLoading, setUsageLogsLoading] = useState(false);
    const [currentCodeId, setCurrentCodeId] = useState(null);

    // 统计数据
    const [stats, setStats] = useState({
        totalRegister: 0,
        activeRegister: 0,
        totalUnban: 0,
        activeUnban: 0,
    });

    // 导出弹窗
    const [exportVisible, setExportVisible] = useState(false);
    const [exportForm, setExportForm] = useState({
        type: 1,
        count: -1, // -1 表示全部
    });

    // 加载注册码列表
    const loadCodes = async () => {
        setLoading(true);
        try {
            const res = await API.get('/api/invitation_code/', {
                params: {
                    type: filterType || undefined,
                    status: filterStatus || undefined,
                    page,
                    page_size: pageSize,
                },
            });
            if (res.data.success) {
                setCodes(res.data.data.list || []);
                setTotal(res.data.data.total || 0);
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError('获取注册码列表失败');
        }
        setLoading(false);
    };

    // 获取统计数据 API
    const fetchStats = async () => {
        try {
            const res = await API.get('/api/invitation_code/stats');
            if (res.data.success) {
                setStats({
                    totalRegister: res.data.data.total_register || 0,
                    activeRegister: res.data.data.active_register || 0,
                    totalUnban: res.data.data.total_unban || 0,
                    activeUnban: res.data.data.active_unban || 0,
                });
            }
        } catch (err) {
            console.error('获取统计失败', err);
        }
    };

    // 当 page, pageSize, filterType, filterStatus 变化时重新加载数据
    useEffect(() => {
        loadCodes();
    }, [page, pageSize, filterType, filterStatus]);

    // 初始加载统计
    useEffect(() => {
        fetchStats();
    }, []);

    // 切换到批次tab时加载批次
    useEffect(() => {
        if (activeTab === 'batches') {
            loadBatches();
        }
    }, [activeTab, batchPage, batchFilterType]);

    // 给外部调用的刷新函数
    const fetchCodes = () => {
        loadCodes();
        fetchStats();
    };

    // ========== 批次相关函数 ==========

    const loadBatches = async () => {
        setBatchLoading(true);
        try {
            const res = await API.get('/api/invitation_code/batch/', {
                params: {
                    type: batchFilterType || undefined,
                    page: batchPage,
                    page_size: 20,
                },
            });
            if (res.data.success) {
                setBatches(res.data.data.list || []);
                setBatchTotal(res.data.data.total || 0);
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError('获取批次列表失败');
        }
        setBatchLoading(false);
    };

    const loadBatchCodes = async (batchId) => {
        try {
            const res = await API.get(`/api/invitation_code/batch/${batchId}`, {
                params: { page: 1, page_size: 1000 },
            });
            if (res.data.success) {
                setBatchCodes(prev => ({ ...prev, [batchId]: res.data.data.codes || [] }));
            }
        } catch (err) {
            showError('获取批次码列表失败');
        }
    };

    const handleDeleteBatch = async (id) => {
        try {
            const res = await API.delete(`/api/invitation_code/batch/${id}`);
            if (res.data.success) {
                showSuccess('删除成功');
                loadBatches();
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError('删除失败');
        }
    };

    const handleCopyBatchCodes = async (batchId) => {
        try {
            const res = await API.get(`/api/invitation_code/batch/${batchId}/export`);
            if (res.data.success && res.data.data) {
                const text = res.data.data.join('\n');
                await copy(text);
                showSuccess(`已复制 ${res.data.count} 个码到剪贴板`);
            } else {
                showError('导出失败');
            }
        } catch (err) {
            showError('导出失败');
        }
    };

    const handleDownloadBatchCodes = async (batch) => {
        try {
            const res = await API.get(`/api/invitation_code/batch/${batch.id}/export`);
            if (res.data.success && res.data.data) {
                const typeName = batch.type === 1 ? '注册码' : '解封码';
                const fileName = `${typeName}_${batch.name || '批次'}_${dayjs.unix(batch.created_at).format('YYYYMMDD_HHmm')}.txt`;
                const content = res.data.data.join('\n');
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                URL.revokeObjectURL(url);
                showSuccess(`已下载 ${res.data.count} 个码`);
            }
        } catch (err) {
            showError('下载失败');
        }
    };

    const toggleBatchExpand = (batchId) => {
        if (expandedBatchId === batchId) {
            setExpandedBatchId(null);
        } else {
            setExpandedBatchId(batchId);
            if (!batchCodes[batchId]) {
                loadBatchCodes(batchId);
            }
        }
    };

    // 批量生成注册码
    const handleGenerate = async () => {
        try {
            // 处理过期时间：支持 dayjs 对象、Date 对象或时间戳
            let expiredAtTimestamp = 0;
            if (generateForm.expired_at) {
                if (typeof generateForm.expired_at.unix === 'function') {
                    // dayjs 对象
                    expiredAtTimestamp = generateForm.expired_at.unix();
                } else if (generateForm.expired_at instanceof Date) {
                    // Date 对象
                    expiredAtTimestamp = Math.floor(generateForm.expired_at.getTime() / 1000);
                } else if (typeof generateForm.expired_at === 'number') {
                    // 已经是时间戳
                    expiredAtTimestamp = generateForm.expired_at;
                }
            }

            const payload = {
                type: generateForm.type,
                count: generateForm.count,
                max_uses: generateForm.max_uses,
                note: generateForm.note,
                expired_at: expiredAtTimestamp,
                name: generateForm.batch_name || generateForm.note || `批次 ${dayjs().format('YYYY-MM-DD HH:mm')}`,
            };
            const res = await API.post('/api/invitation_code/batch/create', payload);
            if (res.data.success) {
                const typeName = generateForm.type === 1 ? '注册码' : '解封码';
                showSuccess(`成功生成 ${res.data.data.codes.length} 个${typeName}`);
                setGenerateVisible(false);
                setGenerateForm({
                    type: 1,
                    count: 10,
                    max_uses: 1,
                    note: '',
                    expired_at: null,
                    batch_name: '',
                });
                fetchCodes();
                fetchStats();
                if (activeTab === 'batches') {
                    loadBatches();
                }
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            const typeName = generateForm.type === 1 ? '注册码' : '解封码';
            showError(`生成${typeName}失败`);
        }
    };

    // 删除注册码
    const handleDelete = async (id) => {
        try {
            const res = await API.delete(`/api/invitation_code/${id}`);
            if (res.data.success) {
                showSuccess('删除成功');
                fetchCodes();
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError('删除失败');
        }
    };

    // 批量删除
    const handleBatchDelete = async () => {
        if (selectedRowKeys.length === 0) {
            showError('请先选择要删除的注册码');
            return;
        }
        try {
            const res = await API.post('/api/invitation_code/batch_delete', { ids: selectedRowKeys });
            if (res.data.success) {
                showSuccess('批量删除成功');
                setSelectedRowKeys([]);
                fetchCodes();
                fetchStats();
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError('批量删除失败');
        }
    };

    // 按类型和状态删除
    const handleDeleteAllByType = async (codeType, status = 0) => {
        try {
            const res = await API.delete(`/api/invitation_code/delete_all_by_type?type=${codeType}&status=${status}`);
            if (res.data.success) {
                showSuccess(res.data.message);
                fetchCodes();
                fetchStats();
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError('删除失败');
        }
    };

    // 查看使用记录
    const handleViewUsageLogs = async (codeId) => {
        setCurrentCodeId(codeId);
        setUsageLogsVisible(true);
        setUsageLogsLoading(true);
        try {
            const res = await API.get('/api/invitation_code/usage_logs', {
                params: { code_id: codeId, page: 1, page_size: 100 },
            });
            if (res.data.success) {
                setUsageLogs(res.data.data.list || []);
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError('获取使用记录失败');
        }
        setUsageLogsLoading(false);
    };

    // 导出注册码
    const handleExport = async () => {
        try {
            const res = await API.get('/api/invitation_code/export', {
                params: {
                    type: exportForm.type,
                    count: exportForm.count,
                },
            });
            if (res.data.success) {
                const text = res.data.data.join('\n');
                copy(text);
                const typeName = exportForm.type === 1 ? '注册码' : '解封码';
                showSuccess(`已复制 ${res.data.count} 个有效${typeName}到剪贴板`);
                setExportVisible(false);
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError('导出失败');
        }
    };

    // 复制单个码
    const handleCopyCode = (code, type) => {
        copy(code);
        showSuccess(`已复制${type === 1 ? '注册码' : '解封码'}`);
    };

    // 表格列定义
    const columns = [
        {
            title: '码值',
            dataIndex: 'code',
            width: 180,
            render: (text, record) => (
                <Space>
                    <Text
                        copyable={{ content: text }}
                        style={{
                            fontFamily: 'monospace',
                            opacity: record.status !== 1 ? 0.5 : 1,
                        }}
                    >
                        {text}
                    </Text>
                </Space>
            ),
        },
        {
            title: '类型',
            dataIndex: 'type',
            width: 100,
            render: (type) => (
                <Tag color={CODE_TYPES[type]?.color}>{CODE_TYPES[type]?.text || '未知'}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (status, record) => {
                // 检查是否已用完
                const isExhausted = record.max_uses !== -1 && record.used_count >= record.max_uses;
                // 检查是否已过期
                const isExpired = record.expired_at && record.expired_at > 0 && record.expired_at < Date.now() / 1000;

                // 优先级：已用完 > 已过期
                // 如果数据库状态是有效(1)，但实际已用完或已过期，显示真实状态
                let displayStatus = status;
                if (status === 1) {
                    if (isExhausted) {
                        displayStatus = 2; // 已用完（优先级最高）
                    } else if (isExpired) {
                        displayStatus = 4; // 已过期
                    }
                }

                return (
                    <Tag color={CODE_STATUS[displayStatus]?.color}>
                        {CODE_STATUS[displayStatus]?.icon} {CODE_STATUS[displayStatus]?.text || '未知'}
                    </Tag>
                );
            },
        },
        {
            title: '使用情况',
            dataIndex: 'used_count',
            width: 120,
            render: (used, record) => {
                const max = record.max_uses === -1 ? '∞' : record.max_uses;
                return (
                    <Tooltip content={`已使用 ${used} 次，最大 ${max} 次`}>
                        <Text style={{ opacity: record.status !== 1 ? 0.5 : 1 }}>
                            {used} / {max}
                        </Text>
                    </Tooltip>
                );
            },
        },
        {
            title: '备注',
            dataIndex: 'note',
            width: 150,
            ellipsis: true,
        },
        {
            title: '过期时间',
            dataIndex: 'expired_at',
            width: 180,
            render: (ts) => {
                if (!ts || ts === 0) return <Text type="tertiary">永不过期</Text>;
                const isExpired = ts < Date.now() / 1000;
                return (
                    <Text type={isExpired ? 'danger' : undefined}>
                        {dayjs.unix(ts).format('YYYY-MM-DD HH:mm')}
                        {isExpired && ' (已过期)'}
                    </Text>
                );
            },
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            width: 180,
            render: (ts) => dayjs.unix(ts).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: '操作',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Tooltip content={record.type === 1 ? '复制注册码' : '复制解封码'}>
                        <Button
                            icon={<IconCopy />}
                            size="small"
                            onClick={() => handleCopyCode(record.code, record.type)}
                        />
                    </Tooltip>
                    <Tooltip content="使用记录">
                        <Button
                            icon={<IconSearch />}
                            size="small"
                            onClick={() => handleViewUsageLogs(record.id)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title={`确定删除此${record.type === 1 ? '注册码' : '解封码'}？`}
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button icon={<IconDelete />} size="small" type="danger" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // 使用记录表格列
    const usageLogColumns = [
        {
            title: '使用者',
            dataIndex: 'username',
            width: 150,
        },
        {
            title: '用户ID',
            dataIndex: 'user_id',
            width: 100,
        },
        {
            title: 'IP地址',
            dataIndex: 'ip',
            width: 150,
        },
        {
            title: '使用类型',
            dataIndex: 'type',
            width: 100,
            render: (type) => (
                <Tag color={type === 1 ? 'green' : 'blue'}>
                    {type === 1 ? '注册' : '解封'}
                </Tag>
            ),
        },
        {
            title: '使用时间',
            dataIndex: 'created_at',
            width: 180,
            render: (ts) => dayjs.unix(ts).format('YYYY-MM-DD HH:mm:ss'),
        },
    ];

    // 批次记录渲染
    const renderBatchTab = () => (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* 批次操作栏 */}
            <Card style={{ marginBottom: 12, flexShrink: 0 }} bodyStyle={{ padding: '12px' }}>
                <Space>
                    <Button icon={<IconPlus />} type="primary" onClick={() => setGenerateVisible(true)}>
                        批量生成
                    </Button>
                    <Button icon={<IconRefresh />} onClick={loadBatches}>
                        刷新
                    </Button>
                    <Select
                        placeholder="类型筛选"
                        value={batchFilterType}
                        onChange={(v) => { setBatchFilterType(v); setBatchPage(1); }}
                        style={{ width: 120 }}
                    >
                        <Select.Option value={0}>全部类型</Select.Option>
                        <Select.Option value={1}>注册码</Select.Option>
                        <Select.Option value={2}>解封码</Select.Option>
                    </Select>
                </Space>
            </Card>

            {/* 批次列表 */}
            {batchLoading ? (
                <Card><Text type="tertiary">加载中...</Text></Card>
            ) : batches.length === 0 ? (
                <Card><Text type="tertiary" style={{ display: 'block', textAlign: 'center', padding: 40 }}>暂无生成记录，点击"批量生成"创建第一个批次</Text></Card>
            ) : (
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {batches.map(batch => (
                        <Card key={batch.id} style={{ marginBottom: 8 }} bodyStyle={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <Text strong style={{ fontSize: 15 }}>{batch.name || '未命名批次'}</Text>
                                        <Tag color={batch.type === 1 ? 'green' : 'blue'} size="small">
                                            {batch.type === 1 ? '注册码' : '解封码'}
                                        </Tag>
                                        <Tag color="grey" size="small">{batch.count} 个</Tag>
                                        <Tag color={batch.used_count > 0 ? 'orange' : 'green'} size="small">
                                            已使用 {batch.used_count}/{batch.count}
                                        </Tag>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <Text type="tertiary" size="small">
                                            📅 {dayjs.unix(batch.created_at).format('YYYY-MM-DD HH:mm')}
                                        </Text>
                                        <Text type="tertiary" size="small">
                                            {batch.expired_at > 0
                                                ? `⏰ 过期: ${dayjs.unix(batch.expired_at).format('YYYY-MM-DD HH:mm')}`
                                                : '♾️ 永不过期'}
                                        </Text>
                                        {batch.max_uses !== 1 && (
                                            <Text type="tertiary" size="small">
                                                每码可用 {batch.max_uses === -1 ? '无限' : batch.max_uses} 次
                                            </Text>
                                        )}
                                    </div>
                                </div>
                                <Space>
                                    <Tooltip content="复制码到剪贴板">
                                        <Button icon={<IconCopy />} size="small" onClick={() => handleCopyBatchCodes(batch.id)} />
                                    </Tooltip>
                                    <Tooltip content="下载 TXT">
                                        <Button icon={<IconDownload />} size="small" onClick={() => handleDownloadBatchCodes(batch)} />
                                    </Tooltip>
                                    <Tooltip content={expandedBatchId === batch.id ? '收起' : '展开码列表'}>
                                        <Button
                                            icon={expandedBatchId === batch.id ? <IconChevronUp /> : <IconChevronDown />}
                                            size="small"
                                            onClick={() => toggleBatchExpand(batch.id)}
                                        />
                                    </Tooltip>
                                    <Popconfirm
                                        title="⚠️ 此操作会同时删除该批次下的所有码，确定删除？"
                                        onConfirm={() => handleDeleteBatch(batch.id)}
                                        okType="danger"
                                    >
                                        <Button icon={<IconDelete />} size="small" type="danger" />
                                    </Popconfirm>
                                </Space>
                            </div>
                            {expandedBatchId === batch.id && (
                                <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid var(--semi-color-border)' }}>
                                    {batchCodes[batch.id] ? (
                                        batchCodes[batch.id].length > 0 ? (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {batchCodes[batch.id].map((code, idx) => (
                                                    <Tag
                                                        key={idx}
                                                        color={code.used_count > 0 ? 'grey' : 'green'}
                                                        size="small"
                                                        style={{ fontFamily: 'monospace', cursor: 'pointer' }}
                                                        onClick={() => { copy(code.code); showSuccess('已复制'); }}
                                                    >
                                                        {code.code}
                                                        {code.used_count > 0 && ' ✓'}
                                                    </Tag>
                                                ))}
                                            </div>
                                        ) : (
                                            <Text type="tertiary">此批次暂无码</Text>
                                        )
                                    ) : (
                                        <Text type="tertiary">加载中...</Text>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                    {/* 批次分页 */}
                    {batchTotal > 20 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                            <Space>
                                <Button disabled={batchPage <= 1} onClick={() => setBatchPage(batchPage - 1)}>上一页</Button>
                                <Text type="tertiary">第 {batchPage} 页 / 共 {Math.ceil(batchTotal / 20)} 页</Text>
                                <Button disabled={batchPage >= Math.ceil(batchTotal / 20)} onClick={() => setBatchPage(batchPage + 1)}>下一页</Button>
                            </Space>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div style={{
            marginTop: 60,
            padding: '12px 24px',
            height: 'calc(100vh - 60px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* 统计卡片 */}
            <Row gutter={16} style={{ marginBottom: 12, flexShrink: 0 }}>
                <Col span={6}>
                    <Card>
                        <StatItem title="注册码总数" value={stats.totalRegister} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <StatItem
                            title="有效注册码"
                            value={stats.activeRegister}
                            color="#52c41a"
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <StatItem title="解封码总数" value={stats.totalUnban} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <StatItem
                            title="有效解封码"
                            value={stats.activeUnban}
                            color="#1890ff"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Tabs */}
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="注册码列表" itemKey="codes">
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        {/* 操作栏 */}
                        <Card style={{ marginBottom: 12, flexShrink: 0 }} bodyStyle={{ padding: '12px' }}>
                            <Space>
                                <Button
                                    icon={<IconPlus />}
                                    type="primary"
                                    onClick={() => setGenerateVisible(true)}
                                >
                                    批量生成
                                </Button>
                                <Button icon={<IconRefresh />} onClick={fetchCodes}>
                                    刷新
                                </Button>
                                <Button icon={<IconDownload />} onClick={() => setExportVisible(true)}>
                                    导出
                                </Button>
                                {selectedRowKeys.length > 0 && (
                                    <Popconfirm
                                        title={`确定删除选中的 ${selectedRowKeys.length} 个码？`}
                                        onConfirm={handleBatchDelete}
                                    >
                                        <Button icon={<IconDelete />} type="danger">
                                            批量删除 ({selectedRowKeys.length})
                                        </Button>
                                    </Popconfirm>
                                )}
                                <Select
                                    placeholder="类型筛选"
                                    value={filterType}
                                    onChange={setFilterType}
                                    style={{ width: 120 }}
                                >
                                    <Select.Option value={0}>全部类型</Select.Option>
                                    <Select.Option value={1}>注册码</Select.Option>
                                    <Select.Option value={2}>解封码</Select.Option>
                                </Select>
                                <Select
                                    placeholder="状态筛选"
                                    value={filterStatus}
                                    onChange={setFilterStatus}
                                    style={{ width: 120 }}
                                >
                                    <Select.Option value={0}>全部状态</Select.Option>
                                    <Select.Option value={1}>有效</Select.Option>
                                    <Select.Option value={2}>已用完</Select.Option>
                                    <Select.Option value={4}>已过期</Select.Option>
                                </Select>
                                <Dropdown
                                    trigger="click"
                                    position="bottomLeft"
                                    render={
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => {
                                                Modal.confirm({
                                                    title: '确认删除',
                                                    content: '确定删除所有注册码？此操作不可撤销！',
                                                    onOk: () => handleDeleteAllByType(1, 0),
                                                });
                                            }}>删除所有注册码</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {
                                                Modal.confirm({
                                                    title: '确认删除',
                                                    content: '确定删除所有有效注册码？此操作不可撤销！',
                                                    onOk: () => handleDeleteAllByType(1, 1),
                                                });
                                            }}>删除所有有效注册码</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {
                                                Modal.confirm({
                                                    title: '确认删除',
                                                    content: '确定删除所有已过期注册码？此操作不可撤销！',
                                                    onOk: () => handleDeleteAllByType(1, 4),
                                                });
                                            }}>删除所有已过期注册码</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {
                                                Modal.confirm({
                                                    title: '确认删除',
                                                    content: '确定删除所有已用完注册码？此操作不可撤销！',
                                                    onOk: () => handleDeleteAllByType(1, 2),
                                                });
                                            }}>删除所有已用完注册码</Dropdown.Item>
                                        </Dropdown.Menu>
                                    }
                                >
                                    <Button type="danger">删除注册码</Button>
                                </Dropdown>
                                <Dropdown
                                    trigger="click"
                                    position="bottomLeft"
                                    render={
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => {
                                                Modal.confirm({
                                                    title: '确认删除',
                                                    content: '确定删除所有解封码？此操作不可撤销！',
                                                    onOk: () => handleDeleteAllByType(2, 0),
                                                });
                                            }}>删除所有解封码</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {
                                                Modal.confirm({
                                                    title: '确认删除',
                                                    content: '确定删除所有有效解封码？此操作不可撤销！',
                                                    onOk: () => handleDeleteAllByType(2, 1),
                                                });
                                            }}>删除所有有效解封码</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {
                                                Modal.confirm({
                                                    title: '确认删除',
                                                    content: '确定删除所有已过期解封码？此操作不可撤销！',
                                                    onOk: () => handleDeleteAllByType(2, 4),
                                                });
                                            }}>删除所有已过期解封码</Dropdown.Item>
                                            <Dropdown.Item onClick={() => {
                                                Modal.confirm({
                                                    title: '确认删除',
                                                    content: '确定删除所有已用完解封码？此操作不可撤销！',
                                                    onOk: () => handleDeleteAllByType(2, 2),
                                                });
                                            }}>删除所有已用完解封码</Dropdown.Item>
                                        </Dropdown.Menu>
                                    }
                                >
                                    <Button type="danger">删除解封码</Button>
                                </Dropdown>
                            </Space>
                        </Card>

                        {/* 注册码表格 */}
                        <Card bodyStyle={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                            <Table
                                columns={columns}
                                dataSource={codes}
                                rowKey="id"
                                loading={loading}
                                size="small"
                                rowSelection={{
                                    selectedRowKeys,
                                    onChange: setSelectedRowKeys,
                                }}
                                pagination={false}
                                scroll={{ x: 1200, y: 'calc(100vh - 420px)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, alignItems: 'center', gap: 16 }}>
                                <Text type="tertiary">显示第 {(page - 1) * pageSize + 1} 条-第 {Math.min(page * pageSize, total)} 条，共 {total} 条</Text>
                                <Space>
                                    <Button
                                        disabled={page <= 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        上一页
                                    </Button>
                                    {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).slice(0, 10).map((p) => (
                                        <Button
                                            key={p}
                                            type={p === page ? 'primary' : 'tertiary'}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </Button>
                                    ))}
                                    <Button
                                        disabled={page >= Math.ceil(total / pageSize)}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        下一页
                                    </Button>
                                    <Select
                                        value={pageSize}
                                        onChange={(v) => { setPageSize(v); setPage(1); }}
                                        style={{ width: 120 }}
                                    >
                                        <Select.Option value={10}>每页10条</Select.Option>
                                        <Select.Option value={15}>每页15条</Select.Option>
                                        <Select.Option value={20}>每页20条</Select.Option>
                                        <Select.Option value={50}>每页50条</Select.Option>
                                    </Select>
                                </Space>
                            </div>
                        </Card>
                    </div>
                </TabPane>
                <TabPane tab="生成记录" itemKey="batches">
                    {renderBatchTab()}
                </TabPane>
            </Tabs>

            {/* 批量生成弹窗 */}
            <Modal
                title="批量生成注册码"
                visible={generateVisible}
                onOk={handleGenerate}
                onCancel={() => setGenerateVisible(false)}
                okText="生成"
                cancelText="取消"
            >
                <Form labelPosition="left" labelWidth={100}>
                    <Form.Select
                        field="type"
                        label="类型"
                        initValue={generateForm.type}
                        onChange={(v) => setGenerateForm({ ...generateForm, type: v })}
                    >
                        <Select.Option value={1}>注册码</Select.Option>
                        <Select.Option value={2}>解封码</Select.Option>
                    </Form.Select>
                    <Form.InputNumber
                        field="count"
                        label="生成数量"
                        initValue={generateForm.count}
                        min={1}
                        max={1000}
                        onChange={(v) => setGenerateForm({ ...generateForm, count: v })}
                    />
                    <Form.InputNumber
                        field="max_uses"
                        label="使用次数"
                        initValue={generateForm.max_uses}
                        min={-1}
                        onChange={(v) => setGenerateForm({ ...generateForm, max_uses: v })}
                        extraText="-1 表示无限次"
                    />
                    <Form.Input
                        field="batch_name"
                        label="批次名称"
                        initValue={generateForm.batch_name}
                        onChange={(v) => setGenerateForm({ ...generateForm, batch_name: v })}
                        placeholder="可选，如：2026年2月活动推广"
                    />
                    <Form.Input
                        field="note"
                        label="备注"
                        initValue={generateForm.note}
                        onChange={(v) => setGenerateForm({ ...generateForm, note: v })}
                        placeholder="可选，用于标记用途"
                    />
                    <Form.DatePicker
                        field="expired_at"
                        label="过期时间"
                        type="dateTime"
                        initValue={generateForm.expired_at}
                        onChange={(v) => setGenerateForm({ ...generateForm, expired_at: v })}
                        placeholder="留空表示永不过期"
                    />
                </Form>
            </Modal>

            {/* 导出弹窗 */}
            <Modal
                title="导出有效注册码"
                visible={exportVisible}
                onOk={handleExport}
                onCancel={() => setExportVisible(false)}
                okText="导出到剪贴板"
                cancelText="取消"
            >
                <Form labelPosition="left" labelWidth={100}>
                    <Form.Select
                        field="type"
                        label="类型"
                        initValue={exportForm.type}
                        onChange={(v) => setExportForm({ ...exportForm, type: v })}
                    >
                        <Select.Option value={1}>注册码</Select.Option>
                        <Select.Option value={2}>解封码</Select.Option>
                    </Form.Select>
                    <Form.InputNumber
                        field="count"
                        label="导出数量"
                        initValue={exportForm.count}
                        min={-1}
                        onChange={(v) => setExportForm({ ...exportForm, count: v })}
                        extraText="-1 表示导出全部有效的"
                    />
                </Form>
                <Text type="tertiary" style={{ marginTop: 8, display: 'block' }}>
                    注：仅导出状态为有效、未过期、未用完的注册码
                </Text>
            </Modal>

            {/* 使用记录弹窗 */}
            <Modal
                title="使用记录"
                visible={usageLogsVisible}
                onCancel={() => setUsageLogsVisible(false)}
                footer={null}
                width={800}
            >
                <Table
                    columns={usageLogColumns}
                    dataSource={usageLogs}
                    rowKey="id"
                    loading={usageLogsLoading}
                    pagination={false}
                    empty="暂无使用记录"
                />
            </Modal>
        </div>
    );
};

export default InvitationCode;
