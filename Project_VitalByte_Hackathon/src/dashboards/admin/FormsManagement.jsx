import React, { useEffect, useState } from 'react';
import {
    FileText,
    Plus,
    Edit3,
    Eye,
    Trash2,
    Search,
    Filter,
    Calendar,
    User,
    ChevronRight,
    Loader,
    CheckCircle2,
    XCircle,
    Microscope,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import clsx from 'clsx';
import LabReportViewer from '../doctor/components/LabReportViewer';

// Standard Semen Analysis Schema (Auto-Seeded)
const SEMEN_ANALYSIS_SCHEMA = {
    formId: 'SEMEN_ANALYSIS_STD',
    formName: 'Semen Analysis Report',
    formType: 'LAB_REPORT',
    schema: {
        fields: [
            { id: "sec_Coll", type: "section", label: "COLLECTION DETAILS" },
            { id: "coll_1", type: "row_2", columns: ["Sample Collection Type", "Mode of Collection"], label: "Collection Mode" },
            { id: "coll_2", type: "row_2", columns: ["Time of Collection", "Time of Examination"], label: "Timeline" },
            { id: "coll_3", type: "row_2", columns: ["Abstinence Period", "Complete Collection"], label: "Other Details" },
            { id: "sec_Macro", type: "section", label: "MACROSCOPIC EXAMINATION" },
            { id: "macro_1", type: "row_2", columns: ["Volume", "pH"], label: "Vol & pH" },
            { id: "macro_2", type: "row_2", columns: ["Appearance", "Time of Liquefaction"], label: "App & Liq" },
            { id: "macro_3", type: "text", label: "Viscosity", width: "full" },
            { id: "sec_Micro", type: "section", label: "MICROSCOPIC EXAMINATION" },
            { id: "micro_1", type: "row_2", columns: ["Sperm Concentration", "Total Motile Progressive (TMSC)"], label: "Concentration" },
            { id: "micro_2", type: "row_2", columns: ["Total Sperm Number", "Vitality"], label: "Counts" },
            { id: "micro_3", type: "row_2", columns: ["Rapid Progressive Motility(a)", "Slow Progressive Motility(b)"], label: "Motility A/B" },
            { id: "micro_4", type: "row_2", columns: ["Non-Progressive Motility(c)", "Immotile Sperm"], label: "Motility C/D" },
            { id: "micro_5", type: "row_2", columns: ["Agglutination", "Round Cells / HPF"], label: "Other Observation" },
            { id: "micro_6", type: "text", label: "Other Cells / Debris", width: "full" },
            { id: "sec_Morph", type: "section", label: "MORPHOLOGY" },
            { id: "morph_1", type: "row_2", columns: ["Normal Forms", "Abnormal Forms"], label: "Forms %" },
            { id: "morph_2", type: "row_2", columns: ["Head Abnormalities", "Midpiece Abnormalities"], label: "Structure 1" },
            { id: "morph_3", type: "row_2", columns: ["Tail Abnormalities", "Cytoplasmic Droplets"], label: "Structure 2" }
        ]
    },
    uiConfig: {
        formLocation: "LAB_INVESTIGATION",
        headerTitle: "ASCAS FERTILITY AND WOMEN'S CENTRE",
        headerSubtitle: "Department of Andrology",
        version: "6.0",
        deploymentStatus: "PUBLISHED"
    },
    description: "Standardized WHO 2021 (6th Edition) Semen Analysis Protocol.",
    workflowLocation: "LAB_INVESTIGATION",
    deploymentStatus: "PUBLISHED",
    publishedTo: ["LAB_ASSISTANT", "DOCTOR", "ADMIN"]
};

// Sample data for Semen Analysis Preview
const sampleSemenData = {
    report: {
        report_id: 'SAMPLE-REF-2024',
        test_name: 'Semen Analysis',
        performed_by_name: 'System Preview',
        status: 'TEMPLATE_VIEW'
    },
    patient: {
        patient_id_str: 'ASCAS30601',
        first_name: 'Mr K',
        last_name: 'KARTHI',
        age: 40,
        gender: 'Male'
    },
    semenAnalysis: {
        female_partner_name: 'Mrs K.m',
        female_partner_id: 'ASCAS82109',
        female_partner_age: '35',
        sample_collection_type: 'Center',
        mode_of_collection: 'Ejaculate',
        collection_time: new Date().toISOString(),
        examination_time: new Date().toISOString(),
        abstinence_period: '3 Days',
        complete_collection: 'Yes',
        volume: '1.2',
        ph: '7.3',
        appearance: 'Grey',
        viscosity: 'Normal',
        liquefaction_time: '40',
        sperm_concentration: '13',
        total_sperm_count: '13',
        tmsc: '6.24',
        vitality: '30',
        rapid_prog_motility: '20',
        slow_prog_motility: '20',
        non_progressive_motility: '20',
        immotile: '40',
        agglutination: 'Present',
        pus_cells_hpf: 'white cells/HPF',
        other_cells: 'nil',
        normal_forms: '30',
        abnormal_forms: '20',
        head_abnormalities: '10',
        midpiece_abnormalities: '20',
        tail_abnormalities: '30',
        cytoplasmic_droplets: '20'
    }
};

const FormsManagement = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [previewTemplate, setPreviewTemplate] = useState(null); // 'semen' or null
    const navigate = useNavigate();

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/forms');
            const fetchedForms = response.data;
            setForms(fetchedForms);

            // Refresh UI with latest forms
            setForms(fetchedForms);
        } catch (error) {
            console.error('Error fetching forms:', error);
        } finally {
            setTimeout(() => setLoading(false), 500); // Small artificial delay for premium feel
        }
    };

    const deleteForm = async (formId) => {
        if (!window.confirm('Are you sure you want to delete this form template? This action cannot be undone.')) return;

        try {
            await apiClient.delete(`/admin/forms/${formId}`);
            // Optimistically update UI
            setForms(prev => prev.filter(f => f.form_code !== formId));
        } catch (error) {
            console.error('Error deleting form:', error);
            alert('Failed to delete form. Please try again.');
        }
    };

    const filteredForms = forms.filter(f =>
        f.form_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.form_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-slate-50 min-h-screen animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Form Repository</h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Manage and Version Hospital documentation Templates</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/forms/designer')}
                        className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                        <Plus size={18} /> Design New Template
                    </button>
                </div>

                {/* Filters & search */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search templates by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="p-3.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-100 hover:bg-slate-100 transition shadow-sm">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="py-40 flex flex-col items-center justify-center gap-6">
                        <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Querying template database...</p>
                    </div>
                ) : filteredForms.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-300">
                        <FileText size={64} className="opacity-20 mb-6" />
                        <h3 className="text-xl font-black text-slate-400">No Templates Found</h3>
                        <p className="text-sm font-bold mt-2">Design a new form to begin building your repository.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredForms.map((form) => {
                            let rolesArr = [];
                            try {
                                const uiConfig = typeof form.ui_config === 'string' ? JSON.parse(form.ui_config || '{}') : form.ui_config || {};
                                rolesArr = uiConfig.published_to || [];
                                if (typeof rolesArr === 'string') {
                                    rolesArr = JSON.parse(rolesArr);
                                }
                            } catch (e) {
                                console.error("Error parsing roles", e);
                            }

                            let schema = { fields: [] };
                            try {
                                schema = typeof form.schema_json === 'string' ? JSON.parse(form.schema_json || '{}') : form.schema_json || {};
                            } catch (e) {
                                console.error("Schema parsing error", e);
                            }
                            const fieldsCount = schema.fields?.length || 0;
                            const isSystemTemplate = form.form_code === 'SEMEN_ANALYSIS_STD';

                            return (
                                <div key={form.form_code} className={clsx("bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-8 flex flex-col group relative overflow-hidden", isSystemTemplate ? "ring-2 ring-rose-50" : "hover:shadow-indigo-100")}>
                                    {isSystemTemplate && (
                                        <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:scale-125 transition-transform duration-700 text-rose-600">
                                            <Microscope size={120} />
                                        </div>
                                    )}
                                    {!isSystemTemplate && (
                                        <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:scale-125 transition-transform duration-700 text-indigo-600">
                                            <FileText size={120} />
                                        </div>
                                    )}


                                    <div className="flex justify-between items-start mb-6 relative">
                                        <div className={clsx("p-4 rounded-2xl shadow-sm transition-all", isSystemTemplate ? "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white")}>
                                            {isSystemTemplate ? <Microscope size={24} /> : <FileText size={24} />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {form.is_active ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                                    <CheckCircle2 size={10} /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm">
                                                    <XCircle size={10} /> Inactive
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteForm(form.form_code);
                                                }}
                                                className="p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"
                                                title="Delete Template"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 relative">
                                        <h3 className={clsx("text-xl font-black text-slate-800 leading-tight mb-2 transition-colors uppercase tracking-tight", isSystemTemplate ? "group-hover:text-rose-700" : "group-hover:text-indigo-700")}>{form.form_name}</h3>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(form.created_at).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><User size={12} /> {fieldsCount} Elements</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed h-10 mb-6">{form.description || 'No functional description provided for this template.'}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {rolesArr.map(role => (
                                            <span key={role} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-wide">
                                                {role}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                                        <button
                                            onClick={() => navigate(`/admin/forms/designer?id=${form.form_code}`)}
                                            className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                                        >
                                            <Edit3 size={14} /> Edit Design
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (isSystemTemplate) {
                                                    setPreviewTemplate('semen');
                                                } else {
                                                    navigate(`/admin/forms/designer?id=${form.form_code}&mode=report`);
                                                }
                                            }}
                                            className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            <Eye size={14} /> View Layout
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
                    <div className="relative w-full max-w-6xl max-h-full flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden">
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all shadow-md"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto h-full p-1 bg-slate-50">
                            {previewTemplate === 'semen' && (
                                <LabReportViewer
                                    report={sampleSemenData}
                                    onClose={() => setPreviewTemplate(null)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormsManagement;
