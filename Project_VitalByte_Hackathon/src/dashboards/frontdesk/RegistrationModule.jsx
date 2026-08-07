import React, { useState, useContext, useRef, useEffect } from 'react';
import { PatientContext } from '../../context/PatientContext';
import { FrontDeskContext } from '../../context/FrontDeskContext';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import { UserPlus, Zap, CheckCircle, AlertCircle, ChevronDown, Search, ArrowRightLeft } from 'lucide-react';
import apiClient from '../../api/apiClient';
import DynamicFormRenderer from '../../components/lcnc/DynamicFormRenderer';

const RegistrationModule = () => {
    const { registerPatient } = useContext(PatientContext);
    const { emergencyRegister, addToQueue, createTransaction } = useContext(FrontDeskContext);
    const { conditionMapping } = useContext(HospitalLayoutContext);

    // Modes: 'STANDARD', 'EMERGENCY', 'DYNAMIC'
    const [mode, setMode] = useState('STANDARD');

    // Dynamic Form State
    const [dynamicForms, setDynamicForms] = useState([]);
    const [selectedDynamicForm, setSelectedDynamicForm] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        age: '',
        gender: '',
        bloodType: '',
        contact: '',
        condition: '',
        symptoms: '',
        address: '',
        emergencyContact: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });

    // Searchable Dropdown State
    const [showDropdown, setShowDropdown] = useState(false);
    const [conditionSearch, setConditionSearch] = useState('');
    const dropdownRef = useRef(null);

    const conditions = conditionMapping.map(cm => cm.condition);
    const filteredConditions = conditions.filter(c =>
        c.toLowerCase().includes(conditionSearch.toLowerCase())
    );

    useEffect(() => {
        fetchDynamicForms();
    }, []);

    const fetchDynamicForms = async () => {
        try {
            const res = await apiClient.get('/shared/forms/published/FRONT_DESK');
            setDynamicForms(res.data);
            if (res.data.length > 0) {
                // Optional: Auto-select if we want to replace standard view completely
                // setSelectedDynamicForm(res.data[0]); 
            }
        } catch (err) {
            console.error("Failed to fetch dynamic forms", err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleConditionSelect = (condition) => {
        setFormData({ ...formData, condition });
        setConditionSearch(condition);
        setShowDropdown(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        processRegistration(formData, mode === 'EMERGENCY');
    };

    const processRegistration = async (data, isEmergency) => {
        try {
            let patient;
            // Map dynamic form fields to Patient Schema if needed, or store as extra details
            // For now, assuming standard fields match, or we merge them
            const registrationData = {
                ...formData,
                ...data, // Start with standard, overwrite with dynamic
            };

            if (isEmergency) {
                patient = await emergencyRegister(registrationData);
                setStatus({ type: 'success', message: `Emergency Red Code: ${patient.firstName} registered. Token #${patient.tokenNumber || 'EM-1'} generated.` });
            } else {
                patient = await registerPatient(registrationData);
                createTransaction(patient.patientId, 500, 'Registration', 'Standard Registration Fee');
                addToQueue(patient.patientId, `${patient.firstName} ${patient.lastName}`, 'Normal', 'Consultation');
                setStatus({ type: 'success', message: `Registration successful! Patient ID: ${patient.patientId}. Registration fee paid: ₹500.` });
            }

            if (!isEmergency) {
                setFormData({
                    firstName: '', lastName: '', age: '', gender: '', bloodType: '', contact: '',
                    condition: '', symptoms: '', address: '', emergencyContact: ''
                });
                setConditionSearch('');
            }
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.error || error.response?.data?.details || 'Registration failed. Please check all fields.';
            setStatus({ type: 'error', message: errorMsg });
        }
    };

    const handleDynamicSubmit = (data) => {
        // Here we can map the dynamic fields to the core patient fields if they match keys
        // For simplicity, we assume the dynamic form might capture basic details + extras

        // Convert to core fields if present (this is a simple mapping assumption)
        const coreData = {
            firstName: data.firstName || data.first_name || 'Unknown',
            lastName: data.lastName || data.last_name || 'Patient',
            age: data.age || 0,
            gender: data.gender || 'Other',
            contact: data.contact || data.phone || '',
            ...data
        };
        processRegistration(coreData, false);
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
            <div className={`p-6 text-white flex items-center justify-between ${mode === 'EMERGENCY' ? 'bg-red-600' : 'bg-blue-600'}`}>
                <div className="flex items-center gap-3">
                    {mode === 'EMERGENCY' ? <Zap size={24} className="animate-pulse" /> : <UserPlus size={24} />}
                    <div>
                        <h2 className="text-xl font-bold">{mode === 'EMERGENCY' ? 'Emergency Quick Intake' : 'Patient Registration'}</h2>
                        <p className="text-blue-100 text-xs font-medium">{mode === 'DYNAMIC' ? `Using Form: ${selectedDynamicForm?.title}` : 'Standard Protocol'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {dynamicForms.length > 0 && (
                        <div className="bg-white/10 rounded-lg p-1 flex">
                            <button
                                onClick={() => { setMode('STANDARD'); setSelectedDynamicForm(null); }}
                                className={`px-3 py-1 rounded text-xs font-bold transition ${mode === 'STANDARD' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'}`}
                            >
                                Standard
                            </button>
                            {dynamicForms.map(form => (
                                <button
                                    key={form.form_id}
                                    onClick={() => { setMode('DYNAMIC'); setSelectedDynamicForm(form); }}
                                    className={`px-3 py-1 rounded text-xs font-bold transition ${selectedDynamicForm?.form_id === form.form_id ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'}`}
                                >
                                    {form.title}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => setMode(mode === 'EMERGENCY' ? 'STANDARD' : 'EMERGENCY')}
                        className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition flex items-center gap-2"
                    >
                        <ArrowRightLeft size={14} /> Switch to {mode === 'EMERGENCY' ? 'Standard' : 'Emergency'}
                    </button>
                </div>
            </div>

            <div className="p-8">
                {status.message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <p className="font-medium">{status.message}</p>
                    </div>
                )}

                {/* DYNAMIC FORM RENDERER */}
                {mode === 'DYNAMIC' && selectedDynamicForm ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {selectedDynamicForm.description && (
                            <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-lg text-sm border border-blue-100">
                                {selectedDynamicForm.description}
                            </div>
                        )}
                        <DynamicFormRenderer
                            schema={selectedDynamicForm.schema_json}
                            onSubmit={handleDynamicSubmit}
                        />
                    </div>
                ) : (
                    /* STANDARD FORM */
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">First Name *</label>
                                <input
                                    required
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Example: John"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Last Name *</label>
                                <input
                                    required
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Example: Doe"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Age *</label>
                                <input
                                    required
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    placeholder="Age"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Gender *</label>
                                <select
                                    required
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Blood Group</label>
                                <select
                                    name="bloodType"
                                    value={formData.bloodType}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                >
                                    <option value="">Select Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="Unknown">Unknown</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Primary Contact *</label>
                                <input
                                    required
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                />
                            </div>
                            {mode !== 'EMERGENCY' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Home Address</label>
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Full address"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                    />
                                </div>
                            )}
                            <div className={`space-y-2 ${mode === 'EMERGENCY' ? 'md:col-span-2' : ''} relative`} ref={dropdownRef}>
                                <label className="text-sm font-semibold text-slate-700">Condition/Complaint *</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        value={conditionSearch}
                                        onFocus={() => setShowDropdown(true)}
                                        onChange={(e) => {
                                            setConditionSearch(e.target.value);
                                            setFormData({ ...formData, condition: e.target.value });
                                        }}
                                        placeholder={mode === 'EMERGENCY' ? "CRITICAL: Describe emergency" : "Search or enter condition..."}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition pr-10 ${mode === 'EMERGENCY' ? 'bg-red-50 border-red-200 focus:ring-red-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />

                                    {showDropdown && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {filteredConditions.length > 0 ? (
                                                filteredConditions.map((c, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleConditionSelect(c)}
                                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 font-medium"
                                                    >
                                                        {c}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-xs text-slate-400 italic">No matches found. You can enter a custom condition.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transform active:scale-[0.98] transition-all ${mode === 'EMERGENCY' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {mode === 'EMERGENCY' ? 'START EMERGENCY TRIAGE' : 'COMPLETE REGISTRATION & PAY'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RegistrationModule;
