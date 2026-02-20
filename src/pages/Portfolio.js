import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, DollarSign, PieChart as PieIcon, ArrowUpRight } from 'lucide-react';

const Portfolio = ({
    currentHoldings,
    currentPrices,
    symbol,
    setSymbol,
    companyName,
    setCompanyName,
    quantity,
    setQuantity,
    price,
    setPrice,
    addOrUpdateStock,
    sellSelectedStock,
    handleStockSelect,
    originalSymbolBeingEdited,
    isAuthenticated,
    dataLoading
}) => {
    const [filterText, setFilterText] = useState('');
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Left Column: Input Form */}
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-28">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Plus size={20} className="text-blue-600" /> Manage Stocks
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ticker Symbol</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                placeholder="AAPL, TSLA..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Company Name</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Apple Inc."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Quantity</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="10"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Cost/Share</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="150.00"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex flex-col gap-3">
                            <button
                                onClick={addOrUpdateStock}
                                disabled={!isAuthenticated || dataLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Plus size={20} /> Add to Portfolio
                            </button>
                            <button
                                onClick={sellSelectedStock}
                                disabled={!isAuthenticated || dataLoading}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <DollarSign size={20} /> Sell Holding
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Holdings Table */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <PieIcon size={20} className="text-blue-600" /> Current Holdings
                        </h3>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                placeholder="Search holdings..."
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Symbol</th>
                                    <th className="px-6 py-4">Quantity</th>
                                    <th className="px-6 py-4">Avg Cost</th>
                                    <th className="px-6 py-4">Current Price</th>
                                    <th className="px-6 py-4 text-right">P/L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentHoldings
                                    .filter(stock => stock.symbol.toLowerCase().includes(filterText.toLowerCase()) || stock.companyName.toLowerCase().includes(filterText.toLowerCase()))
                                    .map((stock) => {
                                        const currentPrice = currentPrices[stock.symbol] || stock.averagePurchasePrice;
                                        const profitLoss = (stock.quantity * currentPrice) - stock.getTotalPurchaseCost();
                                        return (
                                            <tr
                                                key={stock.symbol}
                                                onClick={() => navigate(`/stock/${stock.symbol}`)}
                                                className={`cursor-pointer transition-colors hover:bg-slate-50 relative group ${originalSymbolBeingEdited === stock.symbol ? 'bg-blue-50' : ''}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-bold text-slate-900">{stock.symbol}</div>
                                                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-blue-500" />
                                                    </div>
                                                    <div className="text-xs text-slate-400 truncate max-w-[120px]">{stock.companyName}</div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold">{stock.quantity}</td>
                                                <td className="px-6 py-4 text-slate-500">${stock.averagePurchasePrice.toFixed(2)}</td>
                                                <td className="px-6 py-4 font-bold text-blue-600">${currentPrice.toFixed(2)}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {currentHoldings.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                            No active holdings recorded. Add some stocks to get started!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Portfolio;
