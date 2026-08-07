import React, { useContext, useState } from 'react';
import { PatientContext, PatientStatus } from '../../context/PatientContext';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import { FileText, Download, CheckCircle, AlertCircle, Calendar, Clock, Pill, Heart } from 'lucide-react';

export const DischargeSummary = ({ patientId, onDischargeComplete }) => {
  const { getPatient, updatePatientStatus, deallocateBed } = useContext(PatientContext);
  const { deallocateBedFromContext } = useContext(HospitalLayoutContext);
  const [showDisclosures, setShowDisclosures] = useState(false);
  const [discharged, setDischarged] = useState(false);

  const patient = getPatient(patientId);

  if (!patient) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg">Patient not found</div>;
  }

  const handleDischarge = () => {
    if (!confirm(`Confirm discharge for ${patient.firstName} ${patient.lastName}?`)) return;

    // Update patient status to discharged
    updatePatientStatus(patientId, PatientStatus.DISCHARGED);

    // Free up the bed
    if (patient.allocatedBedId) {
      deallocateBed(patientId);
      deallocateBedFromContext(patient.allocatedBedId);
    }

    setDischarged(true);

    // Trigger callback after 2 seconds
    setTimeout(() => {
      if (onDischargeComplete) {
        onDischargeComplete(patient);
      }
    }, 2000);
  };

  const handleDownloadSummary = () => {
    const summary = `
HOSPITAL DISCHARGE SUMMARY
================================
Generated: ${new Date().toLocaleString()}

PATIENT INFORMATION
-------------------
Name: ${patient.firstName} ${patient.lastName}
Patient ID: ${patient.patientId}
Age: ${patient.age} years
Gender: ${patient.gender}
Blood Group: ${patient.bloodGroup || 'Not recorded'}

ADMISSION DETAILS
-----------------
Date of Admission: ${new Date(patient.registeredAt).toLocaleDateString()}
Ward/Bed: ${patient.allocatedBedId || 'Not allocated'}
Primary Condition: ${patient.condition}
  Risk Level at Discharge: ${patient.riskLevel || 'LOW'}

VITALS AT DISCHARGE
-------------------
${patient.vitals ? `
SpO₂: ${patient.vitals.spo2}%
Heart Rate: ${patient.vitals.bpm} bpm
Blood Pressure: ${patient.vitals.bp_systolic}/${patient.vitals.bp_diastolic} mmHg
Temperature: ${patient.vitals.temperature}°C
` : 'No vitals recorded'}

CLINICAL NOTES
--------------
Patient has completed treatment and is cleared for discharge.
Follow-up appointments may be scheduled as per clinical recommendation.

DISCHARGE MEDICATIONS
---------------------
(To be filled by attending physician)
1. [Medication Name] - [Dosage] - [Frequency] - [Duration]
2. [Medication Name] - [Dosage] - [Frequency] - [Duration]

FOLLOW-UP INSTRUCTIONS
----------------------
1. Rest for at least 3-5 days
2. Take all medications as prescribed
3. Maintain a healthy diet
4. Avoid strenuous activities
5. Keep follow-up appointments
6. Report any unusual symptoms immediately

DOCTOR'S SIGNATURE
-------------------
Dr. [Name] | Signature: _________________ | Date: _________________

PATIENT/GUARDIAN ACKNOWLEDGMENT
-------------------------------
I acknowledge that I have received a copy of this discharge summary
and understand the discharge instructions.

Signature: _________________ | Date: _________________
`;

    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Discharge_Summary_${patient.patientId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (discharged) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-12 text-white shadow-2xl text-center">
            <CheckCircle size={64} className="mx-auto mb-4 text-green-100" />
            <h1 className="text-5xl font-bold mb-3">Patient Successfully Discharged</h1>
            <p className="text-green-100 text-xl mb-6">Bed {patient.allocatedBedId} has been freed and is now available for new patients</p>
            
            <div className="bg-white/15 rounded-xl p-6 inline-block backdrop-blur-md">
              <p className="text-lg font-semibold text-green-50">
                {patient.firstName} {patient.lastName} ({patient.patientId})
              </p>
              <p className="text-green-100 text-sm mt-1">Discharged on {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <FileText size={40} className="text-blue-100" />
            <div>
              <h1 className="text-4xl font-bold">Discharge Summary</h1>
              <p className="text-blue-100 mt-2">Final patient status before discharge</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 border-t border-blue-400 pt-4">
            <div>
              <p className="text-blue-100 text-xs uppercase tracking-tight">Patient Name</p>
              <p className="text-lg font-bold">{patient.firstName} {patient.lastName}</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs uppercase tracking-tight">Patient ID</p>
              <p className="text-lg font-bold">{patient.patientId}</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs uppercase tracking-tight">Admission Date</p>
              <p className="text-lg font-bold">{new Date(patient.registeredAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Patient Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Patient Demographics */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Heart className="text-blue-600" size={28} /> Patient Information
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-semibold">Age</span>
                <span className="text-gray-900 font-bold">{patient.age} years</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-semibold">Gender</span>
                <span className="text-gray-900 font-bold">{patient.gender}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-semibold">Blood Group</span>
                <span className="text-gray-900 font-bold">{patient.bloodGroup || 'Not recorded'}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-600 font-semibold">Contact</span>
                <span className="text-gray-900 font-bold">{patient.contact || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Medical Summary */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Pill className="text-green-600" size={28} /> Medical Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-semibold">Condition</span>
                <span className="text-gray-900 font-bold">{patient.condition}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-semibold">Risk Level</span>
                <span className={`font-bold px-3 py-1 rounded-full ${
                  patient.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                  patient.riskLevel === 'MODERATE' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {patient.riskLevel || 'LOW'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 font-semibold">Bed Allocated</span>
                <span className="text-gray-900 font-bold">{patient.allocatedBedId || 'None'}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-600 font-semibold">Status</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold text-sm">
                  ADMITTED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vital Signs at Discharge */}
        {patient.vitals && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="text-purple-600" size={28} /> Final Vital Signs
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center border border-blue-200">
                <p className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-tight">SpO₂</p>
                <p className="text-4xl font-black text-blue-600">{patient.vitals.spo2}%</p>
                <p className="text-xs text-gray-600 mt-2">Oxygen Saturation</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl text-center border border-red-200">
                <p className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-tight">BPM</p>
                <p className="text-4xl font-black text-red-600">{patient.vitals.bpm}</p>
                <p className="text-xs text-gray-600 mt-2">Heart Rate</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center border border-green-200">
                <p className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-tight">BP</p>
                <p className="text-3xl font-black text-green-600">{patient.vitals.bp_systolic}/{patient.vitals.bp_diastolic}</p>
                <p className="text-xs text-gray-600 mt-2">Blood Pressure (mmHg)</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl text-center border border-orange-200">
                <p className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-tight">Temperature</p>
                <p className="text-4xl font-black text-orange-600">{patient.vitals.temperature}°C</p>
                <p className="text-xs text-gray-600 mt-2">Core Temperature</p>
              </div>
            </div>
          </div>
        )}

        {/* Important Notices */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={32} />
            <div>
              <h3 className="text-xl font-bold text-amber-900 mb-3">Important - Discharge Information</h3>
              <ul className="space-y-2 text-amber-800 text-sm font-medium">
                <li>✓ Patient has completed treatment protocol</li>
                <li>✓ All vital signs are within acceptable range for discharge</li>
                <li>✓ Bed will be immediately freed and made available for new patients</li>
                <li>✓ Follow-up medications and instructions will be provided</li>
                <li>✓ Patient should schedule follow-up appointments as recommended</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleDownloadSummary}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition active:scale-95"
          >
            <Download size={20} /> Download Summary
          </button>
          <button
            onClick={() => setShowDisclosures(!showDisclosures)}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition active:scale-95"
          >
            <FileText size={20} /> View Disclosures
          </button>
          <button
            onClick={handleDischarge}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition active:scale-95 shadow-lg"
          >
            <CheckCircle size={20} /> Confirm Discharge
          </button>
        </div>

        {/* Disclosures Section */}
        {showDisclosures && (
          <div className="mt-8 bg-gray-900 text-white rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-4">Patient Disclosures & Acknowledgments</h3>
            <div className="space-y-4 text-sm leading-relaxed max-h-96 overflow-y-auto">
              <p>
                <strong>☐ Medical Records Provided:</strong> Patient acknowledges receipt of complete medical records including discharge summary, test results, and imaging reports.
              </p>
              <p>
                <strong>☐ Medication Instructions:</strong> Patient understands all prescribed medications, dosages, frequencies, and potential side effects.
              </p>
              <p>
                <strong>☐ Follow-up Care:</strong> Patient agrees to attend all scheduled follow-up appointments and contact hospital if any complications arise.
              </p>
              <p>
                <strong>☐ Discharge Against Medical Advice (if applicable):</strong> Patient is discharging as advised by medical team without any reservations.
              </p>
              <p>
                <strong>☐ Data Privacy:</strong> Patient consents to secure storage of medical data in hospital information system for continuity of care.
              </p>
              <p>
                <strong>☐ Emergency Contact:</strong> Patient understands emergency contact procedures and hotline numbers for urgent post-discharge concerns.
              </p>
            </div>
            <label className="flex items-center gap-3 mt-6 cursor-pointer">
              <input type="checkbox" className="w-5 h-5" />
              <span className="text-white">I acknowledge all of the above disclosures</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
