import React from 'react';
import { Printer, FileText } from 'lucide-react';
import { SemenAnalysisForm } from './SemenAnalysisForm';
import { ReportConfigurator } from './ReportConfigurator';
import { DynamicPatientReport } from './DynamicPatientReport';
import LabReportViewer from './LabReportViewer';

const DoctorModals = ({
    showSemenForm,
    setShowSemenForm,
    selectedPatient,
    showConfigurator,
    setShowConfigurator,
    reportConfig,
    setReportConfig,
    handleFinalizeReport,
    showReportPreview,
    setShowReportPreview,
    handlePrint,
    reportRef,
    existingCaseSheet,
    billingData,
    selectedReport,
    viewingReport,
    setViewingReport
}) => {
    if (!selectedPatient) return null;

    return (
        <>
            {showSemenForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <SemenAnalysisForm
                            patientId={selectedPatient.patientId}
                            onClose={() => setShowSemenForm(false)}
                        />
                    </div>
                </div>
            )}

            {showConfigurator && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <ReportConfigurator
                        config={reportConfig}
                        setConfig={setReportConfig}
                        onGenerate={handleFinalizeReport}
                        onClose={() => setShowConfigurator(false)}
                    />
                </div>
            )}

            {showReportPreview && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-8">
                    <div className="bg-white max-w-5xl w-full h-full rounded-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><FileText /> Report Preview</h2>
                            <div className="flex gap-4">
                                <button onClick={() => setShowReportPreview(false)} className="px-5 py-2 hover:bg-white rounded-lg font-bold text-gray-500 transition">Close</button>
                                <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 flex items-center gap-2 animate-pulse"><Printer size={16} /> Print Now</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
                            <DynamicPatientReport
                                ref={reportRef}
                                patient={selectedPatient}
                                caseSheet={existingCaseSheet}
                                investigations={selectedPatient.investigations}
                                billing={billingData}
                                config={reportConfig}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Report for Printing */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
                <DynamicPatientReport
                    patient={selectedPatient}
                    caseSheet={existingCaseSheet}
                    investigations={selectedPatient.investigations}
                    billing={billingData}
                    config={reportConfig}
                />
            </div>
            {viewingReport && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <LabReportViewer
                            report={selectedReport}
                            onClose={() => setViewingReport(false)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default DoctorModals;
