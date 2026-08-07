import React, { useContext, useState } from 'react';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import { Edit2, Plus, Trash2, Save, Layout, GitMerge, Activity, BedDouble, AlertCircle, Percent } from 'lucide-react';
import clsx from 'clsx';

export const AdminBedConfiguration = () => {
  const { wardTypes, conditionMapping, updateBedLayout, updateConditionMapping, getBedStats } = useContext(HospitalLayoutContext);
  const [activeTab, setActiveTab] = useState('wards'); // 'wards' | 'protocols'
  const [showAddBedType, setShowAddBedType] = useState(null);
  const [newBedType, setNewBedType] = useState({ name: '', totalBeds: 0 });

  // Protocol Management State
  const [showAddProtocol, setShowAddProtocol] = useState(false);
  const [newProtocol, setNewProtocol] = useState({
    condition: '',
    riskLevel: 'LOW',
    ward: wardTypes[0]?.id || '',
    bedType: wardTypes[0]?.bedTypes[0]?.id || ''
  });

  const bedStats = getBedStats();

  const handleAddProtocol = () => {
    if (!newProtocol.condition.trim()) {
      alert('Please enter a medical condition name');
      return;
    }

    const newEntry = {
      id: `proto_${Date.now()}`,
      ...newProtocol
    };

    updateConditionMapping([...conditionMapping, newEntry]);
    setNewProtocol({
      condition: '',
      riskLevel: 'LOW',
      ward: wardTypes[0]?.id || '',
      bedType: wardTypes[0]?.bedTypes[0]?.id || ''
    });
    setShowAddProtocol(false);
  };

  const handleDeleteProtocol = (id) => {
    if (confirm('Are you sure you want to delete this protocol?')) {
      updateConditionMapping(conditionMapping.filter(p => p.id !== id));
    }
  };

  const handleUpdateBedCount = (wardId, bedTypeId, newCount) => {
    const updatedWards = wardTypes.map(ward =>
      ward.id === wardId
        ? {
          ...ward,
          bedTypes: ward.bedTypes.map(bt =>
            bt.id === bedTypeId ? { ...bt, totalBeds: newCount, availableBeds: newCount } : bt
          )
        }
        : ward
    );
    updateBedLayout(updatedWards);
  };

  const handleAddBedType = (wardId) => {
    if (!newBedType.name || newBedType.totalBeds <= 0) {
      alert('Please enter valid bed type name and count');
      return;
    }

    const updatedWards = wardTypes.map(ward =>
      ward.id === wardId
        ? {
          ...ward,
          bedTypes: [
            ...ward.bedTypes,
            {
              id: `${wardId.toLowerCase()}_${newBedType.name.toLowerCase().replace(/\s+/g, '_')}`,
              name: newBedType.name,
              totalBeds: newBedType.totalBeds,
              availableBeds: newBedType.totalBeds
            }
          ]
        }
        : ward
    );

    updateBedLayout(updatedWards);
    setNewBedType({ name: '', totalBeds: 0 });
    setShowAddBedType(null);
  };

  const handleDeleteBedType = (wardId, bedTypeId) => {
    if (confirm('Delete this bed type?')) {
      const updatedWards = wardTypes.map(ward =>
        ward.id === wardId
          ? {
            ...ward,
            bedTypes: ward.bedTypes.filter(bt => bt.id !== bedTypeId)
          }
          : ward
      );
      updateBedLayout(updatedWards);
    }
  };

  const handleUpdateMapping = (mappingId, updates) => {
    const updatedMapping = conditionMapping.map(cm =>
      cm.id === mappingId ? { ...cm, ...updates } : cm
    );
    updateConditionMapping(updatedMapping);
  };

  const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
    <div className={clsx("relative overflow-hidden rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm transition-transform hover:scale-[1.02]",
      color === 'blue' && "bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-blue-200",
      color === 'emerald' && "bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-emerald-200",
      color === 'rose' && "bg-gradient-to-br from-rose-50 to-rose-100/50 hover:shadow-rose-200",
      color === 'violet' && "bg-gradient-to-br from-violet-50 to-violet-100/50 hover:shadow-violet-200",
    )}>
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className={clsx("text-xs font-black uppercase tracking-widest mb-1",
            color === 'blue' && "text-blue-400",
            color === 'emerald' && "text-emerald-400",
            color === 'rose' && "text-rose-400",
            color === 'violet' && "text-violet-400",
          )}>{label}</p>
          <h3 className={clsx("text-3xl font-black",
            color === 'blue' && "text-blue-900",
            color === 'emerald' && "text-emerald-900",
            color === 'rose' && "text-rose-900",
            color === 'violet' && "text-violet-900",
          )}>{value}</h3>
        </div>
        <div className={clsx("p-3 rounded-xl",
          color === 'blue' && "bg-blue-500/10 text-blue-600",
          color === 'emerald' && "bg-emerald-500/10 text-emerald-600",
          color === 'rose' && "bg-rose-500/10 text-rose-600",
          color === 'violet' && "bg-violet-500/10 text-violet-600",
        )}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className={clsx("text-[10px] font-bold px-2 py-1 rounded-full",
          color === 'blue' && "bg-blue-200/50 text-blue-700",
          color === 'emerald' && "bg-emerald-200/50 text-emerald-700",
          color === 'rose' && "bg-rose-200/50 text-rose-700",
          color === 'violet' && "bg-violet-200/50 text-violet-700",
        )}>{subtext}</span>
      </div>
      {/* Background Decor */}
      <div className={clsx("absolute -right-6 -bottom-6 opacity-10 rotate-12 pointer-events-none",
        color === 'blue' && "text-blue-600",
        color === 'emerald' && "text-emerald-600",
        color === 'rose' && "text-rose-600",
        color === 'violet' && "text-violet-600",
      )}>
        <Icon size={120} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Layout size={28} /></span>
              Ward Configuration
            </h1>
            <p className="text-slate-500 font-medium mt-2 max-w-2xl">
              Configure hospital wards, manage bed capacities, and define smart admission protocols for automated patient routing.
            </p>
          </div>
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl self-stretch md:self-auto">
            <button
              onClick={() => setActiveTab('wards')}
              className={clsx("flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                activeTab === 'wards' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}>
              <Layout size={16} /> Ward Management
            </button>
            <button
              onClick={() => setActiveTab('protocols')}
              className={clsx("flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                activeTab === 'protocols' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}>
              <GitMerge size={16} /> Admission Protocols
            </button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Capacity"
            value={bedStats.totalBeds}
            icon={BedDouble}
            color="blue"
            subtext="Hospital Wide"
          />
          <StatCard
            label="Available Beds"
            value={bedStats.availableBeds}
            icon={Activity}
            color="emerald"
            subtext="Ready for Admission"
          />
          <StatCard
            label="Occupied Beds"
            value={bedStats.occupiedBeds}
            icon={AlertCircle}
            color="rose"
            subtext="Currently In-Use"
          />
          <StatCard
            label="Occupancy Rate"
            value={`${bedStats.totalBeds > 0 ? Math.round((bedStats.occupiedBeds / bedStats.totalBeds) * 100) : 0}%`}
            icon={Percent}
            color="violet"
            subtext="Efficiency Score"
          />
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 min-h-[500px]">
          {activeTab === 'wards' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Active Wards</h2>
                  <p className="text-sm text-slate-500">Manage definitions and bed counts per ward</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {wardTypes.map(ward => (
                  <div key={ward.id} className="group relative bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                          {ward.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-800">{ward.name}</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ward.id}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {ward.bedTypes.reduce((sum, bt) => sum + bt.totalBeds, 0)} Beds
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-xl">
                      {ward.description}
                    </p>

                    <div className="space-y-3">
                      {ward.bedTypes.map(bedType => (
                        <div key={bedType.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-700">{bedType.name}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Type ID: {bedType.id}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200">
                            <input
                              type="number"
                              min="1"
                              value={bedType.totalBeds}
                              onChange={(e) => handleUpdateBedCount(ward.id, bedType.id, parseInt(e.target.value))}
                              className="w-12 text-center text-sm font-bold text-slate-800 focus:outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Cap</span>
                          </div>
                          <button
                            onClick={() => handleDeleteBedType(ward.id, bedType.id)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Bed Type"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Bed Type UI */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      {showAddBedType === ward.id ? (
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Type Name</label>
                              <input
                                autoFocus
                                type="text"
                                placeholder="e.g. Isolation Bed"
                                value={newBedType.name}
                                onChange={(e) => setNewBedType({ ...newBedType, name: e.target.value })}
                                className="w-full px-3 py-2 bg-white rounded-lg text-sm font-bold border border-indigo-100 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Count</label>
                              <input
                                type="number"
                                min="1"
                                value={newBedType.totalBeds}
                                onChange={(e) => setNewBedType({ ...newBedType, totalBeds: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 bg-white rounded-lg text-sm font-bold border border-indigo-100 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleAddBedType(ward.id)} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition">Confirm Add</button>
                            <button onClick={() => setShowAddBedType(null)} className="px-4 bg-white text-slate-500 border border-slate-200 rounded-lg py-2 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddBedType(ward.id)}
                          className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2 group-hover:border-slate-300"
                        >
                          <Plus size={18} /> Add New Bed Configuration
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'protocols' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Protocol Mapping</h2>
                  <p className="text-sm text-slate-500">Automated triage logic for incoming patients</p>
                </div>
                <button
                  onClick={() => setShowAddProtocol(true)}
                  disabled={showAddProtocol}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Plus size={20} /> Add New Protocol
                </button>
              </div>

              <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Medical Condition</th>
                      <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Risk Classification</th>
                      <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Target Ward</th>
                      <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Bed Allocation</th>
                      <th className="p-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Create New Protocol Form */}
                    {showAddProtocol && (
                      <tr className="bg-indigo-50/50 animate-in slide-in-from-left-4">
                        <td className="p-5">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Condition Name..."
                            value={newProtocol.condition}
                            onChange={(e) => setNewProtocol({ ...newProtocol, condition: e.target.value })}
                            className="w-full px-3 py-2 bg-white border-2 border-indigo-200 rounded-lg text-sm font-bold text-slate-900 placeholder-indigo-300 focus:ring-0 focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="p-5">
                          <select
                            value={newProtocol.riskLevel}
                            onChange={(e) => setNewProtocol({ ...newProtocol, riskLevel: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-slate-700 cursor-pointer"
                          >
                            <option value="CRITICAL">Critical Risk</option>
                            <option value="HIGH">High Risk</option>
                            <option value="MODERATE">Moderate Risk</option>
                            <option value="LOW">Low Risk</option>
                          </select>
                        </td>
                        <td className="p-5">
                          <select
                            value={newProtocol.ward}
                            onChange={(e) => {
                              const selectedWard = wardTypes.find(w => w.id === e.target.value);
                              setNewProtocol({
                                ...newProtocol,
                                ward: e.target.value,
                                bedType: selectedWard?.bedTypes[0]?.id || ''
                              });
                            }}
                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-slate-700 cursor-pointer"
                          >
                            {wardTypes.map(ward => (
                              <option key={ward.id} value={ward.id}>{ward.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-5">
                          <select
                            value={newProtocol.bedType}
                            onChange={(e) => setNewProtocol({ ...newProtocol, bedType: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-slate-700 cursor-pointer"
                          >
                            {wardTypes.find(w => w.id === newProtocol.ward)?.bedTypes.map(bt => (
                              <option key={bt.id} value={bt.id}>{bt.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={handleAddProtocol}
                              className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => setShowAddProtocol(false)}
                              className="p-2 bg-white text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {conditionMapping.map(mapping => (
                      <tr key={mapping.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="p-5">
                          <input
                            type="text"
                            value={mapping.condition}
                            onChange={(e) => handleUpdateMapping(mapping.id, { condition: e.target.value })}
                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 font-bold text-slate-700 focus:outline-none transition-colors"
                          />
                        </td>
                        <td className="p-5">
                          <select
                            value={mapping.riskLevel}
                            onChange={(e) => handleUpdateMapping(mapping.id, { riskLevel: e.target.value })}
                            className={clsx("px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide border-2 focus:outline-none transition-colors cursor-pointer",
                              mapping.riskLevel === 'CRITICAL' ? "bg-red-50 text-red-600 border-red-100 hover:border-red-300" :
                                mapping.riskLevel === 'HIGH' ? "bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300" :
                                  mapping.riskLevel === 'MODERATE' ? "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300" :
                                    "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300"
                            )}
                          >
                            <option value="CRITICAL">Critical Risk</option>
                            <option value="HIGH">High Risk</option>
                            <option value="MODERATE">Moderate Risk</option>
                            <option value="LOW">Low Risk</option>
                          </select>
                        </td>
                        <td className="p-5">
                          <select
                            value={mapping.ward}
                            onChange={(e) => handleUpdateMapping(mapping.id, { ward: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          >
                            {wardTypes.map(ward => (
                              <option key={ward.id} value={ward.id}>{ward.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-5">
                          <select
                            value={mapping.bedType}
                            onChange={(e) => handleUpdateMapping(mapping.id, { bedType: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          >
                            {wardTypes.find(w => w.id === mapping.ward)?.bedTypes.map(bt => (
                              <option key={bt.id} value={bt.id}>{bt.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-5 text-center">
                          <button
                            onClick={() => handleDeleteProtocol(mapping.id)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Protocol"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
