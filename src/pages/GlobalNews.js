import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, Clock, ExternalLink, Globe, Search, BarChart2 } from 'lucide-react';

const GlobalNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        // Simulating news fetch from an API
        setTimeout(() => {
            setNews([
                { id: 1, title: "S&P 500 hits record high as tech earnings surprise to the upside", category: "Markets", time: "30m ago", source: "Wall Street Journal", impact: "High" },
                { id: 2, title: "Federal Reserve chair signals potential rate pause in next meeting", category: "Economy", time: "1h ago", source: "Bloomberg", impact: "High" },
                { id: 3, title: "Electric vehicle startups face funding crunch amid rising interest rates", category: "Industry", time: "3h ago", source: "Reuters", impact: "Medium" },
                { id: 4, title: "Crypto regulation becomes top priority for European Central Bank", category: "Crypto", time: "5h ago", source: "Financial Times", impact: "Medium" },
                { id: 5, title: "Global shipping costs stabilize as port congestion eases in Asia", category: "Economy", time: "8h ago", source: "CNBC", impact: "Low" },
                { id: 6, title: "Top 5 AI stocks to watch in the second half of 2026", category: "Markets", time: "12h ago", source: "MarketWatch", impact: "High" },
                { id: 7, title: "Gold prices drop as investors flock to higher-yielding treasury bonds", category: "Markets", time: "1d ago", source: "Forbes", impact: "Medium" },
                { id: 8, title: "Sustainable energy transition requires $4T annual investment says IEA", category: "Environment", time: "1d ago", source: "The Economist", impact: "Medium" },
            ]);
            setLoading(false);
        }, 1200);
    }, []);

    const categories = ['All', 'Markets', 'Economy', 'Industry', 'Crypto', 'Environment'];

    const filteredNews = filter === 'All' ? news : news.filter(n => n.category === filter);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Search Area */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Market Outlook</h2>
                    <p className="text-slate-500 font-medium">Real-time global financial news and strategic analysis.</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search news, topics, companies..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-semibold"
                    />
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main News List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 animate-pulse space-y-4">
                                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                                <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                            </div>
                        ))
                    ) : (
                        filteredNews.map(item => (
                            <div key={item.id} className="bg-white p-8 rounded-[32px] border border-slate-100 hover:border-blue-200 transition-all group cursor-pointer relative overflow-hidden">
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.impact === 'High' ? 'bg-red-50 text-red-600' : item.impact === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
                                            {item.impact} Impact
                                        </span>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="text-slate-400 font-bold text-[10px] flex items-center gap-1">
                                        <Clock size={12} /> {item.time}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-all leading-tight mb-4 pr-10">
                                    {item.title}
                                </h3>
                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-sm font-bold text-slate-400 italic">Source: {item.source}</span>
                                    <ExternalLink size={18} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                                <div className="absolute right-[-20%] bottom-[-20%] opacity-[0.02] group-hover:opacity-[0.05] transition-all">
                                    <Globe size={180} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Trending & Market Sentiment Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl overflow-hidden relative group">
                        <div className="relative z-10">
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <TrendingUp size={24} className="text-blue-400" /> Market Sentiment
                            </h4>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        <span>Bullish Confidence</span>
                                        <span>68%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full w-[68%]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                        <span>Fear & Greed Index</span>
                                        <span className="text-emerald-400">Greed</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full w-[74%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <BarChart2 size={160} className="absolute -right-10 -bottom-10 text-blue-500 opacity-10 group-hover:scale-110 transition-all duration-700" />
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Newspaper size={20} className="text-blue-600" /> Top Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {['Artificial Intelligence', 'Inflation', 'TSLA', 'Semiconductors', 'Crypto', 'ESG', 'Fed Rates', 'Oil Prices'].map(tag => (
                                <span key={tag} className="px-3 py-1.5 bg-slate-50 text-slate-500 text-xs font-bold rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalNews;
