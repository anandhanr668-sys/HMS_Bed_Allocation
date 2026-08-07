import React, { useState, useContext } from 'react';
import { PatientContext } from '../../../context/PatientContext';
import { Save, Microscope, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';
import clsx from 'clsx';

export const SemenAnalysisForm = ({ patientId, onClose }) => {
    const { orderInvestigation } = useContext(PatientContext); // using orderInvestigation to save result for now, or update
    const { addNotification } = useNotification();

    const [formData, setFormData] = useState({
        // A. Sample Details
        collectionType: 'Masturbation',
        collectionMode: 'Home',
        collectionTime: '',
        examTime: '',
        abstinence: '', // days
        completeCollection: 'Yes',

        // B. Macroscopic
        volume: '',
        appearance: 'Normal',
        viscosity: 'Normal',
        ph: '',
        liquefactionTime: '',

        // C. Microscopic
        concentration: '', // million/ml
        totalSpermNumber: '',
        rapidProgressive: '', // %
        slowProgressive: '', // %
        nonProgressive: '',
        immotile: '',
        vitality: '', // % live
        agglutination: 'None',
        roundCells: '',
        debris: 'None',

        // D. Morphology
        normalForms: '',
        abnormalForms: '',
        headDefects: '',
        midpieceDefects: '',
        tailDefects: '',
        cytoplasmicDroplets: ''
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Calculate Total Motile Sperm Count (TMSC)
        const vol = parseFloat(formData.volume) || 0;
        const conc = parseFloat(formData.concentration) || 0;
        const rapid = parseFloat(formData.rapidProgressive) || 0;
        const slow = parseFloat(formData.slowProgressive) || 0;
        const tmsc = (vol * conc * (rapid + slow) / 100).toFixed(1);

        const report = {
            type: 'SEMEN_ANALYSIS',
            data: { ...formData, tmsc },
            result: `Vol: ${formData.volume}ml, Conc: ${formData.concentration}M/ml, Motility: ${parseFloat(formData.rapidProgressive) + parseFloat(formData.slowProgressive)}%, Morph: ${formData.normalForms}%`,
            status: 'COMPLETED',
            date: new Date().toISOString()
        };

        // We use orderInvestigation to push a completed investigation record
        // In a real app, we might update an existing request.
        orderInvestigation(patientId, report);

        addNotification(`Semen Analysis recorded. TMSC: ${tmsc} M`, 'success');
        if (onClose) onClose();
    };

    // Reference Values (WHO 2010)
    const checkNormal = (field, value) => {
        const v = parseFloat(value);
        if (isNaN(v)) return true;
        switch (field) {
            case 'volume': return v >= 1.5;
            case 'concentration': return v >= 15;
            case 'normalForms': return v >= 4;
            case 'vitality': return v >= 58;
            default: return true;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Microscope className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Semen Analysis Report</h2>
                        <p className="text-sm text-gray-500">WHO Laboratory Manual 5th Edition</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 flex items-center gap-2">
                        <Save className="w-4 h-4" /> Finalize Report
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto p-8 space-y-8">
                {/* A. Sample Details */}
                <section>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Sample Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select label="Collection Type" value={formData.collectionType} onChange={e => handleChange('collectionType', e.target.value)} options={['Masturbation', 'Coitus Interruptus', 'Surgical Retrieval']} />
                        <Select label="Mode" value={formData.collectionMode} onChange={e => handleChange('collectionMode', e.target.value)} options={['Home', 'Laboratory']} />
                        <Input label="Abstinence (Days)" value={formData.abstinence} onChange={e => handleChange('abstinence', e.target.value)} />
                        <Input type="time" label="Collection Time" value={formData.collectionTime} onChange={e => handleChange('collectionTime', e.target.value)} />
                        <Input type="time" label="Exam Time" value={formData.examTime} onChange={e => handleChange('examTime', e.target.value)} />
                        <Select label="Complete Collection" value={formData.completeCollection} onChange={e => handleChange('completeCollection', e.target.value)} options={['Yes', 'No', 'Spillage']} />
                    </div>
                </section>

                {/* B. Macroscopic */}
                <section>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Macroscopic Examination</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <ValidationInput label="Volume (ml)" value={formData.volume} onChange={e => handleChange('volume', e.target.value)} isValid={checkNormal('volume', formData.volume)} warning="< 1.5 ml" />
                        <Input label="Result pH" value={formData.ph} onChange={e => handleChange('ph', e.target.value)} />
                        <Input label="Liquefaction (min)" value={formData.liquefactionTime} onChange={e => handleChange('liquefactionTime', e.target.value)} />
                        <Select label="Viscosity" value={formData.viscosity} onChange={e => handleChange('viscosity', e.target.value)} options={['Normal', 'High', 'Low']} />
                        <Select label="Appearance" value={formData.appearance} onChange={e => handleChange('appearance', e.target.value)} options={['Normal (Grey-Opalescent)', 'Whitish', 'Yellowish', 'Bloody']} />
                    </div>
                </section>

                {/* C. Microscopic */}
                <section>
                    <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest mb-4">Microscopic Examination</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 border border-blue-100 rounded-xl bg-blue-50/10">
                        <ValidationInput label="Concentration (M/ml)" value={formData.concentration} onChange={e => handleChange('concentration', e.target.value)} isValid={checkNormal('concentration', formData.concentration)} warning="< 15 M/ml" />
                        <Input label="Total Sperm No (M)" value={formData.totalSpermNumber} onChange={e => handleChange('totalSpermNumber', e.target.value)} placeholder="Calc. usually" />
                        <ValidationInput label="Vitality (% Live)" value={formData.vitality} onChange={e => handleChange('vitality', e.target.value)} isValid={checkNormal('vitality', formData.vitality)} warning="< 58%" />
                        <Input label="Agglutination" value={formData.agglutination} onChange={e => handleChange('agglutination', e.target.value)} />

                        <div className="col-span-full grid grid-cols-4 gap-4 pt-4 border-t border-blue-100">
                            <Input label="Rapid Prog. (%)" value={formData.rapidProgressive} onChange={e => handleChange('rapidProgressive', e.target.value)} />
                            <Input label="Slow Prog. (%)" value={formData.slowProgressive} onChange={e => handleChange('slowProgressive', e.target.value)} />
                            <Input label="Non-Prog. (%)" value={formData.nonProgressive} onChange={e => handleChange('nonProgressive', e.target.value)} />
                            <Input label="Immotile (%)" value={formData.immotile} onChange={e => handleChange('immotile', e.target.value)} />
                        </div>
                    </div>
                </section>

                {/* D. Morphology */}
                <section>
                    <h3 className="text-sm font-black text-purple-500 uppercase tracking-widest mb-4">Morphology (Kruger Strict)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 border border-purple-100 rounded-xl bg-purple-50/10">
                        <ValidationInput label="Normal Forms (%)" value={formData.normalForms} onChange={e => handleChange('normalForms', e.target.value)} isValid={checkNormal('normalForms', formData.normalForms)} warning="< 4%" />
                        <Input label="Head Defects (%)" value={formData.headDefects} onChange={e => handleChange('headDefects', e.target.value)} />
                        <Input label="Midpiece Defects (%)" value={formData.midpieceDefects} onChange={e => handleChange('midpieceDefects', e.target.value)} />
                        <Input label="Tail Defects (%)" value={formData.tailDefects} onChange={e => handleChange('tailDefects', e.target.value)} />
                        <Input label="Cyto. Droplets (%)" value={formData.cytoplasmicDroplets} onChange={e => handleChange('cytoplasmicDroplets', e.target.value)} />
                        <Input label="Teratozoospermia Index" value={(parseFloat(formData.headDefects || 0) + parseFloat(formData.midpieceDefects || 0) + parseFloat(formData.tailDefects || 0) / parseFloat(formData.abnormalForms || 1)).toFixed(2)} readOnly />
                    </div>
                </section>
            </div>
        </div>
    );
};

// UI Helpers
const Input = ({ label, value, onChange, type = "text", readOnly, placeholder }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            placeholder={placeholder}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none transition"
        />
    </div>
);

const Select = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none transition">
            {options.map(o => <option key={o}>{o}</option>)}
        </select>
    </div>
);

const ValidationInput = ({ label, value, onChange, isValid, warning }) => (
    <div>
        <label className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1">
            {label}
            {!isValid && value && <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {warning}</span>}
        </label>
        <div className="relative">
            <input
                value={value}
                onChange={onChange}
                className={clsx(
                    "w-full bg-white border rounded-lg px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none transition pr-8",
                    !isValid && value ? "border-red-300 text-red-600 bg-red-50" : "border-gray-200"
                )}
            />
            {isValid && value && <CheckCircle className="absolute right-2 top-2.5 w-4 h-4 text-emerald-500" />}
        </div>
    </div>
);
