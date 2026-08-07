
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, User, Activity, LogOut, Heart, Microscope, Stethoscope, Clock } from 'lucide-react';
import apiClient from '../../api/apiClient';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [visits, setVisits] = useState([]);
    const [reports, setReports] = useState([]);
    const [treatmentHistory, setTreatmentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('hms_user');
        if (!userData) {
            navigate('/portal/login');
            return;
        }

        setPatient(JSON.parse(userData));
        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            const response = await apiClient.get('/portal/dashboard');
            setVisits(response.data.visits || []);
            setReports(response.data.reports || []);
            setTreatmentHistory(response.data.treatmentHistory || []);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
        navigate('/portal/login');
    };

    const handleDownloadReport = async (patientId, visitId) => {
        try {
            const response = await apiClient.get(`/shared/patients/${patientId}/discharge-report?visitId=${visitId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Medical_Report_${visitId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error("Report download failed", e);
            alert('Failed to download report');
        }
    };

    const filteredVisits = visits.filter(v =>
        searchTerm === '' ||
        v.visit_id.toString().includes(searchTerm) ||
        v.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Activity size={48} className="mx-auto mb-4 text-blue-500 animate-pulse" />
                    <p className="text-gray-600 font-bold">Loading your records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                {patient?.firstName?.[0] || 'P'}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {patient?.firstName} {patient?.lastName}
                                </h1>
                                <p className="text-sm font-bold text-gray-500">
                                    Patient ID: {patient?.patientId} • {patient?.age}Y • {patient?.gender}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition flex items-center gap-2 shadow-lg"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                <Calendar size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-gray-900">{visits.length}</p>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Visits</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center">
                                <FileText size={24} className="text-pink-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-gray-900">{reports.length}</p>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab Reports</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                <Activity size={24} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-gray-900">
                                    {visits.filter(v => v.status === 'CLOSED').length}
                                </p>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by Visit ID or Doctor name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>

                {/* Visits & Reports */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Visit History */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                            <Stethoscope size={20} className="text-blue-500" />
                            Visit History
                        </h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredVisits.length === 0 ? (
                                <p className="text-gray-400 text-sm italic text-center py-8">No visits found</p>
                            ) : (
                                filteredVisits.map((visit) => (
                                    <div key={visit.visit_id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-black text-gray-900 text-sm">Visit #{visit.visit_id}</p>
                                                <p className="text-xs font-bold text-gray-500">
                                                    Dr. {visit.doctor_name || 'Not Assigned'}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${visit.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-600' :
                                                visit.status === 'AT_DOCTOR' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-amber-100 text-amber-600'
                                                }`}>
                                                {visit.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                            <Clock size={12} />
                                            {new Date(visit.check_in_time).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        {visit.status === 'CLOSED' && (
                                            <button
                                                onClick={() => handleDownloadReport(patient.patientId, visit.visit_id)}
                                                className="mt-3 w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                            >
                                                <Download size={14} /> Download Report
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Lab Reports */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                            <Microscope size={20} className="text-pink-500" />
                            Lab Reports
                        </h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {reports.length === 0 ? (
                                <p className="text-gray-400 text-sm italic text-center py-8">No lab reports available</p>
                            ) : (
                                reports.map((report) => (
                                    <div key={report.order_id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-black text-gray-900 text-sm">{report.test_type}</p>
                                                <p className="text-xs font-bold text-gray-500">
                                                    Tech: {report.tech_name || 'Lab Staff'}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-black uppercase">
                                                Completed
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                            <Clock size={12} />
                                            {new Date(report.completed_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Treatment History / Fertility Case Sheet */}
                {treatmentHistory.length > 0 && (
                    <div className="mt-6">
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                <Heart size={20} className="text-pink-500" />
                                Treatment History
                            </h2>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {treatmentHistory.map((record) => (
                                    <div key={record.id} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border border-pink-100">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-black text-gray-900 text-sm">
                                                    {record.form_id === 'FERTILITY_CASE_SHEET' ? 'Fertility Case Sheet' : record.form_id}
                                                </p>
                                                <p className="text-xs font-bold text-gray-500">
                                                    {new Date(record.timestamp).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-xs font-black uppercase">
                                                Saved
                                            </span>
                                        </div>

                                        {record.data && record.form_id === 'FERTILITY_CASE_SHEET' && (
                                            <div className="mt-3 space-y-2 text-xs">
                                                {record.data.infertilityType && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-600">Type:</span>
                                                        <span className="text-gray-800">{record.data.infertilityType}</span>
                                                    </div>
                                                )}
                                                {record.data.infertilityDuration && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-600">Duration:</span>
                                                        <span className="text-gray-800">{record.data.infertilityDuration}</span>
                                                    </div>
                                                )}
                                                {record.data.treatmentPlan && (
                                                    <div className="mt-2">
                                                        <span className="font-bold text-gray-600">Treatment Plan:</span>
                                                        <p className="text-gray-800 mt-1">{record.data.treatmentPlan}</p>
                                                    </div>
                                                )}
                                                {(record.data.gravida !== undefined || record.data.para !== undefined) && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-600">Obstetric History:</span>
                                                        <span className="text-gray-800">
                                                            G{record.data.gravida || 0} P{record.data.para || 0} L{record.data.living || 0} A{record.data.abortion || 0}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDashboard;
