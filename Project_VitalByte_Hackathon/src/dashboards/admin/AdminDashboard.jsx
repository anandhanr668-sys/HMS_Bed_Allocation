import React, { useEffect, useState, useContext } from 'react';
import { Users, BedDouble, AlertTriangle, TrendingUp, Clock, Calendar } from 'lucide-react';
import apiClient from '../../api/apiClient';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import clsx from 'clsx';

const AdminDashboard = () => {
    // Get bed stats from Ward Configuration context
    const { getBedStats, wardTypes, allBeds } = useContext(HospitalLayoutContext);
    const bedStatsFromContext = getBedStats();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentView, setCurrentView] = useState('today'); // today, weekly, custom
    const [selectedDate, setSelectedDate] = useState('');

    const fetchStats = async (view = 'today', date = '') => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (date) {
                params.append('date', date);
            } else if (view === 'weekly') {
                params.append('view', 'weekly');
            }

            const res = await apiClient.get(`/admin/stats?${params.toString()}`);
            setStats(res.data);
            setError(null);
            setCurrentView(date ? 'custom' : view);
            if (date) setSelectedDate(date);
        } catch (err) {
            console.error('Stats fetch error:', err);
            setError('Terminal connection interrupted. Check system logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-[10px]">Synchronizing Master Data...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
            <div className="bg-white p-10 rounded-3xl shadow-2xl border border-rose-100 text-center max-w-md">
                <div className="bg-rose-50 text-rose-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">System Interruption</h2>
                <p className="text-slate-500 text-sm mb-6">{error}</p>
                <button
                    onClick={() => fetchStats(currentView, selectedDate)}
                    className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all uppercase text-[10px] tracking-widest"
                >
                    Initialize System Re-Sync
                </button>
            </div>
        </div>
    );

    const getRangeLabel = () => {
        return stats?.rangeInfo?.label || 'Today';
    };

    const STAT_CARDS = [
        {
            label: `Patients (${getRangeLabel()})`,
            value: stats?.patients?.patients_in_range || 0,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            label: 'Beds Available',
            value: bedStatsFromContext.availableBeds || 0, // From Ward Config context
            icon: BedDouble,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            label: 'Occupied Beds',
            value: bedStatsFromContext.occupiedBeds || 0, // From Ward Config context
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            label: `High Risk Alerts (${getRangeLabel()})`,
            value: stats?.alerts?.total_active_alerts || 0,
            icon: AlertTriangle,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        }
    ];

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Enterprise Overview</h1>
                        <p className="text-slate-500 font-medium">Hospital Operations & Governance Terminal</p>
                    </div>
                    <div className="flex gap-3 bg-white p-1 rounded-xl shadow-sm border border-slate-200 relative">
                        <button
                            onClick={() => fetchStats('today')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${currentView === 'today' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => fetchStats('weekly')}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${currentView === 'weekly' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Weekly
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => document.getElementById('dash-date-picker').showPicker()}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${currentView === 'custom' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Calendar size={16} /> {currentView === 'custom' ? selectedDate : 'Select Date'}
                            </button>
                            <input
                                id="dash-date-picker"
                                type="date"
                                className="absolute opacity-0 pointer-events-none inset-0 w-full h-full"
                                onChange={(e) => fetchStats('custom', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {STAT_CARDS.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={28} />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                                    <div className="flex items-center text-emerald-500 text-xs font-bold gap-1 justify-end">
                                        LIVE
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-slate-500 font-bold text-sm mb-1">{stat.label}</h3>
                            <div className="text-4xl font-black text-slate-800">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Bed Occupancy Monitor</h2>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Real-time Ward Capacity & Distribution</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Master Database Linked</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {wardTypes && wardTypes.length > 0 ? (
                                wardTypes.map((ward, i) => {
                                    const wardBeds = allBeds.filter(b => b.wardId === ward.id || b.wardName === ward.name);
                                    const totalBeds = ward.bedTypes.reduce((sum, bt) => sum + (parseInt(bt.totalBeds) || 0), 0);
                                    const occupiedBeds = wardBeds.filter(b => b.status === 'Occupied').length;
                                    const cleaningBeds = wardBeds.filter(b => b.status === 'Cleaning' || b.status === 'Maintenance').length;
                                    const availableBeds = Math.max(0, totalBeds - occupiedBeds - cleaningBeds);
                                    const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

                                    return (
                                        <div key={i} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50 transition-all group">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{ward.name}</h3>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{ward.description || 'General Care'}</span>
                                                </div>
                                                <div className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    occupancyPercentage > 90 ? "bg-rose-100 text-rose-600" :
                                                        occupancyPercentage > 70 ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                                                )}>
                                                    {occupancyPercentage}% CAP
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Live</p>
                                                        <p className="text-sm font-black text-indigo-600">{occupiedBeds}</p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Clean</p>
                                                        <p className="text-sm font-black text-amber-500">{cleaningBeds}</p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Free</p>
                                                        <p className="text-sm font-black text-emerald-500">{availableBeds}</p>
                                                    </div>
                                                </div>

                                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
                                                    <div
                                                        className="h-full bg-indigo-500 transition-all duration-1000"
                                                        style={{ width: `${(occupiedBeds / totalBeds) * 100}%` }}
                                                    />
                                                    <div
                                                        className="h-full bg-amber-400 transition-all duration-1000"
                                                        style={{ width: `${(cleaningBeds / totalBeds) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-3 py-20 text-center">
                                    <BedDouble size={48} className="text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Terminal awaiting ward configuration</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
