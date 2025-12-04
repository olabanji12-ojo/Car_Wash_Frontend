import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import AuthService from '../Contexts/AuthService';
import { useAuth } from '../Contexts/AuthContext';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthBg } from '@/lib/passwordValidation';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('business');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password validation state
  const passwordValidation = validatePassword(password);

  const handleSignup = async () => {
    console.log('🟢 [handleSignup] Starting registration process');
    console.log('📝 [handleSignup] Form data:', {
      name,
      email,
      phone: phone.replace(/./g, '*'), // Mask phone for security
      password: '********', // Never log actual passwords
      userType
    });

    if (!name || !email || !phone || !password) {
      const errorMsg = 'Please fill all fields';
      console.error('❌ [handleSignup] Validation failed:', errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      const errorMsg = 'Please enter a valid email';
      console.error('❌ [handleSignup] Invalid email format');
      toast.error(errorMsg);
      return;
    }

    // Validate password strength
    if (!passwordValidation.isValid) {
      const errorMsg = 'Password does not meet security requirements';
      console.error('❌ [handleSignup] Weak password:', passwordValidation.errors);
      toast.error(errorMsg);
      return;
    }

    const role = userType === 'business' ? 'business_owner' : 'car_owner';
    const account_type = userType === 'business' ? 'car_wash' : 'car_owner';

    console.log('🔄 [handleSignup] Attempting registration with:', {
      role,
      account_type,
      email
    });

    setIsLoading(true);
    try {
      console.log('📤 [handleSignup] Sending request to backend...');
      const response = await AuthService.register(
        name,
        email,
        phone,
        password,
        role,
        account_type
      );

      // The AuthService.register function now guarantees a valid response or throws an error.
      // We can safely use the response here.
      console.log('✅ [handleSignup] Registration successful, response:', response);

      // Don't login automatically - redirect to verification
      // login(response); 

      toast.success('Account created! Please verify your email.', { style: { color: '#10B981' } });
      navigate('/verify-email', { state: { email } });

    } catch (error: any) {
      console.error('❌ [handleSignup] Registration failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // The error toast is already handled inside AuthService, so no need to repeat it here
      // unless you want a more specific message for this page.
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    const role = userType === 'business' ? 'business_owner' : 'car_owner';
    const accountType = userType === 'business' ? 'car_wash' : 'car_owner';
    window.location.href = `http://localhost:8080/api/auth/google?role=${role}&account_type=${accountType}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <p className="text-center text-sm text-gray-500">Join us to get started today</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="user-type" className="text-sm font-medium text-gray-700">
              Join as <span className="text-red-500">*</span>
            </Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger id="user-type" className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business Owner</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@carwash.com"
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2348012345678"
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="h-11 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Password Strength:</span>
                  <span className={`text-xs font-semibold ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                    {passwordValidation.strength.toUpperCase()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getPasswordStrengthBg(passwordValidation.strength)}`}
                    style={{
                      width: passwordValidation.strength === 'weak' ? '33%' :
                        passwordValidation.strength === 'medium' ? '66%' : '100%'
                    }}
                  />
                </div>

                {/* Password Requirements */}
                <div className="space-y-1 pt-1">
                  <p className="text-xs text-gray-600 font-medium">Requirements:</p>
                  {passwordValidation.errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs text-red-600">
                      <XCircle className="h-3 w-3" />
                      <span>{error}</span>
                    </div>
                  ))}
                  {passwordValidation.isValid && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>All requirements met!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            onClick={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                </svg>
                <span>Signing up...</span>
              </div>
            ) : (
              'Sign Up'
            )}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-gray-300 hover:bg-gray-50 font-medium transition-all duration-200"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </Button>
          <div className="text-center text-sm text-gray-600 pt-2">
            Already have an account?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors" onClick={() => navigate('/login')}>
              Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;