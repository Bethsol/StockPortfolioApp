import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

// Mock Market Data Service (JavaScript version)
class MockMarketDataService {
    constructor() {
        this.mockPrices = {
            "AAPL": 170.00,
            "GOOGL": 1800.00,
            "MSFT": 250.00,
            "AMZN": 150.00,
            "TSLA": 700.00,
            "NVDA": 900.00,
            "AMD": 160.00,
        };
        this.random = new Math.Random(); // Simple random number generator
    }

    getMarketPrice(symbol) {
        let basePrice = this.mockPrices[symbol.toUpperCase()] || 100.00;
        let fluctuation = (this.random.nextDouble() * 0.10) - 0.05; // +/- 5%
        let currentPrice = basePrice * (1 + fluctuation);
        this.mockPrices[symbol.toUpperCase()] = currentPrice; // Update for next call
        return Math.max(0.01, currentPrice);
    }
}

// Simple Math.Random equivalent for use in JS
Math.Random = function() {
    this.nextDouble = function() {
        return Math.random();
    };
};

// Represents an aggregated stock holding
class Stock {
    constructor(symbol, companyName, quantity, averagePurchasePrice) {
        this.symbol = symbol;
        this.companyName = companyName;
        this.quantity = quantity;
        this.averagePurchasePrice = averagePurchasePrice;
    }

    getTotalPurchaseCost() {
        return this.quantity * this.averagePurchasePrice;
    }
}

// Helper for aggregating stock quantities and average costs
class StockAggregator {
    constructor(symbol, companyName) {
        this.symbol = symbol;
        this.companyName = companyName;
        this.currentQuantity = 0;
        this.totalCost = 0;
    }

    addBuy(quantity, price) {
        this.totalCost += quantity * price;
        this.currentQuantity += quantity;
    }

    addSell(quantity, price) {
        if (this.currentQuantity > 0) {
            let avgCostPerShare = this.getAveragePurchasePrice();
            this.totalCost -= quantity * avgCostPerShare;
        }
        this.currentQuantity -= quantity;

        if (this.currentQuantity < 0) {
            this.currentQuantity = 0;
            this.totalCost = 0;
        }
        if (this.totalCost < 0 && this.currentQuantity === 0) {
            this.totalCost = 0;
        }
    }

    getAveragePurchasePrice() {
        return this.currentQuantity > 0 ? this.totalCost / this.currentQuantity : 0.0;
    }
}


// Main App Component
const App = () => {
    const portfolioName = "My Portfolio"; // Portfolio name is now a constant

    const [transactions, setTransactions] = useState([]);
    const [currentHoldings, setCurrentHoldings] = useState([]);
    const [totalPurchaseCost, setTotalPurchaseCost] = useState(0);
    const [currentMarketValue, setCurrentMarketValue] = useState(0);
    const [totalProfitLoss, setTotalProfitLoss] = useState(0);

    const [symbol, setSymbol] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');

    const [originalSymbolBeingEdited, setOriginalSymbolBeingEdited] = useState(''); // Used for highlighting selected row

    const [filterText, setFilterText] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Firebase Auth states
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Login/Signup form states
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between Login and Signup

    const marketDataService = useMemo(() => new MockMarketDataService(), []);

    // Custom Modal for Messages/Errors
    const CustomModal = ({ type, message, onClose }) => {
        if (!message) return null;
        const bgColor = type === 'error' ? 'bg-red-100' : 'bg-blue-100';
        const borderColor = type === 'error' ? 'border-red-500' : 'border-blue-500';
        const textColor = type === 'error' ? 'text-red-700' : 'text-blue-700';

        return (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className={`p-8 rounded-xl shadow-2xl ${bgColor} border-2 ${borderColor} flex flex-col items-center justify-center gap-6 transform scale-95 animate-scale-up`}>
                    <p className={`text-lg md:text-xl font-semibold text-center ${textColor}`}>{message}</p>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                    >
                        OK
                    </button>
                </div>
            </div>
        );
    };

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000); // Clear after 3 seconds
    };

    const showError = (msg) => {
        setError(msg);
        setTimeout(() => setError(''), 5000); // Clear after 5 seconds
    };

    // Helper to clear all input fields and reset UI for new entry
    const clearInputFields = useCallback(() => {
        setSymbol('');
        setCompanyName('');
        setQuantity('');
        setPrice('');
        setOriginalSymbolBeingEdited('');
        const button = document.getElementById('addUpdateStockButton');
        if (button) button.innerText = 'Add Stock';
    }, []);

    // Firebase Initialization and Auth State Listener
    useEffect(() => {
        try {
            // !!! IMPORTANT: Replace these with your actual Firebase project config !!!
            // You can find this in your Firebase Project Console -> Project settings -> Your apps -> Web app
            const firebaseConfig = {
                apiKey : "SECRETE KEY HERE",
                authDomain : "SECRETE KEY HERE",
                projectId : "SECRETE KEY HERE",
                storageBucket : "SECRETE KEY HERE",
                messagingSenderId : "SECRETE KEY HERE",
                appId : "SECRETE KEY HERE",
                measurementId : "SECRETE KEY HERE",
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
                    showMessage("Logged in as: " + (user.email || user.uid));
                } else {
                    setUserId(null);
                    setUserEmail('');
                    setIsAuthenticated(false);
                    // If no email/password user, try anonymous sign-in to get a UID for Firestore storage
                    if (!authInstance.currentUser) {
                        try {
                            await signInAnonymously(authInstance);
                        } catch (anonError) {
                            console.error("Error signing in anonymously:", anonError);
                            showError("Failed to establish a session. Please check your network.");
                        }
                    }
                    showMessage("Please log in or sign up.");
                }
                setLoading(false);
            });

            return () => unsubscribe(); // Clean up auth listener

        } catch (e) {
            console.error("Firebase initialization error:", e);
            showError("Failed to initialize the application. Please check your Firebase config.");
            setLoading(false);
        }
    }, []);

    // Firebase Auth Actions
    const handleAuthAction = useCallback(async () => {
        if (!auth) return;
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
                showMessage("Logged in successfully!");
            } else {
                await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
                showMessage("Account created and logged in successfully!");
            }
        } catch (error) {
            console.error("Authentication error:", error);
            let errorMessage = "Authentication failed. ";
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage += "Invalid email address format.";
                    break;
                case 'auth/user-disabled':
                    errorMessage += "User account has been disabled.";
                    break;
                case 'auth/user-not-found':
                case 'auth/invalid-credential':
                    errorMessage += "Invalid email or password.";
                    break;
                case 'auth/wrong-password':
                    errorMessage += "Incorrect password.";
                    break;
                case 'auth/email-already-in-use':
                    errorMessage += "This email is already in use. Try logging in or use a different email.";
                    break;
                case 'auth/weak-password':
                    errorMessage += "Password should be at least 6 characters.";
                    break;
                default:
                    errorMessage += error.message;
            }
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [auth, isLoginMode, loginEmail, loginPassword]);

    const handleLogout = useCallback(async () => {
        if (!auth) return;
        setLoading(true);
        try {
            await signOut(auth);
            showMessage("Logged out successfully.");
            setLoginEmail('');
            setLoginPassword('');
            clearInputFields(); // Clear portfolio-related fields too
        } catch (error) {
            console.error("Logout error:", error);
            showError("Failed to log out: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [auth, clearInputFields]);


    // Firestore Transaction Listener (only runs if authenticated)
    useEffect(() => {
        if (!db || !userId || !isAuthenticated) {
            // Clear data if not authenticated, or if userId/db aren't ready
            setTransactions([]);
            setCurrentHoldings([]);
            setTotalPurchaseCost(0);
            setCurrentMarketValue(0);
            setTotalProfitLoss(0);
            return;
        }

        setLoading(true);
        // Use auth.app.options.projectId for local app ID equivalent
        // This dynamically gets the project ID from the Firebase app initialized.
        const localAppIdentifier = auth.app.options.projectId;
        const transactionsColRef = collection(db, `artifacts/${localAppIdentifier}/users/${userId}/transactions`);
        const q = query(transactionsColRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTransactions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.timestamp ? data.timestamp.toDate() : new Date(),
                };
            });
            setTransactions(fetchedTransactions);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            showError("Failed to load portfolio data. Please refresh.");
            setLoading(false);
        });

        return () => unsubscribe(); // Clean up listener
    }, [db, userId, isAuthenticated, auth]);


    // Aggregate holdings and update performance when transactions change
    const aggregateHoldings = useCallback(() => {
        const aggregatorMap = new Map();
        transactions.forEach(tx => {
            const normalizedSymbol = tx.symbol.toUpperCase();
            const company = tx.companyName || (aggregatorMap.has(normalizedSymbol) ? aggregatorMap.get(normalizedSymbol).companyName : 'N/A');

            if (!aggregatorMap.has(normalizedSymbol)) {
                aggregatorMap.set(normalizedSymbol, new StockAggregator(normalizedSymbol, company));
            }
            const aggregator = aggregatorMap.get(normalizedSymbol);

            if (tx.type === 'BUY') {
                aggregator.addBuy(tx.quantity, tx.price);
            } else if (tx.type === 'SELL') {
                aggregator.addSell(tx.quantity, tx.price);
            }
        });

        const aggregatedStocks = Array.from(aggregatorMap.values())
            .filter(aggregator => aggregator.currentQuantity > 0)
            .map(aggregator => new Stock(
                aggregator.symbol,
                aggregator.companyName,
                aggregator.currentQuantity,
                aggregator.getAveragePurchasePrice()
            ));

        setCurrentHoldings(aggregatedStocks);
    }, [transactions]);


    // Update performance labels
    const updatePerformanceLabels = useCallback(() => {
        let totalPurchase = 0;
        let totalMarket = 0;

        currentHoldings.forEach(stock => {
            const currentPrice = marketDataService.getMarketPrice(stock.symbol);
            totalPurchase += stock.getTotalPurchaseCost();
            totalMarket += stock.quantity * currentPrice;
        });

        setTotalPurchaseCost(totalPurchase);
        setCurrentMarketValue(totalMarket);
        setTotalProfitLoss(totalMarket - totalPurchase);
    }, [currentHoldings, marketDataService]);

    // Effects to trigger aggregation and performance updates
    useEffect(() => {
        aggregateHoldings();
    }, [transactions, aggregateHoldings]);

    useEffect(() => {
        updatePerformanceLabels();
    }, [currentHoldings, updatePerformanceLabels]);


    // --- Form and Table Interaction ---

    const handleStockSelect = useCallback((symbolToEdit) => {
        const stockToEdit = currentHoldings.find(s => s.symbol === symbolToEdit);
        if (stockToEdit) {
            setOriginalSymbolBeingEdited(stockToEdit.symbol); // Used for highlighting
            setSymbol(stockToEdit.symbol);
            setCompanyName(stockToEdit.companyName);
            setQuantity(stockToEdit.quantity.toString());
            setPrice(stockToEdit.averagePurchasePrice.toFixed(2));
            const button = document.getElementById('addUpdateStockButton');
            if (button) button.innerText = 'Update Holding (Buy More)';
        }
    }, [currentHoldings]);

    const addOrUpdateStock = useCallback(async () => {
        if (!db || !userId || !isAuthenticated) {
            showError("Please log in to add or update stocks.");
            return;
        }

        try {
            const parsedQuantity = parseInt(quantity, 10);
            const parsedPrice = parseFloat(price);

            if (!symbol.trim() || !companyName.trim()) {
                showError("Symbol and Company Name cannot be empty.");
                return;
            }
            if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
                showError("Quantity must be a positive number.");
                return;
            }
            if (isNaN(parsedPrice) || parsedPrice <= 0) {
                showError("Price must be a positive number.");
                return;
            }

            setLoading(true);
            const localAppIdentifier = auth.app.options.projectId; // Dynamically get project ID
            await addDoc(collection(db, `artifacts/${localAppIdentifier}/users/${userId}/transactions`), {
                date: new Date(),
                timestamp: serverTimestamp(),
                type: 'BUY',
                symbol: symbol.trim().toUpperCase(),
                companyName: companyName.trim(),
                quantity: parsedQuantity,
                price: parsedPrice,
            });
            showMessage("Added BUY transaction for " + symbol.trim().toUpperCase());

            clearInputFields();
        } catch (e) {
            console.error("Error adding/updating stock:", e);
            showError("An error occurred: " + e.message);
        } finally {
            setLoading(false);
        }
    }, [db, userId, isAuthenticated, symbol, companyName, quantity, price, clearInputFields, auth]);

    const sellSelectedStock = useCallback(async () => {
        if (!db || !userId || !isAuthenticated) {
            showError("Please log in to sell stocks.");
            return;
        }

        const selectedRow = document.getElementById('portfolioTable')?.querySelector('tbody tr.bg-blue-100');
        if (!selectedRow) {
            showError("Please select a stock from the 'Current Holdings' table to sell.");
            return;
        }

        const symbolToSell = selectedRow.cells[0].innerText;
        const currentHoldingQuantity = parseInt(selectedRow.cells[2].innerText, 10);
        const companyNameToSell = selectedRow.cells[1].innerText;

        const quantityStr = prompt(`Enter quantity to sell for ${symbolToSell} (Current: ${currentHoldingQuantity}):`);

        if (quantityStr === null || quantityStr.trim() === '') {
            return; // User cancelled
        }

        try {
            const quantityToSell = parseInt(quantityStr.trim(), 10);
            if (isNaN(quantityToSell) || quantityToSell <= 0) {
                showError("Quantity to sell must be a positive number.");
                return;
            }
            if (quantityToSell > currentHoldingQuantity) {
                showError(`Cannot sell more shares than you own. You have ${currentHoldingQuantity} shares.`);
                return;
            }

            const sellingPrice = marketDataService.getMarketPrice(symbolToSell);

            if (!window.confirm(`Are you sure you want to sell ${quantityToSell} shares of ${symbolToSell} at $${sellingPrice.toFixed(2)}?`)) {
                return;
            }

            setLoading(true);
            const localAppIdentifier = auth.app.options.projectId; // Dynamically get project ID
            await addDoc(collection(db, `artifacts/${localAppIdentifier}/users/${userId}/transactions`), {
                date: new Date(),
                timestamp: serverTimestamp(),
                type: 'SELL',
                symbol: symbolToSell,
                companyName: companyNameToSell,
                quantity: quantityToSell,
                price: sellingPrice,
            });
            showMessage(`Sold ${quantityToSell} shares of ${symbolToSell}.`);

        } catch (e) {
            console.error("Error selling stock:", e);
            showError("An error occurred during sell operation: " + e.message);
        } finally {
            setLoading(false);
        }
    }, [db, userId, isAuthenticated, marketDataService, auth]);


    const refreshPerformance = useCallback(() => {
        updatePerformanceLabels();
        showMessage("Performance refreshed!");
    }, [updatePerformanceLabels]);

    const exportToCsv = useCallback(() => {
        if (!isAuthenticated || (currentHoldings.length === 0 && transactions.length === 0)) {
            showError("Nothing to export. Please log in and add some data.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";

        // Current Holdings Headers
        const holdingHeaders = ["Symbol", "Company", "Quantity", "Avg. Purchase Price", "Current Price", "Total Cost", "Market Value", "P/L"];
        csvContent += holdingHeaders.join(",") + "\n";

        // Current Holdings Data
        currentHoldings.forEach(stock => {
            const currentPrice = marketDataService.getMarketPrice(stock.symbol);
            const marketValue = stock.quantity * currentPrice;
            const profitLoss = marketValue - stock.getTotalPurchaseCost();

            const row = [
                stock.symbol,
                stock.companyName,
                stock.quantity,
                stock.averagePurchasePrice.toFixed(2),
                currentPrice.toFixed(2),
                stock.getTotalPurchaseCost().toFixed(2),
                marketValue.toFixed(2),
                profitLoss.toFixed(2)
            ].map(value => {
                const strValue = String(value);
                return strValue.includes(',') || strValue.includes('"') ? `"${strValue.replace(/"/g, '""')}"` : strValue;
            });
            csvContent += row.join(",") + "\n";
        });

        csvContent += "\n\n--- Transaction History ---\n\n";

        // Transaction History Headers
        const transactionHeaders = ["Date", "Type", "Symbol", "Company", "Quantity", "Price"];
        csvContent += transactionHeaders.join(",") + "\n";

        // Transaction History Data
        const dateFormat = new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false // 24-hour format
        });
        transactions.forEach(tx => {
            const row = [
                tx.date ? dateFormat.format(tx.date) : '',
                tx.type,
                tx.symbol,
                tx.companyName,
                tx.quantity,
                tx.price.toFixed(2)
            ].map(value => {
                const strValue = String(value);
                return strValue.includes(',') || strValue.includes('"') ? `"${strValue.replace(/"/g, '""')}"` : strValue;
            });
            csvContent += row.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `portfolio_data_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link); // Clean up
        showMessage("Portfolio data exported to CSV!");
    }, [currentHoldings, transactions, marketDataService, isAuthenticated]);


    // The `handleTabChange` function was previously present but unused because the JTabbedPane JSX was commented out.
    // Since the layout now uses direct div containers for Current Holdings and Transaction History,
    // this function is no longer needed and has been removed for cleaner code.

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800 flex flex-col items-center justify-center">
                {/* Tailwind CSS CDN and Inter Font links removed from JSX as they belong in public/index.html */}
                <CustomModal type="info" message={message} onClose={() => setMessage('')} />
                <CustomModal type="error" message={error} onClose={() => setError('')} />

                <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                        {isLoginMode ? 'Log In' : 'Sign Up'} to Your Portfolio
                    </h2>
                    <div className="space-y-5"> {/* Increased spacing */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                            <input
                                type="email"
                                id="email"
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
                            <input
                                type="password"
                                id="password"
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="password"
                                required
                            />
                        </div>
                        <button
                            onClick={handleAuthAction}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-lg"
                            disabled={loading}
                        >
                            {isLoginMode ? 'Log In' : 'Sign Up'}
                        </button>
                    </div>
                    <button
                        onClick={() => setIsLoginMode(!isLoginMode)}
                        className="w-full mt-6 text-base text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                    >
                        {isLoginMode ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
                    </button>
                </div>
            </div>
        );
    }


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4 font-sans text-gray-800">
                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600"></div>
                <p className="mt-6 text-xl font-semibold text-gray-700">Loading Portfolio Data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4 font-sans text-gray-800 flex flex-col items-center">
            {/* These links should ideally be in public/index.html, not in component JSX for local development */}
            {/* <script src="https://cdn.tailwindcss.com"></script> */}
            {/* <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" /> */}
            <style>
                {`
                body { font-family: 'Inter', sans-serif; }
                /* Custom styles for tables */
                table {
                    width: 100%;
                    border-collapse: separate; /* Use separate for rounded corners on cells */
                    border-spacing: 0;
                }
                th, td {
                    padding: 1rem; /* Increased padding */
                    text-align: left;
                    border-bottom: 1px solid #e2e8f0; /* gray-200 */
                }
                th {
                    background-color: #e0f2fe; /* blue-50 */
                    font-weight: 700; /* Bolder */
                    color: #2563eb; /* blue-700 */
                    text-transform: uppercase;
                    font-size: 0.85rem;
                }
                th:first-child { border-top-left-radius: 0.5rem; }
                th:last-child { border-top-right-radius: 0.5rem; }

                tbody tr:hover {
                    background-color: #e3f2fd; /* blue-100 */
                    cursor: pointer;
                    transform: translateY(-2px); /* Subtle lift on hover */
                    box-shadow: 0 4px 8px rgba(0,0,0,0.05); /* Subtle shadow on hover */
                }
                tbody tr {
                    transition: all 0.2s ease-in-out; /* Smooth transition for hover effects */
                }

                .highlight-profit {
                    color: #10B981; /* green-500 */
                    font-weight: 700;
                }
                .highlight-loss {
                    color: #EF4444; /* red-500 */
                    font-weight: 700;
                }
                .highlight-neutral {
                    color: #4B5563; /* gray-700 */
                }
                /* Style for selected row */
                .portfolio-table tbody tr.bg-blue-100 {
                    background-color: #BBDEFB !important; /* blue-200, slightly darker */
                    outline: 3px solid #3B82F6; /* blue-500, thicker outline */
                    box-shadow: 0 6px 12px rgba(0,0,0,0.1); /* More prominent shadow for selected */
                }

                /* Animations for modals */
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }

                @keyframes scale-up {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-up {
                    animation: scale-up 0.3s ease-out forwards;
                }
                `}
            </style>

            <CustomModal type="info" message={message} onClose={() => setMessage('')} />
            <CustomModal type="error" message={error} onClose={() => setError('')} />

            <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-8 mb-8 mt-4 md:mt-8 border border-blue-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2 md:mb-0">
                        Stock Portfolio Tracker
                    </h1>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                    >
                        Log Out
                    </button>
                </div>
                <p className="text-2xl text-blue-700 font-semibold mb-4">
                    {portfolioName}
                </p>
                {userId && (
                    <p className="text-base text-gray-600">
                        Logged in as: <span className="font-mono bg-blue-100 text-blue-800 rounded px-3 py-1 font-semibold text-sm">{userEmail}</span> <br className="md:hidden"/> (ID: <span className="font-mono bg-gray-200 rounded px-3 py-1 font-semibold text-sm">{userId}</span>)
                    </p>
                )}
            </div>

            <div className="w-full max-w-6xl bg-white rounded-xl shadow-lg p-8 flex flex-col lg:flex-row gap-8 mb-8 border border-blue-200">
                {/* Input Panel */}
                <div className="w-full lg:w-1/3 p-6 border border-blue-100 bg-blue-50 rounded-xl shadow-md flex-shrink-0">
                    <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Manage Transactions</h2>
                    <div className="space-y-5"> {/* Increased spacing */}
                        <div>
                            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">Symbol:</label>
                            <input
                                type="text"
                                id="symbol"
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                placeholder="e.g., AAPL"
                            />
                        </div>
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name:</label>
                            <input
                                type="text"
                                id="companyName"
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g., Apple Inc."
                            />
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity:</label>
                            <input
                                type="number"
                                id="quantity"
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="e.g., 10"
                                min="1"
                            />
                        </div>
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (per share):</label>
                            <input
                                type="number"
                                id="price"
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g., 150.00"
                                step="0.01"
                                min="0.01"
                            />
                        </div>
                        <button
                            id="addUpdateStockButton"
                            onClick={addOrUpdateStock}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 text-lg"
                            disabled={!isAuthenticated || loading}
                        >
                            Add Stock
                        </button>
                        <hr className="my-5 border-blue-200" />
                        <button
                            onClick={sellSelectedStock}
                            className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 text-lg"
                            disabled={!isAuthenticated || loading}
                        >
                            Sell Selected Stock (from holdings)
                        </button>
                        <button
                            onClick={clearInputFields}
                            className="w-full mt-3 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 text-lg"
                            disabled={loading}
                        >
                            Clear Fields / Cancel Edit
                        </button>
                    </div>
                </div>

                {/* Tables and Performance */}
                <div className="w-full lg:w-2/3 p-0"> {/* Adjusted padding here as child divs have padding */}
                    <div className="w-full bg-white rounded-xl shadow-md p-6 mb-8 border border-blue-100">
                        <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">Current Holdings</h2>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-medium text-gray-700">Filter Holdings:</span>
                            <input
                                type="text"
                                id="filterField"
                                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 w-full md:w-2/3 text-base transition-all duration-200"
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                placeholder="Filter by symbol or company"
                            />
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-inner">
                            <table id="portfolioTable" className="min-w-full divide-y divide-gray-200 portfolio-table">
                                <thead className="bg-blue-50">
                                    <tr>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700 rounded-tl-lg">Symbol</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Company</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Quantity</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Avg. Price</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Current Price</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Total Cost</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Market Value</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700 rounded-tr-lg">P/L</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentHoldings
                                        .filter(stock =>
                                            stock.symbol.toLowerCase().includes(filterText.toLowerCase()) ||
                                            stock.companyName.toLowerCase().includes(filterText.toLowerCase())
                                        )
                                        .map((stock, index) => {
                                            const currentPrice = marketDataService.getMarketPrice(stock.symbol);
                                            const marketValue = stock.quantity * currentPrice;
                                            const profitLoss = marketValue - stock.getTotalPurchaseCost();
                                            const profitLossClass = profitLoss > 0 ? 'highlight-profit' : (profitLoss < 0 ? 'highlight-loss' : 'highlight-neutral');

                                            return (
                                                <tr
                                                    key={stock.symbol}
                                                    onClick={() => handleStockSelect(stock.symbol)}
                                                    className={originalSymbolBeingEdited === stock.symbol ? 'bg-blue-100' : ''}
                                                >
                                                    <td className="py-3 px-6 whitespace-nowrap text-sm font-medium text-gray-900">{stock.symbol}</td>
                                                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">{stock.companyName}</td>
                                                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">{stock.quantity}</td>
                                                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">${stock.averagePurchasePrice.toFixed(2)}</td>
                                                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">${currentPrice.toFixed(2)}</td>
                                                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">${stock.getTotalPurchaseCost().toFixed(2)}</td>
                                                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">${marketValue.toFixed(2)}</td>
                                                    <td className={`py-3 px-6 whitespace-nowrap text-sm ${profitLossClass}`}>${profitLoss.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                        {currentHoldings.length === 0 && (
                                            <tr>
                                                <td colSpan="8" className="py-4 px-6 text-center text-gray-500 text-base">No current holdings. Add some stocks!</td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="w-full bg-white rounded-xl shadow-md p-6 mb-8 border border-blue-100">
                        <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Portfolio Performance Summary</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg shadow-sm">
                                <span className="font-semibold text-blue-800">Total Purchase Cost:</span>
                                <span className="font-extrabold text-gray-900 text-xl">${totalPurchaseCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg shadow-sm">
                                <span className="font-semibold text-blue-800">Current Market Value:</span>
                                <span className="font-extrabold text-gray-900 text-xl">${currentMarketValue.toFixed(2)}</span>
                            </div>
                            <div className="col-span-1 md:col-span-2 flex justify-between items-center bg-blue-50 p-4 rounded-lg shadow-sm">
                                <span className="font-semibold text-blue-800">Total Profit/Loss:</span>
                                <span className={`font-extrabold text-xl ${totalProfitLoss > 0 ? 'highlight-profit' : (totalProfitLoss < 0 ? 'highlight-loss' : 'highlight-neutral')}`}>
                                    ${totalProfitLoss.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-white rounded-xl shadow-md p-6 mb-8 border border-blue-100">
                        <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Transaction History</h2>
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-inner">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-50">
                                    <tr>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700 rounded-tl-lg">Date</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Type</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Symbol</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Company</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700">Quantity</th>
                                        <th className="py-3 px-6 text-xs uppercase tracking-wider text-blue-700 rounded-tr-lg">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions
                                        .sort((a, b) => b.date - a.date) // Sort by date descending
                                        .map((tx, index) => (
                                        <tr key={index}>
                                            <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">{tx.date.toLocaleString()}</td>
                                            <td className={`py-3 px-6 whitespace-nowrap text-sm font-semibold ${tx.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>{tx.type}</td>
                                            <td className="py-3 px-6 whitespace-nowrap text-sm font-medium text-gray-900">{tx.symbol}</td>
                                            <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">{tx.companyName}</td>
                                            <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">{tx.quantity}</td>
                                            <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-700">${tx.price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="py-4 px-6 text-center text-gray-500 text-base">No transactions yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="w-full mt-6 flex flex-wrap justify-center gap-6">
                        <button
                            onClick={refreshPerformance}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 text-lg"
                            disabled={!isAuthenticated || loading}
                        >
                            Refresh Performance
                        </button>
                        <button
                            onClick={exportToCsv}
                            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 text-lg"
                            disabled={!isAuthenticated || (currentHoldings.length === 0 && transactions.length === 0) || loading}
                        >
                            Export to CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;