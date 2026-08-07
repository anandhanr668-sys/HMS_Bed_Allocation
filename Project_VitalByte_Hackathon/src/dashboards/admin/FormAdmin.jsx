import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import FormBuilder from '../../modules/lcnc/FormBuilder';
import { ClipboardList, Stethoscope, Plus, Layout, Trash2, Edit3, X, Check, Microscope } from 'lucide-react';
import clsx from 'clsx';
import { useNotification } from '../../context/NotificationContext';

const DEFAULT_FORMS = [
    { id: 'patient_registration', label: 'Patient Registration Form', icon: 'ClipboardList' },
    { id: 'vitals_entry', label: 'Nurse Vitals Entry Form', icon: 'Stethoscope' },
    { id: 'semen_analysis', label: 'Semen Analysis Report', icon: 'Microscope' },
];

const FormAdmin = () => {
    const { addNotification } = useNotification();
    const [forms, setForms] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newFormName, setNewFormName] = useState('');
    const [activeTab, setActiveTab] = useState('');

    useEffect(() => {
        const savedForms = localStorage.getItem('hospital_forms_list');
        if (savedForms) {
            const parsed = JSON.parse(savedForms);
            setForms(parsed);
            if (parsed.length > 0) setActiveTab(parsed[0].id);
        } else {
            setForms(DEFAULT_FORMS);
            setActiveTab(DEFAULT_FORMS[0].id);
            localStorage.setItem('hospital_forms_list', JSON.stringify(DEFAULT_FORMS));
        }
    }, []);

    const saveFormList = (updatedForms) => {
        setForms(updatedForms);
        localStorage.setItem('hospital_forms_list', JSON.stringify(updatedForms));
    };

    const handleCreateForm = () => {
        if (!newFormName.trim()) return;

        const newId = `custom_form_${Date.now()}`;
        const newForm = {
            id: newId,
            label: newFormName,
            icon: 'Layout'
        };

        const updated = [...forms, newForm];
        saveFormList(updated);
        setActiveTab(newId);
        setNewFormName('');
        setIsAdding(false);
        addNotification(`Form "${newFormName}" created successfully!`, 'success');
    };

    const handleDeleteForm = (id, e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this form architecture? This cannot be undone.')) {
            const updated = forms.filter(f => f.id !== id);
            saveFormList(updated);
            if (activeTab === id && updated.length > 0) setActiveTab(updated[0].id);
            addNotification('Form architecture deleted.', 'warning');
        }
    };

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'Stethoscope': return Stethoscope;
            case 'ClipboardList': return ClipboardList;
            case 'Microscope': return Microscope;
            default: return Layout;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Layout className="w-8 h-8 text-blue-600" />
                        Clinical Form Manager
                    </h1>
                    <p className="text-gray-500 font-medium">Configure and deploy enterprise medical forms across hospital departments.</p>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                    {isAdding ? (
                        <div className="flex gap-2 items-center bg-white border-2 border-blue-500 p-1 rounded-2xl animate-in slide-in-from-right-4 transition-all w-full lg:w-[400px]">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Enter Form Title..."
                                value={newFormName}
                                onChange={(e) => setNewFormName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateForm()}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold px-4"
                            />
                            <button onClick={handleCreateForm} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 text-gray-400 rounded-xl"><X className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Create New Form
                        </button>
                    )}
                </div>
            </div>

            {/* Tabbed Interface */}
            <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
                <Tabs.List className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide border-b border-gray-100">
                    {forms.map((form) => {
                        const Icon = getIcon(form.icon);
                        return (
                            <Tabs.Trigger
                                key={form.id}
                                value={form.id}
                                className={clsx(
                                    "group flex items-center gap-3 px-6 py-4 rounded-2xl transition-all whitespace-nowrap outline-none border-2",
                                    activeTab === form.id
                                        ? "bg-gray-900 border-gray-900 text-white shadow-xl shadow-secondary-200 scale-105 z-10"
                                        : "bg-white border-gray-50 text-gray-500 hover:border-gray-100 hover:bg-gray-50"
                                )}
                            >
                                <Icon className={clsx("w-5 h-5", activeTab === form.id ? "text-blue-400" : "text-gray-300 group-hover:text-gray-500")} />
                                <span className="font-bold text-sm tracking-tight">{form.label}</span>
                                {forms.length > 2 && (
                                    <button
                                        onClick={(e) => handleDeleteForm(form.id, e)}
                                        className={clsx(
                                            "ml-2 p-1 rounded-md transition-colors",
                                            activeTab === form.id ? "hover:bg-white/10 text-white/40 hover:text-red-400" : "hover:bg-red-50 text-gray-200 hover:text-red-500"
                                        )}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </Tabs.Trigger>
                        );
                    })}
                </Tabs.List>

                <div className="mt-8">
                    {forms.map((form) => (
                        <Tabs.Content key={form.id} value={form.id} className="outline-none focus:outline-none animate-in fade-in duration-500">
                            <FormBuilder formId={form.id} />
                        </Tabs.Content>
                    ))}
                </div>
            </Tabs.Root>
        </div>
    );
};

export default FormAdmin;
