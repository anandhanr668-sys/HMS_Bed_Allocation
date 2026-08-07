import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, User, Stethoscope, Microscope } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, hospitalDevLogin } = useAuth();
    const navigate = useNavigate();

    const isDevMode = import.meta.env.VITE_AUTH_MODE === 'DEV';

    const handleStandardLogin = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err);
        }
    };

    const handleDevLogin = async (role) => {
        try {
            setError('');
            await hospitalDevLogin(role);
            navigate('/');
        } catch (err) {
            setError(err);
        }
    };

    const roles = [
        { id: 'ADMIN', title: 'Administrator', icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-slate-100 text-slate-700' },
        { id: 'DOCTOR', title: 'Doctor', icon: <Stethoscope className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
        { id: 'NURSE', title: 'Nurse', icon: <Activity className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
        { id: 'FRONT_DESK', title: 'Front Desk', icon: <User className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600' },
        { id: 'LAB_ASSISTANT', title: 'Lab Assistant', icon: <Microscope className="w-6 h-6" />, color: 'bg-indigo-50 text-indigo-600' }
    ];

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative font-sans"
            style={{ background: 'linear-gradient(135deg, #eaf4ff, #bfdbfe)' }}
        >
            {/* Subtle Patterns */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
            </div>

            <div className="relative z-10 w-full max-w-5xl">
                <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
                    <div className="inline-flex p-3 bg-white rounded-2xl shadow-xl shadow-blue-500/10 mb-6 border border-blue-100">
                        <Activity className="w-10 h-10 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">MediBed <span className="text-blue-600">Enterprise</span></h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-3">Professional Clinical Operating System</p>
                </div>

                {isDevMode && (
                    <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px flex-1 bg-blue-100" />
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] bg-white px-4 py-1.5 rounded-full border border-blue-200 shadow-sm">Hospital Demo Mode Active</span>
                            <div className="h-px flex-1 bg-blue-100" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {error && (
                                <div className="col-span-1 md:col-span-5 bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl mb-4 text-xs font-black uppercase tracking-widest flex items-center gap-4 animate-in shake duration-500">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    {error.toString()}
                                </div>
                            )}
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => handleDevLogin(role.id)}
                                    className="group relative flex flex-col items-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-md"
                                >
                                    <div className={`w-14 h-14 rounded-2xl ${role.color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                        {role.icon}
                                    </div>
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{role.title}</span>
                                    <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Click to Enter</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {!isDevMode && (
                    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 shadow-xl shadow-blue-900/5">
                            <div className="mb-8 flex items-center gap-3">
                                <ShieldCheck className="text-blue-500 w-5 h-5" />
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Authentication Required</h2>
                            </div>

                            {error && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl mb-6 text-[11px] font-bold uppercase tracking-wider flex items-center gap-3">
                                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleStandardLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Hospital ID / Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-xs font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        placeholder="id@hospital.org"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Security Passcode</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-xs font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 transform active:scale-[0.98]"
                                >
                                    Verify Identity
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
