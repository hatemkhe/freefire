import React, { useState } from 'react';
import { LogIn, UserPlus, Lock, Mail, User } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsAuthenticated(true);
    }
  };

  // بعد تسجيل الدخول: عرض شاشة بيضاء بالكامل
  if (isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col justify-between p-4">
        {/* شاشة بيضاء فارغة تماماً */}
        <div></div>
        
        {/* زر خروج بسيط جداً في أسفل الشاشة للعودة عند الحاجة */}
        <div className="text-right">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  // شاشة تسجيل الدخول / إنشاء الحساب
  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4 dir-rtl" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Free Fire
          </h1>
          <p className="text-sm text-gray-500">
            {isSignUp ? 'أنشئ حسابك الجديد للبدء' : 'مرحباً بعودتك! قم بتسجيل الدخول للحساب'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم كامل
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm"
                  placeholder="أدخل اسمك"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة السر
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all flex items-center justify-center gap-2 text-sm"
          >
            {isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                إنشاء حساب
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-gray-500 hover:text-black transition-colors"
          >
            {isSignUp
              ? 'لديك حساب بالفعل؟ سجل الدخول'
              : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
          </button>
        </div>
      </div>
    </div>
  );
}