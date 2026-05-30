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
import { Modal, InputNumber, Space, Typography, Input, Tag, Divider, Button } from '@douyinfe/semi-ui';
import { IconPlus } from '@douyinfe/semi-icons';

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

// 系统预设的快速备注
const DEFAULT_REMARK_PRESETS = [
  'IP过多',
  '违反分组规则',
  '疑似分发',
  '滥用额度',
  '异常高频请求',
  '多账号',
  '违规内容',
  '恶意攻击',
];

const STORAGE_KEY = 'ban_remark_presets';

// 从 localStorage 获取自定义快速备注
function getCustomPresets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }
  return [];
}

// 保存自定义快速备注到 localStorage
function saveCustomPresets(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

const EnableDisableUserModal = ({
  visible,
  onCancel,
  onConfirm,
  user,
  action,
  t,
}) => {
  const isDisable = action === 'disable';
  const [banDuration, setBanDuration] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(10);
  const [remark, setRemark] = useState('');
  const [newPreset, setNewPreset] = useState('');
  const [customPresets, setCustomPresets] = useState([]);

  useEffect(() => {
    if (visible && isDisable) {
      setCustomPresets(getCustomPresets());
    }
    // 弹窗打开时重置表单状态
    if (visible) {
      setBanDuration(0);
      setCustomMinutes(10);
      setRemark('');
      setNewPreset('');
    }
  }, [visible, isDisable]);

  const handleConfirm = () => {
    if (isDisable) {
      let duration = banDuration;
      if (banDuration === -1) {
        duration = customMinutes * 60;
      }
      onConfirm(duration, remark.trim());
    } else {
      onConfirm(0, '');
    }
  };

  const handleSkip = () => {
    if (isDisable) {
      let duration = banDuration;
      if (banDuration === -1) {
        duration = customMinutes * 60;
      }
      onConfirm(duration, '');
    } else {
      onConfirm(0, '');
    }
  };

  const handleCancel = () => {
    setBanDuration(0);
    setCustomMinutes(10);
    setRemark('');
    setNewPreset('');
    onCancel();
  };

  // 点击快速选择药丸，填入封禁原因输入框
  const handlePresetClick = (preset) => {
    setRemark(preset);
  };

  // 删除自定义快速备注
  const handleDeletePreset = (preset) => {
    const updated = customPresets.filter((p) => p !== preset);
    setCustomPresets(updated);
    saveCustomPresets(updated);
  };

  // 添加新的快速备注
  const handleAddPreset = () => {
    const trimmed = newPreset.trim();
    if (!trimmed) return;
    if (DEFAULT_REMARK_PRESETS.includes(trimmed) || customPresets.includes(trimmed)) {
      setNewPreset('');
      return;
    }
    const updated = [...customPresets, trimmed];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setNewPreset('');
  };

  return (
    <Modal
      title={isDisable ? t('封禁用户') : t('确定要启用此用户吗？')}
      visible={visible}
      onCancel={handleCancel}
      footer={isDisable ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={handleCancel}>{t('取消')}</Button>
          <Button onClick={handleSkip}>{t('跳过备注')}</Button>
          <Button theme="solid" type="danger" onClick={handleConfirm}>{t('确认封禁')}</Button>
        </div>
      ) : undefined}
      onOk={isDisable ? undefined : handleConfirm}
      okText={isDisable ? undefined : t('确认')}
      width={isDisable ? 520 : undefined}
    >
      {isDisable ? (
        <div>
          {/* 封禁时长选择 */}
          <Text style={{ marginBottom: 8, display: 'block' }}>
            {t('选择封禁时长')}：
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            {BAN_DURATION_OPTIONS.map((opt) => (
              <Tag
                key={opt.value}
                size="large"
                color={banDuration === opt.value ? 'blue' : 'white'}
                type={banDuration === opt.value ? 'light' : 'ghost'}
                style={{
                  cursor: 'pointer',
                  border: banDuration === opt.value ? '1px solid var(--semi-color-primary)' : '1px solid var(--semi-color-border)',
                }}
                onClick={() => setBanDuration(opt.value)}
              >
                {t(opt.label)}
              </Tag>
            ))}
          </div>
          {banDuration === -1 && (
            <Space style={{ marginTop: 8 }}>
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

          <Divider margin={16} />

          {/* 封禁原因输入框 */}
          <Text style={{ marginBottom: 8, display: 'block' }}>
            {t('封禁原因')}：
          </Text>
          <Input
            placeholder={t('输入封禁原因（可选）')}
            value={remark}
            onChange={setRemark}
            showClear
          />

          {/* 快速选择区域 */}
          <Text type="tertiary" size="small" style={{ marginTop: 12, marginBottom: 8, display: 'block' }}>
            {t('快速选择')}：
          </Text>
          <div style={{
            maxHeight: 120,
            overflowY: 'auto',
            padding: '8px 0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}>
            {/* 系统预设（不可删除） */}
            {DEFAULT_REMARK_PRESETS.map((preset) => (
              <Tag
                key={preset}
                size="large"
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => handlePresetClick(preset)}
              >
                {preset}
              </Tag>
            ))}
            {/* 自定义预设（可删除） */}
            {customPresets.map((preset) => (
              <Tag
                key={preset}
                size="large"
                color="orange"
                closable
                onClose={(value, e) => { e.stopPropagation(); handleDeletePreset(preset); return false; }}
                style={{ cursor: 'pointer' }}
                onClick={() => handlePresetClick(preset)}
              >
                {preset}
              </Tag>
            ))}
          </div>

          {/* 添加快速选择 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input
              placeholder={t('输入新的快速选择项')}
              value={newPreset}
              onChange={setNewPreset}
              onEnterPress={handleAddPreset}
              style={{ flex: 1 }}
              size="small"
            />
            <Button
              size="small"
              icon={<IconPlus />}
              onClick={handleAddPreset}
              disabled={!newPreset.trim()}
            >
              {t('填入')}
            </Button>
          </div>
        </div>
      ) : (
        t('此操作将启用用户账户')
      )}
    </Modal>
  );
};

export default EnableDisableUserModal;
