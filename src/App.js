import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { LayoutDashboard, PieChart as PieIcon, List, Search, BookOpen, LogOut, TrendingUp, RefreshCw, X, Bell, Activity, ChevronRight, Sun, Moon, Shield } from 'lucide-react';

// Relative imports
import { MarketDataService, Stock, StockAggregator } from './services';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Transactions from './pages/Transactions';
import Market from './pages/Market';
import Education from './pages/Education';
import StockDetail from './pages/StockDetail';
import Watchlist from './pages/Watchlist';
// import Settings from './pages/Settings';
import GlobalNews from './pages/GlobalNews';

// Main App Component
const App = () => {
    // --- State Management ---
    const [transactions, setTransactions] = useState([]);
    const [currentHoldings, setCurrentHoldings] = useState([]);
    const [currentPrices, setCurrentPrices] = useState({});
    const [totalPurchaseCost, setTotalPurchaseCost] = useState(0);
    const [currentMarketValue, setCurrentMarketValue] = useState(0);
    const [totalProfitLoss, setTotalProfitLoss] = useState(0);

    const [symbol, setSymbol] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [originalSymbolBeingEdited, setOriginalSymbolBeingEdited] = useState('');

    const [authLoading, setAuthLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notificationsOn, setNotificationsOn] = useState(true);
    const [tfaEnabled, setTfaEnabled] = useState(false);

    const marketDataService = useMemo(() => new MarketDataService(), []);

    const showMessage = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };
    const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // --- Firebase Initialization ---
    useEffect(() => {
        try {
            const firebaseConfig = {
                apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
                authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
                projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
                storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.REACT_APP_FIREBASE_APP_ID,
                measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
            };

            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const firestoreInstance = getFirestore(app);

            setDb(firestoreInstance);
            setAuth(authInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setUserEmail(user.email || 'Anonymous');
                    setIsAuthenticated(true);
                } else {
                    setUserId(null);
                    setUserEmail('');
                    setIsAuthenticated(false);
                }
                setAuthLoading(false);
            });
            return () => unsubscribe();
        } catch (e) {
            console.error(e);
            setAuthLoading(false);
        }
    }, []);

    // --- Actions ---
    const handleAuthAction = async () => {
        if (!auth) return;
        setAuthLoading(true);
        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
                showMessage("Welcome back!");
            } else {
                await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
                showMessage("Account created!");
            }
        } catch (e) { showError(e.message); }
        finally { setAuthLoading(false); }
    };

    const handleLogout = async () => {
        if (!auth) return;
        setAuthLoading(true);
        try { await signOut(auth); showMessage("Logged out."); }
        catch (e) { showError(e.message); }
        finally { setAuthLoading(false); }
    };

    useEffect(() => {
        if (!db || !userId || !isAuthenticated) {
            setTransactions([]);
            return;
        }
        setDataLoading(true);
        const projectId = auth.app.options.projectId;
        const ref = collection(db, `artifacts/${projectId}/users/${userId}/transactions`);
        const q = query(ref, orderBy("timestamp", "asc"));

        return onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date(),
            }));
            setTransactions(txs);
            setDataLoading(false);
        }, (e) => {
            console.error(e);
            setDataLoading(false);
        });
    }, [db, userId, isAuthenticated, auth]);

    const aggregateHoldings = useCallback(() => {
        const aggregatorMap = new Map();
        transactions.forEach(tx => {
            const sym = tx.symbol.toUpperCase();
            if (!aggregatorMap.has(sym)) {
                aggregatorMap.set(sym, new StockAggregator(sym, tx.companyName));
            }
            const agg = aggregatorMap.get(sym);
            if (tx.type === 'BUY') agg.addBuy(tx.quantity, tx.price);
            else if (tx.type === 'SELL') agg.addSell(tx.quantity, tx.price);
        });

        const stocks = Array.from(aggregatorMap.values())
            .filter(a => a.currentQuantity > 0)
            .map(a => new Stock(a.symbol, a.companyName, a.currentQuantity, a.getAveragePurchasePrice()));

        setCurrentHoldings(stocks);
    }, [transactions]);

    const updatePerformanceLabels = useCallback(async () => {
        let cost = 0, market = 0, prices = {};
        for (const s of currentHoldings) {
            const p = await marketDataService.getMarketPrice(s.symbol);
            prices[s.symbol] = p;
            cost += s.getTotalPurchaseCost();
            market += s.quantity * p;
        }
        setCurrentPrices(prices);
        setTotalPurchaseCost(cost);
        setCurrentMarketValue(market);
        setTotalProfitLoss(market - cost);
    }, [currentHoldings, marketDataService]);

    useEffect(() => { aggregateHoldings(); }, [transactions, aggregateHoldings]);
    useEffect(() => { updatePerformanceLabels(); }, [currentHoldings, updatePerformanceLabels]);

    const handleStockSelect = (sym) => {
        const s = currentHoldings.find(h => h.symbol === sym);
        if (s) {
            setOriginalSymbolBeingEdited(s.symbol);
            setSymbol(s.symbol);
            setCompanyName(s.companyName);
            setQuantity(s.quantity.toString());
            setPrice(s.averagePurchasePrice.toFixed(2));
        }
    };

    const addOrUpdateStock = async (customData) => {
        if (!db || !userId || !isAuthenticated) return showError("Auth required");

        const s = customData?.symbol || symbol;
        const q = parseInt(customData?.quantity || quantity);
        const p = parseFloat(customData?.price || price);
        const name = customData?.companyName || companyName;

        if (!s || isNaN(q) || isNaN(p)) return showError("Invalid input");

        setDataLoading(true);
        try {
            await addDoc(collection(db, `artifacts/${auth.app.options.projectId}/users/${userId}/transactions`), {
                timestamp: serverTimestamp(),
                type: 'BUY',
                symbol: s.toUpperCase(),
                companyName: name || s.toUpperCase(),
                quantity: q,
                price: p,
            });
            showMessage("Transaction successful");
            if (!customData) {
                setSymbol(''); setCompanyName(''); setQuantity(''); setPrice('');
            }
        } catch (e) { showError(e.message); }
        finally { setDataLoading(false); }
    };

    const sellSelectedStock = async (customSymbol) => {
        const targetSymbol = customSymbol || originalSymbolBeingEdited;
        if (!db || !userId || !isAuthenticated || !targetSymbol) return showError("Select a stock");

        const s = currentHoldings.find(h => h.symbol === targetSymbol);
        if (!s) return showError("Holding not found");

        const qStr = prompt(`Sell quantity for ${s.symbol} (max ${s.quantity}):`);
        const qSell = parseInt(qStr);
        if (isNaN(qSell) || qSell <= 0 || qSell > s.quantity) return showError("Invalid quantity");

        setDataLoading(true);
        try {
            const p = await marketDataService.getMarketPrice(s.symbol);
            await addDoc(collection(db, `artifacts/${auth.app.options.projectId}/users/${userId}/transactions`), {
                timestamp: serverTimestamp(),
                type: 'SELL',
                symbol: s.symbol,
                companyName: s.companyName,
                quantity: qSell,
                price: p,
            });
            showMessage("Stock sold");
        } catch (e) { showError(e.message); }
        finally { setDataLoading(false); }
    };

    const exportToCsv = () => {
        let csv = "data:text/csv;charset=utf-8,Symbol,Company,Quantity,AvgPrice,CurrentPrice,Cost,MarketValue,PL\n";
        currentHoldings.forEach(s => {
            const p = currentPrices[s.symbol] || s.averagePurchasePrice;
            const val = s.quantity * p;
            csv += `${s.symbol},${s.companyName},${s.quantity},${s.averagePurchasePrice},${p},${s.getTotalPurchaseCost()},${val},${val - s.getTotalPurchaseCost()}\n`;
        });
        const link = document.createElement("a");
        link.href = encodeURI(csv);
        link.download = `portfolio_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    // --- Nav Component ---
    const Navigation = () => {
        const loc = useLocation();
        const [showProfileDropdown, setShowProfileDropdown] = useState(false);

        const navItems = [
            { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
            { path: '/portfolio', label: 'Portfolio', icon: <PieIcon size={20} /> },
            { path: '/watchlist', label: 'Watchlist', icon: <Bell size={20} /> },
            { path: '/transactions', label: 'History', icon: <List size={20} /> },
            { path: '/market', label: 'Signals', icon: <Search size={20} /> },
            { path: '/outlook', label: 'Outlook', icon: <BookOpen size={20} /> },
        ];

        return (
            <nav className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
                {/* Branding Bar (3D Shiny Metallic) */}
                <div className="relative py-4 text-right overflow-hidden bg-slate-900 border-b border-white/10 group">
                    {/* 3D Shiny Animation Layer */}
                    <div className="absolute inset-0 z-0 opacity-40">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shine" />
                    </div>
                    {/* Depth Gradient */}
                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-right justify-right">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.6em] block mb-1 opacity-80">Quantum Ecosystem</span>
                        <div className="flex items-right gap-3">
                            <div className="p-1.5 bg-blue-600 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/30">
                                <TrendingUp size={20} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-[0.2em] italic bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                Stock-Verse
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Profile Dropdown (FIRST) */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all border border-slate-100 dark:border-slate-700 group"
                            >
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                                    {userEmail.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left hidden lg:block">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-[8px]">Session</div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[100px]">{userEmail}</div>
                                </div>
                            </button>

                            {showProfileDropdown && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileDropdown(false)}></div>
                                    <div className="absolute top-full left-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-20 animate-fade-in">
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active Identity</div>
                                            <div className="text-sm font-black text-slate-900 dark:text-white truncate">{userEmail}</div>
                                        </div>

                                        <div className="p-4 space-y-2">
                                            {/* In-Dropdown Settings (Non-Clickable Header) */}
                                            <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Environment Settings</div>

                                            {/* Theme Toggle */}
                                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                <div className="flex items-center gap-3">
                                                    {isDarkMode ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-amber-500" />}
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Dark Mode</span>
                                                </div>
                                                <button
                                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>

                                            {/* Security Proxy (Simulation) */}
                                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                <div className="flex items-center gap-3">
                                                    <Shield size={18} className="text-emerald-500" />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">2FA Terminal</span>
                                                </div>
                                                <button
                                                    onClick={() => setTfaEnabled(!tfaEnabled)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${tfaEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tfaEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>

                                            {/* Alerts Toggle */}
                                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                <div className="flex items-center gap-3">
                                                    <Bell size={18} className="text-indigo-500" />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Alert Signals</span>
                                                </div>
                                                <button
                                                    onClick={() => setNotificationsOn(!notificationsOn)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notificationsOn ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsOn ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    onClick={() => { handleLogout(); setShowProfileDropdown(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-black transition-all text-sm uppercase tracking-widest"
                                                >
                                                    <LogOut size={18} /> LogOut
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800"></div>

                        {/* Desktop Navigation Items */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${loc.pathname === item.path ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    {item.icon} {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-600 transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </button>
                    </div>
                </div>
            </nav>
        );
    };

    const CustomModal = ({ type, message, onClose }) => {
        if (!message) return null;
        return (
            <div className="fixed bottom-10 right-10 z-[100] animate-fade-in">
                <div className={`px-6 py-4 rounded-2xl shadow-2xl border-2 flex items-center gap-4 ${type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                    <span className="font-bold">{message}</span>
                    <button onClick={onClose}><X size={18} /></button>
                </div>
            </div>
        );
    };

    if (authLoading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <RefreshCw className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="font-bold text-slate-400">Securing your session...</p>
        </div>
    );

    if (!isAuthenticated) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Cinematic Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-950 to-indigo-900/30 z-10" />
                <video
                    autoPlay muted loop playsInline
                    className="w-full h-full object-cover opacity-40 scale-105 blur-[2px]"
                >
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-mesh-network-loop-42867-large.mp4" type="video/mp4" />
                </video>
                {/* Floating Intelligence Nodes */}
                <div className="absolute inset-0 z-5">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse delay-1000" />
                </div>
                {/* Digital Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Central Command Terminal */}
            <div className="relative z-20 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-[40px] rounded-[60px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">

                {/* Visual Identity Side */}
                <div className="hidden lg:flex flex-col p-16 border-r border-white/5 bg-white/[0.02]">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12 self-start animate-pulse">
                        <Activity size={14} /> Intelligence Core Active
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-blue-600 rounded-[32px] shadow-[0_0_40px_rgba(37,99,235,0.3)]">
                            <TrendingUp size={48} className="text-white" />
                        </div>
                        <h2 className="text-5xl font-black text-white tracking-widest uppercase italic">Stock-Verse</h2>
                    </div>

                    <h1 className="text-6xl font-black text-white mb-8 leading-[0.9] tracking-tighter">
                        Master the <br /> <span className="text-blue-500">Multi-Verse.</span>
                    </h1>

                    <p className="text-slate-400 text-lg font-medium leading-relaxed mb-12">
                        Welcome to the next generation of quantitative asset management.
                    </p>

                    <div className="mt-auto flex items-center gap-10">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-white uppercase tracking-tighter">Live Scan</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Status: Operational</span>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="flex flex-col">

                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Engine Version</span>
                        </div>
                    </div>
                </div>

                {/* Form / Terminal Interaction Side */}
                <div className="p-10 lg:p-16 flex flex-col justify-center">
                    <div className="mb-10 text-center lg:text-left">
                        <h3 className="text-3xl font-black text-white mb-3">Initialize Identity</h3>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Secure Session Protocol Required</p>
                    </div>

                    <div className="space-y-6">
                        <div className="group space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 group-focus-within:text-blue-500 transition-colors">Credential Email</label>
                            <input
                                type="email"
                                value={loginEmail}
                                onChange={e => setLoginEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-[30px] px-8 py-6 outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 font-bold text-white text-lg transition-all placeholder:text-slate-600"
                                placeholder="name@quantum-verse.com"
                            />
                        </div>

                        <div className="group space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 group-focus-within:text-blue-500 transition-colors">Access Passkey</label>
                            <input
                                type="password"
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-[30px] px-8 py-6 outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 font-bold text-white text-lg transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={handleAuthAction}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[30px] shadow-[0_20px_40px_rgba(37,99,235,0.2)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 group"
                            >
                                <span className="uppercase tracking-[0.2em] text-sm">
                                    {isLoginMode ? 'Log In' : 'Sign Up'}
                                </span>
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <button
                            onClick={() => setIsLoginMode(!isLoginMode)}
                            className="text-[10px] font-black text-slate-400 hover:text-blue-500 transition-all uppercase tracking-[0.4em] decoration-blue-500/50 underline-offset-8 decoration-2 hover:underline"
                        >
                            {isLoginMode ? "Sign Up →" : "Login →"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Global Legal Footer */}
            <div className="absolute bottom-8 left-0 right-0 text-center opacity-30 pointer-events-none">
                <span className="text-[8px] font-black text-white uppercase tracking-[0.5em]">Stock-Verse Global Intelligence Network • Encrypted Session Host</span>
            </div>
        </div>
    );

    return (
        <Router>
            <div className="min-h-screen bg-slate-50 pb-20">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                    body { font-family: 'Plus Jakarta Sans', sans-serif; transition: background-color 0.3s ease; }
                    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes shine { from { transform: translateX(-200%) skewX(-20deg); } to { transform: translateX(200%) skewX(-20deg); } }
                    .animate-shine { animation: shine 5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
                    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); }
                    
                    /* Global Dark Mode Overrides */
                    .dark body { background-color: #0f172a; color: white; }
                    .dark .bg-white { background-color: #1e293b !important; border-color: #334155 !important; }
                    .dark .text-slate-900 { color: #f8fafc !important; }
                    .dark .text-slate-500 { color: #94a3b8 !important; }
                    .dark .bg-slate-50 { background-color: #0f172a !important; }
                    .dark .border-slate-100, .dark .border-slate-200 { border-color: #334155 !important; }
                    .dark input { background-color: #1e293b !important; color: white !important; border-color: #334155 !important; }
                    .dark table th { background-color: #0f172a !important; color: #94a3b8 !important; }
                    .dark h1, .dark h2, .dark h3 { color: #f8fafc !important; }
                `}</style>

                <CustomModal type="info" message={message} onClose={() => setMessage('')} />
                <CustomModal type="error" message={error} onClose={() => setError('')} />

                <Navigation />

                <main className="max-w-7xl mx-auto px-6 py-10">
                    <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Active Portfolio</h2>
                            <p className="text-slate-500 font-semibold flex items-center gap-2 mt-1">
                                High Growth Equities Strategy {dataLoading && <RefreshCw size={14} className="animate-spin text-blue-600" />}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={updatePerformanceLabels} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                                <RefreshCw size={20} />
                            </button>
                            <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                                <Bell size={20} />
                            </button>
                        </div>
                    </header>

                    <Routes>
                        <Route path="/" element={
                            <Dashboard
                                totalPurchaseCost={totalPurchaseCost}
                                currentMarketValue={currentMarketValue}
                                totalProfitLoss={totalProfitLoss}
                                currentHoldings={currentHoldings}
                                currentPrices={currentPrices}
                            />
                        } />
                        <Route path="/portfolio" element={
                            <Portfolio
                                currentHoldings={currentHoldings}
                                currentPrices={currentPrices}
                                symbol={symbol} setSymbol={setSymbol}
                                companyName={companyName} setCompanyName={setCompanyName}
                                quantity={quantity} setQuantity={setQuantity}
                                price={price} setPrice={setPrice}
                                addOrUpdateStock={addOrUpdateStock}
                                sellSelectedStock={sellSelectedStock}
                                handleStockSelect={handleStockSelect}
                                originalSymbolBeingEdited={originalSymbolBeingEdited}
                                isAuthenticated={isAuthenticated}
                                dataLoading={dataLoading}
                            />
                        } />
                        <Route path="/transactions" element={
                            <Transactions transactions={transactions} exportToCsv={exportToCsv} />
                        } />
                        <Route path="/market" element={
                            <Market marketDataService={marketDataService} />
                        } />
                        <Route path="/education" element={<Education />} />
                        <Route path="/outlook" element={<GlobalNews />} />
                        <Route path="/stock/:symbol" element={<StockDetail marketDataService={marketDataService} addOrUpdateStock={addOrUpdateStock} sellSelectedStock={sellSelectedStock} />} />
                        <Route path="/watchlist" element={<Watchlist marketDataService={marketDataService} />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;