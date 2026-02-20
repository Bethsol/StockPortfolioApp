export class MarketDataService {
    constructor() {
        this.apiKey = process.env.REACT_APP_FINNHUB_API_KEY;
        this.isMock = !this.apiKey || this.apiKey === 'your_finnhub_api_key_here';
        this.mockPrices = {
            "AAPL": 175.43, "GOOGL": 142.56, "MSFT": 412.30,
            "AMZN": 178.22, "TSLA": 193.57, "NVDA": 875.28,
            "AMD": 180.49, "META": 496.24, "NFLX": 605.88
        };
        this.cache = new Map();
    }

    async getMarketPrice(symbol) {
        const sym = symbol.toUpperCase();
        if (this.isMock) {
            let basePrice = this.mockPrices[sym] || 100.00;
            let fluctuation = (Math.random() * 0.04) - 0.02; // +/- 2%
            return Math.max(0.01, basePrice * (1 + fluctuation));
        }

        const cached = this.cache.get(sym);
        if (cached && Date.now() - cached.time < 60000) {
            return cached.price;
        }

        try {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${this.apiKey}`);
            const data = await response.json();
            if (data.c) {
                this.cache.set(sym, { price: data.c, time: Date.now() });
                return data.c;
            }
            return 100.00;
        } catch (e) {
            console.error("Finnhub fetch error:", e);
            return 100.00;
        }
    }
}

export class Stock {
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

export class StockAggregator {
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
