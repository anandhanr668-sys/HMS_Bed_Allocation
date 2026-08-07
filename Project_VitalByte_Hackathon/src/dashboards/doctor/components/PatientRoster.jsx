import React from 'react';
import { Search, Activity, User, AlertCircle, BedDouble, Clock, Users } from 'lucide-react';
import clsx from 'clsx';

const PatientRoster = ({
    patients,
    selectedPatientId,
    handleSelectPatient,
    searchTerm,
    setSearchTerm,
    rosterFilter,
    setRosterFilter,
    criticalCount
}) => {
    return (
        <div className="w-96 flex flex-col bg-slate-50 border-r border-gray-200 min-h-0 overflow-hidden font-sans">
            {/* Command Header */}
            <div className="p-6 space-y-5 bg-white border-b border-gray-100 shadow-sm relative z-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
                            <Users size={20} />
                        </div>
                        Clinical Queue
                    </h2>
                    <div className="flex flex-col items-end">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                            {patients.length} ONLINE
                        </span>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search Intelligence Database..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl text-sm font-bold placeholder:text-gray-400 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                    />
                </div>

                <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                    <button
                        onClick={() => setRosterFilter('all')}
                        className={clsx(
                            "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                            rosterFilter === 'all' ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        Standard
                    </button>
                    <button
                        onClick={() => setRosterFilter('critical')}
                        className={clsx(
                            "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                            rosterFilter === 'critical' ? "bg-red-500 text-white shadow-lg shadow-red-200" : "text-gray-400 hover:text-red-500"
                        )}
                    >
                        <AlertCircle size={14} /> Critical {criticalCount > 0 && `(${criticalCount})`}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar bg-slate-50/50">
                {patients.length === 0 ? (
                    <div className="text-center py-12 opacity-40">
                        <Users size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-black text-gray-400">No Patient Records Found</p>
                    </div>
                ) : (
                    patients.map((patient) => {
                        const isSelected = selectedPatientId === patient.patientId;
                        const isCritical = patient.riskLevel === 'CRITICAL' || patient.riskLevel === 'HIGH';

                        return (
                            <button
                                key={patient.patientId}
                                onClick={() => handleSelectPatient(patient.patientId)}
                                className={clsx(
                                    "w-full text-left p-5 rounded-[2.5rem] transition-all relative group overflow-hidden border",
                                    isSelected
                                        ? "bg-white border-blue-500 shadow-2xl shadow-gray-200 ring-4 ring-blue-50 font-bold"
                                        : "bg-white border-transparent hover:border-gray-200 hover:shadow-xl"
                                )}
                            >
                                {isCritical && (
                                    <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse" />
                                )}

                                <div className="flex items-center gap-5">
                                    <div className={clsx(
                                        "w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-xl font-black shrink-0 transition-all duration-300 group-hover:scale-110",
                                        isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-200 rotate-3" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {patient.firstName ? patient.firstName[0] : '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h3 className={clsx(
                                                "font-black tracking-tight text-base truncate",
                                                isSelected ? "text-gray-900" : "text-gray-700"
                                            )}>
                                                {patient.firstName} {patient.lastName}
                                            </h3>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                                {patient.age}Y • {patient.gender}
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            {patient.visitStatus === 'AT_NURSE' && (
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-50 text-amber-500 border border-amber-100">
                                                    Nurse Check
                                                </span>
                                            )}
                                            {patient.visitStatus === 'WAITING_DOCTOR' && (
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-50 text-blue-500 border border-blue-100">
                                                    Ready
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl">
                                            <Clock size={14} className="text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase">Wait: 12m</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-blue-50/50 p-2.5 rounded-2xl">
                                            <Activity size={14} className="text-blue-500" />
                                            <span className="text-[10px] font-black text-blue-600 uppercase">
                                                {patient.visitStatus === 'AT_NURSE' ? 'Nurse Check' :
                                                    patient.visitStatus === 'AT_LAB' ? 'Lab Work' :
                                                        patient.visitStatus === 'WAITING_DOCTOR' ? 'Vitals Ready' :
                                                            patient.visitStatus || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default PatientRoster;
