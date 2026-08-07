import React from 'react';
import { Calendar, CheckCircle2, AlertCircle, FileText, Droplets, Thermometer, Activity, Clock, Printer, X } from 'lucide-react';
import clsx from 'clsx';
import { FertilityReport } from './FertilityReport';

const ClinicalHistoryTimeline = ({ patient }) => {
    const [selectedReport, setSelectedReport] = React.useState(null);
    const reportRef = React.useRef(null);
    // Mock longitudinal data combined with real patient data
    const history = [
        {
            id: 1,
            date: '2026-02-04',
            time: '14:30',
            event: 'Current Admission',
            type: 'ADMISSION',
            status: 'ACTIVE',
            details: 'Admitted for comprehensive fertility evaluation.',
            icon: Clock,
            color: 'blue'
        },
        ...(patient.treatmentHistory || []).map((h, index) => ({
            id: `th-${index}`,
            date: new Date(h.timestamp || Date.now()).toISOString().split('T')[0],
            time: new Date(h.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: h.type.replace(/_/g, ' '),
            type: h.type,
            status: 'COMPLETED',
            details: h.summary || 'Details recorded in case sheet.',
            icon: FileText,
            color: 'indigo',
            rawData: h.clinical_data ? JSON.parse(h.clinical_data) : null
        })),
        ...(patient.investigations || []).filter(i => i.status === 'COMPLETED').map((i, index) => ({
            id: `inv-${index}`,
            date: new Date(i.timestamp || Date.now()).toISOString().split('T')[0],
            time: new Date(i.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: `${i.testName || i.type} - Result Verified`,
            type: 'INVESTIGATION',
            status: 'COMPLETED',
            details: 'Results available in diagnostic center module.',
            icon: Activity,
            color: 'purple'
        })),
        {
            id: 99,
            date: '2025-12-15',
            time: '10:00',
            event: 'External Referral',
            type: 'HISTORY',
            status: 'ARCHIVED',
            details: 'Referred from City Health Center for specialized andrology workup.',
            icon: CheckCircle2,
            color: 'slate'
        }
    ].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Clinical Continuity Timeline</h3>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Historical Archive</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Verified Records</span>
                </div>
            </div>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gray-100" />

                <div className="space-y-6">
                    {history.map((item, idx) => (
                        <div key={item.id} className="relative flex gap-6 group">
                            {/* Icon Wrapper */}
                            <div className={clsx(
                                "z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg",
                                item.color === 'blue' ? "bg-blue-500 text-white shadow-blue-200" :
                                    item.color === 'indigo' ? "bg-indigo-500 text-white shadow-indigo-200" :
                                        item.color === 'purple' ? "bg-purple-500 text-white shadow-purple-200" :
                                            "bg-slate-500 text-white shadow-slate-200"
                            )}>
                                <item.icon size={20} />
                            </div>

                            {/* Content Card */}
                            <div className="flex-1 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm group-hover:shadow-xl group-hover:border-blue-100 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.event}</h4>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                                            <Calendar size={12} /> {item.date}
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <Clock size={12} /> {item.time}
                                        </div>
                                    </div>
                                    <span className={clsx(
                                        "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest",
                                        item.status === 'ACTIVE' ? "bg-blue-100 text-blue-600" :
                                            item.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-600" :
                                                "bg-gray-100 text-gray-500"
                                    )}>
                                        {item.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.details}</p>

                                {item.type === 'FERTILITY_CASE_SHEET' && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3">
                                        <button
                                            onClick={() => setSelectedReport(item.rawData)}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                                        >
                                            <FileText size={12} /> View Case Sheet
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedReport(item.rawData);
                                                setTimeout(() => window.print(), 500);
                                            }}
                                            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:underline flex items-center gap-1"
                                        >
                                            <Printer size={12} /> Download PDF
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedReport && (
                <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 no-print">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-full flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Fertility Consultation Summary</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Electronic Health Record v4.2</p>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200"
                                >
                                    <Printer size={16} /> Print / Export PDF
                                </button>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="p-2.5 bg-white text-slate-400 rounded-xl hover:text-slate-900 transition-all border border-slate-200"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="grow overflow-y-auto p-12 bg-gray-100">
                            <div className="bg-white shadow-xl min-h-[11in] p-12 mx-auto max-w-[8.5in]">
                                {/* Reuse the existing report component but force it visible */}
                                <div className="print:block">
                                    <FertilityReport
                                        patient={patient}
                                        caseSheet={selectedReport}
                                        ref={reportRef}
                                    />
                                </div>

                                {/* If the report component is 'hidden' by default in FertilityReport.jsx, we might need a non-hidden version or adjust CSS */}
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                    @media screen {
                                        .hidden.print\\:block { display: block !important; }
                                    }
                                `}} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicalHistoryTimeline;
