import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Activity, Pill, ClipboardCheck, Gauge, HeartPulse, Thermometer, MessageSquare, Clock, Plus, PenTool, BedDouble, UserCheck, AlertTriangle, ArrowRight, LogOut } from 'lucide-react';
import clsx from 'clsx';
import DynamicFormRenderer from '../../../components/lcnc/DynamicFormRenderer';

const NurseTabs = ({
    activeTab,
    setActiveTab,
    selectedPatient,
    vitalsForms,
    selectedVitalsForm,
    setSelectedVitalsForm,
    handleDynamicVitalsSubmit,
    handleSubmitVitals,
    vitalsForm,
    setVitalsForm,
    VitalInput,
    handleMedicationAction,
    noteContent,
    setNoteContent,
    noteCategory,
    setNoteCategory,
    handleAddNote,
    // Bed Props
    allBeds = [],
    wardTypes = [],
    conditionMapping = [],
    currentBed,
    onAllocateBed,
    onReleaseBed,
    allocationHistory = []
}) => {
    if (!selectedPatient) return null;

    const [selectedWardForBed, setSelectedWardForBed] = useState(wardTypes[0]?.id);

    // Bed Logic
    const recommendedRule = conditionMapping.find(cm => cm.condition === selectedPatient.condition);
    const recommendedWardId = recommendedRule?.ward;
    const recommendedBedType = recommendedRule?.bedType;

    const filteredBeds = allBeds.filter(b => b.wardId === selectedWardForBed);

    return (
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 bg-white shadow-2xl shadow-gray-200/50 rounded-b-3xl">
            <div className="px-8 pt-2 bg-gray-50/50 border-b border-gray-100">
                <Tabs.List className="flex gap-10">
                    {['overview', 'bed-allocation', 'notes', 'history'].map(tab => (
                        <Tabs.Trigger
                            key={tab}
                            value={tab}
                            className={clsx(
                                "py-5 text-xs font-black uppercase tracking-[0.2em] border-b-[3px] transition-all relative flex items-center gap-2",
                                activeTab === tab
                                    ? "text-blue-600 border-blue-600"
                                    : "text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-200"
                            )}
                        >
                            {tab === 'overview' && 'Clinical Overview'}

                            {tab === 'bed-allocation' && 'Bed Mgmt'}
                            {tab === 'notes' && 'Nursing Notes'}
                            {tab === 'history' && 'History'}
                        </Tabs.Trigger>
                    ))}
                </Tabs.List>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <Tabs.Content value="overview" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300 focus:outline-none">
                    {/* Vitals Input Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent opacity-50 rounded-bl-[100px] pointer-events-none" />

                        <div className="flex justify-between items-center mb-6 relative">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                    <Activity className="text-blue-500" size={20} />
                                    Vitals Recording
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-gray-500 font-medium">Record real-time physiological parameters</p>
                                    {vitalsForms.length > 0 && (
                                        <select
                                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none font-bold text-slate-600 cursor-pointer"
                                            onChange={(e) => {
                                                const selected = vitalsForms.find(f => f.form_id === e.target.value);
                                                setSelectedVitalsForm(selected || null);
                                            }}
                                            value={selectedVitalsForm?.form_id || ''}
                                        >
                                            <option value="">Standard Vitals</option>
                                            {vitalsForms.map(f => <option key={f.form_id} value={f.form_id}>{f.title}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-blue-100">
                                Live Mode
                            </span>
                        </div>

                        {selectedVitalsForm ? (
                            <div className="animate-in fade-in duration-300">
                                <DynamicFormRenderer
                                    schema={selectedVitalsForm.schema_json}
                                    onSubmit={handleDynamicVitalsSubmit}
                                />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitVitals} className="space-y-6 relative animate-in fade-in duration-300">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <VitalInput
                                        label="Oxygen (SpO2)" icon={Gauge} unit="%" type="number" min="0" max="100"
                                        value={vitalsForm.spo2} onChange={e => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                                    />
                                    <VitalInput
                                        label="Heart Rate" icon={HeartPulse} unit="BPM" type="number"
                                        value={vitalsForm.bpm} onChange={e => setVitalsForm({ ...vitalsForm, bpm: e.target.value })}
                                    />
                                    <VitalInput
                                        label="Temperature" icon={Thermometer} unit="°F" type="number" step="0.1"
                                        value={vitalsForm.temperature} onChange={e => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                                    />
                                    <VitalInput
                                        label="Resp. Rate" icon={Activity} unit="/min" type="number"
                                        value={vitalsForm.respiratoryRate} onChange={e => setVitalsForm({ ...vitalsForm, respiratoryRate: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                    <VitalInput
                                        label="Systolic BP" icon={Activity} unit="mmHg" type="number" placeholder="120"
                                        value={vitalsForm.bp_systolic} onChange={e => setVitalsForm({ ...vitalsForm, bp_systolic: e.target.value })}
                                    />
                                    <VitalInput
                                        label="Diastolic BP" icon={Activity} unit="mmHg" type="number" placeholder="80"
                                        value={vitalsForm.bp_diastolic} onChange={e => setVitalsForm({ ...vitalsForm, bp_diastolic: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-black uppercase text-xs tracking-[0.1em] hover:bg-black hover:scale-[1.02] transition-all shadow-xl shadow-gray-900/10 flex items-center gap-2">
                                        <ClipboardCheck size={16} /> Save Vitals Entry
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </Tabs.Content>



                {/* PRO BED MANAGEMENT TAB */}
                <Tabs.Content value="bed-allocation" className="space-y-6 focus:outline-none animate-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[650px]">

                        {/* LEFT PANEL: CURRENT ASSIGNMENT / TICKET */}
                        <div className="lg:col-span-1 flex flex-col h-full">
                            <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex-1 flex flex-col relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:bg-blue-50 transition-colors duration-700" />

                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 z-10">Current Allocation</h3>

                                {currentBed ? (
                                    <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 animate-in zoom-in duration-500">
                                        {/* Ticket Design */}
                                        <div className="w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 relative">
                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r border-slate-200" />
                                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-l border-slate-200" />

                                            <div className="text-center space-y-2">
                                                <div className="w-16 h-16 bg-blue-100/50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                                                    <BedDouble size={32} />
                                                </div>
                                                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{currentBed.bedNumber}</h2>
                                                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                                                    {currentBed.wardName}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 w-full mt-8">
                                            <button
                                                onClick={() => onReleaseBed(currentBed.bedId)}
                                                className="py-4 bg-white border border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm hover:shadow-red-200/50 flex items-center justify-center gap-2 group/btn"
                                            >
                                                <LogOut size={14} className="group-hover/btn:-translate-x-1 transition-transform" /> Discharge
                                            </button>
                                            <button className="py-4 bg-slate-900 text-white hover:bg-black rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg hover:shadow-xl hover:shadow-slate-900/20 flex items-center justify-center gap-2">
                                                Transfer
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                            <BedDouble size={40} className="text-slate-300" />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 mb-2">No Bed Assigned</h4>
                                        <p className="text-sm font-medium text-slate-400 max-w-[200px] leading-relaxed">
                                            Select an available bed from a ward to admit patient.
                                        </p>

                                        {recommendedWardId && (
                                            <div className="mt-8 bg-amber-50 border border-amber-100 p-5 rounded-2xl w-full text-left relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-full -mr-8 -mt-8 opacity-50" />
                                                <div className="flex items-center gap-2 mb-2 relative z-10">
                                                    <div className="p-1 bg-amber-100 rounded text-amber-600"><AlertTriangle size={12} strokeWidth={3} /></div>
                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Recommendation</span>
                                                </div>
                                                <p className="text-xs font-bold text-amber-900 leading-relaxed relative z-10">
                                                    Protocol suggests admission to <br />
                                                    <span className="text-amber-700 bg-amber-200/50 px-1.5 py-0.5 rounded text-[10px] uppercase mt-1 inline-block border border-amber-200/50">
                                                        {recommendedWardId}
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT PANEL: INTERACTIVE MAP */}
                        <div className="lg:col-span-3 flex flex-col h-full space-y-4">
                            {/* WARD SELECTOR STRIP */}
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x p-1">
                                {wardTypes.map(ward => {
                                    const wardBeds = allBeds.filter(b => b.wardId === ward.id);
                                    const availableCount = wardBeds.filter(b => b.status === 'Available').length;
                                    const totalCount = wardBeds.length;
                                    const occupancyRate = totalCount > 0 ? ((totalCount - availableCount) / totalCount) * 100 : 0;
                                    const isCritical = occupancyRate > 80;
                                    const isSelected = selectedWardForBed === ward.id;

                                    return (
                                        <button
                                            key={ward.id}
                                            onClick={() => setSelectedWardForBed(ward.id)}
                                            className={clsx(
                                                "min-w-[180px] p-5 rounded-[1.5rem] border transition-all duration-300 text-left relative overflow-hidden group snap-start",
                                                isSelected
                                                    ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 scale-100"
                                                    : "bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 scale-95 opacity-80 hover:opacity-100"
                                            )}
                                        >
                                            {/* Decorative Background */}
                                            {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black pointer-events-none" />}
                                            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Activity size={64} />
                                            </div>

                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className="flex justify-between items-start">
                                                    <span className={clsx("text-[10px] font-black uppercase tracking-widest", isSelected ? "text-slate-400" : "text-slate-400 group-hover:text-blue-500")}>
                                                        {ward.name}
                                                    </span>
                                                    {isCritical && !isSelected && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                                                </div>

                                                <div className="mt-4">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={clsx("text-3xl font-black tracking-tight", isSelected ? "text-white" : "text-slate-900")}>
                                                            {availableCount}
                                                        </span>
                                                        <span className={clsx("text-xs font-bold", isSelected ? "text-slate-500" : "text-slate-400")}>
                                                            / {totalCount}
                                                        </span>
                                                    </div>
                                                    <p className={clsx("text-[10px] font-bold uppercase tracking-wider mt-1", isSelected ? "text-slate-500" : "text-slate-400")}>Available Beds</p>
                                                </div>

                                                {/* Mini Progress */}
                                                <div className="w-full h-1 bg-white/10 rounded-full mt-4 overflow-hidden relative">
                                                    <div className={clsx("absolute inset-y-0 left-0 bg-current opacity-20 w-full")} />
                                                    <div
                                                        className={clsx("absolute inset-y-0 left-0 transition-all duration-1000 rounded-full",
                                                            isSelected ? (occupancyRate > 90 ? "bg-red-500" : "bg-emerald-400") : (occupancyRate > 90 ? "bg-red-500" : "bg-blue-500")
                                                        )}
                                                        style={{ width: `${(availableCount / totalCount) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* BED GRID */}
                            <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100 p-6 flex-1 overflow-y-auto min-h-0">
                                {filteredBeds.length > 0 ? (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredBeds.map(bed => {
                                            const isAvailable = bed.status === 'Available';
                                            const isOccupied = bed.status === 'Occupied';
                                            const isRecommended = recommendedWardId === bed.wardId;
                                            const isAssignedToMe = bed.assignedPatientId === selectedPatient.patientId;

                                            return (
                                                <div
                                                    key={bed.bedId}
                                                    onClick={() => isAvailable && onAllocateBed(bed.bedId)}
                                                    className={clsx(
                                                        "relative bg-white rounded-2xl p-0 transition-all duration-300 group overflow-hidden border",
                                                        isAssignedToMe ? "border-blue-500 ring-4 ring-blue-500/10 shadow-xl shadow-blue-500/20 scale-[1.02]" :
                                                            isAvailable
                                                                ? "border-slate-100 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-100 hover:-translate-y-1 cursor-pointer"
                                                                : "border-slate-100 opacity-60 grayscale-[0.5]"
                                                    )}
                                                >
                                                    {/* Status Strip */}
                                                    <div className={clsx("h-1.5 w-full",
                                                        isAssignedToMe ? "bg-blue-500" :
                                                            isAvailable ? "bg-emerald-400" :
                                                                "bg-slate-200"
                                                    )} />

                                                    <div className="p-5">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className={clsx("p-2 rounded-xl transition-colors",
                                                                isAssignedToMe ? "bg-blue-50 text-blue-600" :
                                                                    isAvailable ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : "bg-slate-50 text-slate-400"
                                                            )}>
                                                                <BedDouble size={20} />
                                                            </div>
                                                            {isRecommended && isAvailable && (
                                                                <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide border border-emerald-200 shadow-sm animate-pulse">
                                                                    Best Match
                                                                </span>
                                                            )}
                                                            {!isAvailable && !isAssignedToMe && (
                                                                <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-wide">
                                                                    Occupied
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h4 className={clsx("text-2xl font-black tracking-tight", isAssignedToMe ? "text-blue-900" : "text-slate-800")}>{bed.bedNumber}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate mt-1">{bed.bedTypeName}</p>
                                                        </div>

                                                        {isOccupied && !isAssignedToMe && (
                                                            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                    {bed.assignedPatientName ? bed.assignedPatientName[0] : '?'}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-500 truncate">{bed.assignedPatientName || 'Unknown'}</span>
                                                            </div>
                                                        )}

                                                        {isAvailable && (
                                                            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-white via-white to-transparent">
                                                                <div className="text-center">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                                                        Select Bed
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                        <BedDouble size={64} className="mb-4 text-slate-300" />
                                        <h3 className="text-lg font-black text-slate-400">No Beds in View</h3>
                                        <p className="text-sm font-bold text-slate-300">Try selecting a different ward</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="notes" className="space-y-6 focus:outline-none animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <PenTool className="text-blue-500" size={18} /> Add Nursing Observation
                            </h3>
                            <select
                                value={noteCategory}
                                onChange={(e) => setNoteCategory(e.target.value)}
                                className="bg-gray-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none"
                            >
                                <option>General</option>
                                <option>Shift Handover</option>
                                <option>Symptom Monitoring</option>
                                <option>Family Interaction</option>
                            </select>
                        </div>
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Describe patient condition, behavior, and any interventions performed..."
                            className="w-full h-40 bg-gray-50 rounded-3xl p-6 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white border-transparent focus:border-blue-500 transition-all resize-none placeholder-gray-300"
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={handleAddNote}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 flex items-center gap-2"
                            >
                                <Plus size={16} /> Post Observation
                            </button>
                        </div>
                    </div>

                    {/* Historical Notes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="text-gray-400" size={18} /> Nursing Log History
                        </h3>
                        <div className="space-y-4">
                            {(selectedPatient.nursingNotes || []).length === 0 ? (
                                <p className="text-gray-400 italic text-sm">No notes have been recorded for this patient yet.</p>
                            ) : (
                                [...(selectedPatient.nursingNotes || [])].reverse().map(note => (
                                    <div key={note.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-black uppercase rounded-bl-xl border-l border-b border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            {note.category}
                                        </div>
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{new Date(note.timestamp).toLocaleString()}</p>
                                        <p className="text-sm font-bold text-gray-700 leading-relaxed">{note.note}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Tabs.Content>

                <Tabs.Content value="history" className="focus:outline-none animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-white p-16 rounded-3xl border border-gray-200 text-center text-gray-400">
                        <MessageSquare size={64} className="mx-auto mb-4 opacity-10" />
                        <h3 className="text-lg font-black text-gray-900 mb-1">Clinical Timeline</h3>
                        <p className="text-sm font-medium">Integration with LCNC audit trails coming soon</p>
                    </div>
                </Tabs.Content>
            </div>
        </Tabs.Root>
    );
};

export default NurseTabs;
