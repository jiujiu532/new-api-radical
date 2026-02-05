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

import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Form, Modal } from '@douyinfe/semi-ui';
import { IconKey } from '@douyinfe/semi-icons';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import {
  API,
  showError,
  showSuccess,
  updateAPI,
  setUserData,
  getLogo,
  getSystemName,
} from '../../helpers';
import { UserContext } from '../../context/User';
import Loading from '../common/ui/Loading';

const OAuth2Callback = (props) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [, userDispatch] = useContext(UserContext);
  const navigate = useNavigate();

  // 注册码输入状态
  const [showInvitationCodeModal, setShowInvitationCodeModal] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [oauthDisplayName, setOauthDisplayName] = useState('');
  const [oauthType, setOauthType] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const logo = getLogo();
  const systemName = getSystemName();

  // 最大重试次数
  const MAX_RETRIES = 3;

  // 防止封禁跳转重复触发
  const hasBannedRedirected = React.useRef(false);

  // 处理解封验证流程
  const handleUnbanVerify = async (code, state, oauthType) => {
    try {
      // 调用解封验证 API（不是登录 API）
      const res = await API.post('/api/blacklist/oauth_verify_by_code', {
        code: code,
        state: state,
        oauth_type: oauthType,
      });

      // 清除解封标记
      localStorage.removeItem('unban_action');
      localStorage.removeItem('unban_oauth_type');

      if (res.data.success) {
        const { token, username, display_name } = res.data.data;

        // 跳转回小黑屋页面，带上验证结果
        navigate(`/blacklist?verified=true&token=${encodeURIComponent(token)}&username=${encodeURIComponent(username)}&display_name=${encodeURIComponent(display_name || username)}`);
      } else {
        showError(res.data.message || t('验证失败'));
        navigate('/blacklist');
      }
    } catch (error) {
      // 清除解封标记
      localStorage.removeItem('unban_action');
      localStorage.removeItem('unban_oauth_type');

      showError(error?.response?.data?.message || error?.message || t('验证失败'));
      navigate('/blacklist');
    }
  };

  // 提交注册码完成注册
  const handleSubmitInvitationCode = async () => {
    if (!invitationCode) {
      showError(t('请输入注册码'));
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await API.post('/api/oauth/register_with_code', {
        invitation_code: invitationCode,
      });

      const { success, message, data } = res.data;

      if (success) {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        setUserData(data);
        updateAPI();
        showSuccess(t('注册成功！'));
        setShowInvitationCodeModal(false);
        navigate('/console/token');
      } else {
        showError(message || t('注册失败'));
      }
    } catch (error) {
      showError(error?.response?.data?.message || error?.message || t('注册失败'));
    } finally {
      setSubmitLoading(false);
    }
  };

  // 处理正常登录流程
  const sendCode = async (code, state, retry = 0) => {
    try {
      const { data: resData } = await API.get(
        `/api/oauth/${props.type}?code=${code}&state=${state}`,
      );

      const { success, message, data } = resData;

      if (!success) {
        throw new Error(message || 'OAuth2 callback error');
      }

      // 检查是否需要输入注册码
      if (message === 'require_invitation_code' && data?.require_invitation_code) {
        setOauthType(data.oauth_type || props.type);
        setOauthDisplayName(data.display_name || '');
        setShowInvitationCodeModal(true);
        return;
      }

      if (message === 'bind') {
        showSuccess(t('绑定成功！'));
        navigate('/console/personal');
      } else {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        setUserData(data);
        updateAPI();
        showSuccess(t('登录成功！'));
        navigate('/console/token');
      }
    } catch (error) {
      // 检测是否是封禁错误
      const errorMessage = error?.message || '';
      if (errorMessage.includes('用户已被封禁') || errorMessage.includes('USER_DISABLED')) {
        // 用户被封禁，只跳转一次
        if (!hasBannedRedirected.current) {
          hasBannedRedirected.current = true;
          navigate('/login?banned=true', { replace: true });
        }
        return;
      }

      // 检测是否是信任等级错误（不需要重试）
      if (errorMessage.includes('信任等级')) {
        showError(errorMessage);
        navigate('/register');
        return;
      }

      if (retry < MAX_RETRIES) {
        // 递增的退避等待
        await new Promise((resolve) => setTimeout(resolve, (retry + 1) * 2000));
        return sendCode(code, state, retry + 1);
      }

      // 重试次数耗尽，提示错误并返回设置页面
      showError(error.message || t('授权失败'));
      navigate('/console/personal');
    }
  };

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // 参数缺失直接返回
    if (!code) {
      showError(t('未获取到授权码'));
      navigate('/console/personal');
      return;
    }

    // 检查是否是解封验证场景
    const isUnbanAction = localStorage.getItem('unban_action') === 'true';
    const unbanOAuthType = localStorage.getItem('unban_oauth_type');

    if (isUnbanAction && unbanOAuthType === props.type) {
      // 这是解封验证，调用解封验证 API
      handleUnbanVerify(code, state, props.type);
    } else {
      // 这是普通登录，走原来的登录流程
      sendCode(code, state);
    }
  }, []);

  // 注册码输入弹窗
  const renderInvitationCodeModal = () => {
    return (
      <Modal
        title={null}
        visible={showInvitationCodeModal}
        footer={null}
        closable={false}
        centered={true}
        width={400}
      >
        <div className='flex flex-col items-center p-4'>
          <div className='flex items-center justify-center mb-4 gap-2'>
            <img src={logo} alt='Logo' className='h-8 rounded-full' />
            <Title heading={4} className='!text-gray-800'>
              {systemName}
            </Title>
          </div>

          <Title heading={5} className='mb-2'>
            {t('请输入注册码')}
          </Title>

          {oauthDisplayName && (
            <Text className='text-gray-500 mb-4'>
              {t('欢迎')}，{oauthDisplayName}
            </Text>
          )}

          <Form className='w-full'>
            <Form.Input
              field='invitation_code'
              label={t('注册码')}
              placeholder={t('请输入注册码')}
              prefix={<IconKey />}
              value={invitationCode}
              onChange={(value) => setInvitationCode(value)}
              rules={[{ required: true, message: t('请输入注册码') }]}
            />

            <div className='flex gap-2 mt-4'>
              <Button
                theme='light'
                className='flex-1'
                onClick={() => {
                  setShowInvitationCodeModal(false);
                  navigate('/register');
                }}
              >
                {t('取消')}
              </Button>
              <Button
                theme='solid'
                type='primary'
                className='flex-1'
                loading={submitLoading}
                onClick={handleSubmitInvitationCode}
              >
                {t('注册')}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    );
  };

  if (showInvitationCodeModal) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        {renderInvitationCodeModal()}
      </div>
    );
  }

  return <Loading />;
};

export default OAuth2Callback;
