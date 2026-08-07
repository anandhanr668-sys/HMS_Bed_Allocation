import React, { useState, useContext, useEffect } from 'react';
import { PatientContext } from '../../context/PatientContext';
import { FrontDeskContext } from '../../context/FrontDeskContext';
import RegistrationModule from './RegistrationModule';
import AppointmentModule from './AppointmentModule';
import QueueModule from './QueueModule';
import BillingModule from './BillingModule';
import AuditLogsModule from './AuditLogsModule';
import {
    LayoutDashboard,
    UserPlus,
    Calendar,
    ListOrdered,
    ReceiptIndianRupee,
    History,
    Search,
    Users,
    Activity,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FrontDeskDashboard = ({ module = 'dashboard' }) => {
    const { patients } = useContext(PatientContext);
    const { queue, appointments, transactions } = useContext(FrontDeskContext);
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // KPI Calculations
    const totalPatients = patients.length;
    const activeQueue = queue.filter(q => q.status !== 'Completed').length;
    const todayAppointments = appointments.filter(a => {
        const today = new Date().toISOString().split('T')[0];
        return a.date === today;
    }).length;
    const dailyRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 2) {
            setIsSearching(true);
            const results = patients.filter(p =>
                `${p.firstName} ${p.lastName}`.toLowerCase().includes(term.toLowerCase()) ||
                p.patientId.toLowerCase().includes(term.toLowerCase()) ||
                p.contact?.includes(term)
            );
            setSearchResults(results);
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    };

    const renderContent = () => {
        if (isSearching && searchTerm.length > 2) {
            return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-800">Search Results for "{searchTerm}"</h2>
                        <button onClick={() => { setSearchTerm(''); setIsSearching(false); }} className="text-blue-600 font-bold hover:underline">Clear Search</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
                                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 font-medium">No patients found matching your search criteria.</p>
                            </div>
                        ) : (
                            searchResults.map(p => (
                                <div key={p.patientId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {p.firstName[0]}{p.lastName[0]}
                                        </div>
                                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-full">{p.patientId}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">{p.firstName} {p.lastName}</h3>
                                    <p className="text-xs text-slate-500 mt-1">{p.gender} • {p.age} Years</p>
                                    <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                                        <p className="text-[11px] text-slate-400">CONTACT</p>
                                        <p className="text-sm font-medium text-slate-700">{p.contact || 'Not Provided'}</p>
                                    </div>
                                    <button className="w-full mt-6 py-2 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-600 rounded-lg text-xs font-bold transition">
                                        VIEW RECORD (READ-ONLY)
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            );
        }

        switch (module) {
            case 'registration': return <RegistrationModule />;
            case 'appointments': return <AppointmentModule />;
            case 'queue': return <QueueModule />;

            // case 'billing': return <BillingModule />; // Removed
            // case 'logs': return <AuditLogsModule />; // Removed
            default: return (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Registered', value: totalPatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'In Queue', value: activeQueue, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Today Appts', value: todayAppointments, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition">
                                <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                                    <stat.icon size={28} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Access & Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Activity className="text-blue-600" size={20} /> Patient Lifecycle Distribution
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Registered</p>
                                        <p className="text-2xl font-bold text-slate-900">{patients.filter(p => !p.riskLevel).length}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Under Clinic</p>
                                        <p className="text-2xl font-bold text-slate-900">{patients.filter(p => p.status === 'UNDER_TREATMENT').length}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Admitted</p>
                                        <p className="text-2xl font-bold text-slate-900">{patients.filter(p => p.allocatedBedId).length}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Discharged</p>
                                        <p className="text-2xl font-bold text-slate-900">{patients.filter(p => p.status === 'DISCHARGED').length}</p>
                                    </div>
                                </div>
                            </div>


                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-50 font-bold text-slate-900 flex items-center justify-between">
                                Upcoming Today
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">LIVE</span>
                            </div>
                            <div className="p-6 space-y-4">
                                {appointments.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-10 italic">No appointments for today.</p>
                                ) : (
                                    appointments.slice(0, 5).map(a => (
                                        <div key={a.id} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition">
                                                {a.patientName[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800">{a.patientName}</p>
                                                <p className="text-[10px] text-slate-500">{a.doctorName} • {a.time}</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Header - Only shown when not in a module or when explicitly needed */}
            {module === 'dashboard' && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Global patient search (Search by Name, ID, or Phone)..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full bg-slate-50 border-none h-12 pl-12 pr-6 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderContent()}
            </div>
        </div>
    );
};

export default FrontDeskDashboard;
