import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Settings,
  FileEdit,
  Users,
  Activity,
  ClipboardList,
  LogOut,
  Stethoscope,
  BedDouble,
  ListOrdered,
  ReceiptIndianRupee,
  History,
  FlaskConical
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
          { icon: Users, label: 'Staff Management', path: '/admin/staff' },
          { icon: Users, label: 'Patient View', path: '/admin/patient-view' },
          { icon: BedDouble, label: 'Ward Config', path: '/admin/wards' },
          { icon: Settings, label: 'Protocols', path: '/admin/protocols' },
          { icon: FileEdit, label: 'Forms', path: '/admin/forms' },
        ];
      case 'DOCTOR':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor' },

        ];
      case 'NURSE':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/nurse' },
          { icon: Users, label: 'Patients', path: '/nurse/patients' },
          { icon: BedDouble, label: 'Bed Management', path: '/nurse/bed-management' },
        ];
      case 'FRONT_DESK':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/front-desk' },
          { icon: ClipboardList, label: 'Registration', path: '/front-desk/registration' },
          { icon: Activity, label: 'Appointments', path: '/front-desk/appointments' },
          { icon: ListOrdered, label: 'Live Queue', path: '/front-desk/queue' },
        ];
      case 'LAB_ASSISTANT':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/lab' },
          { icon: FlaskConical, label: 'Lab Assignments', path: '/lab/assignments' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-soft">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Medibed</h1>
        </div>
        <div className="px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Current User</p>
          <p className="font-bold text-blue-900">{user?.name}</p>
          <p className="text-xs text-blue-600 mt-1 font-medium">{user?.role?.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {getMenuItems().map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/doctor' || item.path === '/nurse' || item.path === '/front-desk'}
            className={({ isActive }) => clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
              isActive
                ? "bg-blue-500 text-white shadow-lg"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
