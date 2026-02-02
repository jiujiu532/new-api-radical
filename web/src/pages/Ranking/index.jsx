import React, { useEffect, useState, useMemo } from 'react';
import { API, showError, isAdmin } from '../../helpers';
import {
    Banner,
    Tabs,
    TabPane,
    Table,
    Tag,
    Space,
    Typography,
    DatePicker,
    Button,
    Spin,
} from '@douyinfe/semi-ui';
import { IconUser, IconServer, IconCoinMoneyStroked, IconUserGroup, IconClock, IconGift } from '@douyinfe/semi-icons';

const { Text } = Typography;

const Ranking = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('user_call');
    const [userCallData, setUserCallData] = useState([]);
    const [ipCallData, setIpCallData] = useState([]);
    const [tokenConsumeData, setTokenConsumeData] = useState([]);
    const [userIPCountData, setUserIPCountData] = useState([]);
    const [recentIPData, setRecentIPData] = useState([]);
    const [quotaBalanceData, setQuotaBalanceData] = useState([]);
    const [dateRange, setDateRange] = useState([]);

    // 判断当前用户是否为管理员
    const isAdminUser = useMemo(() => isAdmin(), []);

    const getTimestamps = () => {
        if (dateRange && dateRange.length === 2) {
            return {
                start_timestamp: Math.floor(dateRange[0].getTime() / 1000),
                end_timestamp: Math.floor(dateRange[1].getTime() / 1000),
            };
        }
        // 默认最近24小时
        const now = Math.floor(Date.now() / 1000);
        return {
            start_timestamp: now - 86400,
            end_timestamp: now,
        };
    };

    const fetchUserCallRanking = async () => {
        setLoading(true);
        try {
            const { start_timestamp, end_timestamp } = getTimestamps();
            const res = await API.get(`/api/ranking/user_call?start_timestamp=${start_timestamp}&end_timestamp=${end_timestamp}&limit=50`);
            if (res.data.success) {
                setUserCallData(res.data.data || []);
            } else {
                showError(res.data.message);
            }
        } catch (error) {
            showError(error.message);
        }
        setLoading(false);
    };

    const fetchIPCallRanking = async () => {
        setLoading(true);
        try {
            const { start_timestamp, end_timestamp } = getTimestamps();
            const res = await API.get(`/api/ranking/ip_call?start_timestamp=${start_timestamp}&end_timestamp=${end_timestamp}&limit=50`);
            if (res.data.success) {
                setIpCallData(res.data.data || []);
            } else {
                showError(res.data.message);
            }
        } catch (error) {
            showError(error.message);
        }
        setLoading(false);
    };

    const fetchTokenConsumeRanking = async () => {
        setLoading(true);
        try {
            const { start_timestamp, end_timestamp } = getTimestamps();
            const res = await API.get(`/api/ranking/token_consume?start_timestamp=${start_timestamp}&end_timestamp=${end_timestamp}&limit=50`);
            if (res.data.success) {
                setTokenConsumeData(res.data.data || []);
            } else {
                showError(res.data.message);
            }
        } catch (error) {
            showError(error.message);
        }
        setLoading(false);
    };

    const fetchUserIPCountRanking = async () => {
        setLoading(true);
        try {
            const { start_timestamp, end_timestamp } = getTimestamps();
            const res = await API.get(`/api/ranking/user_ip_count?start_timestamp=${start_timestamp}&end_timestamp=${end_timestamp}&limit=50`);
            if (res.data.success) {
                setUserIPCountData(res.data.data || []);
            } else {
                showError(res.data.message);
            }
        } catch (error) {
            showError(error.message);
        }
        setLoading(false);
    };

    const fetchRecentIPRanking = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/api/ranking/recent_ip?limit=50`);
            if (res.data.success) {
                setRecentIPData(res.data.data || []);
            } else {
                showError(res.data.message);
            }
        } catch (error) {
            showError(error.message);
        }
        setLoading(false);
    };

    const fetchQuotaBalanceRanking = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/api/ranking/quota_balance?limit=100`);
            if (res.data.success) {
                setQuotaBalanceData(res.data.data || []);
            } else {
                showError(res.data.message);
            }
        } catch (error) {
            showError(error.message);
        }
        setLoading(false);
    };

    const fetchData = () => {
        switch (activeTab) {
            case 'user_call':
                fetchUserCallRanking();
                break;
            case 'ip_call':
                fetchIPCallRanking();
                break;
            case 'token_consume':
                fetchTokenConsumeRanking();
                break;
            case 'user_ip_count':
                fetchUserIPCountRanking();
                break;
            case 'recent_ip':
                fetchRecentIPRanking();
                break;
            case 'quota_balance':
                fetchQuotaBalanceRanking();
                break;
            default:
                break;
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleTabChange = (key) => {
        setActiveTab(key);
    };

    const handleSearch = () => {
        fetchData();
    };

    // 渲染排名序号
    const renderRank = (text, record, index) => {
        if (index < 3) {
            const colors = ['amber', 'grey', 'orange'];
            return (
                <Tag color={colors[index]} style={{ fontWeight: 'bold' }}>
                    {index + 1}
                </Tag>
            );
        }
        return <Text>{index + 1}</Text>;
    };

    // 渲染IP标签列表
    const renderIPTags = (ipList) => {
        if (!ipList || ipList.length === 0) return '-';
        return (
            <Space wrap>
                {ipList.slice(0, 5).map((ip, idx) => (
                    <Tag key={idx} color="blue" size="small">
                        {ip}
                    </Tag>
                ))}
                {ipList.length > 5 && <Tag color="grey" size="small">+{ipList.length - 5}</Tag>}
            </Space>
        );
    };

    // 渲染用户标签列表
    const renderUserTags = (userList) => {
        if (!userList || userList.length === 0) return '-';
        return (
            <Space wrap>
                {userList.slice(0, 3).map((user, idx) => (
                    <Tag key={idx} color="cyan" size="small">
                        {user}
                    </Tag>
                ))}
                {userList.length > 3 && <Tag color="grey" size="small">+{userList.length - 3}</Tag>}
            </Space>
        );
    };

    // 用户调用排行表格列 - 根据是否为管理员动态显示用户ID
    const userCallColumns = useMemo(() => {
        const columns = [
            { title: '排名', dataIndex: 'index', render: renderRank, width: 80 },
        ];
        // 管理员可以看到用户ID
        if (isAdminUser) {
            columns.push({ title: '用户ID', dataIndex: 'user_id', width: 80 });
        }
        columns.push(
            { title: '用户名', dataIndex: 'username', render: (text) => <Tag color="light-blue">{text}</Tag> },
            { title: 'IP数', dataIndex: 'ip_count', width: 80 },
            { title: 'IP', dataIndex: 'ip_list', render: renderIPTags },
            { title: '调用次数', dataIndex: 'call_count', width: 100, align: 'right' },
        );
        return columns;
    }, [isAdminUser]);

    // IP调用排行表格列
    const ipCallColumns = [
        { title: '排名', dataIndex: 'index', render: renderRank, width: 80 },
        { title: 'IP', dataIndex: 'ip', render: (text) => <Tag color="blue">{text}</Tag> },
        { title: '用户数', dataIndex: 'user_count', width: 80 },
        { title: '用户', dataIndex: 'user_list', render: renderUserTags },
        { title: '调用次数', dataIndex: 'call_count', width: 100, align: 'right' },
    ];

    // Token消耗排行表格列 - 根据是否为管理员动态显示用户ID
    const tokenConsumeColumns = useMemo(() => {
        const columns = [
            { title: '排名', dataIndex: 'index', render: renderRank, width: 80 },
        ];
        if (isAdminUser) {
            columns.push({ title: '用户ID', dataIndex: 'user_id', width: 80 });
        }
        columns.push(
            { title: '用户名', dataIndex: 'username', render: (text) => <Tag color="light-blue">{text}</Tag> },
            { title: 'Tokens', dataIndex: 'total_tokens', render: (text) => text?.toLocaleString(), align: 'right' },
            { title: '调用次数', dataIndex: 'call_count', width: 100, align: 'right' },
            { title: '消耗', dataIndex: 'total_quota', render: (text) => <Text type="danger">$ {(text / 500000).toFixed(2)}</Text>, align: 'right' },
            { title: '均价/请求', dataIndex: 'avg_per_call', render: (text) => <Text type="secondary">$ {text?.toFixed(4)}</Text>, align: 'right' },
        );
        return columns;
    }, [isAdminUser]);

    // 用户IP数排行表格列 - 根据是否为管理员动态显示用户ID
    const userIPCountColumns = useMemo(() => {
        const columns = [
            { title: '排名', dataIndex: 'index', render: renderRank, width: 80 },
        ];
        if (isAdminUser) {
            columns.push({ title: '用户ID', dataIndex: 'user_id', width: 80 });
        }
        columns.push(
            { title: '用户名', dataIndex: 'username', render: (text) => <Tag color="light-blue">{text}</Tag> },
            { title: 'IP数', dataIndex: 'ip_count', width: 80 },
            { title: 'IP', dataIndex: 'ip_list', render: renderIPTags },
            { title: '调用次数', dataIndex: 'call_count', width: 100, align: 'right' },
            { title: 'Tokens', dataIndex: 'tokens', render: (text) => text?.toLocaleString(), align: 'right' },
            { title: '消耗', dataIndex: 'quota', render: (text) => <Text type="danger">$ {(text / 500000).toFixed(2)}</Text>, align: 'right' },
        );
        return columns;
    }, [isAdminUser]);

    // 1分钟IP数排行表格列 - 根据是否为管理员动态显示用户ID
    const recentIPColumns = useMemo(() => {
        const columns = [
            { title: '排名', dataIndex: 'index', render: renderRank, width: 80 },
        ];
        if (isAdminUser) {
            columns.push({ title: '用户ID', dataIndex: 'user_id', width: 80 });
        }
        columns.push(
            { title: '用户名', dataIndex: 'username', render: (text) => <Tag color="light-blue">{text}</Tag> },
            { title: '1分钟内IP数', dataIndex: 'ip_count', width: 120 },
            { title: '发生时间', dataIndex: 'last_time_str', width: 100 },
            { title: 'IP', dataIndex: 'ip_list', render: renderIPTags },
        );
        return columns;
    }, [isAdminUser]);

    // 囤囤鼠排行表格列 - 根据是否为管理员动态显示用户ID
    const quotaBalanceColumns = useMemo(() => {
        const columns = [
            { title: '排名', dataIndex: 'index', render: renderRank, width: 80 },
        ];
        if (isAdminUser) {
            columns.push({ title: '用户ID', dataIndex: 'user_id', width: 80 });
        }
        columns.push(
            { title: '用户名', dataIndex: 'username', render: (text) => <Tag color="amber">{text}</Tag> },
            { title: '余额', dataIndex: 'quota_usd', render: (text) => <Text type="success" style={{ fontWeight: 'bold' }}>$ {text?.toFixed(2)}</Text>, align: 'right', width: 150 },
        );
        return columns;
    }, [isAdminUser]);

    return (
        <div style={{ padding: '24px', paddingTop: '80px' }}>
            <Banner
                type="info"
                description="用户调用排行榜，帮助监控用户行为和资源使用情况"
                style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <DatePicker
                    type="dateTimeRange"
                    placeholder={['开始时间', '结束时间']}
                    value={dateRange}
                    onChange={(value) => setDateRange(value)}
                    style={{ width: 400 }}
                />
                <Button theme="solid" onClick={handleSearch}>
                    查询
                </Button>
            </div>

            <Spin spinning={loading}>
                <Tabs activeKey={activeTab} onChange={handleTabChange}>
                    <TabPane
                        tab={
                            <span>
                                <IconUser style={{ marginRight: 4 }} />
                                用户调用
                            </span>
                        }
                        itemKey="user_call"
                    >
                        <Table
                            columns={userCallColumns}
                            dataSource={userCallData}
                            pagination={false}
                            rowKey={(record, index) => record.username + '_' + index}
                        />
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <IconServer style={{ marginRight: 4 }} />
                                IP调用
                            </span>
                        }
                        itemKey="ip_call"
                    >
                        <Table
                            columns={ipCallColumns}
                            dataSource={ipCallData}
                            pagination={false}
                            rowKey="ip"
                        />
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <IconCoinMoneyStroked style={{ marginRight: 4 }} />
                                Token消耗
                            </span>
                        }
                        itemKey="token_consume"
                    >
                        <Table
                            columns={tokenConsumeColumns}
                            dataSource={tokenConsumeData}
                            pagination={false}
                            rowKey={(record, index) => record.username + '_' + index}
                        />
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <IconUserGroup style={{ marginRight: 4 }} />
                                用户IP数
                            </span>
                        }
                        itemKey="user_ip_count"
                    >
                        <Table
                            columns={userIPCountColumns}
                            dataSource={userIPCountData}
                            pagination={false}
                            rowKey={(record, index) => record.username + '_' + index}
                        />
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <IconClock style={{ marginRight: 4 }} />
                                1分钟IP数
                            </span>
                        }
                        itemKey="recent_ip"
                    >
                        <Banner
                            type="warning"
                            description="实时监控：显示最近1分钟内使用多个IP的用户，用于检测异常行为"
                            style={{ marginBottom: 16 }}
                        />
                        <Table
                            columns={recentIPColumns}
                            dataSource={recentIPData}
                            pagination={false}
                            rowKey={(record, index) => record.username + '_' + index}
                        />
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <IconGift style={{ marginRight: 4 }} />
                                囤囤鼠
                            </span>
                        }
                        itemKey="quota_balance"
                    >
                        <Banner
                            type="info"
                            description="囤囤鼠排行：显示用户账户余额排行，看看谁是最能囤的小松鼠 🐿️"
                            style={{ marginBottom: 16 }}
                        />
                        <Table
                            columns={quotaBalanceColumns}
                            dataSource={quotaBalanceData}
                            pagination={false}
                            rowKey={(record, index) => record.username + '_' + index}
                        />
                    </TabPane>
                </Tabs>
            </Spin>
        </div>
    );
};

export default Ranking;
