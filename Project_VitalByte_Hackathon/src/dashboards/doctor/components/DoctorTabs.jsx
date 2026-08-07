import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import clsx from 'clsx';
import { Heart, Activity, HeartPulse, Gauge, Thermometer, Stethoscope, Microscope, Save, ClipboardCheck, Plus, Pill, Syringe, Clock, FileText, Zap } from 'lucide-react';
import { FertilityCaseSheet } from './FertilityCaseSheet';
import VitalsGrid from './VitalsGrid';
import DoctorOverviewTab from './DoctorOverviewTab';
import ClinicalHistoryTimeline from './ClinicalHistoryTimeline';

const DoctorTabs = ({
    activeTab,
    setActiveTab,
    selectedPatient,
    patientVitals,
    provisionalDiagnosis,
    setProvisionalDiagnosis,
    clinicalNote,
    setClinicalNote,
    handleSaveNote,
    rxForm,
    setRxForm,
    handlePrescribe,
    labForm,
    setLabForm,
    handleOrderLab,
    setShowSemenForm,
    existingCaseSheet,
    handleViewReport,
    updateClinicalHistory
}) => {
    const [labSelections, setLabSelections] = React.useState({ semen: false });
    const [showFertilityForm, setShowFertilityForm] = React.useState(false);

    const handlePushLabs = () => {
        if (labSelections.semen) {
            handleOrderLab({ preventDefault: () => { } }, 'SEMEN_ANALYSIS');
        }
        setLabSelections({ semen: false });
    };

    if (!selectedPatient) return null;

    return (
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-8 pt-2 bg-gray-50/50 border-b border-gray-100">
                <Tabs.List className="flex gap-8">
                    {['overview', 'lab', 'prescriptions', 'history'].map(tab => {
                        return (
                            <Tabs.Trigger
                                key={tab}
                                value={tab}
                                className={clsx(
                                    "py-4 text-xs font-black uppercase tracking-widest border-b-[3px] transition-all relative flex items-center gap-2",
                                    activeTab === tab
                                        ? "text-blue-600 border-blue-600"
                                        : "text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-200"
                                )}
                            >
                                {tab === 'lab' && <Microscope size={14} className={activeTab === tab ? "text-indigo-500" : "text-gray-400"} />}
                                {tab === 'prescriptions' && <Plus size={14} className={activeTab === tab ? "text-emerald-500" : "text-gray-400"} />}
                                {tab}
                            </Tabs.Trigger>
                        );
                    })}
                </Tabs.List>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                <Tabs.Content value="overview" className="focus:outline-none">
                    <DoctorOverviewTab
                        patientVitals={patientVitals}
                        provisionalDiagnosis={provisionalDiagnosis}
                        setProvisionalDiagnosis={setProvisionalDiagnosis}
                        clinicalNote={clinicalNote}
                        setClinicalNote={setClinicalNote}
                        handleSaveNote={handleSaveNote}
                        rxForm={rxForm}
                        setRxForm={setRxForm}
                        handlePrescribe={handlePrescribe}
                        labForm={labForm}
                        setLabForm={setLabForm}
                        handleOrderLab={handleOrderLab}
                    />
                </Tabs.Content>

                <Tabs.Content value="lab" className="space-y-6 focus:outline-none animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex gap-6 min-h-[400px]">
                        <div className="w-1/3 border-r border-gray-100 pr-6 flex flex-col justify-between">
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <ClipboardCheck size={16} className="text-blue-500" /> 1. Specialized Lab Selection
                                </h3>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => setLabSelections(prev => ({ ...prev, semen: !prev.semen }))}
                                        disabled={selectedPatient.gender !== 'Male'}
                                        className={clsx(
                                            "w-full p-4 border rounded-2xl flex items-center justify-between group transition-all",
                                            selectedPatient.gender !== 'Male' ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-100" :
                                                labSelections.semen ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-indigo-50 border-indigo-100 text-gray-900 hover:bg-indigo-100"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                                labSelections.semen ? "bg-white/20 text-white" : "bg-white text-indigo-500"
                                            )}>
                                                <Microscope size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className={clsx("text-[10px] font-black uppercase tracking-widest", labSelections.semen ? "text-indigo-100" : "text-indigo-600")}>Protocol 01</p>
                                                <p className="text-sm font-bold leading-tight">Semen Analysis</p>
                                                {selectedPatient.gender !== 'Male' && <p className="text-[9px] font-bold text-rose-500">MALE ONLY</p>}
                                            </div>
                                        </div>
                                        {selectedPatient.gender === 'Male' && (
                                            <div className={clsx(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition",
                                                labSelections.semen ? "border-white bg-white/20" : "border-indigo-200"
                                            )}>
                                                <div className={clsx("w-3 h-3 rounded-full transition-transform", labSelections.semen ? "bg-white scale-100" : "bg-indigo-500 scale-0")} />
                                            </div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowFertilityForm(true)}
                                        className="w-full p-4 border border-pink-100 bg-pink-50 text-gray-900 rounded-2xl flex items-center justify-between group transition-all hover:bg-pink-100 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-pink-500">
                                                <Heart size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-pink-600">Direct Entry</p>
                                                <p className="text-sm font-bold leading-tight">Fertility Assessment</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
                                            <Plus size={16} />
                                        </div>
                                    </button>
                                </div>

                                <div className="pt-4 border-t border-gray-50">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Other Investigations</h4>
                                    <div className="flex gap-2">
                                        <input
                                            value={labForm.testName}
                                            onChange={e => setLabForm({ ...labForm, testName: e.target.value })}
                                            placeholder="Standard Lab..."
                                            className="flex-1 text-xs font-bold p-3 bg-gray-50 border-none rounded-xl outline-none focus:bg-white focus:border-blue-400"
                                        />
                                        <button
                                            onClick={() => handleOrderLab()}
                                            className="p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition shadow-lg shadow-gray-200"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePushLabs}
                                disabled={!labSelections.semen}
                                className={clsx(
                                    "w-full py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] transition shadow-2xl mt-6 flex items-center justify-center gap-2",
                                    (labSelections.semen)
                                        ? "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                                )}
                            >
                                <Zap size={16} /> Push Selections to Laboratory
                            </button>
                        </div>
                        <div className="flex-1 space-y-4">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <Syringe size={16} className="text-pink-500" /> Pending Results
                            </h3>
                            <div className="space-y-2">
                                {(selectedPatient.investigations || []).length === 0 && <p className="text-gray-400 text-sm italic">No active investigations.</p>}
                                {(selectedPatient.investigations || []).map(lab => (
                                    <div key={lab.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-gray-900 text-sm">{lab.testName || lab.type}</h4>
                                                {lab.urgency === 'STAT (Emergency)' && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase">STAT</span>}
                                            </div>
                                            <p className="text-xs font-bold text-gray-500">{new Date(lab.timestamp).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={clsx("px-3 py-1 bg-white border rounded-lg text-[10px] font-bold uppercase", lab.status === 'COMPLETED' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-gray-200 text-gray-600')}>
                                                {lab.status}
                                            </span>
                                            {lab.status === 'COMPLETED' && (
                                                <button
                                                    onClick={() => handleViewReport(lab.reportId)}
                                                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-700 transition flex items-center gap-1 shadow-sm"
                                                >
                                                    <FileText size={12} /> View Report
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="history" className="focus:outline-none animate-in slide-in-from-right-4 duration-300 px-8 py-6">
                    <ClinicalHistoryTimeline patient={selectedPatient} />
                </Tabs.Content>

            </div>
            {showFertilityForm && (
                <div className="fixed inset-0 z-[100] bg-white animate-in fade-in zoom-in-95 duration-300">
                    <FertilityCaseSheet
                        patientId={selectedPatient.patientId}
                        existingData={existingCaseSheet}
                        onSave={(data) => {
                            // Logic to save to final report would go here
                            setShowFertilityForm(false);
                            if (updateClinicalHistory) updateClinicalHistory();
                        }}
                        onClose={() => setShowFertilityForm(false)}
                    />
                </div>
            )}
        </Tabs.Root>
    );
};

export default DoctorTabs;
