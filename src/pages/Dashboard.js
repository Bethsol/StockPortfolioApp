import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, PieChart as PieIcon, BarChart3, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const Dashboard = ({ totalPurchaseCost, currentMarketValue, totalProfitLoss, currentHoldings, currentPrices }) => {
    // Performance stats for Bento Grid
    const performanceStats = currentHoldings.map(h => {
        const currentPrice = currentPrices[h.symbol] || h.averagePurchasePrice;
        const totalValue = h.quantity * currentPrice;
        const totalCost = h.getTotalPurchaseCost();
        const profitLoss = totalValue - totalCost;
        const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
        return { ...h, profitLoss, profitLossPercentage, currentPrice };
    });

    const topGainer = performanceStats.length > 0
        ? [...performanceStats].sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)[0]
        : null;

    const topLoser = performanceStats.length > 0
        ? [...performanceStats].sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)[0]
        : null;

    // Portfolio Composition Data
    const pieData = currentHoldings.map(h => ({
        name: h.symbol,
        value: h.quantity * (currentPrices[h.symbol] || h.averagePurchasePrice)
    }));

    const barData = currentHoldings.slice(0, 5).map(h => ({
        name: h.symbol,
        cost: h.getTotalPurchaseCost(),
        value: h.quantity * (currentPrices[h.symbol] || h.averagePurchasePrice)
    }));

    // Mock Trend Data (Value Over Time)
    const trendData = [
        { day: 'Mon', value: currentMarketValue * 0.95 },
        { day: 'Tue', value: currentMarketValue * 0.97 },
        { day: 'Wed', value: currentMarketValue * 0.96 },
        { day: 'Thu', value: currentMarketValue * 0.98 },
        { day: 'Fri', value: currentMarketValue * 1.01 },
        { day: 'Sat', value: currentMarketValue * 0.99 },
        { day: 'Sun', value: currentMarketValue },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Dashboard Header with Logo */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Stock-Verse Intelligence</h1>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Real-time Market Surveillance</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live Feed Synchronized</span>
                    </div>
                </div>
            </div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Portfolio Value Card */}
                <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 block">Total Portfolio Value</span>
                        <h2 className="text-5xl font-black mb-4 tracking-tight">
                            ${currentMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h2>
                        <div className={`flex items-center gap-2 font-bold text-lg ${totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {totalProfitLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            {totalProfitLoss >= 0 ? '+' : ''}${Math.abs(totalProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="opacity-50 text-sm ml-1">({(totalPurchaseCost > 0 ? (totalProfitLoss / totalPurchaseCost) * 100 : 0).toFixed(2)}%)</span>
                        </div>
                    </div>
                    <Activity size={200} className="absolute -right-10 -bottom-10 text-blue-500 opacity-10 group-hover:scale-110 transition-all duration-700" />
                </div>

                {/* Top Gainer Card */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">🔥 Top Gainer</span>
                        {topGainer ? (
                            <>
                                <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-all">{topGainer.symbol}</div>
                                <div className="text-emerald-600 font-bold text-xl mt-1">+{topGainer.profitLossPercentage.toFixed(2)}%</div>
                            </>
                        ) : (
                            <div className="text-slate-300 italic">No rankings yet</div>
                        )}
                    </div>
                    <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <TrendingUp size={12} className="text-emerald-500" /> Performance Leader
                    </div>
                </div>

                {/* Top Loser Card */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-red-200 transition-all">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">🧊 Top Loser</span>
                        {topLoser ? (
                            <>
                                <div className="text-2xl font-black text-slate-900 group-hover:text-red-600 transition-all">{topLoser.symbol}</div>
                                <div className="text-red-600 font-bold text-xl mt-1">{topLoser.profitLossPercentage.toFixed(2)}%</div>
                            </>
                        ) : (
                            <div className="text-slate-300 italic">No rankings yet</div>
                        )}
                    </div>
                    <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <TrendingDown size={12} className="text-red-500" /> Under Review
                    </div>
                </div>
            </div>

            {/* Performance Trend Chart */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Activity size={24} className="text-blue-600" /> Growth Trajectory
                        </h3>
                        <p className="text-sm text-slate-400 font-medium mt-1 uppercase tracking-widest">Aggregate Portfolio Valuation (7D)</p>
                    </div>
                    <div className="flex bg-slate-50 p-1 rounded-xl">
                        {['1D', '7D', '1M', '1Y', 'ALL'].map(t => (
                            <button key={t} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${t === '7D' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                        ))}
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }} dy={10} />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip
                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                                itemStyle={{ fontWeight: 800, color: '#0f172a' }}
                                labelStyle={{ fontWeight: 600, color: '#64748b', marginBottom: '4px' }}
                                formatter={(val) => [`$${val.toLocaleString()}`, 'Total Value']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Asset Composition Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
                        <PieIcon size={24} className="text-blue-500" /> Capital Allocation
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    cornerRadius={8}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => `$${Number(value).toLocaleString()}`}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
                        <BarChart3 size={24} className="text-emerald-500" /> Valuation Benchmarking
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} barGap={12}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="cost" fill="#e2e8f0" radius={[10, 10, 0, 0]} name="Invested Cost" />
                                <Bar dataKey="value" fill="#3b82f6" radius={[10, 10, 0, 0]} name="Current Value" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Account Quick Stats Sub-grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Clock size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Last Performance Sync</div>
                            <div className="text-lg font-black text-slate-900">Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Liquidity Reserve</div>
                            <div className="text-lg font-black text-slate-900">$24,850.00 <span className="text-xs text-slate-400 font-bold ml-1">UNSETTLED</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
