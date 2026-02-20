import React from 'react';
import { List, Download } from 'lucide-react';

const Transactions = ({ transactions, exportToCsv }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <List size={20} className="text-slate-600" /> Transaction History
                </h3>
                <button
                    onClick={exportToCsv}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-2 transition-all p-2 rounded-xl hover:bg-blue-50"
                >
                    <Download size={20} /> Export CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Symbol</th>
                            <th className="px-6 py-4">Quantity</th>
                            <th className="px-6 py-4 text-right">Unit Price</th>
                            <th className="px-6 py-4 text-right">Total Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {transactions.sort((a, b) => b.date - a.date).map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-500">{tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${tx.type === 'BUY' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold">{tx.symbol}</td>
                                <td className="px-6 py-4">{tx.quantity}</td>
                                <td className="px-6 py-4 text-right">${tx.price.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-semibold">${(tx.quantity * tx.price).toFixed(2)}</td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                    No transaction records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Transactions;
