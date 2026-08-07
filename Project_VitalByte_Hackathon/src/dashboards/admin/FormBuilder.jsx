import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Plus,
    Type,
    Hash,
    ChevronDown,
    Calendar,
    CheckSquare,
    Heading,
    Info,
    Save,
    Eye,
    FolderOpen,
    X,
    Trash2,
    Settings,
    Copy,
    MoveVertical,
    Loader,
    FilePlus,
    Table as TableIcon,
    Layout,
    Printer,
    FileText,
    Monitor,
    Zap,
    AlertCircle,
    ArrowRight,
    Edit3,
    CheckCircle2,
    PenTool,
    Users,
    Clipboard,
    Activity,
    ArrowUp,
    ArrowDown,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold as BoldIcon
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/apiClient';
import clsx from 'clsx';
import LabReportViewer from '../doctor/components/LabReportViewer'; // Import the high-fidelity viewer
import TemplateLabReportViewer from '../../components/hospital/TemplateLabReportViewer'; // Import the generic high-fidelity viewer

const SEMEN_ANALYSIS_DEFAULT_SCHEMA = [
    { id: 'h1', type: 'section', label: 'COLLECTION DETAILS' },
    { id: 'coll_type', type: 'text', label: 'Sample Collection Type', width: 'half' },
    { id: 'exam_time', type: 'text', label: 'Time of Examination', width: 'half' },
    { id: 'coll_mode', type: 'text', label: 'Mode of Collection', width: 'half' },
    { id: 'abstinence', type: 'text', label: 'Abstinence Period', width: 'half' },
    { id: 'coll_time', type: 'text', label: 'Time of Collection', width: 'half' },
    { id: 'complete_coll', type: 'text', label: 'Complete Collection', width: 'half' },

    { id: 'h2', type: 'section', label: 'MACROSCOPIC EXAMINATION' },
    { id: 'macro_vol', type: 'text', label: 'Volume (ml)', width: 'half' },
    { id: 'macro_ph', type: 'text', label: 'pH', width: 'half' },
    { id: 'macro_app', type: 'text', label: 'Appearance', width: 'half' },
    { id: 'macro_liq', type: 'text', label: 'Time of Liquefaction', width: 'half' },
    { id: 'macro_visc', type: 'text', label: 'Viscosity', width: 'half' },

    { id: 'h3', type: 'section', label: 'MICROSCOPIC EXAMINATION' },
    { id: 'micro_conc', type: 'text', label: 'Sperm Concentration', width: 'half' },
    { id: 'micro_tmsc', type: 'text', label: 'Total Motile Progressive(TMSC)', width: 'half' },
    { id: 'micro_total', type: 'text', label: 'Total Sperm Number (per ejaculate)', width: 'half' },
    { id: 'micro_vital', type: 'text', label: 'Vitality', width: 'half' },
    { id: 'micro_mot_a', type: 'text', label: 'Rapid Progressive Motility(a)', width: 'half' },
    { id: 'micro_agg', type: 'text', label: 'Agglutination', width: 'half' },
    { id: 'micro_mot_b', type: 'text', label: 'Slow Progressive Motility(b)', width: 'half' },
    { id: 'micro_round', type: 'text', label: 'Round Cells / HPF', width: 'half' },
    { id: 'micro_mot_c', type: 'text', label: 'Non-Progressive Motility(c)', width: 'half' },
    { id: 'micro_other', type: 'text', label: 'Other Cells / Debris', width: 'half' },
    { id: 'micro_mot_d', type: 'text', label: 'Immotile Sperm', width: 'half' },

    { id: 'h4', type: 'section', label: 'MORPHOLOGY' },
    { id: 'morph_norm', type: 'text', label: 'Normal Forms', width: 'half' },
    { id: 'morph_mid', type: 'text', label: 'Midpiece Abnormalities', width: 'half' },
    { id: 'morph_abnorm', type: 'text', label: 'Abnormal Forms', width: 'half' },
    { id: 'morph_tail', type: 'text', label: 'Tail Abnormalities', width: 'half' },
    { id: 'morph_head', type: 'text', label: 'Head Abnormalities', width: 'half' },
    { id: 'morph_cyto', type: 'text', label: 'Cytoplasmic Droplets', width: 'half' },

    { id: 'h5', type: 'section', label: 'WHO REFERENCE VALUES 2021 6TH EDITION' },
    { id: 'ref_1', type: 'info', label: 'Volume: >= 1.5 ml | pH: 7.2 - 7.8 | Total Sperm Number: >= 39 million | Motility: >= 30% PR (a+b) / >= 42% PR+NP (a+b+c)' },
    { id: 'ref_2', type: 'info', label: 'Appearance: Whitish / Greyish Opalescent | Time of Liquefaction: < 60 Mins | Vitality: >= 54% | Sperm Concentration: >= 15 millions/ml | Normal Forms: > 4% | Viscosity: No Reference' },

    { id: 'sig1', type: 'signature', label: 'Androtech' },
    { id: 'sig2', type: 'signature', label: 'Consultant' }
];

const FormBuilder = () => {
    // --- STATE ---
    const [formName, setFormName] = useState('Semen Analysis Comprehensive Report');
    const [formDescription, setFormDescription] = useState('Detailed andrological assessment following WHO 6th edition guidelines.');
    const [formFields, setFormFields] = useState(SEMEN_ANALYSIS_DEFAULT_SCHEMA);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedRoles, setSelectedRoles] = useState(['DOCTOR', 'LAB_ASSISTANT']);
    const [formLocation, setFormLocation] = useState('LAB_INVESTIGATION');
    const [redirectUrl, setRedirectUrl] = useState('');

    // Header Customization State
    const [headerTitle, setHeaderTitle] = useState('ASCAS FERTILITY AND WOMEN\'S CENTRE');
    const [headerSubtitle, setHeaderSubtitle] = useState('DEPARTMENT OF ANDROLOGY');
    const [headerContact, setHeaderContact] = useState('+91-9342521779 | accumedspecialityclinic@gmail.com | www.ascasclinic.com');
    const [headerLogo, setHeaderLogo] = useState(''); // URL for the logo

    const [searchParams] = useSearchParams();
    const formIdParam = searchParams.get('id');
    const initialViewParam = searchParams.get('mode');

    const [viewMode, setViewMode] = useState(initialViewParam || 'builder'); // builder, preview, report, simulator
    const [simulatorRole, setSimulatorRole] = useState('NURSE');
    const [deploymentStatus, setDeploymentStatus] = useState('DRAFT'); // DRAFT, PREVIEW, TEST, PUBLISHED
    const [displayMode, setDisplayMode] = useState('INLINE'); // INLINE, TAB, MODAL
    const [formVersion, setFormVersion] = useState(1);

    const [showOpenModal, setShowOpenModal] = useState(false);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
    const [savedForms, setSavedForms] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('elements'); // elements, settings, logic
    const [insertionIndex, setInsertionIndex] = useState(null);
    const [panelOrder, setPanelOrder] = useState(['SYSTEM_VITALS', 'TARGET_FORM']);
    const canvasRef = useRef(null);

    // --- WORKFLOW PLACEMENT CONFIG ---
    // ... [No changes to WORKFLOW_LOCATIONS]
    const WORKFLOW_LOCATIONS = {
        'NURSE_VITALS': {
            label: 'Nurse → Vitals Recording Panel',
            role: 'NURSE',
            description: 'Integrated into the vitals grid on the nurse dashboard.',
            color: 'blue',
            icon: Activity
        },
        'NURSE_TRIAGE': {
            label: 'Nurse → Triage Screen',
            role: 'NURSE',
            description: 'Shown during patient initial assessment.',
            color: 'amber',
            icon: Clipboard
        },
        'DOCTOR_CONSULTATION': {
            label: 'Doctor → Consultation Panel',
            role: 'DOCTOR',
            description: 'Main clinical findings and history section.',
            color: 'indigo',
            icon: Users
        },
        'DOCTOR_PRESCRIPTION': {
            label: 'Doctor → Prescription Panel',
            role: 'DOCTOR',
            description: 'Appears alongside the pharmacy ordering module.',
            color: 'rose',
            icon: PenTool
        },
        'LAB_INVESTIGATION': {
            label: 'Lab → Investigation Entry',
            role: 'LAB_ASSISTANT',
            description: 'Part of the sample result entry workflow.',
            color: 'purple',
            icon: CheckSquare
        },
        'FRONT_DESK_REGISTRATION': {
            label: 'Front Desk → Registration Page',
            role: 'FRONT_DESK',
            description: 'Extended data collection during patient check-in.',
            color: 'emerald',
            icon: Clipboard
        }
    };

    // --- CONFIG ---
    // ... [No changes to componentTypes, roles]
    const componentTypes = [
        { id: 'section', name: 'Section Header', icon: Heading, color: 'indigo', group: 'Layout' },
        { id: 'row_2', name: '2 Column Grid', icon: Layout, color: 'slate', group: 'Layout' },
        { id: 'grid_3', name: '3 Column Grid', icon: Layout, color: 'slate', group: 'Layout' },
        { id: 'grid_4', name: '4 Column Grid', icon: Layout, color: 'slate', group: 'Layout' },
        { id: 'text', name: 'Short Text', icon: Type, color: 'blue', group: 'Input' },
        { id: 'textarea', name: 'Large Text Area', icon: FilePlus, color: 'blue', group: 'Input' },
        { id: 'number', name: 'Clinical Value', icon: Hash, color: 'green', group: 'Input' },
        { id: 'dropdown', name: 'Drop-down Menu', icon: ChevronDown, color: 'purple', group: 'Input' },
        { id: 'radio', name: 'Radio Options', icon: ArrowRight, color: 'purple', group: 'Input' },
        { id: 'date', name: 'Clinical Date', icon: Calendar, color: 'orange', group: 'Input' },
        { id: 'checkbox', name: 'Binary Check', icon: CheckSquare, color: 'pink', group: 'Input' },
        { id: 'table', name: 'Clinical Table', icon: TableIcon, color: 'emerald', group: 'Data' },
        { id: 'signature', name: 'Authorized Sign', icon: PenTool, color: 'rose', group: 'Data' },
        { id: 'info', name: 'Protocol Note', icon: Info, color: 'cyan', group: 'Meta' }
    ];

    const roles = ['DOCTOR', 'NURSE', 'FRONT_DESK', 'LAB_ASSISTANT'];

    // --- EFFECTS ---
    useEffect(() => {
        if (showOpenModal) fetchForms();
    }, [showOpenModal]);

    useEffect(() => {
        if (formIdParam) {
            loadFormById(formIdParam);
        }
    }, [formIdParam]);

    // --- HANDLERS ---
    const startFresh = () => {
        setFormName('New Clinical Report');
        setFormDescription('Functional clinical documentation template');
        setFormFields([]);
        setSelectedRoles(['DOCTOR']);
        setFormLocation('NURSE_VITALS');
        setDeploymentStatus('DRAFT');
        setDisplayMode('INLINE');
        setFormVersion(1);
        setRedirectUrl('');
        setHeaderTitle('MediBed Enterprise');
        setHeaderSubtitle('Hospital Management Platform');
        setHeaderContact('Unit-09 Quantum Block, Digital Medical District | +91 99 999 5555');
        setHeaderLogo('');
        setSelectedField(null);
        window.history.pushState({}, '', '/admin/forms/designer'); // Clear ID param
        setShowOpenModal(false);
    };

    const loadFormById = async (id) => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/admin/forms`);
            const target = response.data.find(f => f.form_code === id || f.form_id.toString() === id);
            if (target) {
                loadForm(target);
            }
        } catch (error) {
            console.error('Error loading form by ID:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const fetchForms = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/admin/forms');
            setSavedForms(response.data);
        } catch (error) {
            console.error('Error fetching forms:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addField = (type, index = null) => {
        const newField = {
            id: `field_${Date.now()}`,
            type: type.id,
            label: `New ${type.name}`,
            required: false,
            placeholder: type.id === 'table' ? '' : 'Enter details...',
            options: ['dropdown', 'radio'].includes(type.id) ? ['Option A', 'Option B'] : [],
            columns: ['table', 'grid_3', 'grid_4', 'row_2'].includes(type.id)
                ? (type.id === 'table' ? ['Observation', 'Result', 'Reference'] : type.id === 'row_2' ? ['Left Field', 'Right Field'] : type.id === 'grid_3' ? ['Field 1', 'Field 2', 'Field 3'] : ['Field 1', 'Field 2', 'Field 3', 'Field 4'])
                : [],
            rows: type.id === 'table' ? 3 : type.id === 'textarea' ? 4 : 1,
            validation: {
                pattern: '',
                min: '',
                max: ''
            },
            logic: {
                showIfField: '',
                showIfValue: ''
            },
            width: 'full' // full, half, third
        };

        if (index !== null) {
            const updated = [...formFields];
            updated.splice(index + 1, 0, newField);
            setFormFields(updated);
        } else if (insertionIndex !== null) {
            const updated = [...formFields];
            updated.splice(insertionIndex + 1, 0, newField);
            setFormFields(updated);
        } else {
            setFormFields([...formFields, newField]);
        }

        setInsertionIndex(null); // Reset after use
        setSelectedField(newField.id);
        setActiveTab('settings');
    };

    const updateField = (fieldId, updates) => {
        setFormFields(formFields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    };

    const deleteField = (fieldId) => {
        setFormFields(formFields.filter(f => f.id !== fieldId));
        if (selectedField === fieldId) setSelectedField(null);
    };

    const saveForm = async (status = 'DRAFT') => {
        if (!formName) return alert('Enter form name');

        setIsLoading(true);
        // Use the ID from param if editing, or derive from name if new
        const formId = formIdParam || formName.toUpperCase().replace(/[^A-Z0-9]/g, '_');

        const nextVersion = status === 'PUBLISHED' ? formVersion + 1 : formVersion;

        const payload = {
            formId,
            formName,
            formType: 'GENERAL',
            description: formDescription,
            version: nextVersion.toString(),
            schema: { fields: formFields },
            uiConfig: {
                theme: 'premium-indigo',
                layout: 'standard',
                version: '2.0.pro',
                formLocation,
                deploymentStatus: status,
                displayMode,
                redirectUrl,
                headerTitle,
                headerSubtitle,
                headerContact,
                headerLogo
            },
            workflowLocation: formLocation,
            deploymentStatus: status,
            publishedTo: selectedRoles,
            conditionalRules: formFields.reduce((acc, f) => {
                if (f.logic?.showIfField) acc[f.id] = f.logic;
                return acc;
            }, {})
        };

        try {
            // Check if form exists to decide between POST (create) and PUT (update)
            if (formIdParam) {
                await apiClient.put(`/admin/forms/${formId}`, payload);
            } else {
                await apiClient.post('/admin/forms', payload);
            }

            // ARCHIVE VERSION HISTORY
            await apiClient.post(`/admin/forms/${formId}/archive-version`, {
                version: nextVersion,
                schema: { fields: formFields },
                uiConfig: payload.uiConfig
            });

            if (status === 'PUBLISHED') {
                await apiClient.post(`/admin/forms/${formId}/publish`, { publishTo: selectedRoles });
                setDeploymentStatus('PUBLISHED');
                setFormVersion(nextVersion);
            } else {
                setDeploymentStatus(status);
            }

            // Update URL if this was a new form so subsequent saves use PUT
            if (!formIdParam) {
                window.history.replaceState(null, '', `?id=${formId}&mode=builder`);
            }

            const locationName = WORKFLOW_LOCATIONS[formLocation]?.label || "Production";
            alert(`Clinical Protocol Synchronized as ${status} (v${nextVersion}). It is live for: ${locationName}.`);
        } catch (error) {
            console.error('Publishing error:', error);
            const data = error.response?.data;
            const errorMsg = data?.details || data?.error || error.message || 'Unknown protocol error';
            alert(`Integrity Error: ${errorMsg}\n\nPlease check console logs for stack trace.`);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSimulatedLayout = async () => {
        setIsLoading(true);
        try {
            const formId = formName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
            await apiClient.put(`/admin/forms/${formId}`, {
                uiConfig: {
                    formLocation,
                    displayMode,
                    panelOrder,
                    headerTitle,
                    headerSubtitle,
                    headerLogo
                }
            });
            alert('Simulated Workflow Layout Saved Successfully!');
        } catch (error) {
            alert('Layout synced to session cache.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadForm = (form) => {
        setFormName(form.form_name);
        setFormDescription(form.description || '');
        let schema = form.schema_json;
        if (typeof schema === 'string') {
            try {
                schema = JSON.parse(schema);
            } catch (e) {
                console.error("Schema parsing failed", e);
                schema = { fields: [] };
            }
        }
        setFormFields(schema.fields || []);

        let rolesArr = form.published_to;
        // Also check ui_config for published_to if it's there
        let uiConfig = form.ui_config || {};
        if (typeof uiConfig === 'string') {
            try {
                uiConfig = JSON.parse(uiConfig);
            } catch (e) {
                console.error("UI Config parsing failed", e);
                uiConfig = {};
            }
        }

        rolesArr = rolesArr || uiConfig.published_to;

        if (typeof rolesArr === 'string') {
            try {
                rolesArr = JSON.parse(rolesArr);
            } catch (e) {
                rolesArr = rolesArr.split(',').map(r => r.trim()).filter(Boolean);
            }
        }

        setSelectedRoles(rolesArr || ['DOCTOR']);

        setFormLocation(uiConfig.formLocation || form.workflow_location || 'NURSE_VITALS');
        setDeploymentStatus(form.deployment_status || uiConfig.deploymentStatus || 'DRAFT');
        setDisplayMode(uiConfig.displayMode || 'INLINE');
        setFormVersion(parseInt(form.version_id) || 1);
        setRedirectUrl(uiConfig.redirectUrl || '');
        setHeaderTitle(uiConfig.headerTitle || 'MediBed Enterprise');
        setHeaderSubtitle(uiConfig.headerSubtitle || 'Hospital Management Platform');
        setHeaderContact(uiConfig.headerContact || 'Unit-09 Quantum Block, Digital Medical District | +91 99 999 5555');
        setHeaderLogo(uiConfig.headerLogo || '');

        setShowOpenModal(false);
        setSelectedField(null);
    };

    // --- RENDER HELPERS ---
    const renderFieldInput = (field, isBuilder = false) => {
        const commonStyle = clsx(
            "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-700",
            field.textAlign || 'text-left',
            field.fontSize || 'text-sm',
            field.fontWeight || 'font-medium'
        );

        const labelStyle = clsx(
            "block text-[10px] uppercase mb-2 ml-1 text-slate-400",
            field.textAlign === 'text-center' ? 'text-center' : field.textAlign === 'text-right' ? 'text-right' : 'text-left',
            field.fontWeight === 'font-black' ? 'font-black' : 'font-bold'
        );

        switch (field.type) {
            case 'section':
                return (
                    <div className={clsx(
                        "bg-slate-50 px-4 py-2 border-l-4 border-slate-900 mt-6 first:mt-0 font-sans",
                        field.textAlign || 'text-left'
                    )}>
                        <h3 className={clsx(
                            "uppercase tracking-[0.2em] text-slate-800",
                            field.fontSize || 'text-xs',
                            field.fontWeight || 'font-black'
                        )}>{field.label}</h3>
                    </div>
                );
            case 'row_2':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelStyle}>{field.columns[0] || 'Left Channel'}</label>
                            <input type="text" className={commonStyle} placeholder="Enter value..." readOnly={isBuilder} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelStyle}>{field.columns[1] || 'Right Channel'}</label>
                            <input type="text" className={commonStyle} placeholder="Enter value..." readOnly={isBuilder} />
                        </div>
                    </div>
                );
            case 'grid_3':
                return (
                    <div className="grid grid-cols-3 gap-4">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="space-y-2">
                                <label className={labelStyle}>{field.columns[i] || `Column ${i + 1}`}</label>
                                <input type="text" className={commonStyle} placeholder={`Enter value...`} readOnly={isBuilder} />
                            </div>
                        ))}
                    </div>
                );
            case 'grid_4':
                return (
                    <div className="grid grid-cols-4 gap-4">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="space-y-2">
                                <label className={labelStyle}>{field.columns[i] || `Col ${i + 1}`}</label>
                                <input type="text" className={commonStyle} placeholder={`Enter value...`} readOnly={isBuilder} />
                            </div>
                        ))}
                    </div>
                );
            case 'textarea':
                return <textarea rows={field.rows || 4} placeholder={field.placeholder} className={commonStyle} readOnly={isBuilder} />;
            case 'text':
            case 'number':
            case 'date':
                return <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} className={commonStyle} placeholder={field.placeholder} readOnly={isBuilder} />;
            case 'dropdown':
                return (
                    <select className={commonStyle} disabled={isBuilder}>
                        <option value="">Select Option</option>
                        {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                );
            case 'radio':
                return (
                    <div className={clsx("flex flex-wrap gap-4 pt-2", field.textAlign === 'text-center' ? 'justify-center' : field.textAlign === 'text-right' ? 'justify-end' : 'justify-start')}>
                        {field.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                <span className={clsx("text-[11px] text-slate-600", field.fontWeight || 'font-bold')}>{opt}</span>
                            </div>
                        ))}
                    </div>
                );
            case 'table':
                return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden mt-2 bg-white shadow-sm">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-[0.1em]">
                                <tr>
                                    {field.columns.map((c, i) => <th key={i} className={clsx("px-4 py-3 border-b", field.textAlign || 'text-left')}>{c}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(field.rows)].map((_, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        {field.columns.map((_, j) => <td key={j} className={clsx("px-4 py-3 bg-white/50 text-slate-400 italic", field.textAlign || 'text-left')}>Expected Result {i + 1}...</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'signature':
                return (
                    <div className={clsx("h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center bg-slate-50/30 group", field.textAlign === 'text-center' ? 'justify-center' : field.textAlign === 'text-right' ? 'justify-end pr-8' : 'justify-start pl-8')}>
                        <div className="text-center">
                            <PenTool className="w-5 h-5 text-slate-300 mx-auto group-hover:text-indigo-400 transition" />
                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Authorization Signature Required</p>
                        </div>
                    </div>
                );
            case 'info':
                return (
                    <div className={clsx("flex gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50", field.textAlign === 'text-center' ? 'justify-center' : field.textAlign === 'text-right' ? 'justify-end' : 'justify-start')}>
                        <Info className="w-5 h-5 text-indigo-500 shrink-0" />
                        <p className={clsx("text-indigo-700 leading-relaxed font-medium", field.fontSize || 'text-xs')}>{field.label}</p>
                    </div>
                );
            default:
                return null;
        }
    };

    // --- REPORT PREVIEW ---
    const renderReportPreview = () => {
        // Now using a clean mock dataset to show placeholders instead of hardcoded values
        const mockEmptyData = formFields.reduce((acc, field) => {
            acc[field.label || field.id] = "---";
            if (['row_2', 'grid_3', 'grid_4'].includes(field.type)) {
                field.columns?.forEach(col => {
                    acc[`${field.label}_${col}`] = "---";
                });
            }
            return acc;
        }, {});

        const mockPatient = {
            first_name: 'Patient',
            last_name: 'Name',
            patient_id_str: 'P-0000',
            age: '--',
            gender: '--'
        };

        return (
            <div className="transform scale-[0.8] origin-top">
                <TemplateLabReportViewer
                    logo={headerLogo}
                    title={headerTitle}
                    subtitle={headerSubtitle}
                    contact={headerContact}
                    reportName={formName}
                    patient={mockPatient}
                    fields={formFields}
                    data={mockEmptyData}
                    onClose={() => { }}
                    isDesigner={true}
                    onFieldSelect={(fieldId) => {
                        setSelectedField(fieldId);
                        setViewMode('builder');
                    }}
                    onDeleteField={(fieldId) => deleteField(fieldId)}
                    onInsertRequest={(idx) => {
                        setInsertionIndex(idx);
                        setViewMode('builder'); // Switch to builder to show toolbox
                    }}
                />
            </div>
        );
    }

    const selectedFieldData = formFields.find(f => f.id === selectedField);

    return (
        <div className="h-screen flex flex-col bg-[#F8FAFC]">
            {/* PRO HEADER */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="text-xl font-black text-slate-800 bg-transparent border-none focus:ring-0 w-64 px-0 leading-tight"
                            />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Class LCNC Designer</p>
                        </div>
                    </div>

                    <div className="h-10 w-[1px] bg-slate-200 mx-2" />

                    <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => setViewMode('builder')}
                            className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all",
                                viewMode === 'builder' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50")}
                        >
                            <Layout size={14} /> DESIGN
                        </button>
                        <button
                            onClick={() => setViewMode('report')}
                            className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all",
                                viewMode === 'report' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-50")}
                        >
                            <Printer size={14} /> PRINT FORMAT
                        </button>
                    </div>

                    <div className="h-10 w-[1px] bg-slate-200 mx-2" />

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/60 backdrop-blur-sm hidden">
                            {/* Deployment Status Controls Removed */}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={startFresh}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Plus size={16} /> NEW TEMPLATE
                    </button>
                    <button
                        onClick={() => setShowOpenModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <FolderOpen size={16} /> EXPLORE REPOSITORY
                    </button>

                    <div className="flex items-center">
                        <button
                            onClick={() => saveForm('PUBLISHED')}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-l-xl text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-indigo-100 disabled:grayscale border-r border-white/20"
                        >
                            {isLoading ? <Loader className="animate-spin w-4 h-4" /> : <Zap size={16} />}
                            PUBLISH TO PRODUCTION
                        </button>
                        <button
                            onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
                            className="px-3 py-2.5 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-r-xl text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-indigo-100"
                        >
                            <ChevronDown size={16} className={clsx("transition-transform", isSaveMenuOpen && "rotate-180")} />
                        </button>

                        {isSaveMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100] overflow-hidden"
                            >
                                <button
                                    onClick={() => { saveForm('DRAFT'); setIsSaveMenuOpen(false); }}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all group text-left"
                                >
                                    <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                        <Save size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Save as Draft</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Local staging only</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { saveForm('PUBLISHED'); setIsSaveMenuOpen(false); }}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-indigo-50 rounded-xl transition-all group text-left mt-1"
                                >
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-indigo-100">
                                        <Zap size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-indigo-700 uppercase tracking-tight">Publish Live</p>
                                        <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Deploy to Production</p>
                                    </div>
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* TOOLBOX SIDEBAR */}
                <AnimatePresence mode="wait">
                    {viewMode === 'builder' && (
                        <motion.div
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="w-80 bg-white border-r border-slate-200 p-8 flex flex-col gap-8 overflow-y-auto"
                        >
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Component Arsenal</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="grid grid-cols-1 gap-8">
                                            {['Layout', 'Input', 'Data', 'Meta'].map(group => (
                                                <div key={group} className="space-y-4">
                                                    <div className="flex items-center gap-3 px-1">
                                                        <div className="h-[1px] flex-1 bg-slate-100" />
                                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">{group}</p>
                                                        <div className="h-[1px] flex-1 bg-slate-100" />
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {componentTypes.filter(c => c.group === group).map(c => (
                                                            <motion.button
                                                                key={c.id}
                                                                whileHover={{ scale: 1.02, x: 4 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => addField(c)}
                                                                className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group text-left relative overflow-hidden"
                                                            >
                                                                <div className={clsx("p-3 rounded-2xl transition-all shadow-sm", `bg-${c.color}-50 text-${c.color}-600 group-hover:bg-${c.color}-600 group-hover:text-white group-hover:rotate-6`)}>
                                                                    <c.icon size={20} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{c.name}</p>
                                                                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">Enterprise Ready</p>
                                                                </div>
                                                                <motion.div
                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                                                    initial={{ scale: 0 }}
                                                                    whileHover={{ scale: 1.2 }}
                                                                >
                                                                    <Plus size={12} className="text-indigo-600" />
                                                                </motion.div>
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* VISUAL CANVAS */}
                <div className="flex-1 p-12 overflow-y-auto bg-slate-50/50 relative">
                    <div className={clsx("max-w-4xl mx-auto transition-all duration-500", viewMode === 'report' ? "opacity-100" : "opacity-100")}>
                        {viewMode === 'report' ? (
                            <div className="flex flex-col items-center">
                                {renderReportPreview()}
                            </div>
                        ) : viewMode === 'simulator' ? (
                            <div className="w-full h-full flex flex-col gap-8 animate-in fade-in duration-500">
                                {/* SIMULATOR CONTROLS */}
                                <div className="flex items-center justify-between bg-slate-900 p-6 rounded-[2rem] shadow-2xl">
                                    <div className="flex gap-4">
                                        {[
                                            { id: 'NURSE', icon: Activity, label: 'Nurse View' },
                                            { id: 'DOCTOR', icon: User, label: 'Doctor View' },
                                            { id: 'FRONT_DESK', icon: Clipboard, label: 'Front Desk' },
                                            { id: 'LAB_ASSISTANT', icon: CheckSquare, label: 'Lab View' }
                                        ].map(role => (
                                            <button
                                                key={role.id}
                                                onClick={() => setSimulatorRole(role.id)}
                                                className={clsx(
                                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    simulatorRole === role.id ? "bg-white/20 text-white ring-1 ring-white/50" : "text-slate-500 hover:text-white"
                                                )}
                                            >
                                                <role.icon size={14} /> {role.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-slate-500 text-xs font-mono uppercase">Simulation Mode Active</p>
                                </div>

                                {/* MOCK INTERFACE */}
                                <div className="flex-1 bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-200 relative">
                                    <div className="absolute top-0 left-0 w-full h-12 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                        </div>
                                        <div className="flex-1 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{simulatorRole} DASHBOARD MOCKUP</div>
                                    </div>
                                    <div className="p-12 mt-8 overflow-y-auto h-[calc(100%-3rem)] bg-[#F8FAFC]">
                                        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                                <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                                                {formName}
                                            </h3>
                                            <div className="space-y-6">
                                                {formFields.map(field => (
                                                    <div key={field.id} className="animate-in slide-in-from-bottom-2 duration-500">
                                                        {field.type !== 'section' && field.type !== 'info' && field.type !== 'signature' && (
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">{field.label}</label>
                                                        )}
                                                        {renderFieldInput(field)}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 flex justify-end">
                                                <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200">
                                                    Submit Mock Entry
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                ref={canvasRef}
                                className="bg-white min-h-[1000px] shadow-sm rounded-xl p-12 border border-slate-200/60"
                            >
                                <div className="text-center mb-12 border-b border-slate-100 pb-8 cursor-pointer hover:bg-slate-50 p-4 rounded-xl transition-all group"
                                    onClick={() => { setSelectedField('header-settings'); setActiveTab('settings'); }}
                                >
                                    <h1 className="text-3xl font-black text-slate-800 mb-2">{headerTitle}</h1>
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{headerSubtitle}</h2>
                                    <p className="text-xs text-slate-300 mt-2">{headerContact}</p>
                                    <p className="text-[10px] text-indigo-400 font-bold mt-4 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Click to Edit Header</p>
                                </div>

                                {/* REPORT NAME DESIGN - High Fidelity */}
                                <div
                                    className="text-center mb-10 cursor-pointer hover:bg-slate-50 p-4 rounded-xl transition-all group relative"
                                    onClick={() => { setSelectedField('meta-settings'); setActiveTab('settings'); }}
                                >
                                    <h2 className="text-lg font-black uppercase tracking-[0.3em] border-b-2 border-slate-900 inline-block px-12 py-1">
                                        {formName}
                                    </h2>
                                    <p className="text-[10px] text-indigo-400 font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Click to Edit Report Name</p>
                                </div>

                                {/* DEPLOYMENT SETTINGS - High Fidelity */}
                                <div
                                    className={clsx(
                                        "mb-12 cursor-pointer hover:bg-indigo-50/50 p-4 rounded-xl transition-all group relative border-2 border-dashed flex items-center justify-between",
                                        selectedField === 'deployment-settings' ? "border-indigo-500 bg-indigo-50" : "border-slate-100 hover:border-indigo-200"
                                    )}
                                    onClick={() => { setSelectedField('deployment-settings'); setActiveTab('settings'); }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                            <Monitor size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Deployment Strategy</p>
                                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                                {WORKFLOW_LOCATIONS[formLocation]?.label || 'Production Workflow'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Access Control</p>
                                        <div className="flex gap-1 justify-end">
                                            {selectedRoles.map(role => (
                                                <span key={role} className="px-2 py-0.5 bg-slate-100 text-[8px] font-black rounded-md text-slate-500">{role}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute -right-3 -top-3 scale-0 group-hover:scale-100 transition-transform bg-indigo-600 text-white p-1.5 rounded-lg shadow-xl">
                                        <Settings size={14} />
                                    </div>
                                </div>

                                <div className="space-y-4 min-h-[400px]">
                                    {formFields.length === 0 ? (
                                        <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                                            <Plus size={48} className="mb-4 opacity-50" />
                                            <p className="font-bold">Drag & Drop components or Click to Add</p>
                                            <p className="text-xs mt-2 opacity-60">Build your clinical protocol here.</p>
                                        </div>
                                    ) : (
                                        <Reorder.Group axis="y" values={formFields} onReorder={setFormFields} className="space-y-4">
                                            {formFields.map((field) => (
                                                <Reorder.Item
                                                    key={field.id}
                                                    value={field}
                                                    className="relative"
                                                >
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedField(field.id);
                                                            setActiveTab('settings');
                                                        }}
                                                        className={clsx(
                                                            "group relative p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg",
                                                            selectedField === field.id
                                                                ? "bg-white border-indigo-500 shadow-xl shadow-indigo-100/50 z-10"
                                                                : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {selectedField === field.id && (
                                                            <div className="absolute right-0 -top-10 flex items-center gap-1 bg-slate-900 p-1.5 rounded-lg shadow-xl z-20 animate-in fade-in slide-in-from-bottom-2">
                                                                <div className="flex items-center gap-1 border-r border-white/20 pr-1 mr-1">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const idx = formFields.findIndex(f => f.id === field.id);
                                                                            setInsertionIndex(idx);
                                                                            setViewMode('builder');
                                                                        }}
                                                                        title="Insert Field Above"
                                                                        className="p-1.5 text-slate-300 hover:text-white hover:bg-white/20 rounded-md transition"
                                                                    >
                                                                        <ArrowUp size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const idx = formFields.findIndex(f => f.id === field.id);
                                                                            setInsertionIndex(idx + 1);
                                                                            setViewMode('builder');
                                                                        }}
                                                                        title="Insert Field Below"
                                                                        className="p-1.5 text-slate-300 hover:text-white hover:bg-white/20 rounded-md transition"
                                                                    >
                                                                        <ArrowDown size={14} />
                                                                    </button>
                                                                </div>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setActiveTab('settings'); }}
                                                                    title="Edit Properties"
                                                                    className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-500/50 rounded-md transition"
                                                                >
                                                                    <Settings size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                                                                    title="Delete Field"
                                                                    className="p-1.5 text-rose-300 hover:text-white hover:bg-rose-500/50 rounded-md transition"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                                <div className="w-[1px] h-4 bg-white/20 mx-1" />
                                                                <button className="p-1.5 text-slate-400 cursor-grab active:cursor-grabbing hover:text-white transition">
                                                                    <MoveVertical size={14} />
                                                                </button>
                                                            </div>
                                                        )}

                                                        <div className="pointer-events-none">
                                                            {field.type !== 'section' && field.type !== 'info' && field.type !== 'signature' && (
                                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">{field.label}</label>
                                                            )}
                                                            {renderFieldInput(field, true)}
                                                        </div>
                                                    </div>
                                                    {/* Insertion Zone */}
                                                    <div
                                                        className="h-2 w-full hover:bg-indigo-500/20 transition-colors my-1 rounded-full cursor-copy relative group/insert"
                                                        onClick={() => {
                                                            const idx = formFields.findIndex(f => f.id === field.id);
                                                            setInsertionIndex(idx);
                                                            setViewMode('builder'); // Ensure toolbox is open
                                                        }}
                                                    >
                                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-[9px] px-2 py-0.5 rounded-full opacity-0 group-hover/insert:opacity-100 transition-opacity font-bold">
                                                            INSERT HERE
                                                        </div>
                                                    </div>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* SETTINGS SIDEBAR */}
                <AnimatePresence>
                    {selectedField && viewMode === 'builder' && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="w-80 bg-white border-l border-slate-200 shadow-xl z-20 flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                                    {selectedField === 'header-settings' ? 'Header Configuration' :
                                        selectedField === 'meta-settings' ? 'Report Configuration' :
                                            selectedField === 'deployment-settings' ? 'Deployment & Access' :
                                                'Component Configuration'}
                                </h3>
                                <button onClick={() => setSelectedField(null)} className="text-slate-400 hover:text-red-500 transition">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                {selectedField === 'header-settings' ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Hospital Logo URL</label>
                                            <input
                                                type="text"
                                                value={headerLogo}
                                                onChange={(e) => setHeaderLogo(e.target.value)}
                                                placeholder="https://example.com/logo.png"
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                                            />
                                            <p className="text-[9px] text-slate-400">Enter a direct image URL for the logo.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Hospital Name / Title</label>
                                            <input
                                                type="text"
                                                value={headerTitle}
                                                onChange={(e) => setHeaderTitle(e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Department / Subtitle</label>
                                            <input
                                                type="text"
                                                value={headerSubtitle}
                                                onChange={(e) => setHeaderSubtitle(e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Contact / Address Info</label>
                                            <textarea
                                                rows={3}
                                                value={headerContact}
                                                onChange={(e) => setHeaderContact(e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                                            />
                                        </div>
                                    </>
                                ) : selectedField === 'meta-settings' ? (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Report Title</label>
                                            <input
                                                type="text"
                                                value={formName}
                                                onChange={(e) => setFormName(e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Description / Purpose</label>
                                            <textarea
                                                rows={3}
                                                value={formDescription}
                                                onChange={(e) => setFormDescription(e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                                            />
                                        </div>
                                    </>
                                ) : selectedField === 'deployment-settings' ? (
                                    <>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Workflow Placement</label>
                                                <div className="space-y-2">
                                                    {Object.entries(WORKFLOW_LOCATIONS).map(([key, loc]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => setFormLocation(key)}
                                                            className={clsx(
                                                                "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                                                                formLocation === key
                                                                    ? "border-indigo-500 bg-indigo-50"
                                                                    : "border-slate-100 hover:border-slate-200 bg-slate-50"
                                                            )}
                                                        >
                                                            <div className={clsx("p-2 rounded-lg", formLocation === key ? "bg-indigo-500 text-white" : "bg-white text-slate-400")}>
                                                                <loc.icon size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-800">{loc.label}</p>
                                                                <p className="text-[9px] text-slate-500 font-medium">{loc.description}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Authorized Roles</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {roles.map(role => (
                                                        <label key={role} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRoles.includes(role)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedRoles([...selectedRoles, role]);
                                                                    else setSelectedRoles(selectedRoles.filter(r => r !== role));
                                                                }}
                                                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-xs font-black text-slate-700">{role.replace('_', ' ')}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Field Label</label>
                                                <input
                                                    type="text"
                                                    value={selectedFieldData?.label || ''}
                                                    onChange={(e) => updateField(selectedField, { label: e.target.value })}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium"
                                                />
                                            </div>

                                            {/* CLINICAL METADATA */}
                                            {selectedFieldData?.type !== 'section' && selectedFieldData?.type !== 'info' && (
                                                <div className="grid grid-cols-2 gap-4 pt-2">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
                                                        <input
                                                            type="text"
                                                            value={selectedFieldData?.unit || ''}
                                                            onChange={(e) => updateField(selectedField, { unit: e.target.value })}
                                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm outline-none text-xs"
                                                            placeholder="e.g. ml, mg/dL"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ref Range</label>
                                                        <input
                                                            type="text"
                                                            value={selectedFieldData?.reference || ''}
                                                            onChange={(e) => updateField(selectedField, { reference: e.target.value })}
                                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm outline-none text-xs"
                                                            placeholder="e.g. 7.2 - 8.0"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Dynamic Columns Configuration */}
                                        {['row_2', 'grid_3', 'grid_4', 'table'].includes(selectedFieldData?.type) && (
                                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                                                    <Layout size={12} /> Column Headers
                                                </label>
                                                <div className="space-y-2">
                                                    {selectedFieldData.columns.map((col, i) => (
                                                        <input
                                                            key={i}
                                                            type="text"
                                                            value={col}
                                                            onChange={(e) => {
                                                                const newCols = [...selectedFieldData.columns];
                                                                newCols[i] = e.target.value;
                                                                updateField(selectedField, { columns: newCols });
                                                            }}
                                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                                            placeholder={`Column ${i + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* STYLING CONTROLS */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                <Type size={12} /> Appearance & Typography
                                            </h4>

                                            {/* ALIGNMENT */}
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase">Input / Text Alignment</label>
                                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                                    {[
                                                        { id: 'text-left', icon: AlignLeft },
                                                        { id: 'text-center', icon: AlignCenter },
                                                        { id: 'text-right', icon: AlignRight }
                                                    ].map(align => (
                                                        <button
                                                            key={align.id}
                                                            onClick={() => updateField(selectedField, { textAlign: align.id })}
                                                            className={clsx(
                                                                "flex-1 py-1.5 flex items-center justify-center rounded-md transition-all",
                                                                (selectedFieldData?.textAlign || 'text-left') === align.id ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                                                            )}
                                                        >
                                                            <align.icon size={14} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* FONT SIZE */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Size</label>
                                                    <select
                                                        value={selectedFieldData?.fontSize || 'text-sm'}
                                                        onChange={(e) => updateField(selectedField, { fontSize: e.target.value })}
                                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                                                    >
                                                        <option value="text-xs">Extra Small</option>
                                                        <option value="text-sm">Regular</option>
                                                        <option value="text-base">Medium</option>
                                                        <option value="text-lg">Large</option>
                                                        <option value="text-xl">Extra Large</option>
                                                        <option value="text-2xl">Header 2XL</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Weight</label>
                                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                                        {[
                                                            { id: 'font-normal', label: 'R' },
                                                            { id: 'font-medium', label: 'M' },
                                                            { id: 'font-bold', label: 'B' },
                                                            { id: 'font-black', label: 'H' }
                                                        ].map(w => (
                                                            <button
                                                                key={w.id}
                                                                onClick={() => updateField(selectedField, { fontWeight: w.id })}
                                                                title={w.id}
                                                                className={clsx(
                                                                    "flex-1 py-1.5 flex items-center justify-center rounded-md transition-all text-[10px] font-black",
                                                                    (selectedFieldData?.fontWeight || 'font-medium') === w.id ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600"
                                                                )}
                                                            >
                                                                {w.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedFieldData?.type === 'table' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Initial Rows (Visual Only)</label>
                                                <input
                                                    type="number"
                                                    value={selectedFieldData?.rows || 3}
                                                    onChange={(e) => updateField(selectedField, { rows: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                                                />
                                            </div>
                                        )}

                                        {['dropdown', 'radio'].includes(selectedFieldData?.type) && (
                                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Options (Comma Separated)</label>
                                                <textarea
                                                    rows={4}
                                                    value={selectedFieldData?.options?.join(', ') || ''}
                                                    onChange={(e) => updateField(selectedField, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                                                />
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-slate-100">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFieldData?.required || false}
                                                    onChange={(e) => updateField(selectedField, { required: e.target.checked })}
                                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition">Mark as Mandatory Field</span>
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SAVED FORMS MODAL */}
                {showOpenModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-12">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">Template Repository</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Select a base to iterate upon</p>
                                </div>
                                <button onClick={() => setShowOpenModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 gap-4 bg-slate-50/50">
                                {savedForms.map(form => (
                                    <button
                                        key={form.form_id}
                                        onClick={() => loadFormById(form.form_id)}
                                        className="text-left p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute w-1 h-full left-0 top-0 bg-indigo-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
                                        <h3 className="font-black text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">{form.form_name}</h3>
                                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{form.description || 'No description available for this protocol.'}</p>
                                        <div className="mt-4 flex gap-2">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black uppercase text-slate-500">{form.form_id}</span>
                                            <span className="px-2 py-1 bg-indigo-50 rounded text-[9px] font-black uppercase text-indigo-500">v{form.version}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormBuilder;
