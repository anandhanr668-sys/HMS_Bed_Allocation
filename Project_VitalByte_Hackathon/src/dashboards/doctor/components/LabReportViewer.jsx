import React from 'react';
import TemplateLabReportViewer from '../../../components/hospital/TemplateLabReportViewer';

/**
 * High-Fidelity Clinical Report Viewer for Doctors
 * 
 * This component acts as a bridge between the Doctor's Dashboard 
 * and the Unified LCNC Template System. It ensures that the doctor 
 * sees the exact professional layout designed by the admin.
 */
const LabReportViewer = ({ report, onClose }) => {
    if (!report) return null;

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300 h-full w-full">
            <TemplateLabReportViewer
                report={report}
                onClose={onClose}
            />
        </div>
    );
};

export default LabReportViewer;
