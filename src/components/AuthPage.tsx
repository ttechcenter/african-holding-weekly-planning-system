import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Leaf, UserPlus, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

const CEO_EMAIL = 'ceo@africanholding.com';
// const CEO_PASSWORD = 'CEO@AHG';

type Mode = 'login' | 'register';

interface AuthPageProps {
  onAuthenticated: () => void;
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCEOEmail = email.trim().toLowerCase() === CEO_EMAIL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (err) {
      setError(err.message);
    } else {
      onAuthenticated();
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setLoading(true);
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    // CEO role is determined by email — no user-selectable role
    const role = trimmedEmail === CEO_EMAIL ? 'ceo' : 'employee';

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (signUpErr || !data.user) {
      setError(signUpErr?.message ?? 'Registration failed. Please try again.');
      setLoading(false);
      return;
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
            id: data.user.id,
            full_name: isCEOEmail ? 'CEO' : fullName.trim(),
            email: trimmedEmail,
            role,
            department: isCEOEmail ? 'Executive' : department.trim(),
    });

   if (profileErr) {
  console.error(profileErr);
  setError(profileErr.message);
  setLoading(false);
  return;
}

    onAuthenticated();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-bold text-white tracking-wide">AFRICAN HOLDING GROUPS</h1>
          <h2 className="text-xl font-semibold text-orange-300 tracking-widest uppercase">
            
          </h2>
          
         {/* <div className="flex justify-center items-center mb-4">
           <img
           src="../../public/logo.png"
           alt="African Holding Groups"
           className="w-20 h-20 sm:w-24 sm:h-23 object-contain"/>
         </div> */}
         <p className="text-green-200 text-sm mt-1">Weekly Planning System</p>
         <p className="text-xl font-semibold text-orange-300 tracking-widest sentencecase">Think Big, Start Small, Act Now!</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex">
            <button
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                mode === 'login'
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                mode === 'register'
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              <UserPlus size={16} />
              Register
            </button>
          </div>

          <form
            onSubmit={mode === 'login' ? handleLogin : handleRegister}
            className="p-8 space-y-5"
          >
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g. HR, Finance .."
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCEOEmail
                      ? 'border-orange-400 focus:ring-orange-400 bg-orange-50'
                      : 'border-gray-200 focus:ring-green-500'
                  }`}
                  placeholder="Enter Your Email Address"
                />
                {isCEOEmail && (
                  <ShieldCheck
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500"
                  />
                )}
              </div>
              {isCEOEmail && (
                <p className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  CEO administrator account
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <><LogIn size={16} /> Sign In</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-green-300 text-xs mt-6">
          African Holding Groups &mdash; Internal Use Only
        </p>
      </div>
    </div>
  );
}
