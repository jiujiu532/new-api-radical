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

import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin, Typography, RadioGroup, Radio, InputNumber } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  renderQuotaWithPrompt,
} from '../../../helpers';

export default function SettingsCheckin(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    'checkin_setting.enabled': false,
    'checkin_setting.mode': 'daily',
    'checkin_setting.min_quota': 1000,
    'checkin_setting.max_quota': 10000,
    'checkin_setting.fixed_quota': 5000,
    'checkin_setting.random_mode': true,
    'checkin_setting.low_quota_threshold': 10000,
    'checkin_setting.low_quota_reward': 50000,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function handleFieldChange(fieldName) {
    return (value) => {
      // Semi UI 的 RadioGroup onChange 返回的是事件对象，需要提取 target.value
      const actualValue = value?.target?.value !== undefined ? value.target.value : value;
      setInputs((inputs) => ({ ...inputs, [fieldName]: actualValue }));
    };
  }

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (typeof inputs[item.key] === 'boolean') {
        value = String(inputs[item.key]);
      } else {
        value = String(inputs[item.key]);
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined))
            return showError(t('部分保存失败，请重试'));
        }
        showSuccess(t('保存成功'));
        props.refresh();
      })
      .catch(() => {
        showError(t('保存失败，请重试'));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    // 使用默认值作为基础，然后用服务器返回的值覆盖
    const defaultInputs = {
      'checkin_setting.enabled': false,
      'checkin_setting.mode': 'daily',
      'checkin_setting.min_quota': 1000,
      'checkin_setting.max_quota': 10000,
      'checkin_setting.fixed_quota': 5000,
      'checkin_setting.random_mode': true,
      'checkin_setting.low_quota_threshold': 10000,
      'checkin_setting.low_quota_reward': 50000,
    };

    const currentInputs = { ...defaultInputs };
    for (let key in props.options) {
      if (Object.keys(defaultInputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);

  // 当 inputs 变化时（如切换模式），同步表单值
  useEffect(() => {
    if (refForm.current) {
      refForm.current.setValues(inputs);
    }
  }, [inputs]);

  const isEnabled = inputs['checkin_setting.enabled'];
  const mode = inputs['checkin_setting.mode'] || 'daily';
  const isRandomMode = inputs['checkin_setting.random_mode'];
  const isDailyMode = mode === 'daily';
  const isLowQuotaMode = mode === 'low_quota';

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('签到设置')}>
            <Typography.Text
              type='tertiary'
              style={{ marginBottom: 16, display: 'block' }}
            >
              {t('签到功能允许用户获取额度奖励，支持两种模式：每日签到和低额度签到')}
            </Typography.Text>

            {/* 基本设置 */}
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={'checkin_setting.enabled'}
                  label={t('启用签到功能')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={handleFieldChange('checkin_setting.enabled')}
                />
              </Col>
              <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                <Form.RadioGroup
                  field={'checkin_setting.mode'}
                  label={t('签到模式')}
                  type='button'
                  buttonSize='middle'
                  onChange={handleFieldChange('checkin_setting.mode')}
                  disabled={!isEnabled}
                >
                  <Radio value='daily'>{t('每日签到')}</Radio>
                  <Radio value='low_quota'>{t('低额度签到')}</Radio>
                </Form.RadioGroup>
                <Typography.Text type='tertiary' size='small' style={{ marginTop: 4, display: 'block' }}>
                  {isDailyMode
                    ? t('每日签到：用户每天可签到一次获得奖励')
                    : t('低额度签到：用户余额低于阈值时可签到获得奖励')}
                </Typography.Text>
              </Col>
            </Row>

            {/* 每日签到模式配置 */}
            {isDailyMode && (
              <>
                <Typography.Title heading={6} style={{ marginTop: 20, marginBottom: 12 }}>
                  {t('每日签到配置')}
                </Typography.Title>
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Form.Switch
                      field={'checkin_setting.random_mode'}
                      label={t('随机额度模式')}
                      size='default'
                      checkedText='｜'
                      uncheckedText='〇'
                      extraText={t('关闭后使用固定额度')}
                      onChange={handleFieldChange('checkin_setting.random_mode')}
                      disabled={!isEnabled}
                    />
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Form.InputNumber
                      field={'checkin_setting.fixed_quota'}
                      label={t('固定签到额度')}
                      placeholder={t('固定模式下的签到额度')}
                      extraText={
                        !isRandomMode && inputs['checkin_setting.fixed_quota']
                          ? renderQuotaWithPrompt(parseInt(inputs['checkin_setting.fixed_quota']) || 0)
                          : t('固定模式下使用此额度')
                      }
                      onChange={handleFieldChange('checkin_setting.fixed_quota')}
                      min={0}
                      disabled={!isEnabled || isRandomMode}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Form.InputNumber
                      field={'checkin_setting.min_quota'}
                      label={t('签到最小额度')}
                      placeholder={t('随机模式下的最小额度')}
                      extraText={
                        isRandomMode && inputs['checkin_setting.min_quota']
                          ? renderQuotaWithPrompt(parseInt(inputs['checkin_setting.min_quota']) || 0)
                          : t('随机模式下使用')
                      }
                      onChange={handleFieldChange('checkin_setting.min_quota')}
                      min={0}
                      disabled={!isEnabled || !isRandomMode}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <Form.InputNumber
                      field={'checkin_setting.max_quota'}
                      label={t('签到最大额度')}
                      placeholder={t('随机模式下的最大额度')}
                      extraText={
                        isRandomMode && inputs['checkin_setting.max_quota']
                          ? renderQuotaWithPrompt(parseInt(inputs['checkin_setting.max_quota']) || 0)
                          : t('随机模式下使用')
                      }
                      onChange={handleFieldChange('checkin_setting.max_quota')}
                      min={0}
                      disabled={!isEnabled || !isRandomMode}
                    />
                  </Col>
                </Row>
              </>
            )}

            {/* 低额度签到模式配置 */}
            {isLowQuotaMode && (
              <>
                <Typography.Title heading={6} style={{ marginTop: 20, marginBottom: 12 }}>
                  {t('低额度签到配置')}
                </Typography.Title>
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <div className="semi-form-field" style={{ marginBottom: 12 }}>
                      <label className="semi-form-field-label">
                        <span className="semi-form-field-label-text">{t('低额度阈值')}</span>
                      </label>
                      <InputNumber
                        value={Number(inputs['checkin_setting.low_quota_threshold']) || undefined}
                        placeholder={t('余额低于此值时可签到')}
                        onChange={handleFieldChange('checkin_setting.low_quota_threshold')}
                        min={0}
                        disabled={!isEnabled}
                        style={{ width: '100%' }}
                      />
                      <div className="semi-form-field-extra" style={{ marginTop: 4, color: 'var(--semi-color-text-2)', fontSize: 12 }}>
                        {inputs['checkin_setting.low_quota_threshold']
                          ? `${t('余额低于')} ${renderQuotaWithPrompt(parseInt(inputs['checkin_setting.low_quota_threshold']) || 0)} ${t('时可签到')}`
                          : t('用户余额低于此值时可以签到')}
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                    <div className="semi-form-field" style={{ marginBottom: 12 }}>
                      <label className="semi-form-field-label">
                        <span className="semi-form-field-label-text">{t('签到奖励额度')}</span>
                      </label>
                      <InputNumber
                        value={Number(inputs['checkin_setting.low_quota_reward']) || undefined}
                        placeholder={t('签到获得的额度')}
                        onChange={handleFieldChange('checkin_setting.low_quota_reward')}
                        min={0}
                        disabled={!isEnabled}
                        style={{ width: '100%' }}
                      />
                      <div className="semi-form-field-extra" style={{ marginTop: 4, color: 'var(--semi-color-text-2)', fontSize: 12 }}>
                        {inputs['checkin_setting.low_quota_reward']
                          ? `${t('签到获得')} ${renderQuotaWithPrompt(parseInt(inputs['checkin_setting.low_quota_reward']) || 0)}`
                          : t('签到一次获得的额度')}
                      </div>
                    </div>
                  </Col>
                </Row>
                <Typography.Text type='tertiary' size='small' style={{ marginTop: 8, display: 'block' }}>
                  {t('低额度模式下，用户每天最多签到一次，防止无限刷额度')}
                </Typography.Text>
              </>
            )}

            <Row style={{ marginTop: 20 }}>
              <Button size='default' onClick={onSubmit}>
                {t('保存签到设置')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
