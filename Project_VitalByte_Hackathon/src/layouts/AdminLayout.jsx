import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Activity, BedDouble, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
        { icon: Users, label: 'Staff Management', path: '/admin/staff' },
        { icon: User, label: 'Patient View', path: '/admin/patient-view' },
        { icon: FileText, label: 'Clinical Forms', path: '/admin/forms' },
        { icon: Activity, label: 'Protocols', path: '/admin/protocols' },
        { icon: BedDouble, label: 'Ward Config', path: '/admin/wards' },
    ];

    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
                <div className="p-8 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Settings size={24} />
                        </div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">HMS Admin</h1>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            className={({ isActive }) => {
                                // Special logic for Forms to keep it active when in designer
                                const isFormsActive = item.path === '/admin/forms' && window.location.pathname.startsWith('/admin/forms');
                                const active = isActive || isFormsActive;

                                return `flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${active
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 translate-x-1'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    }`;
                            }}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-4 py-3 w-full text-rose-500 font-bold hover:bg-rose-50 rounded-2xl transition-all"
                    >
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
