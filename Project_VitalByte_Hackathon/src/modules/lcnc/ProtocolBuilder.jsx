import React, { useState, useEffect, useContext } from 'react';
import {
    Plus,
    Trash2,
    Save,
    Activity,
    Info,
    Zap,
    BellRing,
    HeartPulse,
    Thermometer,
    Gauge,
    AlertCircle,
    FileJson,
    LayoutTemplate
} from 'lucide-react';
import clsx from 'clsx';
import { useNotification } from '../../context/NotificationContext';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';

const PARAMETERS = [
    { id: 'SpO2', label: 'Oxygen Saturation', icon: Activity, unit: '%', color: 'blue', bg: 'bg-blue-50' },
    { id: 'Heart Rate', label: 'Heart Rate', icon: HeartPulse, unit: 'bpm', color: 'rose', bg: 'bg-rose-50' },
    { id: 'BP_SYS', label: 'Systolic BP', icon: Gauge, unit: 'mmHg', color: 'violet', bg: 'bg-violet-50' },
    { id: 'Temperature', label: 'Body Temp', icon: Thermometer, unit: '°F', color: 'orange', bg: 'bg-orange-50' }
];

const SEVERITIES = [
    { id: 'Low', label: 'Low Risk', color: 'emerald', class: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { id: 'Medium', label: 'Elevated', color: 'blue', class: 'text-blue-600 bg-blue-50 border-blue-100' },
    { id: 'High', label: 'High Priority', color: 'orange', class: 'text-orange-600 bg-orange-50 border-orange-100' },
    { id: 'Critical', label: 'Critical', color: 'red', class: 'text-red-600 bg-red-50 border-red-100' }
];

const ProtocolBuilder = () => {
    const { addNotification } = useNotification();
    const { updateMedicalProtocols } = useContext(HospitalLayoutContext);

    const [rules, setRules] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [protocolVersion, setProtocolVersion] = useState('1.0');
    const [showTemplates, setShowTemplates] = useState(false);

    // Predefined Templates
    const TEMPLATES = [
        {
            name: 'COVID-19 Protocol',
            rules: [
                { parameter: 'SpO2', min: '92', max: '100', severity: 'High', description: 'SpO2 critical indicator for COVID-19' },
                { parameter: 'Heart Rate', min: '60', max: '110', severity: 'Medium', description: 'Monitor for tachycardia' },
                { parameter: 'Temperature', min: '98', max: '100.4', severity: 'Medium', description: 'Fever monitoring' }
            ]
        },
        {
            name: 'Cardiac Protocol',
            rules: [
                { parameter: 'Heart Rate', min: '50', max: '100', severity: 'High', description: 'Strict HR control' },
                { parameter: 'BP_SYS', min: '90', max: '140', severity: 'High', description: 'BP monitoring essential' },
                { parameter: 'Temperature', min: '97', max: '99.5', severity: 'Low', description: 'Infection monitoring' }
            ]
        },
        {
            name: 'Post-Surgery Protocol',
            rules: [
                { parameter: 'SpO2', min: '94', max: '100', severity: 'Critical', description: 'Oxygen saturation post-op' },
                { parameter: 'Heart Rate', min: '55', max: '100', severity: 'High', description: 'Recovery monitoring' },
                { parameter: 'Temperature', min: '98', max: '101', severity: 'Medium', description: 'Infection prevention' }
            ]
        }
    ];

    useEffect(() => {
        const saved = localStorage.getItem('protocol_rules');
        if (saved) {
            try {
                setRules(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved protocols", e);
            }
        }
    }, []);

    const addRule = () => {
        const newRule = {
            id: Date.now(),
            parameter: '',
            min: '',
            max: '',
            severity: 'Low',
            isActive: true,
            description: ''
        };
        setRules([newRule, ...rules]);
        addNotification('Configuration pending: Please define clinical thresholds.', 'warning');
    };

    const updateRule = (id, key, value) => {
        setRules(rules.map(r => r.id === id ? { ...r, [key]: value } : r));
    };

    const removeRule = (id) => {
        if (confirm('Are you sure you want to delete this rule?')) {
            setRules(rules.filter(r => r.id !== id));
        }
    };

    const saveRules = () => {
        setIsSaving(true);
        setTimeout(() => {
            // Update Context AND LocalStorage (handled by context now)
            updateMedicalProtocols(rules);

            localStorage.setItem('protocol_version', protocolVersion);
            addNotification('Medical protocols synchronized successfully.', 'success');
            setIsSaving(false);
        }, 800);
    };

    const loadTemplate = (template) => {
        const newRules = template.rules.map(r => ({
            id: Date.now() + Math.random(),
            parameter: r.parameter,
            min: r.min,
            max: r.max,
            severity: r.severity,
            isActive: true,
            description: r.description
        }));
        setRules([...newRules]);
        const newVersion = (parseFloat(protocolVersion) + 0.1).toFixed(1);
        setProtocolVersion(newVersion);
        addNotification(`Loaded ${template.name} v${newVersion}`, 'success');
        setShowTemplates(false);
    };

    const exportRules = () => {
        const data = JSON.stringify({ rules, version: protocolVersion, timestamp: new Date().toISOString() }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Protocol_v${protocolVersion}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addNotification('Protocol exported successfully', 'success');
    };

    // Reusable Stat Card Component aligned with AdminBedConfiguration
    const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
        <div className={clsx("relative overflow-hidden rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm transition-transform hover:scale-[1.02]",
            color === 'blue' && "bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-blue-200",
            color === 'emerald' && "bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-emerald-200",
            color === 'rose' && "bg-gradient-to-br from-rose-50 to-rose-100/50 hover:shadow-rose-200",
            color === 'violet' && "bg-gradient-to-br from-violet-50 to-violet-100/50 hover:shadow-violet-200",
            color === 'amber' && "bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-amber-200",
        )}>
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className={clsx("text-xs font-black uppercase tracking-widest mb-1",
                        color === 'blue' && "text-blue-400",
                        color === 'emerald' && "text-emerald-400",
                        color === 'rose' && "text-rose-400",
                        color === 'violet' && "text-violet-400",
                        color === 'amber' && "text-amber-400",
                    )}>{label}</p>
                    <h3 className={clsx("text-3xl font-black",
                        color === 'blue' && "text-blue-900",
                        color === 'emerald' && "text-emerald-900",
                        color === 'rose' && "text-rose-900",
                        color === 'violet' && "text-violet-900",
                        color === 'amber' && "text-amber-900",
                    )}>{value}</h3>
                </div>
                <div className={clsx("p-3 rounded-xl",
                    color === 'blue' && "bg-blue-500/10 text-blue-600",
                    color === 'emerald' && "bg-emerald-500/10 text-emerald-600",
                    color === 'rose' && "bg-rose-500/10 text-rose-600",
                    color === 'violet' && "bg-violet-500/10 text-violet-600",
                    color === 'amber' && "bg-amber-500/10 text-amber-600",
                )}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <span className={clsx("text-[10px] font-bold px-2 py-1 rounded-full",
                    color === 'blue' && "bg-blue-200/50 text-blue-700",
                    color === 'emerald' && "bg-emerald-200/50 text-emerald-700",
                    color === 'rose' && "bg-rose-200/50 text-rose-700",
                    color === 'violet' && "bg-violet-200/50 text-violet-700",
                    color === 'amber' && "bg-amber-200/50 text-amber-700",
                )}>{subtext}</span>
            </div>
            {/* Background Decor */}
            <div className={clsx("absolute -right-6 -bottom-6 opacity-10 rotate-12 pointer-events-none",
                color === 'blue' && "text-blue-600",
                color === 'emerald' && "text-emerald-600",
                color === 'rose' && "text-rose-600",
                color === 'violet' && "text-violet-600",
                color === 'amber' && "text-amber-600",
            )}>
                <Icon size={120} />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Activity size={28} /></span>
                            Monitoring Protocols
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full border border-slate-200">v{protocolVersion}</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 max-w-2xl">
                            Configure real-time vital sign monitoring rules, thresholds, and automated alert triggers.
                        </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <LayoutTemplate size={18} /> Templates
                        </button>
                        <button
                            onClick={exportRules}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <FileJson size={18} /> Export
                        </button>
                        <button
                            onClick={saveRules}
                            disabled={isSaving}
                            className={clsx(
                                "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50",
                                isSaving && "animate-pulse"
                            )}
                        >
                            <Save size={18} /> {isSaving ? 'Deploying...' : 'Deploy Rules'}
                        </button>
                    </div>
                </div>

                {/* Templates Selection Panel */}
                {showTemplates && (
                    <div className="animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-black text-indigo-900">Available Clinical Templates</h2>
                                <button onClick={() => setShowTemplates(false)} className="text-xs font-bold text-indigo-400 hover:text-indigo-600">CLOSE</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {TEMPLATES.map((template, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => loadTemplate(template)}
                                        className="text-left bg-white p-5 rounded-2xl border border-indigo-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group"
                                    >
                                        <h3 className="font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{template.name}</h3>
                                        <div className="space-y-1">
                                            {template.rules.map((r, i) => (
                                                <p key={i} className="text-xs text-slate-500 font-medium">
                                                    • {r.parameter}: <span className="text-slate-700 font-bold">{r.min}-{r.max}</span>
                                                </p>
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="Active Rules"
                        value={rules.filter(r => r.isActive).length}
                        icon={Zap}
                        color="blue"
                        subtext="Monitoring Live"
                    />
                    <StatCard
                        label="System Status"
                        value="Online"
                        icon={Activity}
                        color="emerald"
                        subtext="V2.0 Core Active"
                    />
                    <StatCard
                        label="Pending Alerts"
                        value="0"
                        icon={BellRing}
                        color="amber"
                        subtext="System Healthy"
                    />
                </div>

                {/* Rules List */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            Active Configurations
                            <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{rules.length}</span>
                        </h2>
                        <button
                            onClick={addRule}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold text-sm shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                        >
                            <Plus size={18} /> Add Parameter
                        </button>
                    </div>

                    {rules.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200/75 p-16 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                                <Activity size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">No Monitoring Rules Configured</h3>
                            <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
                                Define clinical thresholds to enable automated patient monitoring and alerting systems.
                            </p>
                            <button
                                onClick={addRule}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
                            >
                                Create First Rule
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {rules.map((rule) => {
                                const param = PARAMETERS.find(p => p.id === rule.parameter);
                                const severity = SEVERITIES.find(s => s.id === rule.severity) || SEVERITIES[0];

                                return (
                                    <div
                                        key={rule.id}
                                        className={clsx(
                                            "bg-white rounded-3xl p-6 border-2 transition-all duration-300 group hover:shadow-xl hover:shadow-slate-200/50",
                                            rule.isActive ? "border-slate-100 hover:border-indigo-100" : "border-slate-100 opacity-60 bg-slate-50/50"
                                        )}
                                    >
                                        <div className="flex flex-col xl:flex-row gap-8 items-start">
                                            {/* Parameter Selection */}
                                            <div className="w-full xl:w-72 space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Clinical Parameter</label>
                                                <div className="relative">
                                                    <select
                                                        value={rule.parameter}
                                                        onChange={(e) => updateRule(rule.id, 'parameter', e.target.value)}
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer transition-all"
                                                    >
                                                        <option value="" disabled>Select Parameter...</option>
                                                        {PARAMETERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                                    </select>
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                        {param ? <param.icon size={20} className={`text-${param.color}-500`} /> : <Activity size={20} />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Threshold Controls */}
                                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safe Floor (Min)</label>
                                                        {param && <span className={`text-[10px] font-black text-${param.color}-500 bg-${param.color}-50 px-2 py-0.5 rounded-full`}>{param.unit}</span>}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        placeholder="Min Value"
                                                        value={rule.min}
                                                        onChange={(e) => updateRule(rule.id, 'min', e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:font-medium placeholder:text-slate-300"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safe Ceiling (Max)</label>
                                                        {param && <span className={`text-[10px] font-black text-${param.color}-500 bg-${param.color}-50 px-2 py-0.5 rounded-full`}>{param.unit}</span>}
                                                    </div>
                                                    <input
                                                        type="number"
                                                        placeholder="Max Value"
                                                        value={rule.max}
                                                        onChange={(e) => updateRule(rule.id, 'max', e.target.value)}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:font-medium placeholder:text-slate-300"
                                                    />
                                                </div>
                                            </div>

                                            {/* Priority & Actions */}
                                            <div className="w-full xl:w-auto space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Alert Priority</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {SEVERITIES.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => updateRule(rule.id, 'severity', s.id)}
                                                            className={clsx(
                                                                "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all border",
                                                                rule.severity === s.id
                                                                    ? s.class
                                                                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                                                            )}
                                                        >
                                                            {s.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 xl:pt-8 self-end xl:self-start">
                                                <div
                                                    onClick={() => updateRule(rule.id, 'isActive', !rule.isActive)}
                                                    className={clsx("w-14 h-8 rounded-full cursor-pointer relative transition-colors duration-300",
                                                        rule.isActive ? "bg-emerald-500" : "bg-slate-200"
                                                    )}
                                                >
                                                    <div className={clsx("absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300",
                                                        rule.isActive ? "left-7" : "left-1"
                                                    )} />
                                                </div>
                                                <button
                                                    onClick={() => removeRule(rule.id)}
                                                    className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Protocol Note */}
                                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-start gap-4">
                                            <Info size={18} className="text-slate-400 mt-3 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Instruction</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Initiate Oxygen Therapy if SpO2 falls below 90%"
                                                    value={rule.description}
                                                    onChange={(e) => updateRule(rule.id, 'description', e.target.value)}
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-600 focus:ring-0 placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>

                                        {/* Status Strip */}
                                        {rule.isActive && rule.parameter && (
                                            <div className={clsx("mt-6 rounded-xl p-4 flex items-center gap-3 text-xs font-bold uppercase tracking-wide",
                                                severity.class.replace('border', 'border-l-4')
                                            )}>
                                                <AlertCircle size={16} />
                                                <span>
                                                    Alert: <span className="font-black">{rule.severity}</span>
                                                    <span className="mx-2 opacity-50">|</span>
                                                    IF <span className="font-black text-slate-900">{rule.parameter}</span>
                                                    {rule.min && <> &lt; <span className="font-black text-slate-900">{rule.min}</span></>}
                                                    {rule.min && rule.max && <span className="mx-1">OR</span>}
                                                    {rule.max && <> &gt; <span className="font-black text-slate-900">{rule.max}</span></>}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProtocolBuilder;
