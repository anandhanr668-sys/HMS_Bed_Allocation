import React from 'react';
import { Activity, HeartPulse, Gauge, Thermometer } from 'lucide-react';

const VitalsCard = ({ label, value, unit, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-all">
        <div className={`p-3 rounded-2xl bg-gray-50 ${color} group-hover:scale-110 transition-transform`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-black text-gray-900 leading-none mt-1">
                {value || '--'}<span className="text-[10px] ml-1 text-gray-400">{unit}</span>
            </p>
        </div>
    </div>
);

const VitalsGrid = ({ patientVitals }) => {
    return (
        <div className="grid grid-cols-4 gap-4">
            <VitalsCard label="SpO2" value={patientVitals?.spo2} unit="%" icon={Activity} color="text-emerald-500" />
            <VitalsCard label="Heart Rate" value={patientVitals?.bpm} unit="BPM" icon={HeartPulse} color="text-red-500" />
            <VitalsCard label="BP (Sys/Dia)" value={patientVitals ? `${patientVitals.bp_systolic}/${patientVitals.bp_diastolic}` : null} unit="mmHg" icon={Gauge} color="text-indigo-500" />
            <VitalsCard label="Temperature" value={patientVitals?.temperature} unit="°F" icon={Thermometer} color="text-amber-500" />
        </div>
    );
};

export default VitalsGrid;
