import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, ArrowLeft, Printer, AlertCircle, CheckCircle2, Eye, Heart, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import TemplateLabReportViewer from '../../components/hospital/TemplateLabReportViewer';

const SemenAnalysisForm = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [template, setTemplate] = useState(null);
    const [formFields, setFormFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [formData, setFormData] = useState({});

    // --- INITIALIZATION ---
    useEffect(() => {
        const initializeEntryForm = async () => {
            try {
                const orderResponse = await apiClient.get(`/lab/order/${orderId}`);
                const order = orderResponse.data.order;
                setOrderData(orderResponse.data);

                const formCode = order.test_code || 'SEMEN_ANALYSIS';
                const formResponse = await apiClient.get(`/shared/clinical-forms/${formCode}`);
                const fetchedTemplate = formResponse.data;
                setTemplate(fetchedTemplate);

                const schema = typeof fetchedTemplate.schema_json === 'string'
                    ? JSON.parse(fetchedTemplate.schema_json)
                    : fetchedTemplate.schema_json;

                const fields = schema.fields || [];
                setFormFields(fields);

                // Initialize formData with default values
                const initialData = {};
                fields.forEach(field => {
                    if (field.defaultValue) initialData[field.label || field.id] = field.defaultValue;
                    if (['row_2', 'grid_3', 'grid_4'].includes(field.type)) {
                        field.columns?.forEach(col => {
                            if (field.defaultValue) initialData[`${field.label}_${col}`] = field.defaultValue;
                        });
                    }
                });

                setFormData(prev => ({
                    ...initialData,
                    ...prev,
                    'Date': new Date().toLocaleDateString(),
                    'Time of Examination': new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));
            } catch (err) {
                console.error('Failed to initialize clinical entry workflow', err);
            } finally {
                setLoading(false);
            }
        };
        if (orderId) initializeEntryForm();
    }, [orderId]);

    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiClient.post('/shared/clinical-forms/submit', {
                formCode: template.form_code,
                versionId: template.version_id,
                patientId: orderData.order.patient_id,
                orderId: orderId,
                fieldValues: formData
            });

            await apiClient.post('/lab/submit-report', {
                orderId,
                reportData: formData,
                semenAnalysisData: formData
            });

            alert('Investigation Results Finalized & Synced to Case Sheet!');
            navigate('/lab/assignments');
        } catch (err) {
            console.error('Submission failed', err);
            alert('Integrity Error: Failed to commit clinical data.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Hydrating Clinical Template...</p>
        </div>
    );

    const patient = orderData?.patient || {};
    const uiConfig = template?.ui_config ? (typeof template.ui_config === 'string' ? JSON.parse(template.ui_config) : template.ui_config) : {};

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans flex flex-col items-center">
            {/* Action Bar */}
            <div className="w-full max-w-[900px] flex justify-between items-center mb-6 no-print">
                <button
                    onClick={() => navigate('/lab/assignments')}
                    className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold transition-all px-4 py-2 hover:bg-rose-50 rounded-xl"
                >
                    <ArrowLeft size={18} /> Exit Order
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                    >
                        <Eye size={16} /> Live Report Preview
                    </button>
                </div>
            </div>

            {/* Document-Style Form */}
            <div className="w-full max-w-[900px] bg-white shadow-2xl rounded-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none mb-12">

                {/* Formal Medical Header (Matches Admin Designer) */}
                <div className="p-10 border-b-2 border-slate-900 bg-white">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-6 items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 shadow-sm overflow-hidden text-rose-500">
                                <Heart className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                                    {uiConfig.headerTitle || "ASCAS FERTILITY AND WOMEN'S CENTRE"}
                                </h1>
                                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">
                                    {uiConfig.headerSubtitle || "Department of Andrology"}
                                </p>
                                <div className="flex flex-col text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                                    <span>{uiConfig.headerContact || "Unit-09 Quantum Block, Digital Medical District"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    {/* Document Title */}
                    <div className="text-center relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-8 text-sm font-black uppercase tracking-[0.4em] text-slate-900 border-x-2 border-slate-900">
                                {template?.form_name || "Clinical Report Entry"}
                            </span>
                        </div>
                    </div>

                    {/* Patient Summary Block (System-Driven Only) */}
                    <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-white p-6 space-y-2">
                            <ClinicalRow label="Patient ID" value={patient.patient_id_str || patient.id} />
                            <ClinicalRow label="Patient Name" value={`${patient.first_name || ''} ${patient.last_name || ''}`} />
                            <ClinicalRow label="Gender" value={patient.gender} />
                            <ClinicalRow label="Age" value={patient.age} />
                        </div>
                        <div className="bg-white p-6 space-y-2">
                            <ClinicalRow label="Order ID" value={orderId} />
                            <ClinicalRow label="Test Code" value={template?.form_code} />
                            <ClinicalRow label="Version" value={`v${template?.version_id}`} />
                            <ClinicalRow label="Status" value="IN_PROGRESS" />
                        </div>
                    </div>

                    {/* Dynamic Sections */}
                    <div className="space-y-12">
                        {formFields.map((field) => {
                            if (field.type === 'section') {
                                return <ClinicalSection key={field.id} title={field.label} />;
                            }

                            if (field.type === 'info') {
                                return (
                                    <div key={field.id} className="px-4 py-3 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
                                        <p className="text-[10px] text-indigo-700 italic font-medium leading-relaxed">{field.label}</p>
                                    </div>
                                );
                            }

                            if (['row_2', 'grid_3', 'grid_4'].includes(field.type)) {
                                const cols = field.type === 'row_2' ? 2 : field.type === 'grid_3' ? 3 : 4;
                                return (
                                    <div key={field.id} className={`grid grid-cols-${cols} gap-x-12 gap-y-6 px-4`}>
                                        {field.columns?.map(col => (
                                            <div key={col}>
                                                <ClinicalInputRow
                                                    label={col}
                                                    value={formData[`${field.label}_${col}`] || formData[col]}
                                                    onChange={(v) => handleInputChange(`${field.label}_${col}`, v)}
                                                    suffix={field.unit}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            }

                            if (field.type === 'signature') return null;

                            return (
                                <div key={field.id} className="px-4">
                                    <ClinicalInputRow
                                        label={field.label}
                                        value={formData[field.label] || formData[field.id]}
                                        onChange={(v) => handleInputChange(field.label, v)}
                                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                        suffix={field.unit}
                                        width={field.width}
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-12 border-t border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Validated</span>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-12 py-4 bg-slate-900 text-white font-black rounded-xl shadow-2xl hover:bg-black transition-all flex items-center gap-3 uppercase text-[11px] tracking-[0.2em] active:scale-95 disabled:opacity-50"
                        >
                            {submitting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : <Save size={18} />}
                            {submitting ? 'Committing...' : 'Finalize & Submit Report'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-slate-900/90 backdrop-blur-xl">
                    <div className="w-full max-w-6xl max-h-full overflow-y-auto bg-white rounded-xl relative">
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full z-10 text-slate-400 hover:text-rose-500"
                        >
                            <X size={24} />
                        </button>
                        <TemplateLabReportViewer
                            onClose={() => setShowPreview(false)}
                            report={{
                                report: {
                                    report_id: 'PREVIEW',
                                    test_name: template?.form_name || 'Clinical Report',
                                    test_code: template?.form_code,
                                    status: 'DRAFT'
                                },
                                report_data: formData,
                                patient: patient
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Designer-Style Components ---

const ClinicalSection = ({ title }) => (
    <div className="flex items-center gap-4 bg-slate-900 rounded-lg p-2 pr-4 mt-8">
        <div className="bg-white/10 w-2 h-6 rounded-full ml-1" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex-1">{title}</h3>
        <ClipboardCheck className="text-white/20 w-4 h-4" />
    </div>
);

const ClinicalRow = ({ label, value }) => (
    <div className="flex justify-between items-center text-[11px]">
        <span className="font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="font-black text-slate-900">: {value || "---"}</span>
    </div>
);

const ClinicalInputRow = ({ label, value, onChange, placeholder, type = 'text', suffix = '', width }) => {
    return (
        <div className="flex flex-col gap-1 py-1 group">
            <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0 w-32">{label}</label>
                <div className="flex-1 border-b border-slate-100 group-focus-within:border-indigo-500 transition-all flex items-center">
                    <input
                        type={type}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || "---"}
                        className="bg-transparent w-full outline-none py-1 text-[11px] font-black text-slate-900 placeholder:font-normal placeholder:text-slate-200"
                    />
                    {suffix && <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mb-1 ml-1">{suffix}</span>}
                </div>
            </div>
        </div>
    );
};

export default SemenAnalysisForm;

