import React from 'react';
import { Button, Typography } from '@douyinfe/semi-ui';
import { IconRefresh } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '48px 24px',
                        textAlign: 'center',
                        minHeight: '200px',
                    }}
                >
                    <Title heading={4} style={{ marginBottom: 12 }}>
                        页面渲染出错
                    </Title>
                    <Text type='tertiary' style={{ marginBottom: 8 }}>
                        {this.state.error?.message || '发生了未知错误'}
                    </Text>
                    <Text
                        type='quaternary'
                        size='small'
                        style={{ marginBottom: 24, maxWidth: 500, wordBreak: 'break-all' }}
                    >
                        {this.state.error?.stack?.split('\n')?.[0] || ''}
                    </Text>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Button
                            type='primary'
                            icon={<IconRefresh />}
                            onClick={this.handleReset}
                        >
                            重试
                        </Button>
                        <Button type='tertiary' onClick={this.handleReload}>
                            刷新页面
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
