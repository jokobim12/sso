import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Key, Mail, Phone, User as UserIcon, Lock, ArrowRight, CheckCircle2, AlertCircle, LogOut, Shield, ShieldCheck } from 'lucide-react';
import api from './utils/api';

// Tipe User
interface User {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  role: string;
  status: boolean;
}

// ----------------------------------------------------
// LOGIN COMPONENT
// ----------------------------------------------------
const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');

  useEffect(() => {
    // Cek apakah sudah login
    const token = localStorage.getItem('sso_token');
    if (token) {
      if (clientId && redirectUri) {
        // Jika ada request OAuth, redirect langsung ke endpoint backend OAuth Authorize
        window.location.href = `http://localhost:3000/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state || ''}`;
      } else {
        navigate('/');
      }
    }
  }, [clientId, redirectUri, state, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('sso_token', token);
      localStorage.setItem('sso_user', JSON.stringify(user));

      if (clientId && redirectUri) {
        // Redirect ke Authorize backend untuk menukar auth code
        window.location.href = `http://localhost:3000/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state || ''}`;
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Kredensial login salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-violet-500/10 border border-violet-500/30 rounded-2xl mb-4 text-violet-400">
            <Key className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            SSO Portal
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Satu akun untuk mengakses aplikasi DMI dan Eventbook
          </p>

          {clientId && (
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-300 font-medium animate-pulse">
              <Shield className="w-3.5 h-3.5" />
              Menghubungkan ke aplikasi: <span className="font-semibold uppercase">{clientId}</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email atau Nomor WhatsApp
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sso-user@example.com / 0812..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] transition-all text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-violet-900/25 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Register link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Belum punya akun SSO?{' '}
            <Link
              to={`/register${window.location.search}`}
              className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

// ----------------------------------------------------
// REGISTER COMPONENT
// ----------------------------------------------------
const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', { name, email, whatsapp, password });
      setSuccess(true);
      setTimeout(() => {
        // Arahkan kembali ke login dengan params yang sama
        navigate(`/login${window.location.search}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registrasi gagal. Pastikan format email/WA benar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-violet-500/10 border border-violet-500/30 rounded-2xl mb-4 text-violet-400">
            <UserIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Daftar Akun SSO
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Lengkapi data diri Anda untuk membuat akun terpusat
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 flex items-start gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            <span>Registrasi Berhasil! Anda akan dialihkan ke halaman masuk...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <UserIcon className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Joko Bim"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Phone className="w-5 h-5" />
              </span>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="08123456789"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Buat password minimal 6 karakter"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-4 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] transition-all text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 group cursor-pointer shadow-lg shadow-violet-900/25 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-400">
            Sudah memiliki akun?{' '}
            <Link
              to={`/login${window.location.search}`}
              className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
            >
              Masuk
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

// ----------------------------------------------------
// DASHBOARD COMPONENT (SSO Profile / Client Management)
// ----------------------------------------------------
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('sso_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await api.get('/auth/profile');
        setUser(response.data);
        localStorage.setItem('sso_user', JSON.stringify(response.data));
      } catch (err) {
        // Token expired / invalid
        localStorage.removeItem('sso_token');
        localStorage.removeItem('sso_user');
        navigate('/login');
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('sso_token');
    localStorage.removeItem('sso_user');
    // Clear cookies too by making a backend request if needed, or simply force redirect
    document.cookie = "sso_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-medium">
        Memuat profil pengguna...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-500/10 border border-violet-500/30 rounded-xl text-violet-400">
              <Key className="w-6 h-6" />
            </div>
            <span className="font-bold tracking-tight bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              SSO Central Dashboard
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 bg-slate-950 border border-slate-800 rounded-2xl hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>

        {/* User Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-blue-600 rounded-full flex items-center justify-center font-bold text-3xl shadow-lg shadow-violet-900/35 mb-4">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-slate-100">{user.name}</h2>
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mt-1">{user.role}</p>

            <div className="w-full border-t border-slate-800/80 my-6" />

            <div className="w-full space-y-4 text-left">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase">Email</span>
                <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {user.email}
                </span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase">WhatsApp</span>
                <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-4 h-4 text-slate-500" />
                  {user.whatsapp}
                </span>
              </div>
            </div>
          </div>

          {/* Connected Applications */}
          <div className="md:col-span-2 p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Aplikasi Terhubung</h3>
              <p className="text-sm text-slate-400 mt-1">
                Kredensial SSO Anda dapat digunakan untuk mengakses dan mengintegrasikan aplikasi berikut:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Application 1: DMI */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-200">DMI App</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sistem Bank Sampah terpadu untuk pengelolaan, tabungan, dan kebersihan komunitas.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-900 flex justify-end">
                  <a
                    href="http://localhost:5173"
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    Buka Aplikasi
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Application 2: Eventbook */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-200">E-VentBook</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Aplikasi manajemen event, booking tiket, dan reservasi buku digital.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-900 flex justify-end">
                  <a
                    href="http://localhost:5174"
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    Buka Aplikasi
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl text-xs text-slate-400 leading-relaxed flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span>
                <strong>Informasi Keamanan:</strong> SSO ini menggunakan protokol OAuth 2.0. Jangan berikan akses kredensial login Anda ke situs web yang mencurigakan di luar platform resmi kami.
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

// ----------------------------------------------------
// MAIN APP & ROUTING
// ----------------------------------------------------
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Dashboard />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
