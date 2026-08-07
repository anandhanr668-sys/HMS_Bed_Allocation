import React, { useState } from 'react';
import {
    Heart, Activity, Calendar, Clock, Clipboard, Save,
    CheckCircle2, AlertCircle, Syringe, User, Sparkles,
    ClipboardCheck, Plus, Trash2, Microscope, Baby,
    Wind, Droplets, Target, FileText, Pill
} from 'lucide-react';
import clsx from 'clsx';
import apiClient from '../../../api/apiClient';

/**
 * Enterprise-Grade Fertility Assessment Case Sheet
 * Comprehensive Reproductive Health Protocol
 */
export const FertilityCaseSheet = ({ patientId, existingData, onSave, onClose }) => {
    const [formData, setFormData] = useState(existingData || {
        visitDate: new Date().toISOString().split('T')[0],
        // Female Info
        femaleInfo: { height: '', weight: '', bmi: '', bp: '', pr: '', marriedYears: '', subfertilityYears: '' },
        menstrualHO: { lmp: '', cycleLength: '', cyclesPattern: '', painInPeriods: '', needWithdrawal: '' },
        obstetricHistory: { gravida: '', para: '', abortions: '', livingChild: '', ectopic: '' },
        detailedObstetricHistory: [],
        fertilityHistory: { type: '', durationYears: '', durationMonths: '' },
        chiefComplaints: '',
        // Previous Treatments
        ovulationInduction: [],
        iuiHistory: [],
        ivfHistory: [],
        // Female Medical/Surgical
        femaleMedicalHistory: [],
        femaleSurgicalHistory: [],
        // Male Info
        maleInfo: { height: '', weight: '', bmi: '', bp: '', pr: '', sexualDysfunction: '', erectileProblem: '', ejaculateProblem: '', others: '' },
        maleMedicalHistory: [],
        maleSurgicalHistory: [],
        previousSemenAnalysis: [],
        // Medications & Investigations
        basicMedications: [],
        recommendedInvestigations: [
            { name: 'CBC' }, { name: 'Blood Group' }, { name: 'TSH' }, { name: 'AMH' },
            { name: 'PROLACTIN' }, { name: 'Karyotype' }
        ],
        advice: '',
        nextAppointment: '',
        otherInstructions: ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('female');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                type: 'FERTILITY_CASE_SHEET',
                summary: `Fertility Assessment - G${formData.obstetricHistory.gravida}P${formData.obstetricHistory.para}`,
                data: formData,
                prescriptions: formData.basicMedications
            };

            await apiClient.post(`/doctor/patients/${patientId}/history`, payload);

            if (onSave) onSave(formData);
            alert('Fertility Case Sheet saved to patient history as PDF-ready record.');
        } catch (err) {
            console.error('Failed to save fertility case sheet:', err);
            alert('Failed to save case sheet. Please check connection.');
        } finally {
            setIsSaving(false);
        }
    };

    const addTableRow = (section, template) => {
        setFormData(prev => ({
            ...prev,
            [section]: [...(prev[section] || []), { ...template, id: Date.now() }]
        }));
    };

    const updateTableRow = (section, id, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: prev[section].map(row => row.id === id ? { ...row, [field]: value } : row)
        }));
    };

    const removeTableRow = (section, id) => {
        setFormData(prev => ({
            ...prev,
            [section]: prev[section].filter(row => row.id !== id)
        }));
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
            {/* STICKY HEADER */}
            <div className="bg-white px-8 py-6 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Baby size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Advanced Fertility Protocol</h2>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">Reproductive Health Case Sheet v4.2</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right mr-4 hidden md:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Assessment Date</p>
                        <p className="text-sm font-black text-slate-800">{new Date(formData.visitDate).toLocaleDateString()}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center gap-2"
                    >
                        {isSaving ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Syncing...' : 'Save & Publish'}
                    </button>
                </div>
            </div>

            <div className="grow flex overflow-hidden">
                {/* VERTICAL NAV */}
                <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-2 overflow-y-auto">
                    {[
                        { id: 'female', label: 'Female Assessment', icon: Heart, color: 'text-pink-500' },
                        { id: 'obstetric', label: 'Obstetric History', icon: Baby, color: 'text-indigo-500' },
                        { id: 'treatments', label: 'Past Treatments', icon: Syringe, color: 'text-amber-600' },
                        { id: 'male', label: 'Male Assessment', icon: Microscope, color: 'text-blue-500' },
                        { id: 'meds', label: 'Plan & Recommendations', icon: Pill, color: 'text-emerald-500' },
                    ].map(nav => (
                        <button
                            key={nav.id}
                            onClick={() => setActiveSection(nav.id)}
                            className={clsx(
                                "flex items-center gap-3 p-4 rounded-2xl transition-all text-left group",
                                activeSection === nav.id
                                    ? "bg-slate-900 shadow-xl shadow-slate-200"
                                    : "hover:bg-slate-50"
                            )}
                        >
                            <nav.icon size={18} className={activeSection === nav.id ? "text-white" : nav.color} />
                            <span className={clsx(
                                "text-[11px] font-black uppercase tracking-widest",
                                activeSection === nav.id ? "text-white" : "text-slate-500 group-hover:text-slate-900"
                            )}>
                                {nav.label}
                            </span>
                        </button>
                    ))}

                    <div className="mt-auto p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle size={14} className="text-indigo-600" />
                            <p className="text-[10px] font-black text-indigo-900 uppercase">Pro Tip</p>
                        </div>
                        <p className="text-[9px] font-bold text-indigo-700 leading-relaxed italic">
                            All medical history rows are synced to the patient's global history timeline upon saving.
                        </p>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="grow overflow-y-auto p-10">
                    <div className="max-w-4xl mx-auto space-y-12">

                        {/* SECTION: FEMALE ASSESSMENT */}
                        {activeSection === 'female' && (
                            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-10">
                                <div className="space-y-6">
                                    <SectionHeading title="Female Clinical Profile" icon={Heart} color="bg-pink-50 text-pink-500" />
                                    <div className="grid grid-cols-4 gap-4">
                                        <InputGroup label="Height (cm)" value={formData.femaleInfo.height} onChange={(v) => setFormData({ ...formData, femaleInfo: { ...formData.femaleInfo, height: v } })} />
                                        <InputGroup label="Weight (kg)" value={formData.femaleInfo.weight} onChange={(v) => setFormData({ ...formData, femaleInfo: { ...formData.femaleInfo, weight: v } })} />
                                        <InputGroup label="BMI" value={formData.femaleInfo.bmi} onChange={(v) => setFormData({ ...formData, femaleInfo: { ...formData.femaleInfo, bmi: v } })} />
                                        <InputGroup label="Blood Pressure" value={formData.femaleInfo.bp} onChange={(v) => setFormData({ ...formData, femaleInfo: { ...formData.femaleInfo, bp: v } })} />
                                        <InputGroup label="Pulse Rate (PR)" value={formData.femaleInfo.pr} onChange={(v) => setFormData({ ...formData, femaleInfo: { ...formData.femaleInfo, pr: v } })} />
                                        <InputGroup label="Married Years" value={formData.femaleInfo.marriedYears} onChange={(v) => setFormData({ ...formData, femaleInfo: { ...formData.femaleInfo, marriedYears: v } })} />
                                        <InputGroup label="Subfertility Years" value={formData.femaleInfo.subfertilityYears} onChange={(v) => setFormData({ ...formData, femaleInfo: { ...formData.femaleInfo, subfertilityYears: v } })} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <SectionHeading title="Menstrual H/O" icon={Calendar} color="bg-indigo-50 text-indigo-500" />
                                    <div className="grid grid-cols-3 gap-4">
                                        <InputGroup label="LMP Date" type="date" value={formData.menstrualHO.lmp} onChange={(v) => setFormData({ ...formData, menstrualHO: { ...formData.menstrualHO, lmp: v } })} />
                                        <InputGroup label="Cycle Length (Days)" value={formData.menstrualHO.cycleLength} onChange={(v) => setFormData({ ...formData, menstrualHO: { ...formData.menstrualHO, cycleLength: v } })} />
                                        <InputGroup label="Pattern" value={formData.menstrualHO.cyclesPattern} onChange={(v) => setFormData({ ...formData, menstrualHO: { ...formData.menstrualHO, cyclesPattern: v } })} />
                                        <InputGroup label="Pain In Periods" value={formData.menstrualHO.painInPeriods} onChange={(v) => setFormData({ ...formData, menstrualHO: { ...formData.menstrualHO, painInPeriods: v } })} />
                                        <InputGroup label="Need Withdrawal" value={formData.menstrualHO.needWithdrawal} onChange={(v) => setFormData({ ...formData, menstrualHO: { ...formData.menstrualHO, needWithdrawal: v } })} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <SectionHeading title="Systemic History" icon={Activity} color="bg-emerald-50 text-emerald-500" />
                                    <TableActionRow
                                        title="Clinical Conditions"
                                        onAdd={() => addTableRow('femaleMedicalHistory', { condition: '', duration: '', treatment: '' })}
                                    />
                                    <HistoryTable
                                        headers={['Condition', 'Duration', 'Treatment']}
                                        data={formData.femaleMedicalHistory || []}
                                        fields={['condition', 'duration', 'treatment']}
                                        onChange={(id, f, v) => updateTableRow('femaleMedicalHistory', id, f, v)}
                                        onRemove={(id) => removeTableRow('femaleMedicalHistory', id)}
                                    />
                                </div>
                            </section>
                        )}

                        {/* SECTION: OBSTETRIC HISTORY */}
                        {activeSection === 'obstetric' && (
                            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-10">
                                <div className="space-y-6">
                                    <SectionHeading title="Obstetric Summary" icon={Baby} color="bg-indigo-50 text-indigo-500" />
                                    <div className="grid grid-cols-5 gap-4">
                                        <InputGroup label="Gravida (G)" value={formData.obstetricHistory.gravida} onChange={(v) => setFormData({ ...formData, obstetricHistory: { ...formData.obstetricHistory, gravida: v } })} />
                                        <InputGroup label="Para (P)" value={formData.obstetricHistory.para} onChange={(v) => setFormData({ ...formData, obstetricHistory: { ...formData.obstetricHistory, para: v } })} />
                                        <InputGroup label="Abortions (A)" value={formData.obstetricHistory.abortions} onChange={(v) => setFormData({ ...formData, obstetricHistory: { ...formData.obstetricHistory, abortions: v } })} />
                                        <InputGroup label="Living (L)" value={formData.obstetricHistory.livingChild} onChange={(v) => setFormData({ ...formData, obstetricHistory: { ...formData.obstetricHistory, livingChild: v } })} />
                                        <InputGroup label="Ectopic (E)" value={formData.obstetricHistory.ectopic} onChange={(v) => setFormData({ ...formData, obstetricHistory: { ...formData.obstetricHistory, ectopic: v } })} />
                                    </div>

                                    <TableActionRow
                                        title="Detailed Outcomes"
                                        onAdd={() => addTableRow('detailedObstetricHistory', { outcome: '', conception: '', weeks: '', delivery: '', babyOutcome: '', complications: '', comments: '' })}
                                    />
                                    <HistoryTable
                                        headers={['Outcome', 'Mode of Conception', 'Weeks', 'Delivery', 'Baby', 'Complications', 'Comments']}
                                        data={formData.detailedObstetricHistory || []}
                                        fields={['outcome', 'conception', 'weeks', 'delivery', 'babyOutcome', 'complications', 'comments']}
                                        onChange={(id, f, v) => updateTableRow('detailedObstetricHistory', id, f, v)}
                                        onRemove={(id) => removeTableRow('detailedObstetricHistory', id)}
                                    />
                                </div>
                            </section>
                        )}

                        {/* SECTION: MALE ASSESSMENT */}
                        {activeSection === 'male' && (
                            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-10">
                                <div className="space-y-6">
                                    <SectionHeading title="Male Clinical Profile" icon={User} color="bg-blue-50 text-blue-500" />
                                    <div className="grid grid-cols-4 gap-4">
                                        <InputGroup label="Height" value={formData.maleInfo.height} onChange={(v) => setFormData({ ...formData, maleInfo: { ...formData.maleInfo, height: v } })} />
                                        <InputGroup label="Weight" value={formData.maleInfo.weight} onChange={(v) => setFormData({ ...formData, maleInfo: { ...formData.maleInfo, weight: v } })} />
                                        <InputGroup label="BMI" value={formData.maleInfo.bmi} onChange={(v) => setFormData({ ...formData, maleInfo: { ...formData.maleInfo, bmi: v } })} />
                                        <InputGroup label="BP" value={formData.maleInfo.bp} onChange={(v) => setFormData({ ...formData, maleInfo: { ...formData.maleInfo, bp: v } })} />
                                        <InputGroup label="Sexual Dysfunction" value={formData.maleInfo.sexualDysfunction} onChange={(v) => setFormData({ ...formData, maleInfo: { ...formData.maleInfo, sexualDysfunction: v } })} />
                                        <InputGroup label="Erectile Problem" value={formData.maleInfo.erectileProblem} onChange={(v) => setFormData({ ...formData, maleInfo: { ...formData.maleInfo, erectileProblem: v } })} />
                                        <InputGroup label="Ejaculate Problem" value={formData.maleInfo.ejaculateProblem} onChange={(v) => setFormData({ ...formData, maleInfo: { ...formData.maleInfo, ejaculateProblem: v } })} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <SectionHeading title="Semen Parameters H/O" icon={Microscope} color="bg-indigo-50 text-indigo-500" />
                                    <TableActionRow
                                        title="Past Analysis"
                                        onAdd={() => addTableRow('previousSemenAnalysis', { year: '', center: '', volume: '', count: '', motility: '', morphology: '' })}
                                    />
                                    <HistoryTable
                                        headers={['Year', 'Center', 'Vol', 'Conc', 'Motility', 'Morphology']}
                                        data={formData.previousSemenAnalysis || []}
                                        fields={['year', 'center', 'volume', 'count', 'motility', 'morphology']}
                                        onChange={(id, f, v) => updateTableRow('previousSemenAnalysis', id, f, v)}
                                        onRemove={(id) => removeTableRow('previousSemenAnalysis', id)}
                                    />
                                </div>
                            </section>
                        )}

                        {/* SECTION: PLAN */}
                        {activeSection === 'meds' && (
                            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-10">
                                <div className="space-y-6">
                                    <SectionHeading title="Prescription Plan" icon={Pill} color="bg-emerald-50 text-emerald-500" />
                                    <TableActionRow
                                        title="Specialized Medications"
                                        onAdd={() => addTableRow('basicMedications', { patient: 'Female', brand: '', generic: '', dose: '', time: '', freq: '', duration: '' })}
                                    />
                                    <HistoryTable
                                        headers={['Patient', 'Drug Name', 'Dose', 'Time', 'Freq', 'Days']}
                                        data={formData.basicMedications || []}
                                        fields={['patient', 'brand', 'dose', 'time', 'freq', 'duration']}
                                        onChange={(id, f, v) => updateTableRow('basicMedications', id, f, v)}
                                        onRemove={(id) => removeTableRow('basicMedications', id)}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <SectionHeading title="General Advice & Instructions" icon={Clipboard} color="bg-slate-100 text-slate-500" />
                                    <textarea
                                        className="w-full bg-white border border-slate-200 rounded-3xl p-6 text-sm font-bold min-h-[150px] outline-none focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                                        placeholder="Type comprehensive clinical guidance here..."
                                        value={formData.advice}
                                        onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="Next Review Date" type="date" value={formData.nextAppointment} onChange={(v) => setFormData({ ...formData, nextAppointment: v })} />
                                        <InputGroup label="Urgency Status" value={formData.otherInstructions} onChange={(v) => setFormData({ ...formData, otherInstructions: v })} />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* SECTION: PAST TREATMENTS */}
                        {activeSection === 'treatments' && (
                            <section className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-10">
                                <div className="space-y-6">
                                    <SectionHeading title="Previous Fertility Interventions" icon={Syringe} color="bg-amber-50 text-amber-600" />

                                    <TableActionRow
                                        title="IUI / IVF / ICSI Cycles"
                                        onAdd={() => addTableRow('ivfHistory', { year: '', center: '', protocol: '', eggs: '', outcome: '' })}
                                    />
                                    <HistoryTable
                                        headers={['Year', 'Center', 'Protocol', 'Eggs/Embryos', 'Outcome']}
                                        data={formData.ivfHistory || []}
                                        fields={['year', 'center', 'protocol', 'eggs', 'outcome']}
                                        onChange={(id, f, v) => updateTableRow('ivfHistory', id, f, v)}
                                        onRemove={(id) => removeTableRow('ivfHistory', id)}
                                    />
                                </div>
                            </section>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

// MINI COMPONENTS

const SectionHeading = ({ title, icon: Icon, color }) => (
    <div className="flex items-center gap-4">
        <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm", color)}>
            <Icon size={20} />
        </div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
        <div className="grow h-[1px] bg-slate-100" />
    </div>
);

const InputGroup = ({ label, value, onChange, type = 'text' }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input
            type={type}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all shadow-sm"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const TableActionRow = ({ title, onAdd }) => (
    <div className="flex justify-between items-center px-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
        <button
            type="button"
            onClick={onAdd}
            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
        >
            <Plus size={14} />
        </button>
    </div>
);

const HistoryTable = ({ headers, data, fields, onChange, onRemove }) => (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                    {headers.map((h, i) => (
                        <th key={i} className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                    <th className="px-6 py-4 w-10"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {!data || data.length === 0 ? (
                    <tr>
                        <td colSpan={headers.length + 1} className="px-6 py-10 text-center">
                            <p className="text-xs font-bold text-slate-300 italic">No entries recorded yet.</p>
                        </td>
                    </tr>
                ) : data.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50/50 transition-all">
                        {fields.map((f, i) => (
                            <td key={i} className="px-6 py-3">
                                <input
                                    className="w-full bg-transparent border-none text-xs font-bold text-slate-700 outline-none focus:text-indigo-600"
                                    value={row[f] || ''}
                                    onChange={(e) => onChange(row.id, f, e.target.value)}
                                    placeholder="..."
                                />
                            </td>
                        ))}
                        <td className="px-4 py-3">
                            <button
                                type="button"
                                onClick={() => onRemove(row.id)}
                                className="p-1.5 text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default FertilityCaseSheet;
