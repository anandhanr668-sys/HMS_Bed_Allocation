import React from 'react';
import { ListTodo, Search, AlertCircle, BedDouble } from 'lucide-react';
import clsx from 'clsx';

const WardCensus = ({
    patients,
    selectedPatientId,
    handleSelectPatient,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus
}) => {
    return (
        <div className="w-96 flex flex-col bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-white z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <ListTodo className="text-blue-600" size={24} />
                        Ward Census
                    </h2>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">{patients.length} Active</span>
                </div>

                <div className="relative mb-5 group">
                    <Search className="absolute left-3.5 top-3 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Find patient by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-sm font-bold outline-none transition-all placeholder:font-medium text-gray-900"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['All', 'ADMITTED', 'CRITICAL', 'VITALS_PENDING'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                filterStatus === status
                                    ? "bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/20 transform scale-[1.02]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            )}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50">
                {patients.map(patient => (
                    <div
                        key={patient.patientId}
                        onClick={() => handleSelectPatient(patient.patientId)}
                        className={clsx(
                            "p-4 rounded-2xl border transition-all cursor-pointer relative group overflow-hidden",
                            selectedPatientId === patient.patientId
                                ? "bg-white border-blue-500 shadow-lg shadow-blue-500/10 z-10 ring-1 ring-blue-500/20"
                                : "bg-white border-transparent hover:border-gray-200 hover:shadow-md"
                        )}
                    >
                        {selectedPatientId === patient.patientId && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                        )}

                        <div className="flex justify-between items-start mb-3 pl-2">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-105 shadow-sm",
                                    selectedPatientId === patient.patientId
                                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-2 ring-blue-200"
                                        : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:ring-2 group-hover:ring-gray-100"
                                )}>
                                    {patient.firstName[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{patient.firstName} {patient.lastName}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{patient.patientId}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {(patient.riskLevel === 'CRITICAL' || patient.riskLevel === 'HIGH') && (
                                    <AlertCircle size={16} className="text-red-500 animate-pulse" />
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pl-14 pr-2">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                    <BedDouble size={14} /> {patient.allocatedBedId || 'TRIAGE'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WardCensus;
