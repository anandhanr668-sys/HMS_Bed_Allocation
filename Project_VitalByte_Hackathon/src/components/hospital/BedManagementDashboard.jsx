import React, { useContext, useState } from 'react';
import { HospitalLayoutContext } from '../../context/HospitalLayoutContext';
import { PatientContext } from '../../context/PatientContext';
import { Activity, AlertCircle, CheckCircle, User } from 'lucide-react';

export const BedManagementDashboard = () => {
  const { wardTypes, allBeds, getBedStats } = useContext(HospitalLayoutContext);
  const { getAllPatients } = useContext(PatientContext);

  const [selectedWard, setSelectedWard] = useState(wardTypes[0]?.id || null);
  const [filterStatus, setFilterStatus] = useState('All');

  const bedStats = getBedStats();
  const patients = getAllPatients();

  const selectedWardData = wardTypes.find(w => w.id === selectedWard);
  const wardBeds = allBeds.filter(bed => bed.wardId === selectedWard);
  const filteredBeds = filterStatus === 'All' 
    ? wardBeds 
    : wardBeds.filter(bed => bed.status === filterStatus);

  const getOccupancyPercentage = (wardBeds) => {
    const occupied = wardBeds.filter(b => b.status === 'Occupied').length;
    return wardBeds.length > 0 ? Math.round((occupied / wardBeds.length) * 100) : 0;
  };

  const getBedStatusColor = (status) => {
    return status === 'Available' ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300';
  };

  const getBedStatusBadge = (status) => {
    return status === 'Available' 
      ? 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold'
      : 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Bed Management Dashboard</h1>
          <p className="text-slate-600">Real-time hospital bed occupancy and allocation tracking</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Beds</p>
                <p className="text-3xl font-bold text-blue-600">{bedStats.totalBeds}</p>
              </div>
              <Activity size={24} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Available</p>
                <p className="text-3xl font-bold text-green-600">{bedStats.availableBeds}</p>
              </div>
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Occupied</p>
                <p className="text-3xl font-bold text-red-600">{bedStats.occupiedBeds}</p>
              </div>
              <User size={24} className="text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Occupancy Rate</p>
                <p className="text-3xl font-bold text-orange-600">{Math.round((bedStats.occupiedBeds / bedStats.totalBeds) * 100)}%</p>
              </div>
              <AlertCircle size={24} className="text-orange-500" />
            </div>
          </div>
        </div>

        {/* Ward Occupancy Summary */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Ward Occupancy Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wardTypes.map(ward => {
              const wardBedsList = allBeds.filter(b => b.wardId === ward.id);
              const occupied = wardBedsList.filter(b => b.status === 'Occupied').length;
              const percentage = getOccupancyPercentage(wardBedsList);
              
              return (
                <div key={ward.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{ward.name}</h3>
                      <p className="text-sm text-slate-600">{occupied}/{wardBedsList.length} occupied</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      percentage <= 50 ? 'bg-green-100 text-green-700' :
                      percentage <= 80 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentage <= 50 ? 'bg-green-500' :
                        percentage <= 80 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ward Selection and Bed Grid */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Bed Details by Ward</h2>
            <div className="flex gap-2 flex-wrap">
              {wardTypes.map(ward => (
                <button
                  key={ward.id}
                  onClick={() => setSelectedWard(ward.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedWard === ward.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-slate-700 hover:bg-gray-300'
                  }`}
                >
                  {ward.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Status */}
          <div className="mb-6 flex gap-2">
            {['All', 'Available', 'Occupied'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Bed Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBeds.map(bed => (
              <div
                key={bed.bedId}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${getBedStatusColor(bed.status)} hover:shadow-lg`}
              >
                <div className="mb-3">
                  <p className="text-sm text-slate-600">Bed #</p>
                  <p className="text-2xl font-bold text-slate-900">{bed.bedNumber}</p>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-slate-600 uppercase font-semibold">{bed.bedTypeName}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className={getBedStatusBadge(bed.status)}>
                    {bed.status === 'Available' ? (
                      <>
                        <CheckCircle size={12} /> Available
                      </>
                    ) : (
                      <>
                        <User size={12} /> Occupied
                      </>
                    )}
                  </span>
                </div>

                {bed.assignedPatientName && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <p className="text-xs text-slate-600">Patient:</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{bed.assignedPatientName}</p>
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-500">
                  Updated: {new Date(bed.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {filteredBeds.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-slate-600">No beds found matching the selected filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
