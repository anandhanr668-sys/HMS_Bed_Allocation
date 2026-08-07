import React, { useContext } from 'react';
import { FrontDeskContext } from '../../context/FrontDeskContext';
import { ShieldCheck, History, Clock, User, Info } from 'lucide-react';

const AuditLogsModule = () => {
    const { auditLogs } = useContext(FrontDeskContext);

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="text-slate-700" size={24} />
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Security & Audit Logs</h2>
                        <p className="text-xs text-slate-500">Real-time tracking of front desk operations</p>
                    </div>
                </div>
                <div className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full font-bold">FRONT DESK ONLY</div>
            </div>

            <div className="p-2">
                <div className="max-h-[600px] overflow-y-auto">
                    {auditLogs.length === 0 ? (
                        <div className="p-10 text-center text-slate-400">
                            <History size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No activity logs found for the current session.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="group p-4 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-lg ${log.action.includes('EMERGENCY') ? 'bg-red-100 text-red-600' :
                                                log.action.includes('BILLING') ? 'bg-emerald-100 text-emerald-600' :
                                                    log.action.includes('APPOINTMENT') ? 'bg-blue-100 text-blue-600' :
                                                        'bg-slate-100 text-slate-600'
                                            }`}>
                                            <Info size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-sm font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</h4>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                                                        <Clock size={10} /> {new Date(log.timestamp).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold mt-1">
                                                        <User size={10} /> {log.user}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                                {log.details}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogsModule;
