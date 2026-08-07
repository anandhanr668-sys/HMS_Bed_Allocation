import React, { useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';

const DynamicFormRenderer = ({ schema, onSubmit, initialData = {} }) => {
    const [formData, setFormData] = useState(initialData);

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderField = (field) => {
        const commonClasses = "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
        const value = formData[field.id] || '';

        switch (field.type) {
            case 'text':
                return <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={commonClasses}
                    required={field.required}
                />;
            case 'number':
                return <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={commonClasses}
                    required={field.required}
                />;
            case 'textarea':
                return <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={commonClasses}
                    required={field.required}
                />;
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        className={commonClasses}
                        required={field.required}
                    >
                        <option value="">Select option...</option>
                        {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                );
            case 'checkbox':
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => handleChange(field.id, e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-600">{field.label} {field.required && '*'}</span>
                    </div>
                );
            case 'date':
                return <input
                    type="date"
                    value={value}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className={commonClasses}
                    required={field.required}
                />;
            case 'section':
                return (
                    <div className="border-b-2 border-slate-100 pb-2 mb-4 mt-6">
                        <h3 className="text-lg font-bold text-slate-800">{field.label}</h3>
                        <p className="text-sm text-slate-500">{field.description}</p>
                    </div>
                );
            case 'vital':
                return (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <Activity size={16} className="text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-900">{field.label}</span>
                        <input
                            type="number"
                            value={value}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            className="w-20 ml-auto bg-white border border-emerald-200 rounded px-2 py-1 text-sm outline-none focus:border-emerald-500 transition-colors"
                            placeholder="Value"
                            required={field.required}
                        />
                        <span className="text-xs font-bold text-emerald-500">Unit</span>
                    </div>
                );
            case 'note':
                return (
                    <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        {field.label}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {schema.map(field => (
                <div key={field.id} className={field.type === 'section' ? 'col-span-full' : ''}>
                    {field.type !== 'checkbox' && field.type !== 'section' && field.type !== 'note' && (
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                    )}
                    {renderField(field)}
                    {field.description && field.type !== 'section' && <p className="text-xs text-slate-400 mt-1">{field.description}</p>}
                </div>
            ))}
            <div className="pt-6">
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                    Submit Form
                </button>
            </div>
        </form>
    );
};

export default DynamicFormRenderer;
