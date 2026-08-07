import React, { useState, useContext } from 'react';
import { FrontDeskContext } from '../../context/FrontDeskContext';
import { PatientContext } from '../../context/PatientContext';
import { Calendar, Clock, User, Phone, CheckCircle } from 'lucide-react';

const AppointmentModule = () => {
    const { bookAppointment, appointments } = useContext(FrontDeskContext);
    const { patients } = useContext(PatientContext);

    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const doctors = [
        { id: 'DOC-1', name: 'Dr. Sarah Wilson', specialty: 'Cardiology', availability: '9:00 AM - 1:00 PM' },
        { id: 'DOC-2', name: 'Dr. Michael Chen', specialty: 'Neurology', availability: '2:00 PM - 6:00 PM' },
        { id: 'DOC-3', name: 'Dr. Emily Brown', specialty: 'Pediatrics', availability: '10:00 AM - 4:00 PM' },
        { id: 'DOC-4', name: 'Dr. James Miller', specialty: 'Orthopedics', availability: '11:00 AM - 7:00 PM' }
    ];

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    const handleBook = () => {
        if (!selectedPatient || !selectedDoctor || !date || !time) return;

        const patient = patients.find(p => p.patientId === selectedPatient);
        const doctor = doctors.find(d => d.id === selectedDoctor);

        bookAppointment({
            patientId: patient.patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            contact: patient.contact,
            doctorId: doctor.id,
            doctorName: doctor.name,
            specialty: doctor.specialty,
            date,
            time
        });

        // Clear selection
        setSelectedPatient('');
        setSelectedDoctor('');
        setDate('');
        setTime('');
        setSearchTerm('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Calendar className="text-blue-600" /> Book New Appointment
                    </h2>

                    <div className="space-y-6">
                        {/* Patient Search */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 font-bold">Search Patient *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by name or Patient ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                {searchTerm && filteredPatients.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl">
                                        {filteredPatients.map(p => (
                                            <div
                                                key={p.patientId}
                                                onClick={() => {
                                                    setSelectedPatient(p.patientId);
                                                    setSearchTerm(`${p.firstName} ${p.lastName} (${p.patientId})`);
                                                }}
                                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                                            >
                                                <p className="font-medium text-slate-900">{p.firstName} {p.lastName}</p>
                                                <p className="text-xs text-slate-500">{p.patientId} • {p.contact}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Doctor Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 font-bold">Select Specialist *</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg"
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">Choose Specialist</option>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 font-bold">Appointment Date *</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {/* Time Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 font-bold">Preferred Time *</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                >
                                    <option value="">Select Time Slot</option>
                                    <option value="09:00 AM">09:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:30 AM">11:30 AM</option>
                                    <option value="02:00 PM">02:00 PM</option>
                                    <option value="04:30 PM">04:30 PM</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleBook}
                            disabled={!selectedPatient || !selectedDoctor || !date || !time}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition transform active:scale-[0.98] disabled:opacity-50"
                        >
                            CONFIRM APPOINTMENT & SEND NOTIFICATION
                        </button>
                    </div>
                </div>
            </div>

            {/* Availability Sidebar */}
            <div className="space-y-6">
                <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white text-bold">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-blue-400" /> Specialist Availability
                    </h3>
                    <div className="space-y-4">
                        {doctors.map(d => (
                            <div key={d.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                                <p className="font-bold text-sm">{d.name}</p>
                                <p className="text-xs text-blue-300 mb-1">{d.specialty}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <Clock size={10} /> {d.availability}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Upcoming Today</h3>
                    <div className="space-y-3">
                        {appointments.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">No appointments scheduled for today.</p>
                        ) : (
                            appointments.slice(0, 3).map(apt => (
                                <div key={apt.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-sm text-slate-900">{apt.patientName}</p>
                                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">CONFIRMED</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">with {apt.doctorName}</p>
                                    <p className="text-xs text-blue-600 font-bold mt-1">{apt.time}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentModule;
