import React, { useState } from 'react';
import { Search, TrendingUp, Newspaper, ExternalLink, RefreshCw, Activity } from 'lucide-react';

const Market = ({ marketDataService }) => {
    const [searchSymbol, setSearchSymbol] = useState('');
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchSymbol) return;
        setLoading(true);
        const price = await marketDataService.getMarketPrice(searchSymbol);
        setQuote({
            symbol: searchSymbol.toUpperCase(),
            price: price,
            change: (Math.random() * 4 - 2).toFixed(2), // Mock change
            changePercent: (Math.random() * 2 - 1).toFixed(2), // Mock percent
            updated: new Date()
        });
        setLoading(false);
    };

    const news = [
        { id: 1, title: "Federal Reserve signals steady rates for coming months", source: "MarketWatch", link: "#", time: "2h ago" },
        { id: 2, title: "Tech stocks rally as AI demand hits new records", source: "Reuters", link: "#", time: "4h ago" },
        { id: 3, title: "Oil prices stabilize amid global supply Chain improvements", source: "Bloomberg", link: "#", time: "6h ago" },
        { id: 4, title: "Electric vehicle sales see unexpected surge in Q4", source: "CNBC", link: "#", time: "8h ago" }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Search and Quote Section */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Search size={20} className="text-blue-600" /> Market Scanner
                    </h3>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold dark:text-white"
                                value={searchSymbol}
                                onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                                placeholder="Search Symbol (e.g. AAPL)"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Get Real-time Quote'}
                        </button>
                    </form>

                    {quote && (
                        <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 animate-fade-in">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{quote.symbol}</span>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${parseFloat(quote.change) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {parseFloat(quote.change) >= 0 ? '▲' : '▼'} {Math.abs(quote.changePercent)}%
                                </span>
                            </div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white mb-3">${quote.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                                <Activity size={12} className="text-blue-500" /> Validated: {quote.updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-xl overflow-hidden relative group">
                    <div className="relative z-10">
                        <h4 className="text-xl font-black mb-2 tracking-tight">Portfolio Insights AI</h4>
                        <p className="text-blue-100 font-medium mb-6 text-sm">Synthetic analysis suggests 3 assets reaching target margins.</p>
                        <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg active:scale-95">View Recommendations</button>
                    </div>
                    <TrendingUp size={160} className="absolute -right-8 -bottom-8 text-white opacity-10 group-hover:scale-110 transition-all duration-700 pointer-events-none" />
                </div>
            </div>

            {/* Market News Section */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-700 h-full">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                        <Newspaper size={24} className="text-blue-600" /> News Feed Pipeline
                    </h3>
                    <div className="space-y-8">
                        {news.map(item => (
                            <div key={item.id} className="group cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">{item.source}</span>
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                        <Activity size={10} /> {item.time}
                                    </span>
                                </div>
                                <h4 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all flex items-center justify-between gap-4 leading-snug">
                                    {item.title}
                                    <ExternalLink size={18} className="shrink-0 text-slate-300 group-hover:text-blue-600 transition-all" />
                                </h4>
                                <hr className="mt-8 border-slate-50 dark:border-slate-700/50" />
                            </div>
                        ))}
                    </div>
                    <button className="mt-8 w-full py-4 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-[0.3em] hover:text-blue-600 transition-all text-center">Open Intelligence Terminal</button>
                </div>
            </div>
        </div>
    );
};

export default Market;
