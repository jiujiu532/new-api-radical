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

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Typography,
    Tag,
    Empty,
    Spin,
    Banner,
    Steps,
    Input,
    Tooltip,
    Divider,
} from '@douyinfe/semi-ui';
import {
    IconLock,
    IconUnlock,
    IconUser,
    IconAlertTriangle,
    IconMail,
    IconSend,
    IconTickCircle,
    IconClock,
    IconKey,
    IconLink,
    IconArrowLeft,
} from '@douyinfe/semi-icons';
import { API, showError, showSuccess } from '@/helpers';
import { useTranslation } from 'react-i18next';
import LinuxDoIcon from '@/components/common/logo/LinuxDoIcon';

const { Title, Text } = Typography;

// 第三方登录方式图标映射
const authMethodIcons = {
    github: (
        <Tooltip content="GitHub">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
        </Tooltip>
    ),
    discord: (
        <Tooltip content="Discord">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
        </Tooltip>
    ),
    linuxdo: (
        <Tooltip content="Linux DO">
            <LinuxDoIcon style={{ fontSize: '20px' }} />
        </Tooltip>
    ),
    wechat: (
        <Tooltip content="微信">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89l-.002-.033h-.404v.001zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
            </svg>
        </Tooltip>
    ),
    telegram: (
        <Tooltip content="Telegram">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
        </Tooltip>
    ),
    oidc: (
        <Tooltip content="OIDC 单点登录">
            <IconLink className="w-5 h-5" />
        </Tooltip>
    ),
    password: (
        <Tooltip content="密码注册">
            <IconKey className="w-5 h-5" />
        </Tooltip>
    ),
};

// 验证方式选项
const VERIFY_METHODS = {
    EMAIL: 'email',
    OAUTH: 'oauth',
    USERNAME: 'username',
};

const Blacklist = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [bannedUsers, setBannedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isFetching, setIsFetching] = useState(false);

    // 系统状态
    const [status, setStatus] = useState({});

    // 解封弹窗状态
    const [unbanVisible, setUnbanVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [unbanLoading, setUnbanLoading] = useState(false);

    // 选择的验证方式
    const [selectedMethod, setSelectedMethod] = useState('');

    // 解封表单数据
    const [unbanForm, setUnbanForm] = useState({
        email: '',
        username: '',
        unban_code: '',
        verification_code: '',
        oauth_token: '',
    });

    // 用户信息（验证后获取）
    const [verifiedUser, setVerifiedUser] = useState(null);

    // 验证码发送状态
    const [codeSent, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // 微信验证弹窗
    const [wechatModalVisible, setWechatModalVisible] = useState(false);
    const [wechatCode, setWechatCode] = useState('');

    // 加载系统状态
    const fetchStatus = useCallback(async () => {
        try {
            const savedStatus = localStorage.getItem('status');
            if (savedStatus) {
                setStatus(JSON.parse(savedStatus));
            }
        } catch (err) {
            console.error('Failed to load status:', err);
        }
    }, []);

    // 加载封禁用户列表
    const fetchBannedUsers = useCallback(async (isInitial = false) => {
        if (isInitial) {
            setLoading(true);
        } else {
            setIsFetching(true);
        }
        try {
            const res = await API.get('/api/blacklist/', {
                params: { page, page_size: pageSize },
            });
            if (res.data.success) {
                setBannedUsers(res.data.data.list || []);
                setTotal(res.data.data.total || 0);
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError(t('获取封禁名单失败'));
        }
        setLoading(false);
        setIsFetching(false);
    }, [page, pageSize, t]);

    useEffect(() => {
        fetchStatus();
        fetchBannedUsers(true);
    }, [fetchStatus]);

    useEffect(() => {
        fetchBannedUsers(false);
    }, [page, pageSize]);

    // 处理 OAuth 回调
    useEffect(() => {
        const verified = searchParams.get('verified');
        const token = searchParams.get('token');
        const username = searchParams.get('username');
        const displayName = searchParams.get('display_name');

        if (verified === 'true' && token && username) {
            // OAuth 验证成功，自动进入解封码输入步骤
            setVerifiedUser({
                username: username,
                display_name: displayName || username,
            });
            setUnbanForm(prev => ({ ...prev, oauth_token: token }));
            setSelectedMethod(VERIFY_METHODS.OAUTH);
            setCurrentStep(2);
            setUnbanVisible(true);

            // 清除 URL 参数
            setSearchParams({});

            showSuccess(t('身份验证成功！请输入解封码完成解封'));
        }
    }, [searchParams, setSearchParams, t]);

    // 倒计时效果
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 重置解封表单
    const resetUnbanForm = () => {
        setUnbanForm({
            email: '',
            username: '',
            unban_code: '',
            verification_code: '',
            oauth_token: '',
        });
        setVerifiedUser(null);
        setCurrentStep(0);
        setSelectedMethod('');
        setCodeSent(false);
        setCountdown(0);
        setWechatCode('');
    };

    // 发送邮箱验证码
    const handleSendEmailCode = async () => {
        if (!unbanForm.email.trim()) {
            showError(t('请输入邮箱'));
            return;
        }

        setUnbanLoading(true);
        try {
            const res = await API.post('/api/blacklist/send_email_code', {
                email: unbanForm.email.trim(),
            });

            if (res.data.success) {
                showSuccess(t('验证码已发送到您的邮箱'));
                setCodeSent(true);
                setCountdown(60);
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError(t('发送验证码失败'));
        }
        setUnbanLoading(false);
    };

    // 邮箱验证
    const handleEmailVerify = async () => {
        if (!unbanForm.email.trim() || !unbanForm.verification_code.trim()) {
            showError(t('请输入邮箱和验证码'));
            return;
        }

        setUnbanLoading(true);
        try {
            const res = await API.post('/api/blacklist/verify_email', {
                email: unbanForm.email.trim(),
                verification_code: unbanForm.verification_code.trim(),
            });

            if (res.data.success) {
                setVerifiedUser(res.data.data);
                showSuccess(t('验证成功！'));
                setCurrentStep(2);
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError(t('验证失败'));
        }
        setUnbanLoading(false);
    };

    // 用户名验证
    const handleUsernameVerify = async () => {
        if (!unbanForm.username.trim()) {
            showError(t('请输入用户名'));
            return;
        }

        setUnbanLoading(true);
        try {
            const res = await API.post('/api/blacklist/verify_username', {
                username: unbanForm.username.trim(),
            });

            if (res.data.success) {
                setVerifiedUser(res.data.data);
                setCurrentStep(2);
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError(t('验证失败'));
        }
        setUnbanLoading(false);
    };

    // OAuth 验证（GitHub, Discord, LinuxDO, OIDC）
    const handleOAuthVerify = async (oauthType) => {
        // 保存解封标记到 localStorage
        localStorage.setItem('unban_action', 'true');
        localStorage.setItem('unban_oauth_type', oauthType);

        const redirectBase = window.location.origin;
        let authUrl = '';

        try {
            // 获取 OAuth state
            const stateRes = await API.get('/api/oauth/state');
            if (!stateRes.data.success) {
                showError(t('获取验证状态失败'));
                return;
            }
            const state = stateRes.data.data;

            switch (oauthType) {
                case 'github':
                    if (!status.github_client_id) {
                        showError(t('GitHub 验证未配置'));
                        return;
                    }
                    authUrl = `https://github.com/login/oauth/authorize?client_id=${status.github_client_id}&state=${state}&scope=user:email`;
                    break;

                case 'discord':
                    if (!status.discord_client_id) {
                        showError(t('Discord 验证未配置'));
                        return;
                    }
                    authUrl = `https://discord.com/oauth2/authorize?client_id=${status.discord_client_id}&redirect_uri=${encodeURIComponent(redirectBase + '/oauth/discord')}&response_type=code&scope=identify+email&state=${state}`;
                    break;

                case 'linuxdo':
                    if (!status.linuxdo_client_id) {
                        showError(t('LinuxDO 验证未配置'));
                        return;
                    }
                    authUrl = `https://connect.linux.do/oauth2/authorize?response_type=code&client_id=${status.linuxdo_client_id}&state=${encodeURIComponent(state)}`;
                    break;

                case 'oidc':
                    if (!status.oidc_authorization_endpoint || !status.oidc_client_id) {
                        showError(t('OIDC 验证未配置'));
                        return;
                    }
                    authUrl = `${status.oidc_authorization_endpoint}?client_id=${status.oidc_client_id}&redirect_uri=${encodeURIComponent(redirectBase + '/oauth/oidc')}&response_type=code&scope=openid+profile+email&state=${state}`;
                    break;

                default:
                    showError(t('不支持的验证方式'));
                    return;
            }

            // 跳转到 OAuth 页面
            window.location.href = authUrl;
        } catch (err) {
            showError(t('验证失败：') + err.message);
            localStorage.removeItem('unban_action');
            localStorage.removeItem('unban_oauth_type');
        }
    };

    // 微信验证
    const handleWechatVerify = () => {
        setWechatModalVisible(true);
    };

    // 提交微信验证码
    const handleWechatCodeSubmit = async () => {
        if (!wechatCode.trim()) {
            showError(t('请输入验证码'));
            return;
        }

        setUnbanLoading(true);
        try {
            const res = await API.post('/api/blacklist/oauth_verify_by_code', {
                code: wechatCode.trim(),
                oauth_type: 'wechat',
            });

            if (res.data.success) {
                const { token, username, display_name } = res.data.data;
                setVerifiedUser({
                    username: username,
                    display_name: display_name || username,
                });
                setUnbanForm(prev => ({ ...prev, oauth_token: token }));
                setSelectedMethod(VERIFY_METHODS.OAUTH);
                setCurrentStep(2);
                setWechatModalVisible(false);
                showSuccess(t('验证成功！'));
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError(t('验证失败'));
        }
        setUnbanLoading(false);
    };

    // 提交解封
    const handleUnban = async () => {
        if (!unbanForm.unban_code.trim()) {
            showError(t('请输入解封码'));
            return;
        }

        if (!verifiedUser) {
            showError(t('请先完成身份验证'));
            return;
        }

        setUnbanLoading(true);
        try {
            const res = await API.post('/api/blacklist/unban', {
                username: verifiedUser.username,
                unban_code: unbanForm.unban_code.trim(),
                verify_method: selectedMethod,
                email: unbanForm.email,
                verification_code: unbanForm.verification_code,
                oauth_token: unbanForm.oauth_token,
            });

            if (res.data.success) {
                showSuccess(t('🎉 解封成功！您可以正常登录了'));
                setUnbanVisible(false);
                resetUnbanForm();
                fetchBannedUsers();
            } else {
                showError(res.data.message);
            }
        } catch (err) {
            showError(t('解封失败，请检查信息是否正确'));
        }
        setUnbanLoading(false);
    };

    // 表格列定义
    const columns = [
        {
            title: t('用户'),
            dataIndex: 'display_name',
            width: 200,
            render: (text, record) => (
                <div className="flex items-center gap-2">
                    <IconUser className="text-gray-400" />
                    <Text>{text || record.username}</Text>
                </div>
            ),
        },
        {
            title: t('注册方式'),
            dataIndex: 'auth_methods',
            width: 120,
            render: (methods) => (
                <div className="flex items-center gap-1.5">
                    {methods && methods.map((method, idx) => (
                        <span key={idx} className="text-gray-400 hover:text-gray-200 transition-colors">
                            {authMethodIcons[method] || method}
                        </span>
                    ))}
                </div>
            ),
        },
        {
            title: t('邮箱'),
            dataIndex: 'email',
            width: 180,
            render: (text) => (
                <Text className="text-gray-400">
                    {text || <span className="text-gray-600">{t('未绑定')}</span>}
                </Text>
            ),
        },
        {
            title: t('封禁状态'),
            dataIndex: 'ban_type',
            width: 200,
            render: (banType, record) => {
                if (banType === 'temporary' && record.banned_until) {
                    const now = Math.floor(Date.now() / 1000);
                    const remaining = record.banned_until - now;
                    if (remaining <= 0) {
                        return (
                            <Tag color="green" prefixIcon={<IconUnlock />}>
                                {t('即将解封')}
                            </Tag>
                        );
                    }
                    // 格式化剩余时间
                    const formatRemaining = (sec) => {
                        if (sec >= 86400) {
                            const days = Math.floor(sec / 86400);
                            const hours = Math.floor((sec % 86400) / 3600);
                            return `${days}天${hours}小时`;
                        } else if (sec >= 3600) {
                            const hours = Math.floor(sec / 3600);
                            const minutes = Math.floor((sec % 3600) / 60);
                            return `${hours}小时${minutes}分`;
                        } else if (sec >= 60) {
                            const minutes = Math.floor(sec / 60);
                            const seconds = sec % 60;
                            return `${minutes}分${seconds}秒`;
                        } else {
                            return `${sec}秒`;
                        }
                    };
                    const unbanDate = new Date(record.banned_until * 1000);
                    const tooltip = `解封时间: ${unbanDate.toLocaleString()}`;
                    return (
                        <Tooltip content={tooltip}>
                            <Tag color="orange" prefixIcon={<IconClock />}>
                                {t('定时封禁')} · {formatRemaining(remaining)}
                            </Tag>
                        </Tooltip>
                    );
                }
                return (
                    <Tag color="red" prefixIcon={<IconLock />}>
                        {t('永久封禁')}
                    </Tag>
                );
            },
        },
        {
            title: t('备注'),
            dataIndex: 'remark',
            render: (text) => (
                <Text type="tertiary" ellipsis={{ showTooltip: true }}>
                    {text || t('无')}
                </Text>
            ),
        },
    ];

    // 渲染选择验证方式
    const renderMethodSelection = () => (
        <div className="py-2">
            <div className="space-y-2">
                {/* 邮箱验证 */}
                <div
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all group"
                    onClick={() => { setSelectedMethod(VERIFY_METHODS.EMAIL); setCurrentStep(1); }}
                >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <IconMail size="large" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                            {t('邮箱验证')}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                            {t('适用于绑定了邮箱的用户')}
                        </div>
                    </div>
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>

                {/* 第三方账号分隔线 */}
                {(status.github_oauth || status.discord_oauth || status.linuxdo_oauth || status.wechat_login || status.oidc_enabled) && (
                    <div className="flex items-center gap-3 py-2">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">{t('第三方账号')}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>
                )}

                {/* GitHub */}
                {status.github_oauth && (
                    <div
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-800 hover:bg-gray-50 cursor-pointer transition-all group"
                        onClick={() => handleOAuthVerify('github')}
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 group-hover:text-gray-900 transition-colors">
                                GitHub
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                                {t('通过 GitHub 账号验证身份')}
                            </div>
                        </div>
                        <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* LinuxDO */}
                {status.linuxdo_oauth && (
                    <div
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-orange-400 hover:bg-orange-50/50 cursor-pointer transition-all group"
                        onClick={() => handleOAuthVerify('linuxdo')}
                    >
                        <div className="flex-shrink-0">
                            <LinuxDoIcon style={{ fontSize: '25px' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 group-hover:text-orange-600 transition-colors">
                                Linux DO
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                                {t('通过 LinuxDO 账号验证身份')}
                            </div>
                        </div>
                        <div className="flex-shrink-0 text-gray-400 group-hover:text-orange-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Discord */}
                {status.discord_oauth && (
                    <div
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all group"
                        onClick={() => handleOAuthVerify('discord')}
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">
                                Discord
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                                {t('通过 Discord 账号验证身份')}
                            </div>
                        </div>
                        <div className="flex-shrink-0 text-gray-400 group-hover:text-indigo-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* 微信 */}
                {status.wechat_login && (
                    <div
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50/50 cursor-pointer transition-all group"
                        onClick={handleWechatVerify}
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 group-hover:text-green-600 transition-colors">
                                {t('微信')}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                                {t('通过微信公众号验证身份')}
                            </div>
                        </div>
                        <div className="flex-shrink-0 text-gray-400 group-hover:text-green-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* OIDC */}
                {status.oidc_enabled && (
                    <div
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer transition-all group"
                        onClick={() => handleOAuthVerify('oidc')}
                    >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <IconLink size="large" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 group-hover:text-purple-600 transition-colors">
                                {t('单点登录')}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                                {t('通过 OIDC 单点登录验证身份')}
                            </div>
                        </div>
                        <div className="flex-shrink-0 text-gray-400 group-hover:text-purple-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* 其他方式分隔线 */}
                <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">{t('其他方式')}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* 用户名验证 */}
                <div
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 cursor-pointer transition-all group"
                    onClick={() => { setSelectedMethod(VERIFY_METHODS.USERNAME); setCurrentStep(1); }}
                >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <IconUser size="large" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 group-hover:text-amber-600 transition-colors">
                            {t('用户名验证')}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                            {t('适用于未绑定其他验证方式的用户')}
                        </div>
                    </div>
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-amber-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );

    // 渲染验证步骤
    const renderVerifyStep = () => {
        if (selectedMethod === VERIFY_METHODS.EMAIL) {
            return (
                <div className="py-4">
                    <Banner
                        type="success"
                        icon={<IconMail />}
                        description={t('请输入您绑定的邮箱，我们将发送验证码')}
                        className="mb-4"
                    />
                    <Form.Input
                        field="email"
                        label={t('邮箱地址')}
                        placeholder={t('请输入您绑定的邮箱地址')}
                        prefix={<IconMail />}
                        value={unbanForm.email}
                        onChange={(v) => setUnbanForm({ ...unbanForm, email: v })}
                        size="large"
                    />
                    <div className="flex gap-2 mt-4">
                        <Input
                            placeholder={t('请输入6位验证码')}
                            prefix={<IconKey />}
                            value={unbanForm.verification_code}
                            onChange={(v) => setUnbanForm({ ...unbanForm, verification_code: v })}
                            size="large"
                            style={{ flex: 1 }}
                            maxLength={6}
                        />
                        <Button
                            theme="solid"
                            type="primary"
                            icon={<IconSend />}
                            loading={unbanLoading}
                            disabled={countdown > 0 || !unbanForm.email.trim()}
                            onClick={handleSendEmailCode}
                        >
                            {countdown > 0 ? `${countdown}s` : (codeSent ? t('重新发送') : t('发送验证码'))}
                        </Button>
                    </div>
                </div>
            );
        }

        if (selectedMethod === VERIFY_METHODS.USERNAME) {
            return (
                <div className="py-4">
                    <Banner
                        type="warning"
                        icon={<IconUser />}
                        description={t('请输入您被封禁的用户名')}
                        className="mb-4"
                    />
                    <Form.Input
                        field="username"
                        label={t('用户名')}
                        placeholder={t('请输入您的用户名')}
                        prefix={<IconUser />}
                        value={unbanForm.username}
                        onChange={(v) => setUnbanForm({ ...unbanForm, username: v })}
                        size="large"
                    />
                </div>
            );
        }

        return null;
    };

    // 渲染解封码输入
    const renderUnbanCodeStep = () => (
        <div className="py-4">
            <Banner
                type="success"
                icon={<IconTickCircle />}
                description={
                    <span>
                        {t('身份验证成功！用户')} <strong>{verifiedUser?.display_name || verifiedUser?.username}</strong>
                    </span>
                }
                className="mb-4"
            />
            <Form.Input
                field="unban_code"
                label={t('解封码')}
                placeholder={t('请输入管理员提供的解封码')}
                prefix={<IconUnlock />}
                value={unbanForm.unban_code}
                onChange={(v) => setUnbanForm({ ...unbanForm, unban_code: v })}
                size="large"
            />
        </div>
    );

    // 渲染步骤内容
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderMethodSelection();
            case 1:
                return renderVerifyStep();
            case 2:
                return renderUnbanCodeStep();
            default:
                return null;
        }
    };

    // 获取当前步骤的操作按钮
    const getStepActions = () => {
        switch (currentStep) {
            case 0:
                return [
                    <Button key="cancel" onClick={() => { setUnbanVisible(false); resetUnbanForm(); }}>
                        {t('取消')}
                    </Button>,
                ];
            case 1:
                return [
                    <Button key="back" icon={<IconArrowLeft />} onClick={() => { setCurrentStep(0); setSelectedMethod(''); }}>
                        {t('返回')}
                    </Button>,
                    <Button
                        key="next"
                        theme="solid"
                        type="primary"
                        loading={unbanLoading}
                        onClick={() => {
                            if (selectedMethod === VERIFY_METHODS.EMAIL) {
                                handleEmailVerify();
                            } else if (selectedMethod === VERIFY_METHODS.USERNAME) {
                                handleUsernameVerify();
                            }
                        }}
                        disabled={
                            (selectedMethod === VERIFY_METHODS.EMAIL && (!unbanForm.email || !unbanForm.verification_code)) ||
                            (selectedMethod === VERIFY_METHODS.USERNAME && !unbanForm.username)
                        }
                    >
                        {t('验证身份')}
                    </Button>,
                ];
            case 2:
                return [
                    <Button key="back" icon={<IconArrowLeft />} onClick={() => { setCurrentStep(0); setSelectedMethod(''); setVerifiedUser(null); }}>
                        {t('返回')}
                    </Button>,
                    <Button
                        key="submit"
                        theme="solid"
                        type="warning"
                        loading={unbanLoading}
                        onClick={handleUnban}
                        icon={<IconUnlock />}
                    >
                        {t('确认解封')}
                    </Button>,
                ];
            default:
                return [];
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* 标题区域 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                        <IconAlertTriangle size="extra-large" className="text-red-400" />
                    </div>
                    <Title heading={2} className="!text-white mb-2">
                        🔒 {t('小黑屋')}
                    </Title>
                    <Text className="text-gray-400">
                        {t('这里是被封禁用户的名单，如果您被误封，可以使用解封码解封')}
                    </Text>
                </div>

                {/* 解封提示卡片 */}
                <Card
                    className="mb-6 !bg-gradient-to-r from-amber-500/10 to-orange-500/10 !border-amber-500/30"
                    bodyStyle={{ padding: '16px 20px' }}
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <IconUnlock size="large" className="text-amber-400" />
                            <div>
                                <Text strong className="!text-amber-200 block">
                                    {t('被封禁了？')}
                                </Text>
                                <Text className="text-amber-300/80 text-sm">
                                    {t('如果您有解封码，点击右侧按钮自助解封')}
                                </Text>
                            </div>
                        </div>
                        <Button
                            theme="solid"
                            type="warning"
                            icon={<IconUnlock />}
                            onClick={() => setUnbanVisible(true)}
                        >
                            {t('使用解封码')}
                        </Button>
                    </div>
                </Card>

                {/* 封禁名单 */}
                <Card
                    className="!bg-gray-800/50 !border-gray-700"
                    title={
                        <div className="flex items-center gap-2 text-gray-200">
                            <IconLock />
                            {t('封禁名单')}
                            <Tag size="small" color="red">{total} {t('人')}</Tag>
                        </div>
                    }
                >
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spin size="large" />
                        </div>
                    ) : bannedUsers.length === 0 ? (
                        <Empty
                            image={<IconUser size="extra-large" className="text-gray-500" />}
                            description={
                                <Text className="text-gray-500">{t('暂无封禁用户')}</Text>
                            }
                        />
                    ) : (
                        <div style={{ position: 'relative' }}>
                            {/* 翻页时轻量 overlay，不整体替换内容，避免闪烁 */}
                            {isFetching && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 10,
                                    background: 'rgba(0,0,0,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 4,
                                }}>
                                    <Spin size="large" />
                                </div>
                            )}
                            <Table
                                columns={columns}
                                dataSource={bannedUsers}
                                rowKey="id"
                                pagination={false}
                                className="blacklist-table"
                            />
                            {/* 自定义分页，避免 Semi Table 内部做前端切片 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 4px' }}>
                                <span style={{ color: 'var(--semi-color-text-2)', fontSize: 14 }}>
                                    {`显示第 ${(page - 1) * pageSize + 1} 条-第 ${Math.min(page * pageSize, total)} 条，共 ${total} 条`}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: 'var(--semi-color-text-2)', fontSize: 14 }}>
                                        {`总页数：${Math.ceil(total / pageSize)}`}
                                    </span>
                                    <Button
                                        size="small"
                                        disabled={page <= 1 || isFetching}
                                        onClick={() => setPage(p => p - 1)}
                                        icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    />
                                    {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1).map(pg => (
                                        <Button
                                            key={pg}
                                            size="small"
                                            theme={pg === page ? 'solid' : 'borderless'}
                                            type={pg === page ? 'primary' : 'tertiary'}
                                            disabled={isFetching}
                                            onClick={() => setPage(pg)}
                                            style={{ minWidth: 32 }}
                                        >
                                            {pg}
                                        </Button>
                                    ))}
                                    <Button
                                        size="small"
                                        disabled={page >= Math.ceil(total / pageSize) || isFetching}
                                        onClick={() => setPage(p => p + 1)}
                                        icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M4.5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* 说明卡片 */}
                <Card className="mt-6 !bg-gray-800/30 !border-gray-700">
                    <Title heading={5} className="!text-gray-300 mb-3">
                        ⚠️ {t('关于封禁说明')}
                    </Title>
                    <ul className="text-gray-400 space-y-2 text-sm">
                        <li>• {t('封禁通常是因为违反了平台使用规则')}</li>
                        <li>• {t('如果您认为是误封，请联系管理员获取解封码')}</li>
                        <li>• {t('解封码是一次性的，使用后即失效')}</li>
                        <li>• {t('多次违规可能导致永久封禁')}</li>
                    </ul>
                </Card>
            </div>

            {/* 解封弹窗 */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <IconUnlock className="text-green-500" />
                        {t('自助解封')}
                    </div>
                }
                visible={unbanVisible}
                onCancel={() => { setUnbanVisible(false); resetUnbanForm(); }}
                footer={getStepActions()}
                width={720}
                closeOnEsc={false}
                maskClosable={false}
            >
                <Steps current={currentStep} className="mb-4 unban-steps">
                    <Steps.Step title={t('选择验证')} />
                    <Steps.Step title={t('身份验证')} />
                    <Steps.Step title={t('输入解封码')} />
                </Steps>
                <style>{`
                    .unban-steps.semi-steps {
                        width: 100%;
                    }
                    .unban-steps .semi-steps-item {
                        flex: 1;
                    }
                    .unban-steps .semi-steps-item-title {
                        white-space: nowrap;
                    }
                `}</style>

                <Divider margin="12px" />

                <Form labelPosition="top">
                    {renderStepContent()}
                </Form>
            </Modal>

            {/* 微信验证弹窗 */}
            <Modal
                title={t('微信验证')}
                visible={wechatModalVisible}
                onCancel={() => { setWechatModalVisible(false); setWechatCode(''); }}
                onOk={handleWechatCodeSubmit}
                okText={t('验证')}
                okButtonProps={{ loading: unbanLoading }}
            >
                <div className="flex flex-col items-center mb-4">
                    {status.wechat_qrcode && (
                        <img src={status.wechat_qrcode} alt="微信二维码" className="mb-4 max-w-[200px]" />
                    )}
                    <Text className="text-center mb-4">
                        {t('请扫码关注公众号，输入「验证码」获取验证码')}
                    </Text>
                </div>
                <Input
                    placeholder={t('请输入验证码')}
                    value={wechatCode}
                    onChange={setWechatCode}
                    size="large"
                />
            </Modal>
        </div>
    );
};

export default Blacklist;
