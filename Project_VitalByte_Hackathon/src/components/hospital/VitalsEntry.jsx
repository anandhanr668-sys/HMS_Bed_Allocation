import React, { useContext, useState } from 'react';
import { PatientContext, PatientStatus } from '../../context/PatientContext';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import { evaluateRisk, allocateBed } from '../../services/lcncAllocationService';
import { Heart, Activity, AlertCircle, CheckCircle } from 'lucide-react';

export const VitalsEntry = ({ patientId, onVitalsRecorded }) => {
  const { getPatient, recordVitals, updatePatientStatus, updatePatientRiskLevel, allocateBedToPatient } = useContext(PatientContext);
  const { conditionMapping, getAvailableBeds, allocateBed: allocateBedInContext } = useContext(HospitalLayoutContext);

  const patient = getPatient(patientId);
  const [vitals, setVitals] = useState({
    spo2: '',           // Oxygen saturation
    bpm: '',            // Heart rate
    bp_systolic: '',    // Blood pressure systolic
    bp_diastolic: '',   // Blood pressure diastolic
    temperature: ''     // Temperature
  });

  const [evaluationStep, setEvaluationStep] = useState('input');  // input, evaluating, results
  const [riskResult, setRiskResult] = useState(null);
  const [allocationResult, setAllocationResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!patient) {
    return <div className="p-4 bg-red-50 text-red-700 rounded">Patient not found</div>;
  }

  const validateVitals = () => {
    if (!vitals.spo2 || !vitals.bpm || !vitals.bp_systolic || !vitals.bp_diastolic || !vitals.temperature) {
      setError('Please enter all vital signs');
      return false;
    }

    const spo2 = parseInt(vitals.spo2);
    const bpm = parseInt(vitals.bpm);
    const temp = parseFloat(vitals.temperature);

    if (spo2 < 0 || spo2 > 100) {
      setError('SpO₂ must be between 0-100%');
      return false;
    }
    if (bpm < 40 || bpm > 200) {
      setError('BPM must be between 40-200');
      return false;
    }
    if (temp < 35 || temp > 42) {
      setError('Temperature must be between 35-42°C');
      return false;
    }

    return true;
  };

  const handleSubmitVitals = () => {
    setError('');
    setSuccess('');

    if (!validateVitals()) {
      return;
    }

    // Step 3 Complete: Record vitals
    recordVitals(patientId, {
      spo2: parseInt(vitals.spo2),
      bpm: parseInt(vitals.bpm),
      bp_systolic: parseInt(vitals.bp_systolic),
      bp_diastolic: parseInt(vitals.bp_diastolic),
      temperature: parseFloat(vitals.temperature)
    });

    updatePatientStatus(patientId, PatientStatus.VITALS_RECORDED);
    setEvaluationStep('evaluating');

    // Step 4: Risk Evaluation with vitals
    setTimeout(() => {
      const vitalsData = {
        spo2: parseInt(vitals.spo2),
        bpm: parseInt(vitals.bpm),
        bp_systolic: parseInt(vitals.bp_systolic),
        bp_diastolic: parseInt(vitals.bp_diastolic),
        temperature: parseFloat(vitals.temperature)
      };

      const riskLevel = evaluateRisk(patient, vitalsData);
      updatePatientRiskLevel(patientId, riskLevel);
      updatePatientStatus(patientId, PatientStatus.RISK_EVALUATED);

      setRiskResult({
        riskLevel,
        vitals: vitalsData,
        details: getRiskDetails(riskLevel, vitalsData)
      });

      setSuccess(`Risk Evaluation Complete: ${riskLevel} RISK`);
      setEvaluationStep('results');

      // Step 5: Auto-allocate bed
      setTimeout(() => {
        handleBedAllocation(riskLevel);
      }, 1500);
    }, 1000);
  };

  const handleBedAllocation = (riskLevel) => {
    const result = allocateBed(riskLevel, patient.condition, conditionMapping, getAvailableBeds);

    if (result.success) {
      allocateBedInContext(result.bed.bedId, patientId, `${patient.firstName} ${patient.lastName}`);
      allocateBedToPatient(patientId, result.bed.bedId);
      updatePatientStatus(patientId, PatientStatus.ADMITTED);

      setAllocationResult({
        bed: result.bed,
        success: true
      });

      setSuccess(`✅ Bed ${result.bed.bedNumber} allocated in ${result.bed.wardName}!`);
      // Screen will remain open for user review - no auto-closing
    } else {
      setAllocationResult({
        success: false,
        message: result.message
      });
      setError(`Bed Allocation Failed: ${result.message}`);
    }
  };

  const handleCompleteAdmission = () => {
    if (onVitalsRecorded) {
      onVitalsRecorded(patient);
    }
  };

  const getRiskDetails = (riskLevel, vitalsData) => {
    const { spo2, bpm, temperature, bp_systolic } = vitalsData;
    const details = [];

    if (spo2 < 92) details.push(`⚠️ Low SpO₂: ${spo2}% (Normal: 95-100%)`);
    if (bpm > 100) details.push(`⚠️ High Heart Rate: ${bpm} bpm (Normal: 60-100)`);
    if (bpm < 60) details.push(`⚠️ Low Heart Rate: ${bpm} bpm (Normal: 60-100)`);
    if (temperature > 38) details.push(`⚠️ High Temperature: ${temperature}°C (Normal: 36.5-37.5°C)`);
    if (temperature < 36.5) details.push(`⚠️ Low Temperature: ${temperature}°C (Normal: 36.5-37.5°C)`);
    if (bp_systolic > 140) details.push(`⚠️ High BP: ${bp_systolic} mmHg (Normal: 90-140)`);
    if (bp_systolic < 90) details.push(`⚠️ Low BP: ${bp_systolic} mmHg (Normal: 90-140)`);

    return details.length > 0 ? details : ['✅ All vital signs within normal range'];
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="w-full max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-8 text-white shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <Heart size={40} className="text-red-100" />
            <div>
              <h1 className="text-4xl font-bold">Vital Signs Entry</h1>
              <p className="text-red-100 mt-2">Step 3: Record and evaluate patient vitals</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 border-t border-red-400 pt-4">
            <div>
              <p className="text-red-100 text-xs uppercase tracking-tight">Patient Name</p>
              <p className="text-lg font-bold">{patient.firstName} {patient.lastName}</p>
            </div>
            <div>
              <p className="text-red-100 text-xs uppercase tracking-tight">Patient ID</p>
              <p className="text-lg font-bold">{patient.patientId}</p>
            </div>
            <div>
              <p className="text-red-100 text-xs uppercase tracking-tight">Condition</p>
              <p className="text-lg font-bold">{patient.condition}</p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        <div className="w-full max-w-6xl mx-auto px-6">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Step 1: Vitals Input */}
        {evaluationStep === 'input' && (
          <div className="bg-white rounded-xl shadow-xl p-10 border border-red-100">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Step 3: Enter Patient Vitals</h2>
              
              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      SpO₂ (Oxygen Saturation) % *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={vitals.spo2}
                      onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="95"
                    />
                    <p className="text-xs text-slate-600 mt-2 font-semibold">📊 Normal: 95-100% | High Risk: &lt;92%</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      BPM (Heart Rate) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={vitals.bpm}
                      onChange={(e) => setVitals({ ...vitals, bpm: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="72"
                    />
                    <p className="text-xs text-slate-600 mt-2 font-semibold">📊 Normal: 60-100 bpm | High Risk: &gt;110</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Blood Pressure Systolic (mmHg) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="250"
                      value={vitals.bp_systolic}
                      onChange={(e) => setVitals({ ...vitals, bp_systolic: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="120"
                    />
                    <p className="text-xs text-slate-600 mt-2 font-semibold">📊 Normal: 90-140 mmHg | High Risk: &gt;160</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Blood Pressure Diastolic (mmHg) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={vitals.bp_diastolic}
                      onChange={(e) => setVitals({ ...vitals, bp_diastolic: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="80"
                    />
                    <p className="text-xs text-slate-600 mt-2 font-semibold">📊 Normal: 60-90 mmHg</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Temperature (°C) *
                  </label>
                  <input
                    type="number"
                    min="35"
                    max="42"
                    step="0.1"
                    value={vitals.temperature}
                    onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="37.0"
                  />
                  <p className="text-xs text-slate-600 mt-2 font-semibold">📊 Normal: 36.5-37.5°C | High Risk: &gt;39°C or &lt;36°C</p>
                </div>
              </div>

              <button
                onClick={handleSubmitVitals}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-lg hover:from-red-700 hover:to-orange-700 font-bold transition text-lg shadow-lg"
              >
                Submit Vitals & Evaluate Risk
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Risk Evaluation */}
        {evaluationStep === 'evaluating' && (
          <div className="bg-white rounded-xl shadow-xl p-10 text-center border border-red-100">
            <Activity size={48} className="text-orange-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Step 4: Risk Evaluation</h2>
            <p className="text-slate-600 mb-4">Analyzing vital signs against clinical thresholds...</p>
            <p className="text-sm text-slate-500">Please wait...</p>
          </div>
        )}

        {/* Step 3: Risk Results & Bed Allocation */}
        {evaluationStep === 'results' && riskResult && (
          <div className="space-y-6">
            {/* Risk Result Card */}
            <div className={`rounded-xl shadow-xl p-10 text-white ${
              riskResult.riskLevel === 'HIGH' ? 'bg-gradient-to-r from-red-600 to-red-700' :
              riskResult.riskLevel === 'MODERATE' ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
              'bg-gradient-to-r from-green-600 to-emerald-700'
            }`}>
              <h2 className="text-4xl font-bold mb-3">Risk Level: {riskResult.riskLevel}</h2>
              <p className="text-lg mb-8 opacity-90">Based on vital signs analysis</p>

              {/* Vital Signs Summary */}
              <div className="bg-white/15 rounded-lg p-6 mb-8 border border-white/20">
                <h3 className="text-xl font-semibold mb-4">Recorded Vital Signs:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-white/80 text-xs uppercase tracking-tight">SpO₂</p>
                    <p className="font-bold text-2xl mt-1">{riskResult.vitals.spo2}%</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-white/80 text-xs uppercase tracking-tight">Heart Rate</p>
                    <p className="font-bold text-2xl mt-1">{riskResult.vitals.bpm} bpm</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-white/80 text-xs uppercase tracking-tight">Blood Pressure</p>
                    <p className="font-bold text-2xl mt-1">{riskResult.vitals.bp_systolic}/{riskResult.vitals.bp_diastolic}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg">
                    <p className="text-white/80 text-xs uppercase tracking-tight">Temperature</p>
                    <p className="font-bold text-2xl mt-1">{riskResult.vitals.temperature}°C</p>
                  </div>
                </div>
              </div>

              {/* Risk Details */}
              <div className="space-y-2 border-t border-white/20 pt-6">
                <p className="font-semibold mb-3">Clinical Assessment:</p>
                {riskResult.details.map((detail, idx) => (
                  <p key={idx} className="text-sm opacity-90">{detail}</p>
                ))}
              </div>
            </div>

            {/* Bed Allocation Result */}
            {allocationResult && (
              allocationResult.success ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg p-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-green-600 text-white p-3 rounded-full">
                      <CheckCircle size={40} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-green-800">Bed Allocated Successfully!</h3>
                      <p className="text-green-600 text-sm mt-1">Step 5: Patient assigned and ready for admission</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-white p-6 rounded-xl text-center border border-green-200 shadow-sm">
                      <p className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-tight">Bed Number</p>
                      <p className="text-5xl font-black text-green-600">{allocationResult.bed.bedNumber}</p>
                      <p className="text-xs text-gray-500 mt-2">Unique Identifier</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl text-center border border-green-200 shadow-sm">
                      <p className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-tight">Ward</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{allocationResult.bed.wardName}</p>
                      <p className="text-xs text-gray-500 mt-2">Department</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl text-center border border-green-200 shadow-sm">
                      <p className="text-gray-600 text-sm font-bold mb-2 uppercase tracking-tight">Bed Type</p>
                      <p className="text-lg font-bold text-slate-900 mt-2">{allocationResult.bed.bedTypeName}</p>
                      <p className="text-xs text-gray-500 mt-2">Equipment Type</p>
                    </div>
                  </div>

                  <p className="text-center text-green-700 mt-8 font-semibold text-lg">
                    ✅ Patient successfully admitted. Ready for medical care.
                  </p>

                  <div className="flex gap-4 justify-center mt-8">
                    <button
                      onClick={handleCompleteAdmission}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg"
                    >
                      Complete Admission & Return to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl shadow-lg p-10 text-center">
                  <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-red-800 mb-2">Allocation Failed</h3>
                  <p className="text-red-600 font-semibold">{allocationResult.message}</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
