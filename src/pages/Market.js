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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Search size={20} className="text-blue-600" /> Market Scanner
                    </h3>
                    <form onSubmit={handleSearch} className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                            value={searchSymbol}
                            onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                            placeholder="Search Symbol (e.g. AAPL)"
                        />
                        <button
                            type="submit"
                            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Get Real-time Quote'}
                        </button>
                    </form>

                    {quote && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-2xl font-black text-slate-900">{quote.symbol}</span>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${parseFloat(quote.change) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {quote.changePercent}%
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900 mb-2">${quote.price.toFixed(2)}</div>
                            <div className="text-xs text-slate-400 uppercase font-bold tracking-widest flex items-center gap-2">
                                <Activity size={12} /> Last updated {quote.updated.toLocaleTimeString()}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative">
                    <div className="relative z-10">
                        <h4 className="text-lg font-bold mb-2">Portfolio Insights AI</h4>
                        <p className="text-blue-100 text-sm mb-4">You have 3 stocks reaching their target profit margins soon.</p>
                        <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-all">View Recommendations</button>
                    </div>
                    <TrendingUp size={120} className="absolute -right-4 -bottom-4 text-blue-500 opacity-20 pointer-events-none" />
                </div>
            </div>

            {/* Market News Section */}
            <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Newspaper size={20} className="text-slate-600" /> Financial News Digest
                    </h3>
                    <div className="space-y-6">
                        {news.map(item => (
                            <div key={item.id} className="group cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{item.source}</span>
                                    <span className="text-xs text-slate-400">{item.time}</span>
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-all flex items-center gap-2">
                                    {item.title} <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                                </h4>
                                <hr className="mt-6 border-slate-50" />
                            </div>
                        ))}
                    </div>
                    <button className="mt-6 w-full py-3 text-slate-500 font-bold hover:text-blue-600 transition-all text-center">View More Financial Insights</button>
                </div>
            </div>
        </div>
    );
};

export default Market;
