import React, { useContext } from 'react';
import {
    Activity,
    Users,
    BedDouble,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    Clock,
    HeartPulse,
    Thermometer,
    Gauge,
    Stethoscope,
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { PatientContext } from '../../context/PatientContext';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import { useNavigate } from 'react-router-dom';

const NurseDashboard = () => {
    const { patients } = useContext(PatientContext);
    const { getBedStats, allBeds } = useContext(HospitalLayoutContext);
    const navigate = useNavigate();

    const stats = getBedStats ? getBedStats() : { totalBeds: 0, occupiedBeds: 0, availableBeds: 0 };
    const bedStats = [
        { label: 'Total Beds', value: stats.totalBeds, icon: BedDouble, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Occupied', value: stats.occupiedBeds, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'Available', value: stats.availableBeds, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        {
            label: 'Admissions Today', value: patients.filter(p => {
                const today = new Date().toISOString().split('T')[0];
                return p.registeredAt && p.registeredAt.startsWith(today);
            }).length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100'
        },
    ];

    const criticalPatients = patients.filter(p =>
        p.riskLevel === 'CRITICAL' ||
        p.riskLevel === 'HIGH'
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 font-sans">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Stethoscope className="text-blue-600" size={32} />
                        Nurse Station Alpha
                    </h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 ml-1">Real-time Ward Monitoring & Patient Care</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                    <Clock size={16} />
                    <span>Shift: 07:00 - 19:00</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-2 animate-pulse" />
                    <span className="text-emerald-600">Active</span>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {bedStats.map((stat, i) => (
                    <div key={i} className={`bg-white p-6 rounded-[2rem] border ${stat.border} shadow-sm flex items-center gap-5 hover:shadow-xl hover:scale-[1.02] transition-all cursor-default`}>
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center border border-current border-opacity-10`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{stat.label}</p>
                            <p className="text-3xl font-black text-gray-900 leading-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Critical Watchlist */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <span className="w-2 h-8 bg-red-500 rounded-full" />
                                Critical Watchlist
                            </h3>
                            <button
                                onClick={() => navigate('/nurse/patients')}
                                className="group flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
                            >
                                View All Patients <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {criticalPatients.length === 0 ? (
                                <div className="py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                    <CheckCircle className="mx-auto text-emerald-500 mb-3 opacity-20" size={48} />
                                    <p className="text-gray-500 font-bold italic">No critical risk patients active in current census.</p>
                                </div>
                            ) : (
                                criticalPatients.map(p => (
                                    <div key={p.patientId} className="flex items-center justify-between p-5 rounded-3xl bg-red-50/50 border border-red-100 group hover:shadow-lg transition-all hover:bg-red-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-red-500/20">
                                                {p.firstName?.[0] || 'P'}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-900 text-lg">{p.firstName} {p.lastName}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-100 px-2 py-0.5 rounded-lg border border-red-200">
                                                        {p.riskLevel}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                                        <BedDouble size={12} /> {p.allocatedBedId || 'Unitialized'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="hidden md:flex gap-6 pr-6 border-r border-red-200">
                                                <div className="text-center group-hover:scale-110 transition-transform">
                                                    <HeartPulse size={18} className="mx-auto text-red-400 mb-1" />
                                                    <span className="text-[10px] font-black text-gray-500 uppercase">92 BPM</span>
                                                </div>
                                                <div className="text-center group-hover:scale-110 transition-transform delay-75">
                                                    <Thermometer size={18} className="mx-auto text-amber-500 mb-1" />
                                                    <span className="text-[10px] font-black text-gray-500 uppercase">101.2 F</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate('/nurse/patients')}
                                                className="px-6 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-900/10 flex items-center gap-2"
                                            >
                                                Attend <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>


                </div>

                {/* Ward Efficiency & Shortcuts */}
                <div className="lg:col-span-4 space-y-6">



                </div>
            </div>
        </div>
    );
};

export default NurseDashboard;
