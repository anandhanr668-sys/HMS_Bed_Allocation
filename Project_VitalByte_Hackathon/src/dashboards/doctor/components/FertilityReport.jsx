import React, { forwardRef } from 'react';

// A print-friendly component
export const FertilityReport = forwardRef(({ patient, caseSheet, semenAnalysis, billing }, ref) => {
    if (!patient) return null;

    return (
        <div ref={ref} className="p-8 bg-white max-w-4xl mx-auto hidden print:block text-black">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-wider">Fertility Centre</h1>
                    <p className="font-bold text-gray-600">MediBed Enterprise Hospitals</p>
                    <p className="text-sm font-medium text-gray-500">123 Health Avenue, Medical District</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold">Report Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-sm font-bold">Ref: {patient.patientId}</p>
                </div>
            </div>

            {/* Patient Demographics */}
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg mb-6 text-sm">
                <h2 className="font-black uppercase tracking-widest text-gray-500 mb-2">Patient Details</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p><span className="font-bold">Name:</span> {patient.firstName} {patient.lastName}</p>
                        <p><span className="font-bold">Age/Gender:</span> {patient.age} / {patient.gender}</p>
                        <p><span className="font-bold">ID:</span> {patient.patientId}</p>
                    </div>
                    <div>
                        <p><span className="font-bold">Contact:</span> {patient.contact}</p>
                        <p><span className="font-bold">Consultant:</span> {caseSheet?.referredBy || 'Direct'}</p>
                    </div>
                </div>
            </div>

            {/* Fertility Case Summary */}
            {caseSheet && (
                <div className="mb-6">
                    <h2 className="text-xl font-bold border-b border-gray-300 mb-4 pb-1">Clinical Summary</h2>
                    <div className="grid grid-cols-2 gap-8 text-sm mb-4">
                        <div>
                            <h3 className="font-bold font-serif italic text-gray-700 mb-1">Female Factor</h3>
                            <p>BMI: {caseSheet.femaleInfo?.bmi || '--'}</p>
                            <p>Cycles: {caseSheet.menstrualHO?.cyclesPattern || 'Not Noted'}</p>
                            <p>History: {caseSheet.femaleInfo?.subfertilityYears || '0'} years subfertility</p>
                        </div>
                        <div>
                            <h3 className="font-bold font-serif italic text-gray-700 mb-1">Male Factor</h3>
                            <p>BMI: {caseSheet.maleInfo?.bmi || '--'}</p>
                            <p>Status: {caseSheet.maleInfo?.sexualDysfunction || 'Normal Function'}</p>
                        </div>
                    </div>
                    <div className="mb-4">
                        <h3 className="font-bold text-sm mb-1">Obstetric History</h3>
                        <p className="text-sm">
                            G: {caseSheet.obstetricHistory?.gravida || 0} |
                            P: {caseSheet.obstetricHistory?.para || 0} |
                            A: {caseSheet.obstetricHistory?.abortions || 0} |
                            L: {caseSheet.obstetricHistory?.livingChild || 0} |
                            E: {caseSheet.obstetricHistory?.ectopic || 0}
                        </p>
                    </div>
                    <div className="mb-4">
                        <h3 className="font-bold text-sm mb-1">Doctor's Advice</h3>
                        <p className="text-sm italic bg-gray-50 p-2 border-l-4 border-gray-400">{caseSheet.advice || 'No specific advice recorded.'}</p>
                    </div>
                </div>
            )}

            {/* Semen Analysis Report */}
            {semenAnalysis && (
                <div className="mb-6 break-inside-avoid">
                    <h2 className="text-xl font-bold border-b border-gray-300 mb-4 pb-1">Semen Analysis Report (WHO 2010)</h2>
                    <table className="w-full text-sm text-left border border-gray-200 mb-4">
                        <thead className="bg-gray-100 font-bold">
                            <tr>
                                <th className="p-2 border">Parameter</th>
                                <th className="p-2 border">Result</th>
                                <th className="p-2 border">Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="p-2 border">Volume</td><td className="p-2 border font-bold">{semenAnalysis.volume} ml</td><td className="p-2 border text-gray-500">≥ 1.5 ml</td></tr>
                            <tr><td className="p-2 border">Concentration</td><td className="p-2 border font-bold">{semenAnalysis.concentration} M/ml</td><td className="p-2 border text-gray-500">≥ 15 M/ml</td></tr>
                            <tr><td className="p-2 border">Total Motility (PR+NP)</td><td className="p-2 border font-bold">{(parseFloat(semenAnalysis.rapidProgressive || 0) + parseFloat(semenAnalysis.slowProgressive || 0) + parseFloat(semenAnalysis.nonProgressive || 0))}%</td><td className="p-2 border text-gray-500">≥ 40%</td></tr>
                            <tr><td className="p-2 border">Morphology (Normal)</td><td className="p-2 border font-bold">{semenAnalysis.normalForms}%</td><td className="p-2 border text-gray-500">≥ 4%</td></tr>
                        </tbody>
                    </table>
                    <p className="text-sm font-bold text-right">TMSC: {semenAnalysis.tmsc} Million</p>
                </div>
            )}

            {/* Billing Summary */}
            <div className="mb-6 break-inside-avoid border-t-2 border-gray-900 pt-4">
                <h2 className="font-bold uppercase tracking-widest text-sm mb-2">Billing Summary</h2>
                <table className="w-full text-sm">
                    <tbody>
                        {billing?.map((item, i) => (
                            <tr key={i}>
                                <td className="py-1">{item.description}</td>
                                <td className="py-1 text-right font-mono">${item.amount}</td>
                            </tr>
                        ))}
                        <tr className="font-bold text-lg border-t border-gray-300">
                            <td className="py-2">Total Paid</td>
                            <td className="py-2 text-right">${billing?.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-xs text-gray-400">
                <p>Electronically generated report. Valid without signature.</p>
                <p>Printed on {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
});
