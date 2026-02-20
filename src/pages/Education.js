import React from 'react';
import { BookOpen, Shield, BarChart2, Lightbulb, CheckCircle2 } from 'lucide-react';

const Education = () => {
    const modules = [
        {
            title: "Investment Fundamentals",
            icon: <BookOpen className="text-blue-500" />,
            description: "Learn the core concepts of stock ownership, market mechanics, and how to start your investment journey.",
            topics: ["What is a Stock?", "Understanding Market Cap", "Role of Stock Exchanges"]
        },
        {
            title: "Portfolio Strategy",
            icon: <Shield className="text-emerald-500" />,
            description: "Master the art of diversification and risk management to protect your capital while maximizing returns.",
            topics: ["Asset Allocation", "Risk Tolerance", "Diversification Benefits"]
        },
        {
            title: "Technical Analysis",
            icon: <BarChart2 className="text-purple-500" />,
            description: "Introduction to chart patterns, trends, and indicators used by professional traders to find entry points.",
            topics: ["Support & Resistance", "Moving Averages", "RSI and Momentum"]
        },
        {
            title: "Financial Planning",
            icon: <Lightbulb className="text-amber-500" />,
            description: "How to align your investment portfolio with long-term goals like retirement and wealth building.",
            topics: ["Compounding Interest", "Tax-Efficient Investing", "Dollar Cost Averaging"]
        }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Financial Intelligence Hub</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                        Empower your investment decisions with expert knowledge and strategic insights tailored for professional portfolio management.
                    </p>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BookOpen size={200} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((module, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-2xl group-hover:scale-110 transition-all">
                                {module.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{module.title}</h3>
                        </div>
                        <p className="text-slate-500 mb-6 leading-relaxed">
                            {module.description}
                        </p>
                        <ul className="space-y-3">
                            {module.topics.map((topic, tidx) => (
                                <li key={tidx} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                                    <CheckCircle2 size={16} className="text-blue-500" /> {topic}
                                </li>
                            ))}
                        </ul>
                        <button className="mt-8 w-full py-3 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 font-bold rounded-xl transition-all">
                            Start Module
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h4 className="text-2xl font-bold mb-2">Ready for the advanced course?</h4>
                    <p className="text-slate-400">Join our monthly webinar with seasoned hedge fund managers.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
                    Register for Webinar
                </button>
            </div>
        </div>
    );
};

export default Education;
