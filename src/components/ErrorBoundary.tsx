import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-red-50 p-6 flex justify-center">
                            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                                <AlertTriangle className="h-10 w-10 text-red-600" />
                            </div>
                        </div>

                        <div className="p-6 text-center space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
                            <p className="text-gray-500">
                                We're sorry, but an unexpected error occurred. Our team has been notified.
                            </p>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="bg-gray-100 p-3 rounded text-left text-xs font-mono overflow-auto max-h-32 text-red-600 border border-red-200">
                                    {this.state.error.toString()}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button
                                    onClick={this.handleGoHome}
                                    variant="outline"
                                    className="flex-1 gap-2"
                                >
                                    <Home className="h-4 w-4" />
                                    Go Home
                                </Button>
                                <Button
                                    onClick={this.handleReload}
                                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Reload Page
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
