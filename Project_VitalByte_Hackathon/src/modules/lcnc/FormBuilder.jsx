import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Trash2,
    Save,
    Type,
    List,
    CheckSquare,
    Calendar,
    Database,
    Settings2,
    Layout,
    Eye,
    Smartphone,
    Monitor,
    Wand2,
    Hash,
    AlignLeft,
    CheckCircle,
    ArrowUpDown,
    Copy,
    GripVertical,
    Zap,
    FileCode,
    Sparkles,
    AlertCircle,
    Printer,
    ArrowLeft
} from 'lucide-react';
import clsx from 'clsx';
import { useNotification } from '../../context/NotificationContext';
import FormRenderer from './FormRenderer';

const FIELD_TYPES = [
    { type: 'header', label: 'Section Header', icon: Layout, description: 'Visual separator for sections', color: 'text-slate-700', bg: 'bg-slate-100' },
    { type: 'text', label: 'Short Answer', icon: Type, description: 'Single line text input', color: 'text-blue-500', bg: 'bg-blue-50' },
    { type: 'textarea', label: 'Long Answer', icon: AlignLeft, description: 'Multi-line text area', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { type: 'number', label: 'Numeric Value', icon: Hash, description: 'Restricted to numbers only', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { type: 'select', label: 'Dropdown Menu', icon: List, description: 'Choose from a set of options', color: 'text-purple-500', bg: 'bg-purple-50' },
    { type: 'checkbox', label: 'Checkbox Group', icon: CheckSquare, description: 'Multi-select boolean options', color: 'text-pink-500', bg: 'bg-pink-50' },
    { type: 'date', label: 'Date Picker', icon: Calendar, description: 'Standard calendar selection', color: 'text-orange-500', bg: 'bg-orange-50' },
];

const SEMEN_ANALYSIS_DEFAULT_SCHEMA = [
    { id: 'h1', type: 'header', label: 'SAMPLE COLLECTION' },
    { id: 'coll_type', type: 'select', label: 'Sample Collection Type', options: ['Center', 'Home', 'Surgical Retrieval'], width: 'half' },
    { id: 'coll_mode', type: 'text', label: 'Mode of Collection', placeholder: 'e.g. Ejaculate', width: 'half' },
    { id: 'coll_time', type: 'text', label: 'Time of Collection', placeholder: '04:00 AM', width: 'half' },
    { id: 'exam_time', type: 'text', label: 'Time of Examination', placeholder: '07:00 AM', width: 'half' },
    { id: 'abstinence', type: 'number', label: 'Abstinence Period (Days)', width: 'half' },
    { id: 'complete_coll', type: 'select', label: 'Complete Collection', options: ['Yes', 'No'], width: 'half' },
    { id: 'h2', type: 'header', label: 'MACROSCOPIC EXAMINATION' },
    { id: 'macro_vol', type: 'number', label: 'Volume (ml)', width: 'half' },
    { id: 'macro_ph', type: 'number', label: 'pH', width: 'half' },
    { id: 'macro_app', type: 'text', label: 'Appearance', placeholder: 'e.g. Grey-Opalescent', width: 'half' },
    { id: 'macro_liq', type: 'number', label: 'Time of Liquefaction (Mins)', width: 'half' },
    { id: 'macro_visc', type: 'text', label: 'Viscosity', placeholder: 'Normal / High', width: 'half' },
    { id: 'h3', type: 'header', label: 'MICROSCOPIC EXAMINATION' },
    { id: 'micro_conc', type: 'number', label: 'Sperm Concentration (millions/ml)', width: 'half' },
    { id: 'micro_tmsc', type: 'number', label: 'Total Motile Progressive (TMSC)', width: 'half' },
    { id: 'micro_total', type: 'number', label: 'Total Sperm Number (million)', width: 'half' },
    { id: 'micro_vital', type: 'number', label: 'Vitality (%)', width: 'half' },
    { id: 'micro_mot_a', type: 'number', label: 'Rapid Progressive Motility (a) %', width: 'half' },
    { id: 'micro_agg', type: 'text', label: 'Agglutination', width: 'half' },
    { id: 'micro_mot_b', type: 'number', label: 'Slow Progressive Motility (b) %', width: 'half' },
    { id: 'micro_round', type: 'text', label: 'Round Cells / HPF', width: 'half' },
    { id: 'micro_mot_c', type: 'number', label: 'Non-Progressive Motility (c) %', width: 'half' },
    { id: 'micro_other', type: 'text', label: 'Other Cells / Debris', width: 'half' },
    { id: 'micro_mot_d', type: 'number', label: 'Immotile Sperm (%)', width: 'half' },
    { id: 'h4', type: 'header', label: 'MORPHOLOGY' },
    { id: 'morph_norm', type: 'number', label: 'Normal Forms (%)', width: 'half' },
    { id: 'morph_head', type: 'number', label: 'Head Abnormalities (%)', width: 'half' },
    { id: 'morph_abnorm', type: 'number', label: 'Abnormal Forms (%)', width: 'half' },
    { id: 'morph_mid', type: 'number', label: 'Midpiece Abnormalities (%)', width: 'half' },
    { id: 'morph_tail', type: 'number', label: 'Tail Abnormalities (%)', width: 'half' },
    { id: 'morph_cyto', type: 'number', label: 'Cytoplasmic Droplets (%)', width: 'half' },
    { id: 'h5', type: 'header', label: 'WHO REFERENCE VALUES (2021 6th Edition)', helperText: 'Vol >= 1.5ml | pH 7.2-7.8 | Motility >= 32% (a+b)' }
];

const FormBuilder = ({ formId = 'default', initialSchema = [], onSave }) => {
    const { addNotification } = useNotification();
    const [fields, setFields] = useState([]);
    const [previewMode, setPreviewMode] = useState('desktop'); // desktop, mobile
    const [showPreview, setShowPreview] = useState(false);
    const [activeTab, setActiveTab] = useState('structure'); // structure, settings, logic
    const [formTitle, setFormTitle] = useState('Untitled Clinical Form');
    const [isSaving, setIsSaving] = useState(false);

    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(`form_schema_${formId}`);
        const savedTitle = localStorage.getItem(`form_title_${formId}`);
        if (saved) {
            setFields(JSON.parse(saved));
        } else if (formId === 'semen_analysis') {
            setFields(SEMEN_ANALYSIS_DEFAULT_SCHEMA);
            setFormTitle('Semen Analysis Comprehensive Report');
        } else if (initialSchema.length > 0) {
            setFields(initialSchema);
        }
        if (savedTitle) setFormTitle(savedTitle);
    }, [formId]);

    const fieldsWithLogic = useMemo(() => {
        return fields.filter(f => f.logic && f.logic.showIfField);
    }, [fields]);

    const runAiArchitect = () => {
        if (!aiPrompt.trim()) return;

        setIsAiProcessing(true);
        setTimeout(() => {
            const prompt = aiPrompt.toLowerCase();
            const newGeneratedFields = [];

            // Intelligence mapping
            if (prompt.includes('fertility') || prompt.includes('semen')) {
                newGeneratedFields.push(
                    { id: `gen_${Date.now()}_h1`, type: 'header', label: 'Patient Demographics' },
                    { id: `gen_${Date.now()}_gender`, type: 'select', label: 'Patient Gender', options: ['Male', 'Female'], required: true },
                    { id: `gen_${Date.now()}_h2`, type: 'header', label: 'Male Information (Semen Analysis)', logic: { showIfField: `gen_${Date.now()}_gender`, showIfValue: 'Male' } },
                    { id: `gen_${Date.now()}_v1`, type: 'number', label: 'Sperm Concentration (millions/ml)', width: 'half', logic: { showIfField: `gen_${Date.now()}_gender`, showIfValue: 'Male' } },
                    { id: `gen_${Date.now()}_v2`, type: 'number', label: 'Total Motility (%)', width: 'half', logic: { showIfField: `gen_${Date.now()}_gender`, showIfValue: 'Male' } },
                    { id: `gen_${Date.now()}_h3`, type: 'header', label: 'Female Information (Menstrual H/O)', logic: { showIfField: `gen_${Date.now()}_gender`, showIfValue: 'Female' } },
                    { id: `gen_${Date.now()}_f1`, type: 'date', label: 'Last Menstrual Period (LMP)', width: 'half', logic: { showIfField: `gen_${Date.now()}_gender`, showIfValue: 'Female' } },
                    { id: `gen_${Date.now()}_f2`, type: 'textarea', label: 'Obstetric History (G P A L)', logic: { showIfField: `gen_${Date.now()}_gender`, showIfValue: 'Female' } }
                );
            } else {
                if (prompt.includes('patient') || prompt.includes('name')) {
                    newGeneratedFields.push({ id: `ai_${Date.now()}_1`, type: 'text', label: 'Patient Full Name', placeholder: 'Enter legal name', required: true });
                }
                if (prompt.includes('history') || prompt.includes('notes')) {
                    newGeneratedFields.push({ id: `ai_${Date.now()}_2`, type: 'textarea', label: 'Clinical History / Notes', placeholder: 'Describe symptoms', required: false });
                }
                if (prompt.includes('date')) {
                    newGeneratedFields.push({ id: `ai_${Date.now()}_3`, type: 'date', label: 'Visit Date', required: true });
                }
                if (prompt.includes('vitals') || prompt.includes('measurement')) {
                    newGeneratedFields.push({ id: `ai_${Date.now()}_4`, type: 'number', label: 'Vital Value', placeholder: '0.00', required: true });
                }
            }

            if (newGeneratedFields.length === 0) {
                newGeneratedFields.push({ id: `ai_${Date.now()}_f`, type: 'text', label: 'Custom Field', placeholder: 'AI generated generic node', required: false });
            }

            setFields([...fields, ...newGeneratedFields]);
            addNotification('AI Architect successfully mapped new clinical nodes.', 'success');
            setIsAiProcessing(false);
            setShowAiModal(false);
            setAiPrompt('');
        }, 1500);
    };

    const clearCanvas = () => {
        if (confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
            setFields([]);
            addNotification('Canvas cleared.', 'warning');
        }
    };

    const addField = (type) => {
        const typeData = FIELD_TYPES.find(t => t.type === type);
        const newField = {
            id: `field_${Date.now()}`,
            type,
            label: `New ${typeData?.label || 'Field'}`,
            placeholder: 'Type your question here...',
            required: false,
            options: type === 'select' || type === 'checkbox' ? ['Option 1', 'Option 2'] : undefined,
            width: 'full',
            logic: { showIfField: '', showIfValue: '' }
        };
        setFields([...fields, newField]);
        addNotification(`Added ${typeData?.label} field.`, 'success');
    };

    const updateField = (index, updates) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        setFields(newFields);
    };

    const removeField = (index) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
        addNotification('Field removed.', 'warning');
    };

    const duplicateField = (index) => {
        const fieldToCopy = { ...fields[index], id: `field_${Date.now()}` };
        const newFields = [...fields];
        newFields.splice(index + 1, 0, fieldToCopy);
        setFields(newFields);
        addNotification('Field duplicated.', 'info');
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            localStorage.setItem(`form_schema_${formId}`, JSON.stringify(fields));
            localStorage.setItem(`form_title_${formId}`, formTitle);
            if (onSave) onSave(fields);
            addNotification('Form architecture published successfully.', 'success');
            setIsSaving(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 lg:p-8 space-y-6">
            {/* Professional Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg">
                        <FileCode className="w-8 h-8" />
                    </div>
                    <div>
                        <input
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="text-2xl font-black text-gray-900 bg-transparent border-none focus:ring-0 p-0 outline-none w-full hover:text-blue-600 transition-colors"
                        />
                        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">
                            LCNC Form Architect • <span className="text-blue-600">{fields.length} Data Nodes</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:shadow-xl transition-all active:scale-95"
                    >
                        <Wand2 className="w-4 h-4" /> AI Architect
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-black uppercase text-xs tracking-widest border border-red-100 hover:bg-red-100 transition-all active:scale-95"
                    >
                        <Trash2 className="w-4 h-4" /> Clear Canvas
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> {isSaving ? 'Publishing...' : 'Publish Form'}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit border border-gray-200 shadow-inner">
                {[
                    { id: 'structure', label: 'Form Builder', icon: Database },
                    { id: 'logic', label: 'Logic Summary', icon: Zap },
                    { id: 'settings', label: 'Global Settings', icon: Settings2 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === tab.id ? "bg-white text-gray-900 shadow-md" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Canvas Area */}
                <div className="lg:col-span-8 space-y-6">
                    {activeTab === 'structure' && (
                        <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[700px] flex flex-col">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-3">
                                    <div className="w-2 h-6 bg-blue-500 rounded-full" />
                                    Dynamic Canvas
                                </h3>
                                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                                    <button onClick={() => { setPreviewMode('desktop'); setShowPreview(true); }} className="p-2.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Monitor className="w-5 h-5" /></button>
                                    <button onClick={() => { setPreviewMode('mobile'); setShowPreview(true); }} className="p-2.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Smartphone className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div className="p-10 space-y-8 flex-1">
                                {fields.length > 0 ? (
                                    fields.map((field, index) => {
                                        const typeInfo = FIELD_TYPES.find(t => t.type === field.type);
                                        return (
                                            <div key={field.id} className="group relative bg-white border-2 border-gray-100 rounded-3xl p-8 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300">
                                                <div className="flex flex-col lg:flex-row gap-8">
                                                    <div className={clsx("w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center text-xl shadow-inner", typeInfo?.bg, typeInfo?.color)}>
                                                        {typeInfo && <typeInfo.icon className="w-8 h-8" />}
                                                    </div>

                                                    <div className="flex-1 space-y-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Question Label</label>
                                                                <input
                                                                    type="text"
                                                                    value={field.label}
                                                                    onChange={(e) => updateField(index, { label: e.target.value })}
                                                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Placeholder</label>
                                                                <input
                                                                    type="text"
                                                                    value={field.placeholder}
                                                                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                                />
                                                            </div>
                                                        </div>

                                                        {(field.type === 'select' || field.type === 'checkbox') && (
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Options (Comma Separated)</label>
                                                                <input
                                                                    type="text"
                                                                    value={field.options?.join(', ')}
                                                                    onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                                    className="w-full bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl px-5 py-4 text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50 space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <Zap className="w-4 h-4 text-blue-600" />
                                                                <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Visibility Logic</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <select
                                                                    value={field.logic?.showIfField || ''}
                                                                    onChange={(e) => updateField(index, { logic: { ...field.logic, showIfField: e.target.value } })}
                                                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none"
                                                                >
                                                                    <option value="">Always Visible</option>
                                                                    {fields.map(f => f.id !== field.id && <option key={f.id} value={f.id}>{f.label}</option>)}
                                                                </select>
                                                                <input
                                                                    placeholder="Trigger Value (e.g. Male)"
                                                                    value={field.logic?.showIfValue || ''}
                                                                    onChange={(e) => updateField(index, { logic: { ...field.logic, showIfValue: e.target.value } })}
                                                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                                            <label className="flex items-center gap-3 cursor-pointer group/req">
                                                                <div
                                                                    onClick={() => updateField(index, { required: !field.required })}
                                                                    className={clsx(
                                                                        "w-12 h-6 rounded-full relative transition-all border-2",
                                                                        field.required ? "bg-blue-600 border-blue-700" : "bg-gray-200 border-gray-300"
                                                                    )}
                                                                >
                                                                    <div className={clsx("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-md", field.required ? "left-7" : "left-1")} />
                                                                </div>
                                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Required Field</span>
                                                            </label>

                                                            <div className="flex gap-2">
                                                                <button onClick={() => duplicateField(index)} className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Copy className="w-5 h-5" /></button>
                                                                <button onClick={() => removeField(index)} className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center">
                                        <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
                                            <Sparkles className="w-12 h-12 text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900">Start Building</h3>
                                        <p className="text-gray-500 mt-2 max-w-xs font-bold text-sm">Use the toolbox or AI Architect to design your clinical form structure.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'logic' && (
                        <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Conditional Map</h3>
                            <div className="space-y-4">
                                {fieldsWithLogic.length > 0 ? (
                                    fieldsWithLogic.map(f => (
                                        <div key={f.id} className="p-6 bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-3xl flex items-center gap-6">
                                            <div className="p-4 bg-purple-100 rounded-2xl text-purple-600"><Zap className="w-6 h-6" /></div>
                                            <div>
                                                <p className="text-[11px] font-black text-purple-900 uppercase tracking-widest mb-1">Visibility Trigger</p>
                                                <p className="text-sm font-bold text-gray-700 leading-relaxed">
                                                    Field <span className="text-purple-700 italic">"{f.label}"</span> appears only when
                                                    <span className="text-indigo-700 font-extrabold"> "{fields.find(prev => prev.id === f.logic.showIfField)?.label}"</span> is
                                                    <span className="text-emerald-700 font-extrabold uppercase ml-1">"{f.logic.showIfValue}"</span>.
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-20 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-[2rem]">
                                        No conditional rules defined. All fields are currently static.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Global Configuration</h3>
                            <p className="text-gray-500 font-bold text-sm">Advanced form settings and integration mappings will be configured here.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Toolbox */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 shadow-sm sticky top-8">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Layout className="w-5 h-5" /></div>
                            Toolbox
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {FIELD_TYPES.map((type) => (
                                <button
                                    key={type.type}
                                    onClick={() => addField(type.type)}
                                    className="flex items-center gap-4 p-5 bg-gray-50/50 hover:bg-white border-2 border-transparent hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 rounded-2xl transition-all group text-left"
                                >
                                    <div className={clsx("p-3 rounded-xl transition-all group-hover:scale-110", type.bg, type.color)}>
                                        <type.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block font-black text-gray-900 text-sm uppercase tracking-tight">{type.label}</span>
                                        <span className="block text-[10px] font-bold text-gray-400 mt-1">{type.description}</span>
                                    </div>
                                    <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-600 group-hover:rotate-90 transition-all" />
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-100 flex gap-4">
                            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                            <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                                Publishing updates the live patient interface immediately. Verify all clinical IDs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Architect Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                        <div className="p-10 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-200">
                                    <Wand2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">AI Form Architect</h3>
                                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1 italic">V3.0 Intelligence Active</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="p-3 hover:bg-white rounded-2xl transition-all text-gray-400"><Plus className="w-8 h-8 rotate-45" /></button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Construction Prompt</label>
                                <textarea
                                    rows="5"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g. Generate a fertility case sheet with specific male semen analysis and female menstrual cycle history..."
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-[2rem] p-8 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setShowAiModal(false)} className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Cancel</button>
                                <button
                                    onClick={runAiArchitect}
                                    disabled={isAiProcessing || !aiPrompt.trim()}
                                    className={clsx(
                                        "flex-[2] py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl flex items-center justify-center gap-4",
                                        isAiProcessing ? "bg-indigo-400 text-white cursor-wait" : "bg-gradient-to-r from-indigo-600 to-indigo-800 text-white hover:shadow-indigo-300 active:scale-95"
                                    )}
                                >
                                    {isAiProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {isAiProcessing ? "Architecting Schema..." : "Architect Form"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[1100] bg-gray-900/40 backdrop-blur-2xl flex flex-col animate-in fade-in duration-500">
                    <div className="p-8 bg-white/80 backdrop-blur-md border-b border-white/20 flex justify-between items-center shadow-2xl relative z-10">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-600">Secure Live Sandbox</h3>
                            </div>
                            <div className="flex bg-gray-100 rounded-xl p-1 gap-1 border border-gray-200 shadow-inner">
                                <button onClick={() => setPreviewMode('desktop')} className={clsx("p-3 rounded-lg transition-all", previewMode === 'desktop' ? "bg-white text-blue-600 shadow-md ring-1 ring-blue-100" : "text-gray-400")}><Monitor className="w-5 h-5" /></button>
                                <button onClick={() => setPreviewMode('mobile')} className={clsx("p-3 rounded-lg transition-all", previewMode === 'mobile' ? "bg-white text-blue-600 shadow-md ring-1 ring-blue-100" : "text-gray-400")}><Smartphone className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => window.print()} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
                                <Printer className="w-4 h-4" /> Print Medical Report
                            </button>
                            <button onClick={() => setShowPreview(false)} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">
                                Exit Sandbox
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 lg:p-24 flex justify-center bg-[radial-gradient(circle_at_center,_#f8fafc_0%,_#e2e8f0_100%)]">
                        <div className={clsx(
                            "w-full transition-all duration-1000 ease-in-out",
                            previewMode === 'mobile' ? "max-w-[420px] border-[16px] border-gray-900 rounded-[4rem] h-[850px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-white overflow-hidden relative" : "max-w-6xl"
                        )}>
                            <div className={clsx(
                                "h-full overflow-y-auto custom-scrollbar p-10 lg:p-20",
                                previewMode === 'mobile' ? "bg-white" : "bg-white rounded-[3rem] shadow-2xl border border-white"
                            )}>
                                <FormRenderer schema={fields} title={formTitle} isPreview={true} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormBuilder;
