import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

export function OnDemandAuthPage() {
  const { client, saveToken } = useApi();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [message, setMessage] = useState({ type: "", text: "" });
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loginData, setLoginData] = useState({
    email: '',
    phone: '',
    password: ''
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!signupData.name || !signupData.password) {
      toast.error('Name and password are required');
      return;
    }

    if (!signupData.email && !signupData.phone) {
      toast.error('Either email or phone is required');
      return;
    }

    setLoading(true);
    try {
      const response = await client.post('/api/auth/ondemand/register', signupData);
      
      // Store user data and token (must match useApi key)
      localStorage.setItem('ofis_admin_token', response.data.token);
      saveToken(response.data.token);
      localStorage.removeItem('token');
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user._id,
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone,
        role: response.data.user.role,
        guestId: response.data.guestId
      }));

      setMessage({ type: "success", text: "Account created successfully!" });
      
      // Redirect to purchase page after a short delay
      setTimeout(() => {
        window.location.href = '/purchase';
      }, 1500);
      
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || 'Signup failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if ((!loginData.email && !loginData.phone) || !loginData.password) {
      setMessage({ type: "error", text: "Email or phone and password are required" });
      return;
    }

    setLoading(true);
    try {
      const response = await client.post('/api/auth/ondemand/login', loginData);
      
      // Store user data and token (must match useApi key)
      localStorage.setItem('ofis_admin_token', response.data.token);
      saveToken(response.data.token);
      localStorage.removeItem('token');
      localStorage.setItem('user', JSON.stringify({
        id: response.data.user._id,
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone,
        role: response.data.user.role,
        guestId: response.data.guestId
      }));

      setMessage({ type: "success", text: "Login successful!" });
      
      // Redirect to manage page after a short delay
      setTimeout(() => {
        window.location.href = '/manage';
      }, 1500);
      
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ofis Square</h1>
          <p className="text-gray-600 mt-2">Day Pass Access</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  className={`flex-1 py-2 px-4 text-center font-medium ${
                    activeTab === 'login'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('login')}
                >
                  Login
                </button>
                <button
                  className={`flex-1 py-2 px-4 text-center font-medium ${
                    activeTab === 'signup'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('signup')}
                >
                  Sign Up
                </button>
              </div>

              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Mail className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                  </div>

                  <div className="text-center text-sm text-gray-500">OR</div>

                  <div className="relative">
                    <Input
                      label="Phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={loginData.phone}
                      onChange={(e) => setLoginData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <Phone className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                  </div>

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <Lock className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading} loading={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              )}

              {activeTab === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupData.name}
                      onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <User className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                  </div>

                  <div className="relative">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Mail className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                  </div>

                  <div className="relative">
                    <Input
                      label="Phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={signupData.phone}
                      onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <Phone className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                  </div>

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={signupData.password}
                      onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <Lock className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      Either email or phone number is required for account creation.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading} loading={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Need help? Contact support</p>
        </div>
        
        {/* Message Display */}
        {message.text && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
