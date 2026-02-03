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

import React, { useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showSuccess,
  updateAPI,
  setUserData,
} from '../../helpers';
import { UserContext } from '../../context/User';
import Loading from '../common/ui/Loading';

const OAuth2Callback = (props) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [, userDispatch] = useContext(UserContext);
  const navigate = useNavigate();

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

  return <Loading />;
};

export default OAuth2Callback;
