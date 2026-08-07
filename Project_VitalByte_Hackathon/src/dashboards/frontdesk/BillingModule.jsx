import React, { useContext, useState } from 'react';
import { FrontDeskContext } from '../../context/FrontDeskContext';
import { IndianRupee, CreditCard, Receipt, Search, Download } from 'lucide-react';

const BillingModule = () => {
    const { transactions } = useContext(FrontDeskContext);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTransactions = transactions.filter(t =>
        t.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="space-y-6">
            {/* KPI Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-emerald-100 font-medium">Daily Front Desk Collection</p>
                        <h2 className="text-4xl font-bold mt-1">₹{totalRevenue.toLocaleString()}</h2>
                    </div>
                    <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                        <IndianRupee size={32} />
                    </div>
                </div>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black/10 p-3 rounded-lg">
                        <p className="text-[10px] text-emerald-100 font-bold uppercase">Registrations</p>
                        <p className="text-lg font-bold">{transactions.filter(t => t.type === 'Registration').length}</p>
                    </div>
                    <div className="bg-black/10 p-3 rounded-lg">
                        <p className="text-[10px] text-emerald-100 font-bold uppercase">Consultations</p>
                        <p className="text-lg font-bold">{transactions.filter(t => t.type === 'Consultation').length}</p>
                    </div>
                    <div className="bg-black/10 p-3 rounded-lg">
                        <p className="text-[10px] text-emerald-100 font-bold uppercase">Emergency</p>
                        <p className="text-lg font-bold">{transactions.filter(t => t.type === 'Emergency').length}</p>
                    </div>
                    <div className="bg-black/10 p-3 rounded-lg">
                        <p className="text-[10px] text-emerald-100 font-bold uppercase">Successful</p>
                        <p className="text-lg font-bold">100%</p>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Receipt className="text-emerald-600" /> Recent Payments
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by ID or Patient..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 w-full md:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Transaction ID</th>
                                <th className="px-6 py-4">Patient ID</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4 text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{tx.id}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{tx.patientId}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tx.type === 'Emergency' ? 'bg-red-100 text-red-700' :
                                                    tx.type === 'Registration' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{tx.description}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">₹{tx.amount}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(tx.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Download Receipt">
                                                <Download size={18} />
                                            </button>
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

export default BillingModule;
