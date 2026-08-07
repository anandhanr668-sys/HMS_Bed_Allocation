import React, { useContext, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PatientContext, PatientStatus } from '../../context/PatientContext';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import {
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  ChevronRight,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Stethoscope,
  ClipboardList,
  MapPin,
  UserCircle2
} from 'lucide-react';
import clsx from 'clsx';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { patients, getPatientVitals, loading } = useContext(PatientContext);
  const { getBedByPatientId } = useContext(HospitalLayoutContext);

  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    return patients.filter(p => {
      const fName = (p.firstName || '').toLowerCase();
      const lName = (p.lastName || '').toLowerCase();
      const pId = (p.patientId || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return fName.includes(term) || lName.includes(term) || pId.includes(term);
    });
  }, [patients, searchTerm]);

  const selectedPatient = useMemo(() =>
    selectedPatientId ? patients.find(p => p.patientId === selectedPatientId) : null
    , [selectedPatientId, patients]);

  const assignedBed = selectedPatient ? getBedByPatientId(selectedPatient.patientId) : null;
  const patientVitals = selectedPatient ? getPatientVitals(selectedPatient.patientId) : null;

  const getStatusConfig = (status) => {
    switch (status) {
      case PatientStatus.REGISTERED:
        return { color: 'blue', icon: Clock, label: 'Registered' };
      case PatientStatus.UNDER_EVALUATION:
        return { color: 'amber', icon: AlertCircle, label: 'Evaluating' };
      case PatientStatus.ADMITTED:
        return { color: 'rose', icon: MapPin, label: 'Admitted' };
      case PatientStatus.UNDER_TREATMENT:
        return { color: 'indigo', icon: Activity, label: 'Treating' };
      case PatientStatus.DISCHARGED:
        return { color: 'emerald', icon: CheckCircle, label: 'Discharged' };
      default:
        return { color: 'slate', icon: UserCircle2, label: 'Unknown' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Users size={28} /></span>
              Patient Directory
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Comprehensive view of all registered patients and their clinical status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[600px]">

          {/* Left Sidebar: Patient List */}
          <div className="lg:col-span-4 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white z-10">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Directory...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold">No patients found</p>
                </div>
              ) : (
                filteredPatients.map(patient => {
                  const status = getStatusConfig(patient.status);
                  const StatusIcon = status.icon;
                  const isSelected = selectedPatientId === patient.patientId;

                  return (
                    <button
                      key={patient.patientId}
                      onClick={() => setSelectedPatientId(patient.patientId)}
                      className={clsx(
                        "w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 group relative",
                        isSelected
                          ? "bg-indigo-50/50 border-indigo-500 shadow-md shadow-indigo-100"
                          : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2",
                            isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-100 text-slate-500 border-slate-200"
                          )}>
                            {patient.firstName[0]}{patient.lastName[0]}
                          </div>
                          <div>
                            <h3 className={clsx("font-black text-sm", isSelected ? "text-indigo-900" : "text-slate-700")}>
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{patient.patientId}</p>
                          </div>
                        </div>
                        {isSelected && <ChevronRight className="text-indigo-500 animate-in slide-in-from-left-2" size={20} />}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5",
                          `bg-${status.color}-50 text-${status.color}-700`
                        )}>
                          <StatusIcon size={12} strokeWidth={3} />
                          {status.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {patient.age} Yrs • {patient.gender}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Patient Details */}
          <div className="lg:col-span-8 space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-12">
            {selectedPatient ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">

                {/* Patient Header Card */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none" />

                  <div className="relative flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-2xl shadow-slate-200">
                        {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">
                          {selectedPatient.firstName} <span className="text-slate-400">{selectedPatient.lastName}</span>
                        </h2>
                        <div className="flex flex-wrap gap-3">
                          <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                            DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                            Blood: {selectedPatient.bloodType || 'N/A'}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                            Phone: {selectedPatient.contactNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {assignedBed ? (
                      <div className="px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center min-w-[140px]">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Assigned Bed</p>
                        <p className="text-2xl font-black text-emerald-700">{assignedBed.bedNumber}</p>
                        <p className="text-xs font-bold text-emerald-600 mt-1">{assignedBed.wardId} Ward</p>
                      </div>
                    ) : (
                      <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 text-center min-w-[140px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bed Status</p>
                        <p className="text-lg font-bold text-slate-500">Not Assigned</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clinical Vitals Grid - Read Only */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all">
                    <div className="absolute right-[-10px] bottom-[-10px] text-indigo-50 rotate-[-15deg] group-hover:scale-110 transition-transform">
                      <Activity size={80} />
                    </div>
                    <div className="relative">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Blood Pressure</p>
                      <p className="text-2xl font-black text-slate-800">
                        {patientVitals?.bloodPressure || '--/--'}
                        <span className="text-sm font-bold text-slate-400 ml-1">mmHg</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-rose-100 transition-all">
                    <div className="absolute right-[-10px] bottom-[-10px] text-rose-50 rotate-[-15deg] group-hover:scale-110 transition-transform">
                      <Heart size={80} />
                    </div>
                    <div className="relative">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Heart Rate</p>
                      <p className="text-2xl font-black text-slate-800">
                        {patientVitals?.heartRate || '--'}
                        <span className="text-sm font-bold text-slate-400 ml-1">bpm</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-orange-100 transition-all">
                    <div className="absolute right-[-10px] bottom-[-10px] text-orange-50 rotate-[-15deg] group-hover:scale-110 transition-transform">
                      <Thermometer size={80} />
                    </div>
                    <div className="relative">
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Temperature</p>
                      <p className="text-2xl font-black text-slate-800">
                        {patientVitals?.temperature || '--'}
                        <span className="text-sm font-bold text-slate-400 ml-1">°F</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-100 transition-all">
                    <div className="absolute right-[-10px] bottom-[-10px] text-blue-50 rotate-[-15deg] group-hover:scale-110 transition-transform">
                      <Wind size={80} />
                    </div>
                    <div className="relative">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Respiratory</p>
                      <p className="text-2xl font-black text-slate-800">
                        {patientVitals?.respiratoryRate || '--'}
                        <span className="text-sm font-bold text-slate-400 ml-1">/min</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Grid: Clinical History & Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm h-full">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                      <ClipboardList size={20} className="text-indigo-500" /> Clinical History
                    </h3>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {(!selectedPatient.clinicalHistory || selectedPatient.clinicalHistory.length === 0) ? (
                        <p className="text-slate-400 italic text-sm">No clinical history recorded.</p>
                      ) : (
                        selectedPatient.clinicalHistory.map((history, idx) => (
                          <div key={idx} className="relative pl-6 pb-6 border-l-2 border-slate-100 last:border-0 last:pb-0">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-100" />
                            <p className="text-xs font-bold text-slate-400 mb-1">{new Date(history.date).toLocaleDateString()}</p>
                            <p className="text-sm font-bold text-slate-800">{history.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm h-full">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                      <Stethoscope size={20} className="text-indigo-500" /> Consultation Notes
                    </h3>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {(!selectedPatient.consultationNotes || selectedPatient.consultationNotes.length === 0) ? (
                        <p className="text-slate-400 italic text-sm">No consultation notes available.</p>
                      ) : (
                        selectedPatient.consultationNotes.map((note, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-black text-indigo-500 uppercase">{note.doctorName || 'Doctor'}</span>
                              <span className="text-[10px] font-bold text-slate-400">{new Date(note.date).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{note.note}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50 min-h-[400px]">
                <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <UserCircle2 size={64} className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-300">No Patient Selected</h3>
                <p className="text-slate-400 font-medium max-w-sm mt-2">
                  Select a patient from the directory directory to view their clinical details and status.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
