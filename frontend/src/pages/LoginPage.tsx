import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../contexts/AuthContext';
import { Logo } from '../components/ui';
import toast, { Toaster } from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<'customer' | 'admin'>('customer');
  const [email, setEmail] = useState<string>(DEMO_ACCOUNTS.customer.email);
  const [password, setPassword] = useState<string>(DEMO_ACCOUNTS.customer.password);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRoleSwitch = (selectedRole: 'customer' | 'admin') => {
    setRole(selectedRole);
    if (selectedRole === 'admin') {
      setEmail(DEMO_ACCOUNTS.admin.email);
      setPassword(DEMO_ACCOUNTS.admin.password);
    } else {
      setEmail(DEMO_ACCOUNTS.customer.email);
      setPassword(DEMO_ACCOUNTS.customer.password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        toast.error(res.error || 'Invalid email or password');
        return;
      }

      if (role === 'admin') {
        toast.success('Signed in as Hall Administrator');
        navigate('/admin');
      } else {
        toast.success('Welcome back, Organizer');
        navigate('/customer');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-20 min-h-[85vh] flex items-center justify-center px-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-md card p-8 md:p-10 shadow-[var(--shadow-lift)] space-y-7">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-block">
            <Logo />
          </div>
          <h1 className="text-2xl font-serif text-ink tracking-tight">Access Your Portal</h1>
          <p className="text-xs text-stone">Sign in to manage hall reservations or administrative schedules</p>
        </div>

        {/* Role Segmented Toggle */}
        <div className="grid grid-cols-2 p-1.5 rounded-full bg-sand border border-line">
          <button
            type="button"
            onClick={() => handleRoleSwitch('customer')}
            className={`flex items-center justify-center gap-2 py-2 rounded-full text-xs font-medium transition-all ${
              role === 'customer'
                ? 'bg-forest text-ivory shadow-sm'
                : 'text-stone hover:text-ink'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer Portal</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            className={`flex items-center justify-center gap-2 py-2 rounded-full text-xs font-medium transition-all ${
              role === 'admin'
                ? 'bg-forest text-ivory shadow-sm'
                : 'text-stone hover:text-ink'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Administrator</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="name@domain.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="label">Password</label>
              <button
                type="button"
                onClick={() => toast('Use pre-filled demo password for testing', { icon: 'ℹ️' })}
                className="text-moss text-xs hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Demo Credentials Info Pill */}
          <div className="p-3.5 rounded-xl bg-ivory border border-line text-xs text-stone space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">Demo Credentials:</span>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-moss">{role}</span>
            </div>
            <p className="font-mono text-[11px] text-ink/80">{email}</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-3.5 mt-2"
          >
            <span>{isLoading ? 'Verifying...' : `Sign in as ${role === 'admin' ? 'Administrator' : 'Customer'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-4 border-t border-line text-xs text-stone">
          <span>Need a customer account? </span>
          <Link to="/register" className="text-forest font-semibold hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
