import React from 'react';
import { BedDouble, Heart, Printer, LogOut } from 'lucide-react';

const ClinicalHeader = ({
    selectedPatient,
    existingCaseSheet,
    handleGenerateReport,
    handleDischargePatient
}) => {
    if (!selectedPatient) return null;

    return (
        <div className="px-8 py-5 border-b border-gray-100 bg-white sticky top-0 z-20 flex justify-between items-center">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl text-white flex items-center justify-center text-2xl font-black shadow-lg">
                    {selectedPatient.firstName[0]}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{selectedPatient.firstName} {selectedPatient.lastName}</h1>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold border border-gray-200 uppercase tracking-wider">
                            {selectedPatient.age}Y / {selectedPatient.gender}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                        <span className="flex items-center gap-1"><BedDouble size={14} className="text-blue-500" /> Loc: {selectedPatient.allocatedBedId || 'TRIAGE'}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-red-500">{selectedPatient.riskLevel ? `Risk: ${selectedPatient.riskLevel}` : 'Risk: Evaluation Pending'}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        {existingCaseSheet && <span className="text-pink-600 flex items-center gap-1"><Heart size={12} /> Sensitivity: Fertility Case</span>}
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleGenerateReport}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition flex items-center gap-2"
                >
                    <Printer size={14} /> Final Report
                </button>
                <button
                    onClick={handleDischargePatient}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black shadow-lg shadow-gray-900/10 transition flex items-center gap-2"
                >
                    Discharge <LogOut size={14} />
                </button>
            </div>
        </div>
    );
};

export default ClinicalHeader;
