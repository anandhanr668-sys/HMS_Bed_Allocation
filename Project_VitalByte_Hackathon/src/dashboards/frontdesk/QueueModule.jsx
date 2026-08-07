import React, { useContext } from 'react';
import { FrontDeskContext } from '../../context/FrontDeskContext';
import { Clock, User, ArrowRight, Play, CheckCircle, Zap } from 'lucide-react';

const QueueModule = () => {
    const { queue, updateQueueStatus } = useContext(FrontDeskContext);

    const stats = {
        waiting: queue.filter(q => q.status === 'Waiting').length,
        inProgress: queue.filter(q => q.status === 'In Progress').length,
        emergency: queue.filter(q => q.priority === 'Emergency' && q.status !== 'Completed').length
    };

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Wait List</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.waiting}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                        <Play size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">In Consultation</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
                    </div>
                </div>
                <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-red-700">Emergencies</p>
                        <p className="text-2xl font-bold text-red-900">{stats.emergency}</p>
                    </div>
                </div>
            </div>

            {/* Queue Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Live Services Queue</h2>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full">
                            <Zap size={10} /> PRIORITY
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Token</th>
                                <th className="px-6 py-4">Patient Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Waiting Time</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {queue.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                                        Queue is currently empty.
                                    </td>
                                </tr>
                            ) : (
                                queue.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition ${item.priority === 'Emergency' ? 'bg-red-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${item.priority === 'Emergency' ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                                                {item.tokenNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{item.patientName}</p>
                                            <p className="text-[10px] text-slate-500">ID: {item.patientId}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-slate-600 px-2 py-1 bg-slate-100 rounded-md">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${item.status === 'Waiting' ? 'bg-amber-100 text-amber-700' :
                                                    item.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Waiting' ? 'bg-amber-500' :
                                                        item.status === 'In Progress' ? 'bg-blue-500' :
                                                            'bg-green-500'
                                                    }`} />
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(item.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {item.status === 'Waiting' && (
                                                    <button
                                                        onClick={() => updateQueueStatus(item.id, 'In Progress')}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Assign to Service"
                                                    >
                                                        <Play size={18} />
                                                    </button>
                                                )}
                                                {item.status === 'In Progress' && (
                                                    <button
                                                        onClick={() => updateQueueStatus(item.id, 'Completed')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                        title="Complete Service"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QueueModule;
