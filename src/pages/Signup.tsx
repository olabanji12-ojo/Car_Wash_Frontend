import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import AuthService from '../Contexts/AuthService';
import { useAuth } from '../Contexts/AuthContext';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthBg } from '@/lib/passwordValidation';
import logoImg from "@/assets/logo-full.jpg";
import { motion } from 'framer-motion';
import API_BASE_URL from '../Contexts/baseUrl';

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from || "/dashboard";
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

    // Validate Phone Number (Nigerian Format: 080... or +234...)
    const phoneRegex = /^(\+234|0)(7|8|9)(0|1)\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      const errorMsg = 'Please enter a valid Nigerian phone number (e.g. 08012345678 or +234...)';
      console.error('❌ [handleSignup] Invalid phone format:', phone);
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

      console.log('✅ [handleSignup] Registration successful, response:', response);

      toast.success('Account created! Please verify your email.', { style: { color: '#10B981' } });
      navigate('/verify-email', { state: { email, from } });

    } catch (error: any) {
      console.error('❌ [handleSignup] Registration failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleGoogleSignup = () => {
    const role = userType === 'business' ? 'business_owner' : 'car_owner';
    const accountType = userType === 'business' ? 'car_wash' : 'car_owner';
    window.location.href = `${API_BASE_URL}/auth/google/login?role=${role}&account_type=${accountType}`;
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
      {/* Container - ~3/4 width (max-w-5xl) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl bg-background border border-border/50"
      >
        {/* Left Side - Form */}
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-12 bg-background">
          <div className="mx-auto grid w-full max-w-[400px] gap-6">
            <div className="grid gap-2 text-center">
              <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold font-sans tracking-tight text-foreground">Create an account</h1>
              <p className="text-balance text-muted-foreground">
                Enter your information to get started
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="user-type">I want to</Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger id="user-type" className="font-sans">
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Manage a Car Wash Business</SelectItem>
                    <SelectItem value="customer">Book Car Wash Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="font-sans"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-sans"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+234..."
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-sans"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-sans pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Strength:</span>
                      <span className={`text-xs font-semibold ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                        {passwordValidation.strength.toUpperCase()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthBg(passwordValidation.strength)}`}
                        style={{
                          width: passwordValidation.strength === 'weak' ? '33%' :
                            passwordValidation.strength === 'medium' ? '66%' : '100%'
                        }}
                      />
                    </div>

                    <div className="space-y-1 pt-1">
                      {passwordValidation.errors.map((error, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-xs text-destructive">
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

              <Button onClick={handleSignup} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 font-sans">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>

              <Button variant="outline" className="w-full font-sans" onClick={handleGoogleSignup}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Sign up with Google
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Button variant="link" className="p-0 text-primary font-semibold" onClick={() => navigate('/login', { state: { from } })}>
                Login
              </Button>
            </div>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 flex flex-col items-center justify-center aspect-square">
              <img
                src={logoImg}
                alt="QueueLess Logo"
                className="w-full h-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </motion.div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl opacity-50" />
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;