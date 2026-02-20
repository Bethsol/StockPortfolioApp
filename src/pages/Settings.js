import React, { useState } from 'react';
import { User, Shield, Bell, Moon, Sun, CreditCard, ChevronRight, CheckCircle2, CloudLightning } from 'lucide-react';

const Settings = ({ userEmail, handleLogout }) => {
    const [theme, setTheme] = useState('light');
    const [tfa, setTfa] = useState(false);
    const [notifications, setNotifications] = useState(true);

    const sections = [
        {
            title: "Account Security",
            items: [
                {
                    label: "Two-Factor Authentication (2FA)",
                    description: "Add an extra layer of security to your account",
                    action: <button onClick={() => setTfa(!tfa)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${tfa ? 'bg-blue-600' : 'bg-slate-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tfa ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                },
                { label: "Change Password", description: "Last changed 3 months ago", action: <ChevronRight size={20} className="text-slate-400" /> }
            ]
        },
        {
            title: "App Preferences",
            items: [
                {
                    label: "Visual Theme",
                    description: theme === 'light' ? "Clean light interface" : "Professional dark mode",
                    action: <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">{theme === 'light' ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-blue-600" />}</button>
                }
            ]
        },
        {
            title: "Communication",
            items: [
                {
                    label: "Price Alerts",
                    description: "Get notified when stocks hit your targets",
                    action: <button onClick={() => setNotifications(!notifications)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notifications ? 'bg-blue-600' : 'bg-slate-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                }
            ]
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Profile Header */}
            <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl">
                        {userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black">{userEmail.split('@')[0]}</h2>
                        <div className="flex items-center gap-2 text-blue-300 font-bold text-sm tracking-wide mt-1">
                            <CheckCircle2 size={16} /> Verified Professional Account
                        </div>
                    </div>
                </div>
                <div className="relative z-10">
                    <button
                        onClick={handleLogout}
                        className="bg-white/10 hover:bg-red-500 text-white px-8 py-3 rounded-2xl font-black transition-all border border-white/10 backdrop-blur-md"
                    >
                        Sign Out
                    </button>
                </div>
                <CloudLightning size={260} className="absolute -right-20 -top-20 text-blue-600 opacity-20 pointer-events-none" />
            </div>

            {/* Billing Status */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Subscription Plan</div>
                        <div className="text-lg font-black text-slate-900">Enterprise Growth Tier</div>
                    </div>
                </div>
                <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Next Renewal</div>
                    <div className="text-sm font-bold text-slate-900">October 12, 2026</div>
                </div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                                {section.title === "Account Security" && <Shield size={20} className="text-blue-600" />}
                                {section.title === "App Preferences" && <Bell size={20} className="text-indigo-600" />}
                                {section.title === "Communication" && <User size={20} className="text-emerald-600" />}
                                {section.title}
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {section.items.map((item, iidx) => (
                                <div key={iidx} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group">
                                    <div>
                                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-all">{item.label}</div>
                                        <div className="text-sm text-slate-400 font-medium mt-1">{item.description}</div>
                                    </div>
                                    <div>{item.action}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Settings;
