import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, User, ChevronRight } from 'lucide-react';

const Topbar = () => {
    const { user } = useAuth();
    const location = useLocation();

    const getBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(p => p);
        return paths.map((p, i) => (
            <div key={p} className="flex items-center gap-2">
                <span className="capitalize text-secondary-500 font-medium">{p.replace('-', ' ')}</span>
                {i < paths.length - 1 && <ChevronRight className="w-4 h-4 text-secondary-300" />}
            </div>
        ));
    };

    return (
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-soft">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 font-medium">Pages</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    {getBreadcrumbs()}
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="w-64 pl-10 pr-4 py-2 bg-gray-100 border-2 border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user?.name}</p>
                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{user?.role}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                            {user?.name?.charAt(0)}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
