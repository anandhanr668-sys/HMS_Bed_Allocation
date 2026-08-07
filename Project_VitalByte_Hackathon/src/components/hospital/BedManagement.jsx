import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
    Bed,
    CheckCircle,
    XCircle,
    AlertCircle,
    Activity,
    ShieldAlert,
    Clock,
    User,
    ArrowRightCircle,
    Thermometer,
    Plus,
    Search,
    LayoutGrid,
    Target,
    Zap
} from 'lucide-react';
import clsx from 'clsx';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';

const STATUS_CONFIG = {
    available: { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle, label: 'Ready for Patient' },
    occupied: { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', icon: User, label: 'Currently Occupied' },
    maintenance: { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', icon: AlertCircle, label: 'Sterilization Required' },
    cleaning: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock, label: 'Cleaning in Progress' },
    reserved: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock, label: 'Awaiting Admission' }
};

const INITIAL_WARDS = [
    {
        id: 'icu',
        name: 'Intensive Care Unit',
        type: 'Critical',
        prefix: 'ICU',
        staff: 'Administrator Assigned',
        beds: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, status: 'available', patient: null, vitals: null, lastCheck: null }))
    },
    {
        id: 'er',
        name: 'Emergency Response',
        type: 'Immediate',
        prefix: 'ER',
        staff: 'Administrator Assigned',
        beds: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, status: 'available', patient: null, vitals: null, lastCheck: null }))
    },
    {
        id: 'gw',
        name: 'General Medical Ward',
        type: 'Regular',
        prefix: 'GW',
        staff: 'Administrator Assigned',
        beds: Array.from({ length: 24 }, (_, i) => ({ id: i + 1, status: 'available', patient: null, vitals: null, lastCheck: null }))
    }
];

const BedManagement = ({ compact = false }) => {
    const {
        allBeds,
        getBedStats,
        releaseBed,
        markBedClean
    } = useContext(HospitalLayoutContext);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    // Get dynamic bed stats from context
    const bedStats = useMemo(() => getBedStats(), [getBedStats, allBeds]);

    // Transform context beds into ward structure for display
    const wards = useMemo(() => {
        const wardMap = new Map();

        allBeds.forEach((bed) => {
            if (!wardMap.has(bed.wardId)) {
                wardMap.set(bed.wardId, {
                    id: bed.wardId,
                    name: bed.wardName,
                    type: bed.wardId === 'ICU' ? 'Critical' : bed.wardId === 'EMERGENCY' ? 'Immediate' : 'Regular',
                    prefix: bed.wardId.substring(0, 2).toUpperCase(),
                    staff: 'Administrator Assigned',
                    beds: []
                });
            }

            const ward = wardMap.get(bed.wardId);
            ward.beds.push({
                bedId: bed.bedId,
                bedNumber: bed.bedNumber,
                status: bed.status.toLowerCase(),
                patient: bed.assignedPatientName || null,
                vitals: null,
                lastCheck: bed.lastUpdated
            });
        });

        return Array.from(wardMap.values());
    }, [allBeds]);

    const handleBedAction = (bed) => {
        if (bed.status === 'occupied') {
            if (confirm(`Are you sure you want to release ${bed.bedId}? Patient: ${bed.patient}`)) {
                releaseBed(bed.bedId, 'ADMIN');
            }
        } else if (bed.status === 'cleaning' || bed.status === 'maintenance') {
            markBedClean(bed.bedId, 'ADMIN');
        }
    };

    // Calculate stats from context bedStats
    const stats = useMemo(() => {
        const occupancyRate = bedStats.totalBeds > 0
            ? Math.round((bedStats.occupiedBeds / bedStats.totalBeds) * 100)
            : 0;
        return {
            total: bedStats.totalBeds,
            occupied: bedStats.occupiedBeds,
            available: bedStats.availableBeds,
            maintenance: 0,
            rate: occupancyRate
        };
    }, [bedStats]);
    const filteredWards = useMemo(() => {
        return wards.filter(ward => {
            const matchesSearch = ward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ward.prefix.toLowerCase().includes(searchTerm.toLowerCase());

            if (activeFilter === 'all') return matchesSearch;
            if (activeFilter === 'emergency') return matchesSearch && ward.type === 'Critical';

            const hasBedStatus = ward.beds.some(b => b.status === activeFilter);
            return matchesSearch && hasBedStatus;
        });
    }, [wards, searchTerm, activeFilter]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Pro Header Analytics */}
            {!compact && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl flex items-center gap-5 group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md">
                            <Activity className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Global Occupancy</p>
                            <p className="text-2xl font-black">{stats.rate}% <span className="text-[10px] text-emerald-400 font-bold ml-1">Normal Range</span></p>
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600">
                            <Bed className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Available Beds</p>
                            <p className="text-2xl font-black text-slate-900">{stats.available}</p>
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                            <User className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Current In-Patients</p>
                            <p className="text-2xl font-black text-slate-900">{stats.occupied}</p>
                        </div>
                    </div>

                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 text-red-600">
                            <ShieldAlert className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Under Maintenance</p>
                            <p className="text-2xl font-black text-slate-900">{stats.maintenance}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            {!compact && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex bg-slate-100/50 p-1 rounded-xl gap-1">
                        {['all', 'available', 'occupied', 'emergency'].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                    activeFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find bed or ward..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Wards Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {filteredWards.map((ward) => {
                    const occupiedCount = ward.beds.filter(b => b.status === 'occupied').length;
                    const occupancyRate = ward.beds.length > 0 ? Math.round((occupiedCount / ward.beds.length) * 100) : 0;

                    return (
                        <div key={ward.id} className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-slate-100 group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{ward.name}</h3>
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                            ward.type === 'Critical' ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                                        )}>
                                            {ward.type}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5" /> Staff Lead: <span className="font-bold text-slate-700">{ward.staff}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-end gap-2">
                                        Occupancy Intensity <Zap className="w-3 h-3 text-amber-500" />
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={clsx(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    occupancyRate > 80 ? "bg-red-500" : occupancyRate > 50 ? "bg-blue-500" : "bg-emerald-500"
                                                )}
                                                style={{ width: `${occupancyRate}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-black text-slate-900">{occupancyRate}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                                {ward.beds.map((bed) => {
                                    const config = STATUS_CONFIG[bed.status];
                                    return (
                                        <div
                                            key={bed.bedId}
                                            onClick={() => handleBedAction(bed)}
                                            className={clsx(
                                                "aspect-square rounded-[1.25rem] border-2 transition-all relative group/bed cursor-pointer flex flex-col items-center justify-center gap-1",
                                                config?.bg || 'bg-slate-50', config?.border || 'border-slate-100', config?.color || 'text-slate-400',
                                                "hover:scale-110 hover:shadow-lg active:scale-95",
                                                bed.status === 'cleaning' && "animate-pulse"
                                            )}
                                        >
                                            <Bed className="w-6 h-6" />
                                            <span className="text-[9px] font-black">{ward.prefix}{bed.bedNumber}</span>

                                            {/* Hover Detail Modal (Simulation) */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-4 bg-slate-900 text-white rounded-2xl opacity-0 invisible group-hover/bed:opacity-100 group-hover/bed:visible transition-all z-20 shadow-2xl pointer-events-none">
                                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                                    {config?.icon && <config.icon className="w-4 h-4" />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{config?.label || 'Unknown'}</span>
                                                </div>
                                                {bed.patient ? (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] text-slate-400 uppercase font-bold">Patient</span>
                                                            <span className="text-xs font-black">{bed.patient}</span>
                                                        </div>
                                                        {bed.vitals && (
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] text-slate-400 uppercase font-bold">Vitals</span>
                                                                <span className="text-xs font-black text-emerald-400">{bed.vitals}</span>
                                                            </div>
                                                        )}
                                                        {bed.lastCheck && (
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-[10px] text-slate-400 uppercase font-bold">Update</span>
                                                                <span className="text-[10px] font-bold italic">{bed.lastCheck}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-slate-300 font-bold text-center">Ready for next clinical admission</p>
                                                )}
                                                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Ward Footer Controls */}
                            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Occupied
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" /> Reserved
                                    </div>
                                </div>
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                    <ArrowRightCircle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State for Search */}
            {filteredWards.length === 0 && (
                <div className="py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LayoutGrid className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">No Wards Matched</h3>
                    <p className="text-slate-400 mt-1 font-medium italic">Try refining your search parameters.</p>
                </div>
            )}
        </div>
    );
};

export default BedManagement;
