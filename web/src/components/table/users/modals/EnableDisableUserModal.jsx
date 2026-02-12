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

import React, { useState } from 'react';
import { Modal, RadioGroup, Radio, InputNumber, Space, Typography } from '@douyinfe/semi-ui';

const { Text } = Typography;

const BAN_DURATION_OPTIONS = [
  { label: '1 分钟', value: 60 },
  { label: '5 分钟', value: 300 },
  { label: '30 分钟', value: 1800 },
  { label: '1 小时', value: 3600 },
  { label: '6 小时', value: 21600 },
  { label: '1 天', value: 86400 },
  { label: '3 天', value: 259200 },
  { label: '7 天', value: 604800 },
  { label: '30 天', value: 2592000 },
  { label: '永久封禁', value: 0 },
  { label: '自定义', value: -1 },
];

const EnableDisableUserModal = ({
  visible,
  onCancel,
  onConfirm,
  user,
  action,
  t,
}) => {
  const isDisable = action === 'disable';
  const [banDuration, setBanDuration] = useState(0); // 0 = permanent
  const [customMinutes, setCustomMinutes] = useState(10);

  const handleConfirm = () => {
    if (isDisable) {
      let duration = banDuration;
      if (banDuration === -1) {
        // custom: convert minutes to seconds
        duration = customMinutes * 60;
      }
      onConfirm(duration);
    } else {
      onConfirm(0);
    }
  };

  const handleCancel = () => {
    setBanDuration(0);
    setCustomMinutes(10);
    onCancel();
  };

  return (
    <Modal
      title={isDisable ? t('封禁用户') : t('确定要启用此用户吗？')}
      visible={visible}
      onCancel={handleCancel}
      onOk={handleConfirm}
      okText={isDisable ? t('确认封禁') : t('确认')}
      okButtonProps={isDisable ? { type: 'danger' } : {}}
      width={isDisable ? 480 : undefined}
    >
      {isDisable ? (
        <div>
          <Text style={{ marginBottom: 12, display: 'block' }}>
            {t('选择封禁时长')}：
          </Text>
          <RadioGroup
            type='pureCard'
            direction='vertical'
            value={banDuration}
            onChange={(e) => setBanDuration(e.target.value)}
            style={{ width: '100%' }}
          >
            {BAN_DURATION_OPTIONS.map((opt) => (
              <Radio key={opt.value} value={opt.value} style={{ marginBottom: 4 }}>
                {t(opt.label)}
              </Radio>
            ))}
          </RadioGroup>
          {banDuration === -1 && (
            <Space style={{ marginTop: 12 }}>
              <InputNumber
                min={1}
                max={525600}
                value={customMinutes}
                onChange={(v) => setCustomMinutes(v)}
                style={{ width: 120 }}
                suffix={t('分钟')}
              />
            </Space>
          )}
        </div>
      ) : (
        t('此操作将启用用户账户')
      )}
    </Modal>
  );
};

export default EnableDisableUserModal;
