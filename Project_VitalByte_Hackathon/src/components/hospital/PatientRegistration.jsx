import React, { useContext, useState } from 'react';
import { PatientContext, PatientStatus } from '../../context/PatientContext';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export const PatientRegistration = ({ onRegistrationComplete }) => {
  const { registerPatient } = useContext(PatientContext);
  const { conditionMapping } = useContext(HospitalLayoutContext);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '', // Replaces strict age calculation often
    age: '',
    gender: '',
    bloodType: '',
    contactNumber: '',
    condition: '',
    symptoms: ''
  });

  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const conditions = conditionMapping.map(cm => cm.condition);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    // Auto-calculate Age if DOB changes
    if (name === 'dateOfBirth' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age: age.toString(), [name]: value }));
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.age || !formData.gender || !formData.condition) {
      setError('Please fill all required fields');
      return;
    }

    if (parseInt(formData.age) < 0 || parseInt(formData.age) > 150) {
      setError('Please enter a valid age');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Step 2: Register Patient
      // Backend expects consistent keys matching PatientContext
      const patient = await registerPatient({
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: parseInt(formData.age),
        dateOfBirth: formData.dateOfBirth || new Date().toISOString(), // Fallback if not provided, though encouraged
        gender: formData.gender,
        bloodType: formData.bloodType || 'Unknown',
        contactNumber: formData.contactNumber,
        condition: formData.condition,
        symptoms: formData.symptoms
      });

      // Patient registered with VITALS_PENDING status (waiting for vitals entry)
      setRegisteredPatient(patient);
      setSuccess(`✅ ${patient.firstName} ${patient.lastName} registered successfully!`);

      // Notify parent component to proceed to vitals entry
      setTimeout(() => {
        if (onRegistrationComplete) {
          onRegistrationComplete(patient);
        }
      }, 1500);
    } catch (err) {
      setError('Failed to register patient: ' + (err.message || 'Unknown error'));
      setSuccess('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: '',
      gender: '',
      bloodType: '',
      contactNumber: '',
      condition: '',
      symptoms: ''
    });
    setRegisteredPatient(null);
    setError('');
    setSuccess('');
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-0">
      <div className="w-screen max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-none p-8 text-white shadow-lg w-full">
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <UserPlus size={40} className="text-blue-100" />
              <div>
                <h1 className="text-4xl font-bold">Patient Registration</h1>
                <p className="text-blue-100 mt-1">Step 2: Register new patient details</p>
              </div>
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

        {/* Main Form */}
        <div className="bg-white rounded-none shadow-xl p-10 border-t border-blue-100 w-full">
          <div className="w-full max-w-6xl mx-auto">
            <form onSubmit={handleRegisterPatient} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* DOB & Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="0"
                    max="150"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    placeholder="35"
                  // Age is typically derived or manual override
                  />
                </div>
              </div>

              {/* Gender, Blood, Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Blood Type
                  </label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
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
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Medical Condition *
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Condition</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Symptoms (Optional)
                </label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe patient symptoms..."
                  rows="4"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSubmitting ? 'Registering...' : 'Register Patient'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-bold transition"
                >
                  Clear Form
                </button>
              </div>

              <p className="text-sm text-blue-600 text-center font-medium pt-4 border-t border-blue-100">
                After registration, patient will proceed to vital signs entry (Step 3)
              </p>
            </form>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="w-full bg-white py-12 px-6 border-t border-gray-200">
          <div className="w-full max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Hospital Workflow</h2>
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-gray-100 rounded-xl p-5 text-center border border-gray-200 hover:shadow-lg transition">
                <div className="bg-gray-400 text-white rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 font-bold text-lg">1</div>
                <p className="font-bold text-gray-900 text-sm">Admin Config</p>
                <p className="text-xs text-gray-600 mt-1">Setup & Protocols</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-5 text-center ring-2 ring-blue-400 hover:shadow-lg transition border border-blue-200">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 font-bold text-lg">2</div>
                <p className="font-bold text-gray-900 text-sm">Registration</p>
                <p className="text-xs text-gray-600 mt-1">Patient Details</p>
              </div>
              <div className="bg-gray-100 rounded-xl p-5 text-center border border-gray-200 hover:shadow-lg transition">
                <div className="bg-gray-400 text-white rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 font-bold text-lg">3</div>
                <p className="font-bold text-gray-900 text-sm">Vitals Entry</p>
                <p className="text-xs text-gray-600 mt-1">SpO₂, BPM, BP, Temp</p>
              </div>
              <div className="bg-gray-100 rounded-xl p-5 text-center border border-gray-200 hover:shadow-lg transition">
                <div className="bg-gray-400 text-white rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 font-bold text-lg">4</div>
                <p className="font-bold text-gray-900 text-sm">Risk Eval</p>
                <p className="text-xs text-gray-600 mt-1">Analyze Vitals</p>
              </div>
              <div className="bg-gray-100 rounded-xl p-5 text-center border border-gray-200 hover:shadow-lg transition">
                <div className="bg-gray-400 text-white rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 font-bold text-lg">5</div>
                <p className="font-bold text-gray-900 text-sm">Bed Alloc</p>
                <p className="text-xs text-gray-600 mt-1">Auto Assignment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
