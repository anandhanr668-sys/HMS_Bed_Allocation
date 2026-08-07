
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, User, Phone, Lock, Heart } from 'lucide-react';
import apiClient from '../../api/apiClient';

const PatientPortalLogin = () => {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiClient.post('/portal/login', {
                identifier,
                mobile
            });

            // Store token and patient data
            localStorage.setItem('hms_token', response.data.token);
            localStorage.setItem('hms_user', JSON.stringify({
                ...response.data.patient,
                role: 'PATIENT'
            }));

            navigate('/portal/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-pink-500 rounded-3xl mb-4 shadow-2xl shadow-blue-200">
                        <Heart size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Patient Portal</h1>
                    <p className="text-gray-500 font-bold">Access your medical records and reports</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                                <p className="text-sm font-bold text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Patient ID / Name */}
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                                Patient ID or Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Enter your Patient ID or Name"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Mobile Number */}
                        <div>
                            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
                                Mobile Number
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    placeholder="Enter registered mobile number"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-pink-500 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:shadow-2xl hover:shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Authenticating...' : 'Access My Records'}
                        </button>
                    </form>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <Lock size={16} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-black text-blue-900 mb-1">Secure Access</p>
                                <p className="text-xs font-bold text-blue-600">
                                    Login using your Patient ID (or Name) and registered mobile number.
                                    No password required for quick access.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-xs font-bold text-gray-400">
                        Need help? Contact hospital reception
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PatientPortalLogin;
