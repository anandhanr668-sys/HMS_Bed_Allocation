import React from 'react';
import { Settings, X, Check, Save } from 'lucide-react';
import clsx from 'clsx';

export const ReportConfigurator = ({ config, setConfig, onGenerate, onClose }) => {
    const sections = [
        { key: 'demographics', label: 'Patient Demographics', group: 'Basic' },
        { key: 'visitDetails', label: 'Doctor & Visit Details', group: 'Basic' },
        { key: 'caseSheet', label: 'Clinical Case Sheet Summary', group: 'Clinical' },
        { key: 'investigations', label: 'Investigation Reports', group: 'Clinical' },
        { key: 'medications', label: 'Medications & Treatment', group: 'Clinical' },
        { key: 'advice', label: 'Doctor Advice & Follow-up', group: 'Clinical' },
        { key: 'billing', label: 'Billing Summary', group: 'Admin' },
        { key: 'showAmounts', label: 'Show Payment Amounts', group: 'Admin' },
        { key: 'hideSensitive', label: 'Hide Sensitive Fertility History', group: 'Security' },
        { key: 'hideDetailedHistory', label: 'Hide Male/Female Detailed History', group: 'Security' }
    ];

    const toggleSection = (key) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const groupedSections = sections.reduce((acc, section) => {
        if (!acc[section.group]) acc[section.group] = [];
        acc[section.group].push(section);
        return acc;
    }, {});

    return (
        <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Report Config</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customize Output</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {Object.entries(groupedSections).map(([group, items]) => (
                    <div key={group} className="space-y-3">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{group}</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {items.map(item => (
                                <label key={item.key} className={clsx(
                                    "flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border",
                                    config[item.key] ? "bg-blue-50 border-blue-100" : "bg-white border-gray-100 hover:border-gray-200"
                                )}>
                                    <span className={clsx("text-sm font-bold", config[item.key] ? "text-blue-700" : "text-gray-600")}>{item.label}</span>
                                    <div
                                        onClick={() => toggleSection(item.key)}
                                        className={clsx(
                                            "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                            config[item.key] ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-transparent"
                                        )}
                                    >
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                    <input type="checkbox" className="hidden" checked={config[item.key]} onChange={() => { }} />
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                <button
                    onClick={onGenerate}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
                >
                    <Save size={18} /> Generate Final Report
                </button>
            </div>
        </div>
    );
};
