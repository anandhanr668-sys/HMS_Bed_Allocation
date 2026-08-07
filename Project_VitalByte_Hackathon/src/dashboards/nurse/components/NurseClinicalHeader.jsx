import React from 'react';
import { BedDouble, Heart, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const NurseClinicalHeader = ({ selectedPatient, getRiskBadge, currentBed }) => {
    if (!selectedPatient) return null;

    return (
        <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-20 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 bg-slate-900 rounded-[2rem] text-white flex items-center justify-center text-3xl font-black shadow-2xl">
                        {selectedPatient.firstName[0]}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{selectedPatient.firstName} {selectedPatient.lastName}</h1>
                        <span className={clsx("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border", getRiskBadge(selectedPatient.riskLevel))}>
                            {selectedPatient.riskLevel || 'EVALUATING'}
                        </span>
                    </div>
                    <div className="flex items-center gap-5 text-sm font-bold text-gray-500">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-blue-600">
                            <BedDouble size={14} />
                            {currentBed ? `${currentBed.wardName} - ${currentBed.bedNumber}` : (selectedPatient.allocatedBedId || 'TRIAGE')}
                        </span>
                        <span className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                        <span>{selectedPatient.age} YEARS</span>
                        <span className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                        <span className="uppercase">{selectedPatient.gender}</span>
                        {selectedPatient.riskLevel === 'CRITICAL' && (
                            <span className="flex items-center gap-1.5 text-red-500 bg-red-50 px-3 py-1 rounded-lg animate-pulse font-black uppercase text-[10px] tracking-widest ml-2">
                                <AlertTriangle size={14} /> Attention Required
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {/* Optional Header Actions for Nurse */}
        </div>
    );
};

export default NurseClinicalHeader;
