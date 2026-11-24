import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/ui';
import toast, { Toaster } from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      toast.error('Please accept the booking guidelines');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        email,
        password,
        name: fullName,
        phone: phone || '+91 98450 12345',
        organization: organization || undefined,
      });

      if (!res.success) {
        toast.error(res.error || 'Registration failed');
        return;
      }

      toast.success('Account created! Welcome to Sabhā Halls.');
      navigate('/customer');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-20 min-h-[85vh] flex items-center justify-center px-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-lg card p-8 md:p-10 shadow-[var(--shadow-lift)] space-y-7">
        <div className="text-center space-y-3">
          <div className="inline-block">
            <Logo />
          </div>
          <h1 className="text-2xl font-serif text-ink tracking-tight">Create Customer Account</h1>
          <p className="text-xs text-stone">Register to reserve community halls and track event applications</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-stone absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rohit Shenoy"
                className="input pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rohit@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label">Organization / Family Trust (Optional)</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Vedic Moments or Shenoy Family Trust"
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-stone hover:text-ink text-xs"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 text-xs text-stone">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="terms" className="cursor-pointer">
              I agree to the Bengaluru community hall booking terms & noise guidelines
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-3.5 mt-2"
          >
            <span>{isLoading ? 'Creating Account...' : 'Register as Customer'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-line text-xs text-stone">
          <span>Already registered? </span>
          <Link to="/login" className="text-forest font-semibold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
