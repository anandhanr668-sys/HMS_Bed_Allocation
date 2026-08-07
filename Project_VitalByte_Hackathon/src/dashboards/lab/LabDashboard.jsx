import React, { useState, useEffect } from 'react';
import { FlaskConical, Clock, CheckCircle, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import apiClient from '../../api/apiClient';

const LabDashboard = () => {
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        urgent: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await apiClient.get('/lab/my-assignments');
                const assignments = response.data;

                setRecentOrders(assignments.slice(0, 5));
                setStats({
                    pending: assignments.filter(a => a.status === 'PENDING').length,
                    completed: assignments.filter(a => a.status === 'COMPLETED').length,
                    urgent: assignments.filter(a => a.priority === 'STAT' || a.priority === 'URGENT').length
                });
            } catch (err) {
                console.error('Failed to fetch lab dashboard data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const STAT_CARDS = [
        { label: 'Pending Tests', value: stats.pending, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Stat/Urgent', value: stats.urgent, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Completed Today', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' }
    ];

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <FlaskConical className="text-indigo-600" size={32} />
                        Lab Dashboard
                    </h1>
                    <p className="text-slate-500 font-medium">Diagnostic Operations Control Center</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {STAT_CARDS.map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                            <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl`}>
                                <stat.icon size={28} />
                            </div>
                            <div>
                                <h3 className="text-slate-500 font-bold text-sm mb-1">{stat.label}</h3>
                                <div className="text-3xl font-black text-slate-800">{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Assignments */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-800">Recent Assignments</h2>
                        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</button>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400">Loading assignments...</div>
                        ) : recentOrders.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">No recent assignments found.</div>
                        ) : (
                            recentOrders.map((order) => (
                                <div key={order.order_id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-10 rounded-full ${order.priority === 'STAT' ? 'bg-red-500' :
                                            order.priority === 'URGENT' ? 'bg-orange-500' : 'bg-blue-500'
                                            }`} />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-800">{order.test_name}</h4>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${order.priority === 'STAT' ? 'bg-red-100 text-red-600' :
                                                    order.priority === 'URGENT' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {order.priority}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">
                                                Patient: {order.first_name} {order.last_name} ({order.patient_id})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered By</p>
                                            <p className="text-sm font-bold text-slate-700">Dr. {order.ordered_by_name}</p>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabDashboard;
