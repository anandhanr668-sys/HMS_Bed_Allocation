import React, { useEffect, useState } from 'react';
import {
    UserPlus, Shield, Power, Search, MoreVertical, Trash2,
    Stethoscope, HeartPulse, Monitor, Microscope,
    CheckCircle2, XCircle, Mail, Hash, User
} from 'lucide-react';
import apiClient from '../../../api/apiClient';
import clsx from 'clsx'; // Assuming clsx is installed/available given previous checks

const ROLE_CONFIG = {
    DOCTOR: { color: 'indigo', icon: Stethoscope, label: 'Medical Doctor', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', shadow: 'shadow-indigo-100' },
    NURSE: { color: 'rose', icon: HeartPulse, label: 'Nursing Staff', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', shadow: 'shadow-rose-100' },
    ADMIN: { color: 'slate', icon: Shield, label: 'System Administrator', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', shadow: 'shadow-slate-200' },
    FRONT_DESK: { color: 'cyan', icon: Monitor, label: 'Front Desk Operations', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', shadow: 'shadow-cyan-100' },
    LAB_ASSISTANT: { color: 'violet', icon: Microscope, label: 'Lab Technician', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', shadow: 'shadow-violet-100' }
};

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newStaff, setNewStaff] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'DOCTOR',
        specialization: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await apiClient.get('/admin/staff');
            setStaff(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/admin/staff', {
                ...newStaff,
                phoneNumber: null,
                departmentId: null,
                licenseNumber: null
            });
            setShowModal(false);
            setNewStaff({ username: '', password: '', fullName: '', email: '', role: 'DOCTOR', specialization: '' });
            fetchStaff();
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
            alert(`Error creating staff member: ${errorMsg}`);
        }
    };

    const handleDelete = async (staffId) => {
        if (!window.confirm('Are you sure you want to deactivate this staff member? This will disable their system access.')) return;

        try {
            await apiClient.delete(`/admin/staff/${staffId}`);
            fetchStaff();
        } catch (err) {
            console.error(err);
            alert('Failed to delete staff member');
        }
    };

    const handleToggleStatus = async (member) => {
        const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await apiClient.put(`/admin/staff/${member.id}/status`, { status: newStatus });
            fetchStaff();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    const filteredStaff = staff.filter(member => {
        const matchesSearch =
            member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.username?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = showInactive ? true : member.status === 'ACTIVE';

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 min-h-screen bg-[#FDFDFE]">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Staff Control Center</h1>
                        <p className="text-slate-500 font-medium text-lg">Manage permissions, roles, and system access.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowInactive(!showInactive)}
                            className={clsx(
                                "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
                                showInactive
                                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                            )}
                        >
                            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:shadow-2xl hover:bg-black hover:-translate-y-1 transition-all group"
                        >
                            <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">New Staff</span>
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="relative group max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={24} />
                    </div>
                    <input
                        className="w-full bg-white border border-slate-100 rounded-[2rem] py-5 pl-14 pr-6 shadow-sm shadow-slate-100 focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-200 focus:shadow-xl outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                        placeholder="Search by name, role ID, or specialization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Staff Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredStaff.map((member) => {
                        const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.ADMIN;
                        const Icon = config.icon;

                        return (
                            <div key={member.id} className={clsx(
                                "relative bg-white rounded-[2.5rem] border p-8 transition-all duration-300 group overflow-hidden",
                                member.status === 'INACTIVE' ? 'opacity-60 grayscale border-slate-100' : `border-slate-100 hover:border-${config.color}-200 hover:shadow-2xl hover:shadow-${config.color}-100/50 hover:-translate-y-1`
                            )}>
                                {/* Gradient Top Decor */}
                                <div className={clsx("absolute top-0 left-0 right-0 h-32 opacity-10 bg-gradient-to-b", `from-${config.color}-500 to-transparent`)} />

                                <div className="relative flex justify-between items-start mb-6">
                                    <div className={clsx("p-4 rounded-2xl shadow-sm", config.bg, config.text)}>
                                        <Icon size={32} strokeWidth={2} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                        <button
                                            onClick={() => handleToggleStatus(member)}
                                            className={clsx(
                                                "p-3 rounded-xl transition-all",
                                                member.status === 'ACTIVE'
                                                    ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                                                    : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'
                                            )}
                                            title={member.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                                        >
                                            <Power size={18} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Delete Account"
                                        >
                                            <Trash2 size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1 relative mb-6">
                                    <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-indigo-900 transition-colors">
                                        {member.fullName}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className={clsx("text-[10px] font-black uppercase tracking-widest", config.text)}>
                                            {config.label}
                                        </span>
                                        {member.specialization && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                    {member.specialization}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50 space-y-4 relative">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-600 transition-colors">
                                            <Mail size={16} />
                                            <span className="text-xs font-bold truncate max-w-[150px]">{member.email || 'No Email Linked'}</span>
                                        </div>
                                        <div className={clsx(
                                            "flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                                            member.status === 'ACTIVE'
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                                : "bg-slate-50 border-slate-100 text-slate-400"
                                        )}>
                                            <div className={clsx("w-1.5 h-1.5 rounded-full", member.status === 'ACTIVE' ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                            {member.status}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-300 group-hover:text-slate-400 transition-colors">
                                        <Hash size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">@{member.username}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredStaff.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">No matching staff found</h3>
                            <p className="text-slate-400 font-medium">Adjust your search parameters or add a new staff member.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal - Premium Redesign */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-12 shadow-2xl animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[95vh] border border-slate-100">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Create Identity</h2>
                                <p className="text-slate-400 font-medium text-lg">Provision new hospital credentials & access.</p>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
                                <Shield size={32} />
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-8">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1 space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Professional Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                            <input
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-700 transition-all placeholder:text-slate-300"
                                                placeholder="e.g. Dr. Sarah Jenkins"
                                                value={newStaff.fullName}
                                                onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                                        <div className="relative group">
                                            <Microscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                            <input
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-700 transition-all placeholder:text-slate-300"
                                                placeholder="e.g. Cardiology"
                                                value={newStaff.specialization}
                                                onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-700 transition-all placeholder:text-slate-300"
                                            placeholder="sarah.j"
                                            value={newStaff.username}
                                            onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-700 transition-all placeholder:text-slate-300"
                                            placeholder="••••••••"
                                            value={newStaff.password}
                                            onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Assignment</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                                                value={newStaff.role}
                                                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                            >
                                                <option value="DOCTOR">DOCTOR</option>
                                                <option value="NURSE">NURSE</option>
                                                <option value="FRONT_DESK">FRONT DESK</option>
                                                <option value="ADMIN">ADMIN</option>
                                                <option value="LAB_ASSISTANT">LAB ASSISTANT</option>
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <Shield size={16} className="text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                                        <input
                                            type="email"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 font-bold text-slate-700 transition-all placeholder:text-slate-300"
                                            placeholder="sarah@medibed.com"
                                            value={newStaff.email}
                                            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 text-slate-500 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Discard Form</button>
                                <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:bg-indigo-700 transition-all transform hover:-translate-y-1 text-center flex items-center justify-center gap-3">
                                    <UserPlus size={18} /> Initialize Staff Badge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
