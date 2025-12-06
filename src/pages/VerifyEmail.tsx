import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AuthService from '../Contexts/AuthService';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        // Get email from navigation state or query param
        const stateEmail = location.state?.email;
        const queryEmail = new URLSearchParams(location.search).get('email');

        if (stateEmail) {
            setEmail(stateEmail);
        } else if (queryEmail) {
            setEmail(queryEmail);
        } else {
            // If no email found, redirect to login
            toast.error("No email found for verification");
            navigate('/login');
        }
    }, [location, navigate]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code || code.length < 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            await AuthService.verifyEmail(email, code);
            setIsVerified(true);
            toast.success('Email verified successfully!');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            // Error is handled in AuthService
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
                <Card className="w-full max-w-md shadow-xl border-0 text-center p-6">
                    <CardContent className="space-y-6 pt-6">
                        <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
                            <p className="text-gray-500">Your account has been successfully verified.</p>
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => navigate('/login')}
                        >
                            Continue to Login <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="space-y-1 pb-6 text-center">
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Verify your email
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                        We've sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Verification Code</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                placeholder="123456"
                                className="text-center text-2xl tracking-widest h-14"
                                maxLength={6}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            disabled={isLoading || code.length < 6}
                        >
                            {isLoading ? 'Verifying...' : 'Verify Email'}
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-gray-500">Didn't receive the code? </span>
                            <button
                                type="button"
                                className="text-blue-600 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={async () => {
                                    try {
                                        setIsLoading(true);
                                        await AuthService.resendVerificationEmail(email);
                                    } catch (error) {
                                        console.error(error);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Sending...' : 'Resend'}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmail;



