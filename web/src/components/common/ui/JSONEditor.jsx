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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  Typography,
  Banner,
  Tabs,
  TabPane,
  Card,
  Input,
  InputNumber,
  Switch,
  TextArea,
  Row,
  Col,
  Divider,
  Tooltip,
  Dropdown,
  Upload,
  Toast,
  Popover,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconAlertTriangle, IconSync, IconDownload, IconUpload, IconRefresh } from '@douyinfe/semi-icons';
import { generateRedirectMapping, countRedirectableModels, MODEL_REDIRECT_TEMPLATES } from '../../../constants/modelRedirectTemplates';
import { API, showSuccess, showError, showInfo } from '../../../helpers';

const { Text } = Typography;

// 唯一 ID 生成器，确保在组件生命周期内稳定且递增
const generateUniqueId = (() => {
  let counter = 0;
  return () => `kv_${counter++}`;
})();

const JSONEditor = ({
  value = '',
  onChange,
  field,
  label,
  placeholder,
  extraText,
  extraFooter,
  showClear = true,
  template,
  templateLabel,
  editorType = 'keyValue',
  rules = [],
  formApi = null,
  channelModels = [], // 渠道模型列表，用于一键重定向
  onAutoRedirect = null, // 一键重定向回调
  onStandardizeModels = null, // 模型标准化回调，用于更新模型列表
  ...props
}) => {
  const { t } = useTranslation();

  // 将对象转换为键值对数组（包含唯一ID）
  const objectToKeyValueArray = useCallback((obj, prevPairs = []) => {
    if (!obj || typeof obj !== 'object') return [];

    const entries = Object.entries(obj);
    return entries.map(([key, value], index) => {
      // 如果上一次转换后同位置的键一致，则沿用其 id，保持 React key 稳定
      const prev = prevPairs[index];
      const shouldReuseId = prev && prev.key === key;
      return {
        id: shouldReuseId ? prev.id : generateUniqueId(),
        key,
        value,
      };
    });
  }, []);

  // 将键值对数组转换为对象（重复键时后面的会覆盖前面的）
  const keyValueArrayToObject = useCallback((arr) => {
    const result = {};
    arr.forEach((item) => {
      if (item.key) {
        result[item.key] = item.value;
      }
    });
    return result;
  }, []);

  // 初始化键值对数组
  const [keyValuePairs, setKeyValuePairs] = useState(() => {
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return objectToKeyValueArray(parsed);
      } catch (error) {
        return [];
      }
    }
    if (typeof value === 'object' && value !== null) {
      return objectToKeyValueArray(value);
    }
    return [];
  });

  // 手动模式下的本地文本缓冲
  const [manualText, setManualText] = useState(() => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object')
      return JSON.stringify(value, null, 2);
    return '';
  });

  // 根据键数量决定默认编辑模式
  const [editMode, setEditMode] = useState(() => {
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        const keyCount = Object.keys(parsed).length;
        return keyCount > 10 ? 'manual' : 'visual';
      } catch (error) {
        return 'manual';
      }
    }
    return 'visual';
  });

  const [jsonError, setJsonError] = useState('');

  // 计算重复的键
  const duplicateKeys = useMemo(() => {
    const keyCount = {};
    const duplicates = new Set();

    keyValuePairs.forEach((pair) => {
      if (pair.key) {
        keyCount[pair.key] = (keyCount[pair.key] || 0) + 1;
        if (keyCount[pair.key] > 1) {
          duplicates.add(pair.key);
        }
      }
    });

    return duplicates;
  }, [keyValuePairs]);

  // 数据同步 - 当value变化时更新键值对数组
  useEffect(() => {
    try {
      let parsed = {};
      if (typeof value === 'string' && value.trim()) {
        parsed = JSON.parse(value);
      } else if (typeof value === 'object' && value !== null) {
        parsed = value;
      }

      // 只在外部值真正改变时更新，避免循环更新
      const currentObj = keyValueArrayToObject(keyValuePairs);
      if (JSON.stringify(parsed) !== JSON.stringify(currentObj)) {
        setKeyValuePairs(objectToKeyValueArray(parsed, keyValuePairs));
      }
      setJsonError('');
    } catch (error) {
      console.log('JSON解析失败:', error.message);
      setJsonError(error.message);
    }
  }, [value]);

  // 外部 value 变化时，若不在手动模式，则同步手动文本
  useEffect(() => {
    if (editMode !== 'manual') {
      if (typeof value === 'string') setManualText(value);
      else if (value && typeof value === 'object')
        setManualText(JSON.stringify(value, null, 2));
      else setManualText('');
    }
  }, [value, editMode]);

  // 处理可视化编辑的数据变化
  const handleVisualChange = useCallback(
    (newPairs) => {
      setKeyValuePairs(newPairs);
      const jsonObject = keyValueArrayToObject(newPairs);
      const jsonString =
        Object.keys(jsonObject).length === 0
          ? ''
          : JSON.stringify(jsonObject, null, 2);

      setJsonError('');

      // 通过formApi设置值
      if (formApi && field) {
        formApi.setValue(field, jsonString);
      }

      onChange?.(jsonString);
    },
    [onChange, formApi, field, keyValueArrayToObject],
  );

  // 处理手动编辑的数据变化
  const handleManualChange = useCallback(
    (newValue) => {
      setManualText(newValue);
      if (newValue && newValue.trim()) {
        try {
          const parsed = JSON.parse(newValue);
          setKeyValuePairs(objectToKeyValueArray(parsed, keyValuePairs));
          setJsonError('');
          onChange?.(newValue);
        } catch (error) {
          setJsonError(error.message);
        }
      } else {
        setKeyValuePairs([]);
        setJsonError('');
        onChange?.('');
      }
    },
    [onChange, objectToKeyValueArray, keyValuePairs],
  );

  // 切换编辑模式
  const toggleEditMode = useCallback(() => {
    if (editMode === 'visual') {
      const jsonObject = keyValueArrayToObject(keyValuePairs);
      setManualText(
        Object.keys(jsonObject).length === 0
          ? ''
          : JSON.stringify(jsonObject, null, 2),
      );
      setEditMode('manual');
    } else {
      try {
        let parsed = {};
        if (manualText && manualText.trim()) {
          parsed = JSON.parse(manualText);
        } else if (typeof value === 'string' && value.trim()) {
          parsed = JSON.parse(value);
        } else if (typeof value === 'object' && value !== null) {
          parsed = value;
        }
        setKeyValuePairs(objectToKeyValueArray(parsed, keyValuePairs));
        setJsonError('');
        setEditMode('visual');
      } catch (error) {
        setJsonError(error.message);
        return;
      }
    }
  }, [
    editMode,
    value,
    manualText,
    keyValuePairs,
    keyValueArrayToObject,
    objectToKeyValueArray,
  ]);

  // 添加键值对
  const addKeyValue = useCallback(() => {
    const newPairs = [...keyValuePairs];
    const existingKeys = newPairs.map((p) => p.key);
    let counter = 1;
    let newKey = `field_${counter}`;
    while (existingKeys.includes(newKey)) {
      counter += 1;
      newKey = `field_${counter}`;
    }
    newPairs.push({
      id: generateUniqueId(),
      key: newKey,
      value: '',
    });
    handleVisualChange(newPairs);
  }, [keyValuePairs, handleVisualChange]);

  // 删除键值对
  const removeKeyValue = useCallback(
    (id) => {
      const newPairs = keyValuePairs.filter((pair) => pair.id !== id);
      handleVisualChange(newPairs);
    },
    [keyValuePairs, handleVisualChange],
  );

  // 更新键名
  const updateKey = useCallback(
    (id, newKey) => {
      const newPairs = keyValuePairs.map((pair) =>
        pair.id === id ? { ...pair, key: newKey } : pair,
      );
      handleVisualChange(newPairs);
    },
    [keyValuePairs, handleVisualChange],
  );

  // 更新值
  const updateValue = useCallback(
    (id, newValue) => {
      const newPairs = keyValuePairs.map((pair) =>
        pair.id === id ? { ...pair, value: newValue } : pair,
      );
      handleVisualChange(newPairs);
    },
    [keyValuePairs, handleVisualChange],
  );

  // 填入模板
  const fillTemplate = useCallback(() => {
    if (template) {
      const templateString = JSON.stringify(template, null, 2);

      if (formApi && field) {
        formApi.setValue(field, templateString);
      }

      setManualText(templateString);
      setKeyValuePairs(objectToKeyValueArray(template, keyValuePairs));
      onChange?.(templateString);
      setJsonError('');
    }
  }, [
    template,
    onChange,
    formApi,
    field,
    objectToKeyValueArray,
    keyValuePairs,
  ]);

  // ===== 模板管理功能 =====

  // 导出模板 - 下载当前模板库为JSON文件
  const handleExportTemplates = useCallback(async () => {
    try {
      // 尝试从数据库获取自定义模板
      let templates = MODEL_REDIRECT_TEMPLATES;
      try {
        const res = await API.get('/api/option/');
        if (res?.data?.success && res?.data?.data) {
          const customTemplateOption = res.data.data.find(
            (opt) => opt.key === 'ModelRedirectTemplates'
          );
          if (customTemplateOption?.value) {
            templates = JSON.parse(customTemplateOption.value);
          }
        }
      } catch (e) {
        // 使用内置模板
      }

      const dataStr = JSON.stringify(templates, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'model_redirect_templates.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(t('模板导出成功'));
    } catch (error) {
      showError(t('模板导出失败: ') + error.message);
    }
  }, [t]);

  // 导入模板 - 上传JSON文件并保存到数据库
  const handleImportTemplates = useCallback(async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target.result;
          const templates = JSON.parse(content);

          // 验证模板格式
          if (typeof templates !== 'object' || Array.isArray(templates)) {
            showError(t('无效的模板格式，必须是 JSON 对象'));
            return;
          }

          // 保存到数据库
          const res = await API.put('/api/option/', {
            key: 'ModelRedirectTemplates',
            value: JSON.stringify(templates),
          });

          if (res?.data?.success) {
            showSuccess(t('模板导入成功，共 {{count}} 个映射', { count: Object.keys(templates).length }));
          } else {
            showError(t('模板保存失败: ') + (res?.data?.message || '未知错误'));
          }
        } catch (parseError) {
          showError(t('JSON 解析失败: ') + parseError.message);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      showError(t('文件读取失败: ') + error.message);
    }
    return false; // 阻止默认上传行为
  }, [t]);

  // 恢复默认模板 - 清除数据库中的自定义模板
  const handleResetTemplates = useCallback(async () => {
    try {
      const res = await API.put('/api/option/', {
        key: 'ModelRedirectTemplates',
        value: '',
      });

      if (res?.data?.success) {
        showSuccess(t('已恢复为默认模板'));
      } else {
        showError(t('恢复失败: ') + (res?.data?.message || '未知错误'));
      }
    } catch (error) {
      showError(t('恢复失败: ') + error.message);
    }
  }, [t]);

  // 简单填入模板 - 用于非模型重定向模式
  const handleFillTemplate = useCallback(() => {
    if (template) {
      const jsonStr = JSON.stringify(template, null, 2);
      setManualText(jsonStr);

      // 对于 keyValue 类型，同时更新键值对
      if (editorType === 'keyValue') {
        try {
          const obj = JSON.parse(jsonStr);
          setKeyValuePairs(objectToKeyValueArray(obj));
        } catch (e) {
          // ignore
        }
      }

      // 通知外部值变化
      if (onChange) {
        onChange(jsonStr);
      }
      showSuccess(t('已填入模板'));
    }
  }, [template, editorType, objectToKeyValueArray, onChange, t]);

  // 模板管理下拉菜单
  const templateDropdownMenu = useMemo(() => [
    {
      node: 'item',
      key: 'export',
      name: t('导出模板'),
      icon: <IconDownload />,
      onClick: handleExportTemplates,
    },
    {
      node: 'item',
      key: 'import',
      name: (
        <Upload
          action=""
          accept=".json"
          showUploadList={false}
          beforeUpload={({ file }) => {
            handleImportTemplates(file.fileInstance);
            return false;
          }}
        >
          <span className="flex items-center gap-2">
            <IconUpload />
            {t('导入模板')}
          </span>
        </Upload>
      ),
    },
    {
      node: 'divider',
    },
    {
      node: 'item',
      key: 'reset',
      name: t('恢复默认'),
      icon: <IconRefresh />,
      onClick: handleResetTemplates,
    },
  ], [t, handleExportTemplates, handleImportTemplates, handleResetTemplates]);

  // ===== 批量添加/删除前缀/后缀功能 =====

  // 前缀/后缀弹窗状态
  const [prefixValue, setPrefixValue] = useState('');
  const [suffixValue, setSuffixValue] = useState('');
  const [prefixPreview, setPrefixPreview] = useState(null); // { matched: [], unmatched: [], action: 'add'|'remove', value: '' }
  const [suffixPreview, setSuffixPreview] = useState(null);

  // 解析输入（+xxx 或 -xxx）
  const parseInput = useCallback((input) => {
    if (!input || !input.trim()) return null;
    const trimmed = input.trim();
    if (trimmed.startsWith('+')) {
      return { action: 'add', value: trimmed.slice(1) };
    } else if (trimmed.startsWith('-')) {
      return { action: 'remove', value: trimmed.slice(1) };
    }
    // 默认添加
    return { action: 'add', value: trimmed };
  }, []);

  // 预览前缀操作
  const handlePrefixPreview = useCallback(() => {
    const parsed = parseInput(prefixValue);
    if (!parsed || !parsed.value) {
      showError(t('请输入有效的前缀'));
      return;
    }

    const matched = [];
    const unmatched = [];

    keyValuePairs.forEach(pair => {
      if (parsed.action === 'remove') {
        // 删除前缀：检查是否有这个前缀
        if (pair.key.startsWith(parsed.value)) {
          matched.push({ old: pair.key, new: pair.key.slice(parsed.value.length) });
        } else {
          unmatched.push(pair.key);
        }
      } else {
        // 添加前缀：所有都匹配
        matched.push({ old: pair.key, new: parsed.value + pair.key });
      }
    });

    setPrefixPreview({ matched, unmatched, action: parsed.action, value: parsed.value });
  }, [prefixValue, keyValuePairs, parseInput, t]);

  // 预览后缀操作
  const handleSuffixPreview = useCallback(() => {
    const parsed = parseInput(suffixValue);
    if (!parsed || !parsed.value) {
      showError(t('请输入有效的后缀'));
      return;
    }

    const matched = [];
    const unmatched = [];

    keyValuePairs.forEach(pair => {
      if (parsed.action === 'remove') {
        // 删除后缀：检查是否有这个后缀
        if (pair.key.endsWith(parsed.value)) {
          matched.push({ old: pair.key, new: pair.key.slice(0, -parsed.value.length) });
        } else {
          unmatched.push(pair.key);
        }
      } else {
        // 添加后缀：所有都匹配
        matched.push({ old: pair.key, new: pair.key + parsed.value });
      }
    });

    setSuffixPreview({ matched, unmatched, action: parsed.action, value: parsed.value });
  }, [suffixValue, keyValuePairs, parseInput, t]);

  // 执行前缀修改
  const handlePrefixConfirm = useCallback(() => {
    if (!prefixPreview || prefixPreview.matched.length === 0) return;

    const keyMap = {};
    prefixPreview.matched.forEach(item => {
      keyMap[item.old] = item.new;
    });

    const newPairs = keyValuePairs.map(pair => ({
      ...pair,
      key: keyMap[pair.key] !== undefined ? keyMap[pair.key] : pair.key,
    }));

    setKeyValuePairs(newPairs);

    // 同步更新 JSON
    const newObj = {};
    newPairs.forEach(pair => {
      if (pair.key.trim()) {
        newObj[pair.key] = pair.value;
      }
    });

    const jsonString = JSON.stringify(newObj, null, 2);
    setManualText(jsonString);
    if (formApi && field) {
      formApi.setValue(field, jsonString);
    }
    onChange?.(jsonString);

    const actionText = prefixPreview.action === 'add' ? t('添加') : t('删除');
    showSuccess(t('已{{action}}前缀，处理 {{matched}} 个，跳过 {{unmatched}} 个', {
      action: actionText,
      matched: prefixPreview.matched.length,
      unmatched: prefixPreview.unmatched.length
    }));

    setPrefixPreview(null);
    setPrefixValue('');
  }, [prefixPreview, keyValuePairs, formApi, field, onChange, t]);

  // 执行后缀修改
  const handleSuffixConfirm = useCallback(() => {
    if (!suffixPreview || suffixPreview.matched.length === 0) return;

    const keyMap = {};
    suffixPreview.matched.forEach(item => {
      keyMap[item.old] = item.new;
    });

    const newPairs = keyValuePairs.map(pair => ({
      ...pair,
      key: keyMap[pair.key] !== undefined ? keyMap[pair.key] : pair.key,
    }));

    setKeyValuePairs(newPairs);

    // 同步更新 JSON
    const newObj = {};
    newPairs.forEach(pair => {
      if (pair.key.trim()) {
        newObj[pair.key] = pair.value;
      }
    });

    const jsonString = JSON.stringify(newObj, null, 2);
    setManualText(jsonString);
    if (formApi && field) {
      formApi.setValue(field, jsonString);
    }
    onChange?.(jsonString);

    const actionText = suffixPreview.action === 'add' ? t('添加') : t('删除');
    showSuccess(t('已{{action}}后缀，处理 {{matched}} 个，跳过 {{unmatched}} 个', {
      action: actionText,
      matched: suffixPreview.matched.length,
      unmatched: suffixPreview.unmatched.length
    }));

    setSuffixPreview(null);
    setSuffixValue('');
  }, [suffixPreview, keyValuePairs, formApi, field, onChange, t]);


  // 一键重定向 - 根据渠道模型列表自动生成重定向映射，并标准化模型列表
  const handleAutoRedirect = useCallback(async () => {
    if (!channelModels || channelModels.length === 0) {
      showInfo(t('模型列表为空'));
      return;
    }

    // 获取现有的映射
    let existingMapping = {};
    try {
      if (typeof value === 'string' && value.trim()) {
        existingMapping = JSON.parse(value);
      } else if (typeof value === 'object' && value !== null) {
        existingMapping = value;
      }
    } catch {
      existingMapping = {};
    }

    // 尝试从数据库获取自定义模板
    let customTemplates = null;
    try {
      const res = await API.get('/api/option/');
      if (res?.data?.success && res?.data?.data) {
        const customTemplateOption = res.data.data.find(
          (opt) => opt.key === 'ModelRedirectTemplates'
        );
        if (customTemplateOption?.value) {
          customTemplates = JSON.parse(customTemplateOption.value);
        }
      }
    } catch (e) {
      // 使用内置模板
    }

    // 生成新的重定向映射
    const newMapping = generateRedirectMapping(channelModels, existingMapping, customTemplates);

    if (Object.keys(newMapping).length === 0) {
      return;
    }

    const mappingString = JSON.stringify(newMapping, null, 2);

    if (formApi && field) {
      formApi.setValue(field, mappingString);
    }

    setManualText(mappingString);
    setKeyValuePairs(objectToKeyValueArray(newMapping, keyValuePairs));
    onChange?.(mappingString);
    setJsonError('');

    // 调用外部回调（如果有）
    onAutoRedirect?.(newMapping);

    // 模型标准化：用标准模型名替换原始模型名
    if (onStandardizeModels) {
      // newMapping 格式: { "标准名": "原始名" }
      // 需要从模型列表中删除原始名，添加标准名
      const standardNames = Object.keys(newMapping);
      const originalNames = Object.values(newMapping);

      // 过滤掉原始名，添加标准名
      const newModels = channelModels
        .filter(model => !originalNames.includes(model))
        .concat(standardNames.filter(name => !channelModels.includes(name)));

      // 去重
      const uniqueModels = [...new Set(newModels)];

      onStandardizeModels(uniqueModels);
      showSuccess(t('一键重定向完成，生成 {{count}} 个映射，标准化 {{modelCount}} 个模型', {
        count: Object.keys(newMapping).length,
        modelCount: standardNames.length
      }));
    } else {
      showSuccess(t('一键重定向完成，生成 {{count}} 个映射', { count: Object.keys(newMapping).length }));
    }
  }, [
    channelModels,
    value,
    onChange,
    formApi,
    field,
    objectToKeyValueArray,
    keyValuePairs,
    onAutoRedirect,
    onStandardizeModels,
  ]);

  // 计算可重定向的模型数量
  const redirectableCount = useMemo(() => {
    return countRedirectableModels(channelModels);
  }, [channelModels]);

  // 渲染值输入控件（支持嵌套）
  const renderValueInput = (pairId, value) => {
    const valueType = typeof value;

    if (valueType === 'boolean') {
      return (
        <div className='flex items-center'>
          <Switch
            checked={value}
            onChange={(newValue) => updateValue(pairId, newValue)}
          />
          <Text type='tertiary' className='ml-2'>
            {value ? t('true') : t('false')}
          </Text>
        </div>
      );
    }

    if (valueType === 'number') {
      return (
        <InputNumber
          value={value}
          onChange={(newValue) => updateValue(pairId, newValue)}
          style={{ width: '100%' }}
          placeholder={t('输入数字')}
        />
      );
    }

    if (valueType === 'object' && value !== null) {
      // 简化嵌套对象的处理，使用TextArea
      return (
        <TextArea
          rows={2}
          value={JSON.stringify(value, null, 2)}
          onChange={(txt) => {
            try {
              const obj = txt.trim() ? JSON.parse(txt) : {};
              updateValue(pairId, obj);
            } catch {
              // 忽略解析错误
            }
          }}
          placeholder={t('输入JSON对象')}
        />
      );
    }

    // 字符串或其他原始类型
    return (
      <Input
        placeholder={t('参数值')}
        value={String(value)}
        onChange={(newValue) => {
          let convertedValue = newValue;
          if (newValue === 'true') convertedValue = true;
          else if (newValue === 'false') convertedValue = false;
          else if (!isNaN(newValue) && newValue !== '') {
            const num = Number(newValue);
            // 检查是否为整数
            if (Number.isInteger(num)) {
              convertedValue = num;
            }
          }
          updateValue(pairId, convertedValue);
        }}
      />
    );
  };

  // 渲染键值对编辑器
  const renderKeyValueEditor = () => {
    return (
      <div className='space-y-1'>
        {/* 重复键警告 */}
        {duplicateKeys.size > 0 && (
          <Banner
            type='warning'
            icon={<IconAlertTriangle />}
            description={
              <div>
                <Text strong>{t('存在重复的键名：')}</Text>
                <Text>{Array.from(duplicateKeys).join(', ')}</Text>
                <br />
                <Text type='tertiary' size='small'>
                  {t('注意：JSON中重复的键只会保留最后一个同名键的值')}
                </Text>
              </div>
            }
            className='mb-3'
          />
        )}

        {keyValuePairs.length === 0 && (
          <div className='text-center py-6 px-4'>
            <Text type='tertiary' className='text-gray-500 text-sm'>
              {t('暂无数据，点击下方按钮添加键值对')}
            </Text>
          </div>
        )}

        {keyValuePairs.map((pair, index) => {
          const isDuplicate = duplicateKeys.has(pair.key);
          const isLastDuplicate =
            isDuplicate &&
            keyValuePairs.slice(index + 1).every((p) => p.key !== pair.key);

          return (
            <Row key={pair.id} gutter={8} align='middle'>
              <Col span={10}>
                <div className='relative'>
                  <Input
                    placeholder={t('键名')}
                    value={pair.key}
                    onChange={(newKey) => updateKey(pair.id, newKey)}
                    status={isDuplicate ? 'warning' : undefined}
                  />
                  {isDuplicate && (
                    <Tooltip
                      content={
                        isLastDuplicate
                          ? t('这是重复键中的最后一个，其值将被使用')
                          : t('重复的键名，此值将被后面的同名键覆盖')
                      }
                    >
                      <IconAlertTriangle
                        className='absolute right-2 top-1/2 transform -translate-y-1/2'
                        style={{
                          color: isLastDuplicate ? '#ff7d00' : '#faad14',
                          fontSize: '14px',
                        }}
                      />
                    </Tooltip>
                  )}
                </div>
              </Col>
              <Col span={12}>{renderValueInput(pair.id, pair.value)}</Col>
              <Col span={2}>
                <Button
                  icon={<IconDelete />}
                  type='danger'
                  theme='borderless'
                  onClick={() => removeKeyValue(pair.id)}
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
          );
        })}

        <div className='mt-2 flex justify-center'>
          <Button
            icon={<IconPlus />}
            type='primary'
            theme='outline'
            onClick={addKeyValue}
          >
            {t('添加键值对')}
          </Button>
        </div>
      </div>
    );
  };

  // 渲染区域编辑器（特殊格式）- 也需要改造以支持重复键
  const renderRegionEditor = () => {
    const defaultPair = keyValuePairs.find((pair) => pair.key === 'default');
    const modelPairs = keyValuePairs.filter((pair) => pair.key !== 'default');

    return (
      <div className='space-y-2'>
        {/* 重复键警告 */}
        {duplicateKeys.size > 0 && (
          <Banner
            type='warning'
            icon={<IconAlertTriangle />}
            description={
              <div>
                <Text strong>{t('存在重复的键名：')}</Text>
                <Text>{Array.from(duplicateKeys).join(', ')}</Text>
                <br />
                <Text type='tertiary' size='small'>
                  {t('注意：JSON中重复的键只会保留最后一个同名键的值')}
                </Text>
              </div>
            }
            className='mb-3'
          />
        )}

        {/* 默认区域 */}
        <Form.Slot label={t('默认区域')}>
          <Input
            placeholder={t('默认区域，如: us-central1')}
            value={defaultPair ? defaultPair.value : ''}
            onChange={(value) => {
              if (defaultPair) {
                updateValue(defaultPair.id, value);
              } else {
                const newPairs = [
                  ...keyValuePairs,
                  {
                    id: generateUniqueId(),
                    key: 'default',
                    value: value,
                  },
                ];
                handleVisualChange(newPairs);
              }
            }}
          />
        </Form.Slot>

        {/* 模型专用区域 */}
        <Form.Slot label={t('模型专用区域')}>
          <div>
            {modelPairs.map((pair) => {
              const isDuplicate = duplicateKeys.has(pair.key);
              return (
                <Row key={pair.id} gutter={8} align='middle' className='mb-2'>
                  <Col span={10}>
                    <div className='relative'>
                      <Input
                        placeholder={t('模型名称')}
                        value={pair.key}
                        onChange={(newKey) => updateKey(pair.id, newKey)}
                        status={isDuplicate ? 'warning' : undefined}
                      />
                      {isDuplicate && (
                        <Tooltip content={t('重复的键名')}>
                          <IconAlertTriangle
                            className='absolute right-2 top-1/2 transform -translate-y-1/2'
                            style={{ color: '#faad14', fontSize: '14px' }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder={t('区域')}
                      value={pair.value}
                      onChange={(newValue) => updateValue(pair.id, newValue)}
                    />
                  </Col>
                  <Col span={2}>
                    <Button
                      icon={<IconDelete />}
                      type='danger'
                      theme='borderless'
                      onClick={() => removeKeyValue(pair.id)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              );
            })}

            <div className='mt-2 flex justify-center'>
              <Button
                icon={<IconPlus />}
                onClick={addKeyValue}
                type='primary'
                theme='outline'
              >
                {t('添加模型区域')}
              </Button>
            </div>
          </div>
        </Form.Slot>
      </div>
    );
  };

  // 渲染可视化编辑器
  const renderVisualEditor = () => {
    switch (editorType) {
      case 'region':
        return renderRegionEditor();
      case 'object':
      case 'keyValue':
      default:
        return renderKeyValueEditor();
    }
  };

  const hasJsonError = jsonError && jsonError.trim() !== '';

  return (
    <Form.Slot label={label}>
      <Card
        header={
          <div className='flex justify-between items-center'>
            <Tabs
              type='slash'
              activeKey={editMode}
              onChange={(key) => {
                if (key === 'manual' && editMode === 'visual') {
                  setEditMode('manual');
                } else if (key === 'visual' && editMode === 'manual') {
                  toggleEditMode();
                }
              }}
            >
              <TabPane tab={t('可视化')} itemKey='visual' />
              <TabPane tab={t('手动编辑')} itemKey='manual' />
            </Tabs>

            <div className='flex gap-1'>
              {/* 批量前缀按钮 - 仅在模型重定向模式下显示 */}
              {onStandardizeModels && (
                <Popover
                  trigger='click'
                  position='bottomLeft'
                  onVisibleChange={(visible) => {
                    if (!visible) {
                      setPrefixPreview(null);
                      setPrefixValue('');
                    }
                  }}
                  content={
                    <div className='p-3' style={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
                      <Text type='secondary' size='small' className='block mb-2'>
                        {t('+xxx 添加前缀，-xxx 删除前缀')}
                      </Text>
                      <div className='flex gap-1 mb-2'>
                        <Input
                          placeholder={t('例如: +gpt- 或 -GLM-')}
                          value={prefixValue}
                          onChange={setPrefixValue}
                          size='small'
                          style={{ flex: 1 }}
                        />
                        <Button size='small' onClick={handlePrefixPreview}>
                          {t('预览')}
                        </Button>
                      </div>

                      {/* 预览结果 */}
                      {prefixPreview && (
                        <div className='mt-2'>
                          {prefixPreview.matched.length > 0 && (
                            <div className='mb-2'>
                              <Text type='success' size='small' className='block mb-1'>
                                ✓ {t('将修改')} ({prefixPreview.matched.length})
                              </Text>
                              <div style={{ maxHeight: 100, overflow: 'auto', background: 'var(--semi-color-fill-0)', borderRadius: 4, padding: 4 }}>
                                {prefixPreview.matched.map((item, idx) => (
                                  <div key={idx} style={{ fontSize: 12 }}>
                                    <Text delete>{item.old}</Text> → <Text type='success'>{item.new}</Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {prefixPreview.unmatched.length > 0 && (
                            <div className='mb-2'>
                              <Text type='tertiary' size='small' className='block mb-1'>
                                ○ {t('跳过')} ({prefixPreview.unmatched.length})
                              </Text>
                              <div style={{ maxHeight: 60, overflow: 'auto', background: 'var(--semi-color-fill-0)', borderRadius: 4, padding: 4 }}>
                                {prefixPreview.unmatched.map((key, idx) => (
                                  <div key={idx} style={{ fontSize: 12 }}>
                                    <Text type='tertiary'>{key}</Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className='flex justify-end gap-1 mt-2'>
                            <Button size='small' onClick={() => setPrefixPreview(null)}>
                              {t('取消')}
                            </Button>
                            <Button
                              size='small'
                              type='primary'
                              disabled={prefixPreview.matched.length === 0}
                              onClick={handlePrefixConfirm}
                            >
                              {t('确认修改')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  }
                >
                  <Button
                    type='tertiary'
                    size='small'
                    title={t('批量添加/删除前缀\n+xxx 添加前缀\n-xxx 删除前缀')}
                  >
                    {t('前缀')}
                  </Button>
                </Popover>
              )}

              {/* 批量后缀按钮 - 仅在模型重定向模式下显示 */}
              {onStandardizeModels && (
                <Popover
                  trigger='click'
                  position='bottomLeft'
                  onVisibleChange={(visible) => {
                    if (!visible) {
                      setSuffixPreview(null);
                      setSuffixValue('');
                    }
                  }}
                  content={
                    <div className='p-3' style={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
                      <Text type='secondary' size='small' className='block mb-2'>
                        {t('+xxx 添加后缀，-xxx 删除后缀')}
                      </Text>
                      <div className='flex gap-1 mb-2'>
                        <Input
                          placeholder={t('例如: +-pro 或 --mini')}
                          value={suffixValue}
                          onChange={setSuffixValue}
                          size='small'
                          style={{ flex: 1 }}
                        />
                        <Button size='small' onClick={handleSuffixPreview}>
                          {t('预览')}
                        </Button>
                      </div>

                      {/* 预览结果 */}
                      {suffixPreview && (
                        <div className='mt-2'>
                          {suffixPreview.matched.length > 0 && (
                            <div className='mb-2'>
                              <Text type='success' size='small' className='block mb-1'>
                                ✓ {t('将修改')} ({suffixPreview.matched.length})
                              </Text>
                              <div style={{ maxHeight: 100, overflow: 'auto', background: 'var(--semi-color-fill-0)', borderRadius: 4, padding: 4 }}>
                                {suffixPreview.matched.map((item, idx) => (
                                  <div key={idx} style={{ fontSize: 12 }}>
                                    <Text delete>{item.old}</Text> → <Text type='success'>{item.new}</Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {suffixPreview.unmatched.length > 0 && (
                            <div className='mb-2'>
                              <Text type='tertiary' size='small' className='block mb-1'>
                                ○ {t('跳过')} ({suffixPreview.unmatched.length})
                              </Text>
                              <div style={{ maxHeight: 60, overflow: 'auto', background: 'var(--semi-color-fill-0)', borderRadius: 4, padding: 4 }}>
                                {suffixPreview.unmatched.map((key, idx) => (
                                  <div key={idx} style={{ fontSize: 12 }}>
                                    <Text type='tertiary'>{key}</Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className='flex justify-end gap-1 mt-2'>
                            <Button size='small' onClick={() => setSuffixPreview(null)}>
                              {t('取消')}
                            </Button>
                            <Button
                              size='small'
                              type='primary'
                              disabled={suffixPreview.matched.length === 0}
                              onClick={handleSuffixConfirm}
                            >
                              {t('确认修改')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  }
                >
                  <Button
                    type='tertiary'
                    size='small'
                    title={t('批量添加/删除后缀\n+xxx 添加后缀\n-xxx 删除后缀')}
                  >
                    {t('后缀')}
                  </Button>
                </Popover>
              )}

              {/* 一键重定向按钮 - 仅在模型重定向模式下显示 */}
              {onStandardizeModels && (
                <Tooltip content={
                  redirectableCount > 0
                    ? t('根据模型列表自动生成重定向映射，可重定向 {{count}} 个模型', { count: redirectableCount })
                    : t('根据内置模板库自动生成重定向映射')
                }>
                  <Button
                    type='primary'
                    theme='light'
                    onClick={handleAutoRedirect}
                    size='small'
                    icon={<IconSync />}
                  >
                    {t('一键重定向')}
                  </Button>
                </Tooltip>
              )}

              {/* 填入模板按钮 - 模型重定向模式下显示复杂下拉菜单 */}
              {template && templateLabel && onStandardizeModels && (
                <Dropdown
                  trigger='click'
                  position='bottomRight'
                  menu={templateDropdownMenu}
                  render={
                    <Dropdown.Menu>
                      <Dropdown.Item
                        icon={<IconDownload />}
                        onClick={handleExportTemplates}
                      >
                        {t('导出模板')}
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <Upload
                          action=""
                          accept=".json"
                          showUploadList={false}
                          beforeUpload={({ file }) => {
                            handleImportTemplates(file.fileInstance);
                            return false;
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <IconUpload />
                            {t('导入模板')}
                          </span>
                        </Upload>
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item
                        icon={<IconRefresh />}
                        onClick={handleResetTemplates}
                      >
                        {t('恢复默认')}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  }
                >
                  <Button type='tertiary' size='small'>
                    {templateLabel} ▼
                  </Button>
                </Dropdown>
              )}

              {/* 填入模板按钮 - 非模型重定向模式下显示简单按钮 */}
              {template && templateLabel && !onStandardizeModels && (
                <Button
                  type='tertiary'
                  size='small'
                  onClick={handleFillTemplate}
                >
                  {templateLabel}
                </Button>
              )}
            </div>
          </div>
        }
        headerStyle={{ padding: '12px 16px' }}
        bodyStyle={{ padding: '16px' }}
        className='!rounded-2xl'
      >
        {/* JSON错误提示 */}
        {hasJsonError && (
          <Banner
            type='danger'
            description={`JSON 格式错误: ${jsonError}`}
            className='mb-3'
          />
        )}

        {/* 编辑器内容 */}
        {editMode === 'visual' ? (
          <div>
            {renderVisualEditor()}
            {/* 隐藏的Form字段用于验证和数据绑定 */}
            <Form.Input
              field={field}
              value={value}
              rules={rules}
              style={{ display: 'none' }}
              noLabel={true}
              {...props}
            />
          </div>
        ) : (
          <div>
            <TextArea
              placeholder={placeholder}
              value={manualText}
              onChange={handleManualChange}
              showClear={showClear}
              rows={Math.max(8, manualText ? manualText.split('\n').length : 8)}
            />
            {/* 隐藏的Form字段用于验证和数据绑定 */}
            <Form.Input
              field={field}
              value={value}
              rules={rules}
              style={{ display: 'none' }}
              noLabel={true}
              {...props}
            />
          </div>
        )}

        {/* 额外文本显示在卡片底部 */}
        {extraText && (
          <Divider margin='12px' align='center'>
            <Text type='tertiary' size='small'>
              {extraText}
            </Text>
          </Divider>
        )}
        {extraFooter && <div className='mt-1'>{extraFooter}</div>}
      </Card>
    </Form.Slot>
  );
};

export default JSONEditor;
