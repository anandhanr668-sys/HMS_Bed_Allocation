import React, { useState } from 'react';
import clsx from 'clsx';
import {
    CheckCircle,
    AlertCircle,
    Calendar,
    Type,
    List,
    Hash,
    AlignLeft,
    CheckSquare,
    Zap,
    Send
} from 'lucide-react';

const FormRenderer = ({ schema, onSubmit, title, description, isPreview }) => {
    const [formData, setFormData] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) onSubmit(formData);
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 5000);
    };

    if (!schema || schema.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <AlertCircle className="w-10 h-10 text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Form Schema Detected</p>
                <p className="text-gray-400 text-[10px] mt-1">Configure your form architecture in the Builder canvas.</p>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-12 text-center animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
                    <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 tracking-tight">Data Synchronized!</h3>
                <p className="text-emerald-700 font-medium mt-2 max-w-sm mx-auto">
                    The clinical records have been successfully captured and committed to the secure hospital ledger.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-secondary-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Form Header */}
            {(title || description) && (
                <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title || 'Dynamic Clinical Form'}</h2>
                    </div>
                    {description && <p className="text-gray-500 font-medium text-sm ml-12">{description}</p>}
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                    {schema.filter(field => {
                        if (!field.logic || !field.logic.showIfField) return true;
                        const dependentValue = formData[field.logic.showIfField];
                        return dependentValue === field.logic.showIfValue;
                    }).map((field) => {
                        if (field.type === 'header') {
                            return (
                                <div key={field.id} className="md:col-span-2 pt-8 pb-4 border-b-2 border-slate-900 mb-4 animate-in fade-in duration-500">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                        {field.label}
                                    </h3>
                                    {field.helperText && <p className="text-xs text-slate-500 font-bold mt-1 ml-4 italic">{field.helperText}</p>}
                                </div>
                            );
                        }

                        return (
                            <div
                                key={field.id}
                                className={clsx(
                                    "flex flex-col gap-2.5 animate-in slide-in-from-left-4 duration-300",
                                    field.width === 'half' ? "md:col-span-1" : "md:col-span-2"
                                )}
                            >
                                <label htmlFor={field.id} className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500 text-lg leading-none">*</span>}
                                </label>

                                <div className="relative group">
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            id={field.id}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 min-h-[120px] resize-none"
                                            onChange={(e) => handleChange(field.id, e.target.value)}
                                        />
                                    ) : field.type === 'select' ? (
                                        <div className="relative">
                                            <select
                                                id={field.id}
                                                required={field.required}
                                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 appearance-none bg-white"
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                            >
                                                <option value="">Choose an option...</option>
                                                {field.options && field.options.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <List className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type={field.type}
                                                id={field.id}
                                                required={field.required}
                                                placeholder={field.placeholder}
                                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors">
                                                {field.type === 'date' && <Calendar className="w-5 h-5" />}
                                                {field.type === 'number' && <Hash className="w-5 h-5" />}
                                                {field.type === 'text' && <Type className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {field.helperText && <p className="text-[10px] font-bold text-gray-400 ml-1 italic">{field.helperText}</p>}
                            </div>
                        );
                    })}
                </div>

                {!isPreview && (
                    <div className="pt-8 flex justify-end">
                        <button
                            type="submit"
                            className="group flex items-center gap-3 px-10 py-5 bg-gray-900 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-secondary-900/20 active:scale-95"
                        >
                            Submit Response
                            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>
                )}
            </form>

            <div className="px-10 py-4 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center text-[10px] font-black uppercase tracking-tighter text-gray-400">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> SECURE END-TO-END DATA FLOW</span>
                <span>SYSTEM ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
        </div>
    );
};

export default FormRenderer;
