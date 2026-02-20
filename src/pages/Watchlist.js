import React, { useState } from 'react';
import { Search, Plus, Trash2, TrendingUp, TrendingDown, Eye, RefreshCw, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Watchlist = ({ marketDataService }) => {
    const [watchlist, setWatchlist] = useState([
        { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 1.25 },
        { symbol: 'TSLA', name: 'Tesla, Inc.', price: 193.57, change: -2.10 },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 4.32 }
    ]);
    const [newSymbol, setNewSymbol] = useState('');
    const [loading, setLoading] = useState(false);

    const addToWatchlist = async () => {
        if (!newSymbol) return;
        setLoading(true);
        const price = await marketDataService.getMarketPrice(newSymbol);
        const newItem = {
            symbol: newSymbol.toUpperCase(),
            name: `${newSymbol.toUpperCase()} Corp.`, // Simplified for demo
            price: price,
            change: (Math.random() * 4 - 2).toFixed(2)
        };
        setWatchlist([...watchlist, newItem]);
        setNewSymbol('');
        setLoading(false);
    };

    const removeFromWatchlist = (symbol) => {
        setWatchlist(watchlist.filter(item => item.symbol !== symbol));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Your Watchlist</h2>
                    <p className="text-slate-500 max-w-2xl text-lg">
                        Keep track of the companies you're interested in and never miss a buying opportunity.
                    </p>
                </div>
                <Eye size={180} className="absolute -right-10 -bottom-10 text-slate-100 rotate-12" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Stock Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-28">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-blue-600" /> Add to Watchlist
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                                value={newSymbol}
                                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                                placeholder="Ticker (e.g. MSFT)"
                            />
                        </div>
                        <button
                            onClick={addToWatchlist}
                            disabled={loading}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Watch Symbol'}
                        </button>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {watchlist.map((item) => (
                                <div key={item.symbol} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="bg-slate-100 p-4 rounded-2xl text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <BarChart2 size={24} />
                                        </div>
                                        <div>
                                            <Link to={`/stock/${item.symbol}`} className="text-xl font-black text-slate-900 hover:text-blue-600 transition-all">{item.symbol}</Link>
                                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{item.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="text-xl font-black text-slate-900">${item.price.toFixed(2)}</div>
                                            <div className={`text-sm font-bold flex items-center justify-end gap-1 ${item.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {item.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                {item.change}%
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFromWatchlist(item.symbol)}
                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {watchlist.length === 0 && (
                                <div className="p-20 text-center text-slate-400 font-bold italic">
                                    Your watchlist is empty. Start adding some symbols!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Watchlist;
