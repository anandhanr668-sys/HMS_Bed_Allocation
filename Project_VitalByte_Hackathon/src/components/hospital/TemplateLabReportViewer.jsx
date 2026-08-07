import React, { useState, useEffect } from 'react';
import { Microscope, Activity, Droplets, Target, User, Clock, FileText, Printer, X, Heart, Edit, Save, CheckCircle, Trash2, Plus } from 'lucide-react';
import apiClient from '../../api/apiClient';
import clsx from 'clsx';

const TemplateLabReportViewer = ({
    logo,
    title,
    subtitle,
    contact,
    reportName,
    patient,
    fields = [],
    data = {},
    report, // Support consolidated report object
    isDesigner = false,
    onFieldSelect,
    onDeleteField,
    onInsertRequest,
    onClose
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [fetchedFields, setFetchedFields] = useState(fields || []);
    const [formData, setFormData] = useState(data || {});
    const [templateConfig, setTemplateConfig] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initial Hydration from report object if provided
    useEffect(() => {
        if (report) {
            const reportObj = report.report || report;
            const analysisData = report.semenAnalysis || report.report_data || report.field_values || reportObj.report_data || {};
            const patientObj = report.patient || patient;

            setFormData({
                "Patient Name": `${patientObj?.first_name || ''} ${patientObj?.last_name || ''}`,
                "Patient ID": patientObj?.patient_id_str || patientObj?.id || '',
                "Age / Gender": `${patientObj?.age || ''} / ${patientObj?.gender || ''}`,
                "Date": new Date(reportObj.submitted_at || reportObj.completed_at || Date.now()).toLocaleDateString(),
                ...analysisData
            });

            // If no fields provided, try to fetch schema using test_code/form_code
            if (fetchedFields.length === 0 || fetchedFields === fields) {
                const formCode = reportObj.test_code || 'SEMEN_ANALYSIS';
                fetchSchema(formCode);
            }
        } else {
            // Direct props mode
            const patientData = patient ? {
                "Patient Name": `${patient.first_name || ''} ${patient.last_name || ''}`,
                "Patient ID": patient.patient_id_str || '',
                "Age / Gender": `${patient.age || ''} / ${patient.gender || ''}`,
                "Date": new Date().toLocaleDateString()
            } : {};

            setFormData({
                ...patientData,
                ...data
            });
            setFetchedFields(fields);
        }
    }, [report, data, patient, fields]);

    const fetchSchema = async (code) => {
        if (!code) return;
        setLoading(true);
        try {
            const response = await apiClient.get(`/shared/clinical-forms/${code}`);
            if (response.data) {
                const template = response.data;
                setTemplateConfig(template);
                const schema = typeof template.schema_json === 'string' ? JSON.parse(template.schema_json) : template.schema_json;
                setFetchedFields(schema.fields || []);
            }
        } catch (err) {
            console.error("Failed to fetch clinical template for report viewer", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const getGroupedFields = () => {
        const groups = [];
        let currentGroup = { id: 'default', label: '', fields: [], type: 'default' };

        fetchedFields.forEach(field => {
            if (field.type === 'section') {
                if (currentGroup.fields.length > 0) {
                    groups.push(currentGroup);
                }
                currentGroup = { ...field, fields: [] };
            } else {
                currentGroup.fields.push(field);
            }
        });

        if (currentGroup.fields.length > 0 || currentGroup.type === 'section') {
            groups.push(currentGroup);
        }
        return groups;
    };

    const sections = getGroupedFields();

    if (loading) return (
        <div className="bg-slate-900/50 backdrop-blur-md p-20 flex flex-col items-center justify-center rounded-3xl border border-white/10">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-white font-black text-xs uppercase tracking-[0.3em]">Synchronizing Clinical Layout...</p>
        </div>
    );

    const uiConfig = templateConfig?.ui_config ? (typeof templateConfig.ui_config === 'string' ? JSON.parse(templateConfig.ui_config) : templateConfig.ui_config) : {};

    return (
        <div className="bg-white shadow-2xl overflow-hidden flex flex-col min-h-[297mm] w-full max-w-[210mm] mx-auto font-sans text-slate-900 border border-slate-200 print:shadow-none print:border-0 print:m-0">
            {/* Professional Medical Header */}
            <div className="p-10 border-b-2 border-slate-900 bg-white no-print">
                <div className="flex justify-between items-start">
                    <div
                        className={clsx("flex gap-6 items-center", isDesigner && "cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition-all border border-transparent hover:border-indigo-100 hover:shadow-sm")}
                        onClick={() => isDesigner && onFieldSelect && onFieldSelect('header-settings')}
                    >
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 shadow-sm overflow-hidden text-rose-500">
                            {logo || uiConfig.headerLogo ? (
                                <img src={logo || uiConfig.headerLogo} alt="Hospital Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Heart className="w-10 h-10" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                                {uiConfig.headerTitle || title || "MediBed Medical Center"}
                            </h1>
                            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">
                                {uiConfig.headerSubtitle || subtitle || "Diagnostic & Laboratory Division"}
                            </p>
                            <div className="flex flex-col text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                                <span>{uiConfig.headerContact || contact || "Unit-09 Quantum Block, Digital Medical District"}</span>
                            </div>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                            <X size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Print-only Header (Duplicate for static layout) */}
            <div className="hidden print:block p-10 border-b-2 border-slate-900">
                <div className="flex justify-between items-center">
                    <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 bg-slate-50 flex items-center justify-center border border-slate-200">
                            {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" /> : <Activity className="text-blue-600" />}
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900">{uiConfig.headerTitle || title}</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{uiConfig.headerSubtitle || subtitle}</p>
                            <p className="text-[9px] text-slate-400 uppercase">{uiConfig.headerContact || contact}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-10 space-y-8 bg-white print:p-8">
                {/* Report Title */}
                <div className="text-center relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div
                        className={clsx("relative flex justify-center", isDesigner && "cursor-pointer group")}
                        onClick={() => isDesigner && onFieldSelect && onFieldSelect('meta-settings')}
                    >
                        <span className={clsx(
                            "bg-white px-8 text-lg font-black uppercase tracking-[0.4em] text-slate-900 border-x-2 border-slate-900 transition-all",
                            isDesigner && "group-hover:text-indigo-600 group-hover:bg-slate-50 group-hover:px-12 rounded-lg"
                        )}>
                            {templateConfig?.form_name || reportName || formData.reportName || "Clinical Report"}
                        </span>
                    </div>
                </div>

                {/* Patient Summary Block - Enhanced for Fertility reports */}
                <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-white p-6 space-y-2">
                        <PatientInfoRow label="Patient ID" value={formData["Patient ID"] || formData["patient_id"] || patient?.patient_id_str} />
                        <PatientInfoRow label="Patient Name" value={formData["Patient Name"] || formData["patient_name"] || `${patient?.first_name || ''} ${patient?.last_name || ''}`} />
                        <PatientInfoRow label="Gender" value={formData["Gender"] || formData["gender"] || patient?.gender} />
                        <PatientInfoRow label="Age" value={formData["Age"] || formData["age"] || patient?.age} />
                    </div>
                    <div className="bg-white p-6 space-y-2">
                        <PatientInfoRow label="Partner ID" value={formData["Female Partner ID"] || formData["Partner ID"] || '---'} />
                        <PatientInfoRow label="Partner Name" value={formData["Female Partner Name"] || formData["Partner Name"] || '---'} />
                        <PatientInfoRow label="Partner Gender" value={formData["Female Gender"] || '---'} />
                        <PatientInfoRow label="Partner Age" value={formData["Female Age"] || '---'} />
                    </div>
                </div>

                {/* Content Sections */}
                {sections.map((section, sIdx) => {
                    // Logic to handle "Display Only" sections (like WHO Reference Values)
                    if (section.displayOnly && section.content?.type === 'table') {
                        return (
                            <div key={section.id || sIdx} className="space-y-4">
                                <div className="flex items-center gap-4 bg-slate-100 rounded-lg p-2 pr-4 border border-slate-200">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex-1 ml-2">
                                        {section.title || section.label}
                                    </h3>
                                    <Target className="text-slate-400 w-4 h-4" />
                                </div>
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-[10px] border-collapse bg-white">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="px-6 py-2 text-left font-black text-slate-500 uppercase">Parameter</th>
                                                <th className="px-6 py-2 text-right font-black text-slate-500 uppercase">WHO 2021 Reference Limit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {(section.content.data || []).map((row, rIdx) => (
                                                <tr key={rIdx} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-2 font-bold text-slate-700">{row.parameter}</td>
                                                    <td className="px-6 py-2 text-right font-black text-indigo-600">{row.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={section.id || sIdx} className="space-y-4">
                            {/* Section Header */}
                            {(section.type === 'section' || section.title) && (
                                <div className="relative group/section">
                                    {isDesigner && (
                                        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/section:opacity-100 transition-all no-print">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteField && onDeleteField(section.id); }}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg shadow-sm bg-white border border-slate-100"
                                                title="Remove Section"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <div
                                        className={clsx(
                                            "flex items-center gap-4 bg-slate-900 rounded-lg p-2 pr-4 transition-all",
                                            isDesigner && "cursor-pointer hover:bg-slate-800 ring-offset-2 hover:ring-2 hover:ring-indigo-500/50"
                                        )}
                                        onClick={() => isDesigner && onFieldSelect && onFieldSelect(section.id)}
                                    >
                                        <div className="bg-white/10 w-2 h-6 rounded-full ml-1" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex-1">
                                            {section.label || section.title}
                                        </h3>
                                        <FileText className="text-white/20 w-4 h-4" />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-12 gap-x-8 gap-y-3 px-2">
                                {isDesigner && section.fields.length > 0 && (
                                    <div className="col-span-12">
                                        <InsertionPoint onInsert={() => {
                                            const firstIdx = fetchedFields.findIndex(f => f.id === section.fields[0].id);
                                            onInsertRequest && onInsertRequest(firstIdx - 1);
                                        }} />
                                    </div>
                                )}
                                {section.fields.map(field => {
                                    // Calculate Grid Span based on width property
                                    const spanClass = field.width === 'half' ? 'col-span-6' :
                                        field.width === 'third' ? 'col-span-4' :
                                            field.width === 'quarter' ? 'col-span-3' : 'col-span-12';

                                    // Specialized Rendering
                                    if (field.type === 'info') return (
                                        <div key={field.id} className="col-span-12 bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-500 text-[10px] text-slate-600 italic font-medium">
                                            {field.label}
                                        </div>
                                    );

                                    if (['row_2', 'grid_3', 'grid_4'].includes(field.type)) {
                                        const cols = field.type === 'row_2' ? 2 : field.type === 'grid_3' ? 3 : 4;
                                        return (
                                            <div
                                                key={field.id}
                                                className={clsx(
                                                    "col-span-12 space-y-2 pt-2 pb-1 border-b border-slate-100 last:border-0 transition-all rounded-lg px-2 relative group/grid",
                                                    isDesigner && "cursor-pointer hover:bg-slate-50 border-l-2 border-l-transparent hover:border-l-indigo-500"
                                                )}
                                                onClick={() => isDesigner && onFieldSelect && onFieldSelect(field.id)}
                                            >
                                                {isDesigner && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDeleteField && onDeleteField(field.id); }}
                                                        className="absolute -left-10 top-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover/grid:opacity-100 transition-all no-print"
                                                        title="Remove Grid"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                                {field.label && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">{field.label}</p>}
                                                <div className={`grid grid-cols-${cols} gap-6`}>
                                                    {field.columns.map((col, idx) => {
                                                        const key = `${field.label}_${col}`;
                                                        const val = formData[key] || formData[col];
                                                        return (
                                                            <div key={idx} className="flex justify-between items-end pb-1 border-b border-dotted border-slate-200">
                                                                <span className="text-[10px] font-bold text-slate-500">{col}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[11px] font-black text-slate-900">{val || '---'}</span>
                                                                    {field.unit && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{field.unit}</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (field.type === 'signature') return null;

                                    return (
                                        <div key={field.id} className={clsx(spanClass, "relative group/field")}>
                                            {isDesigner && (
                                                <InsertionPoint onInsert={() => onInsertRequest && onInsertRequest(fetchedFields.findIndex(f => f.id === field.id))} />
                                            )}
                                            <DataRow
                                                label={field.label}
                                                value={formData[field.label] || formData[field.id]}
                                                unit={field.unit}
                                                reference={field.reference || field.validation?.warning}
                                                isEditing={isEditing}
                                                onChange={(v) => handleChange(field.label || field.id, v)}
                                                isDesigner={isDesigner}
                                                onEdit={() => onFieldSelect && onFieldSelect(field.id)}
                                                onDelete={() => onDeleteField && onDeleteField(field.id)}
                                            />
                                        </div>
                                    );
                                })}
                                {isDesigner && (
                                    <div className="col-span-12">
                                        <InsertionPoint onInsert={() => {
                                            const lastField = section.fields[section.fields.length - 1];
                                            const lastIdx = lastField ? fetchedFields.findIndex(f => f.id === lastField.id) : fetchedFields.findIndex(f => f.id === section.id);
                                            onInsertRequest && onInsertRequest(lastIdx);
                                        }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Signatures Section */}
                {fetchedFields.some(f => f.type === 'signature') && (
                    <div className="pt-20 flex justify-end gap-24 no-break">
                        {fetchedFields.filter(f => f.type === 'signature').map((sig, i) => (
                            <div key={i} className="text-center w-48">
                                <div className="h-1 bg-slate-900 w-full mb-2"></div>
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{sig.label || "Authorized Signatory"}</p>
                                <p className="text-[8px] font-bold text-slate-400 italic">MediBed Digital Verified</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Disclaimer */}
                <div className="pt-8 border-t border-slate-100 mt-auto text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">*** End of Report - System Generated v{templateConfig?.version_id || '1.0'} on {new Date().toLocaleString()} ***</p>
                </div>
            </div>

        </div >
    );
};

const InsertionPoint = ({ onInsert }) => (
    <div className="group/insert h-6 -my-3 relative flex items-center justify-center opacity-0 hover:opacity-100 transition-all z-10 no-print cursor-pointer" onClick={onInsert}>
        <div className="absolute inset-x-0 h-[1px] bg-indigo-200 group-hover/insert:bg-indigo-400"></div>
        <div className="relative bg-indigo-600 text-white p-1 rounded-full shadow-lg transform scale-50 group-hover/insert:scale-100 transition-transform">
            <Plus size={12} />
        </div>
    </div>
);

const PatientInfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center text-[11px]">
        <span className="font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="font-black text-slate-900">: {value || "---"}</span>
    </div>
);

const DataRow = ({ label, value, unit, reference, isEditing, onChange, isDesigner, onEdit, onDelete }) => (
    <div
        className={clsx(
            "flex items-end gap-3 pb-1 border-b border-slate-100 group/row min-h-[32px] transition-all relative",
            isDesigner && !isEditing && "cursor-pointer hover:bg-slate-50 hover-border-indigo-100 rounded px-1"
        )}
        onClick={() => isDesigner && !isEditing && onEdit && onEdit()}
    >
        {isDesigner && !isEditing && (
            <button
                onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}
                className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover/row:opacity-100 transition-all no-print"
                title="Remove Field"
            >
                <Trash2 size={12} />
            </button>
        )}
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight w-40 shrink-0 mb-1">{label}</span>
        <div className="flex-1 flex items-end justify-between">
            <div className="flex items-center gap-2 flex-1">
                {isEditing ? (
                    <input
                        className="bg-slate-50 w-full border-b-2 border-indigo-500 outline-none px-2 py-1 text-[11px] font-black"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                    />
                ) : (
                    <span className="text-[12px] font-black text-slate-900 mb-0.5">{value || '---'}</span>
                )}
                {unit && <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter shrink-0 mb-1">{unit}</span>}
            </div>
            {reference && !isEditing && (
                <div className="flex items-center gap-2 bg-slate-50 px-2 py-0.5 rounded ml-4 border border-slate-100 shrink-0">
                    <span className="text-[7px] font-black text-slate-300 uppercase">REF:</span>
                    <span className="text-[9px] font-bold text-slate-500 tracking-tighter">{reference}</span>
                </div>
            )}
        </div>
    </div>
);

export default TemplateLabReportViewer;
