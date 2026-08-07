import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, FlaskConical, Clipboard, ArrowRight, User, Calendar, Clock } from 'lucide-react';
import apiClient from '../../api/apiClient';

const LabAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const response = await apiClient.get('/lab/my-assignments');
                setAssignments(response.data);
            } catch (err) {
                console.error('Failed to fetch assignments', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    const filteredAssignments = assignments.filter(item => {
        const matchesSearch =
            item.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.order_id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filter === 'ALL' || item.status === filter;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Investigation Assignments</h1>
                        <p className="text-slate-500 font-medium">Manage and process assigned laboratory tests</p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by patient, test, or ID..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 w-fit">
                    {['ALL', 'PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === f
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {f.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 animate-pulse" />
                        ))
                    ) : filteredAssignments.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FlaskConical className="text-slate-300" size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700">No matching assignments</h3>
                            <p className="text-slate-500">Try adjusting your filters or search terms</p>
                        </div>
                    ) : (
                        filteredAssignments.map((assignment) => (
                            <div key={assignment.order_id} className="bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all group flex flex-col">
                                <div className="p-6 flex-1 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${assignment.priority === 'STAT' ? 'bg-rose-100 text-rose-600' :
                                            assignment.priority === 'URGENT' ? 'bg-orange-100 text-orange-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            {assignment.priority}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">ID</p>
                                            <p className="text-xs font-bold text-slate-500">{assignment.order_id}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                                            {assignment.test_name}
                                        </h3>
                                        <p className="text-indigo-500 text-xs font-black uppercase tracking-widest mt-1">
                                            {assignment.category}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors border border-slate-100">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 leading-none mb-1 capitalize">Patient</p>
                                            <p className="text-sm font-bold text-slate-800 leading-none">
                                                {assignment.first_name} {assignment.last_name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold">
                                                {new Date(assignment.ordered_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 justify-end">
                                            <Clock size={14} className="text-slate-400" />
                                            <span className="text-xs font-bold">
                                                {new Date(assignment.ordered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 border-t border-slate-100 group-hover:bg-indigo-50 transition-colors">
                                    <Link
                                        to={`/lab/process-report/${assignment.order_id}`}
                                        className="w-full bg-white group-hover:bg-indigo-600 border border-slate-200 group-hover:border-indigo-600 py-3 rounded-2xl text-slate-700 group-hover:text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Clipboard size={18} />
                                        PROCESS REPORT
                                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabAssignments;
