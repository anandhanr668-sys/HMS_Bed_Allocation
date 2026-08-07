import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (msg, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, msg, type }]);
        setTimeout(() => removeNotification(id), 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {notifications.map((n) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            className="pointer-events-auto"
                        >
                            <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl border min-w-[320px] max-w-md ${n.type === 'error' ? 'bg-red-900 border-red-500 text-white' :
                                n.type === 'success' ? 'bg-emerald-900 border-emerald-500 text-white' :
                                    'bg-gray-900 border-gray-700 text-white'
                                }`}>
                                <div className={`p-2 rounded-xl bg-white/10`}>
                                    {n.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                                    {n.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                                    {n.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold">{n.msg}</p>
                                </div>
                                <button onClick={() => removeNotification(n.id)} className="p-1 hover:bg-white/10 rounded-lg transition">
                                    <X className="w-4 h-4 text-white/40" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};
