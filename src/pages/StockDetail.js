import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, Newspaper, ArrowLeft, DollarSign, Activity, BarChart3, Globe, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StockDetail = ({ marketDataService, addOrUpdateStock, sellSelectedStock }) => {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [price, setPrice] = useState(0);
    const [stats, setStats] = useState(null);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states for "Buy More" quick action
    const [buyQty, setBuyQty] = useState('10');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const currentPrice = await marketDataService.getMarketPrice(symbol);
            setPrice(currentPrice);

            // Mocking detailed stats for demo professionalism
            setStats({
                peRatio: (15 + Math.random() * 20).toFixed(2),
                marketCap: (Math.random() * 3).toFixed(2) + "T",
                high52: (currentPrice * 1.2).toFixed(2),
                low52: (currentPrice * 0.8).toFixed(2),
                volume: (Math.random() * 100).toFixed(2) + "M",
                dividend: (Math.random() * 3).toFixed(2) + "%",
                companyName: `${symbol.toUpperCase()} Corporation`
            });

            // Mock stock-specific news
            setNews([
                { id: 1, title: `${symbol} beats quarterly earnings expectations`, time: "1h ago", source: "MarketWatch" },
                { id: 2, title: `Analysts upgrade ${symbol} to 'Strong Buy'`, time: "4h ago", source: "Bloomberg" },
                { id: 3, title: `How ${symbol} is positioning itself for the next AI wave`, time: "1d ago", source: "Reuters" }
            ]);
            setLoading(false);
        };
        fetchData();
    }, [symbol, marketDataService]);

    const handleQuickBuy = () => {
        addOrUpdateStock({
            symbol: symbol,
            quantity: buyQty,
            price: price,
            companyName: stats?.companyName
        });
    };

    const handleQuickSell = () => {
        sellSelectedStock(symbol);
    };

    // Mock chart data
    const chartData = [
        { time: '09:30', price: price * 0.98 },
        { time: '10:30', price: price * 0.99 },
        { time: '11:30', price: price * 1.01 },
        { time: '12:30', price: price * 1.00 },
        { time: '13:30', price: price * 1.02 },
        { time: '14:30', price: price * 1.03 },
        { time: '15:30', price: price * 1.02 },
        { time: '16:00', price: price },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Activity className="animate-spin text-blue-600" size={40} />
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all"
                >
                    <ArrowLeft size={20} /> Back to Assets
                </button>
                <div className="flex items-center gap-4">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold tracking-wider">{symbol}</span>
                    <span className="text-slate-400 font-medium">Common Stock • {stats?.companyName}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Chart and Quick Stats */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="mb-10 relative z-10">
                            <h1 className="text-6xl font-black text-slate-900 mb-2 tracking-tighter">${price.toFixed(2)}</h1>
                            <div className="flex items-center gap-3 text-emerald-600 font-black text-lg">
                                <TrendingUp size={24} /> +2.45 (1.12%) <span className="text-slate-400 font-bold ml-2 uppercase text-xs tracking-[0.2em]">Live Quote</span>
                            </div>
                        </div>

                        <div className="h-[400px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 600, fontSize: 12 }} dy={10} />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                                        formatter={(val) => [`$${val.toFixed(2)}`, 'Value']}
                                    />
                                    <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { label: 'P/E Ratio', value: stats.peRatio, icon: <Activity className="text-blue-500" /> },
                            { label: 'Market Cap', value: stats.marketCap, icon: <Globe className="text-indigo-500" /> },
                            { label: '52W High', value: `$${stats.high52}`, icon: <TrendingUp className="text-emerald-500" /> },
                            { label: '52W Low', value: `$${stats.low52}`, icon: <TrendingDown className="text-red-500" /> },
                            { label: 'Avg Volume', value: stats.volume, icon: <BarChart3 className="text-purple-500" /> },
                            { label: 'Dividend', value: stats.dividend, icon: <DollarSign className="text-amber-500" /> },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-50 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-3 text-slate-400">
                                    {stat.icon}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                                </div>
                                <div className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Actions and News */}
                <div className="space-y-8">
                    {/* Action Card */}
                    <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
                            <ShoppingCart size={28} className="text-blue-400" /> Execution
                        </h3>
                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Order Quantity</label>
                                <div className="flex items-center gap-4 bg-slate-800 p-2 rounded-2xl border border-slate-700">
                                    <button
                                        onClick={() => setBuyQty(Math.max(1, parseInt(buyQty) - 1).toString())}
                                        className="w-12 h-12 flex items-center justify-center bg-slate-700 rounded-xl hover:bg-slate-600 font-bold"
                                    >-</button>
                                    <input
                                        type="number"
                                        className="flex-1 bg-transparent text-center font-black text-xl outline-none"
                                        value={buyQty}
                                        onChange={(e) => setBuyQty(e.target.value)}
                                    />
                                    <button
                                        onClick={() => setBuyQty((parseInt(buyQty) + 1).toString())}
                                        className="w-12 h-12 flex items-center justify-center bg-blue-600 rounded-xl hover:bg-blue-500 font-bold"
                                    >+</button>
                                </div>
                            </div>
                            <div className="pt-2">
                                <div className="flex justify-between text-sm font-bold text-slate-400 mb-6 px-1">
                                    <span>Estimated Cost</span>
                                    <span className="text-white">${(parseInt(buyQty || 0) * price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <button
                                    onClick={handleQuickBuy}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 mb-4"
                                >
                                    Place Buy Order
                                </button>
                                <button
                                    onClick={handleQuickSell}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-2xl transition-all active:scale-95 border border-slate-700"
                                >
                                    Liquidate Position
                                </button>
                            </div>
                        </div>
                        <Activity size={200} className="absolute -right-20 -bottom-20 text-blue-500 opacity-5 pointer-events-none" />
                    </div>

                    {/* News Feed */}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <Newspaper size={24} className="text-blue-600" /> Intelligence
                        </h3>
                        <div className="space-y-8">
                            {news.map(n => (
                                <div key={n.id} className="group cursor-pointer">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">{n.source}</span>
                                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                            <Clock size={10} /> {n.time}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-all leading-relaxed">
                                        {n.title}
                                    </h4>
                                    <hr className="mt-6 border-slate-50" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockDetail;
