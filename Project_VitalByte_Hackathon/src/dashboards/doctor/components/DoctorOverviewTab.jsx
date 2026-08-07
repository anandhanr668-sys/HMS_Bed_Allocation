import { Stethoscope, Microscope, ClipboardCheck, Save, Brain, Zap, ShieldAlert, HeartPulse } from 'lucide-react';
import VitalsGrid from './VitalsGrid';
import clsx from 'clsx';

const DoctorOverviewTab = ({
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
    handleOrderLab
}) => {
    return (
        <div className="space-y-8 focus:outline-none animate-in slide-in-from-bottom-2 duration-300 pb-12">


            {/* Real Vitals Grid */}
            <VitalsGrid patientVitals={patientVitals} />

            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Stethoscope size={16} className="text-blue-500" /> Diagnosis & Findings
                    </h3>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Provisional Diagnosis</label>
                            <input
                                value={provisionalDiagnosis}
                                onChange={e => setProvisionalDiagnosis(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm font-bold outline-none transition-all shadow-inner"
                                placeholder="e.g. Acute Viral Fever..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinical Notes</label>
                            <textarea
                                value={clinicalNote}
                                onChange={e => setClinicalNote(e.target.value)}
                                rows={6}
                                className="w-full px-5 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-2xl text-sm font-bold outline-none transition-all resize-none shadow-inner"
                                placeholder="Describe symptoms, signs and plan..."
                            />
                        </div>
                        <button
                            onClick={handleSaveNote}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-xl shadow-blue-200"
                        >
                            <Save size={18} /> Update Patient Record
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Microscope size={16} className="text-purple-500" /> Fast Entry / Quick Actions
                    </h3>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 space-y-10">
                        <form onSubmit={handlePrescribe} className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-6 h-0.5 bg-emerald-500 rounded-full" /> Quick Prescription
                            </h4>
                            <div className="flex gap-3">
                                <input
                                    placeholder="Medicine..."
                                    value={rxForm.name}
                                    onChange={e => setRxForm({ ...rxForm, name: e.target.value })}
                                    className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold"
                                />
                                <input
                                    placeholder="Dose"
                                    value={rxForm.dosage}
                                    onChange={e => setRxForm({ ...rxForm, dosage: e.target.value })}
                                    className="w-24 px-5 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold"
                                />
                                <button type="submit" className="p-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition">
                                    <ClipboardCheck size={20} />
                                </button>
                            </div>
                        </form>

                        <form onSubmit={handleOrderLab} className="space-y-4 pt-8 border-t border-gray-50">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-6 h-0.5 bg-purple-500 rounded-full" /> Rapid Lab Order
                            </h4>
                            <div className="flex gap-3">
                                <input
                                    placeholder="Test Name (e.g. CBC)..."
                                    value={labForm.testName}
                                    onChange={e => setLabForm({ ...labForm, testName: e.target.value })}
                                    className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold"
                                />
                                <select
                                    value={labForm.urgency}
                                    onChange={e => setLabForm({ ...labForm, urgency: e.target.value })}
                                    className="px-3 py-3 bg-gray-50 border-none rounded-xl text-xs font-black uppercase"
                                >
                                    <option>Routine</option>
                                    <option>Stat</option>
                                </select>
                                <button type="submit" className="p-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 shadow-lg shadow-purple-100 transition">
                                    <Microscope size={20} />
                                </button>
                            </div>
                        </form>


                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorOverviewTab;
