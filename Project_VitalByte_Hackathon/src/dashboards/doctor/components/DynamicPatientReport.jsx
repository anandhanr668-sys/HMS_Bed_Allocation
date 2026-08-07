import React, { forwardRef } from 'react';
import clsx from 'clsx';
import { Microscope, AlertCircle, CheckCircle, Info, Printer, Heart, Activity, FileText } from 'lucide-react';

const TableHeader = ({ title }) => (
    <div className="bg-gray-100 px-3 py-1 border-y border-gray-300 mb-2">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-700">{title}</h3>
    </div>
);

const DataRow = ({ label, value, unit = '' }) => (
    <div className="flex border-b border-gray-100 py-1.5 last:border-0 items-center transition-colors hover:bg-gray-50/50 px-2">
        <span className="text-[10px] font-black text-gray-500 uppercase w-32 shrink-0">{label}</span>
        <span className="text-[11px] font-bold text-gray-900 flex-1">{value || '--'} <span className="text-[9px] text-gray-500 font-medium">{unit}</span></span>
    </div>
);

export const DynamicPatientReport = forwardRef(({ patient, caseSheet, investigations, billing, config }, ref) => {
    if (!patient) return null;

    const sections = config || {
        demographics: true,
        visitDetails: true,
        caseSheet: true,
        investigations: true,
        medications: true,
        advice: true,
        billing: true,
        vitals: true
    };

    const printStyles = `
        @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .print-report { 
                width: 210mm; 
                margin: 0 !important; 
                padding: 15mm !important;
                box-shadow: none !important;
            }
            .page-break { page-break-before: always; }
        }
        .print-report table { width: 100%; border-collapse: collapse; }
        .print-report th, .print-report td { padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 10px; }
        .print-report th { background: #f9fafb; font-weight: 800; text-transform: uppercase; text-align: left; color: #4b5563; }
    `;

    // Process Semen Analysis data if present
    const semenAnalysis = investigations?.find(i => i.testCode === 'SEMEN_ANALYSIS' && i.data);

    return (
        <div ref={ref} className="print-report bg-white text-gray-900 font-sans leading-tight">
            <style dangerouslySetInnerHTML={{ __html: printStyles }} />

            {/* PAGE 1: FERTILITY ASSESSMENT */}
            <div className="min-h-[280mm] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                            <Activity size={32} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter">ASCAS Fertility and Women's Centre</h1>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Quality Care for Every Mother & Child</p>
                            <p className="text-[8px] text-gray-500 mt-1">Medical District, Metropolitan City | +91 99 999 9999</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black border border-gray-900 px-2 py-1 inline-block mb-1">CLINICAL ASSESSMENT REPORT</div>
                        <p className="text-[10px] font-bold text-gray-500">Visit Date: <span className="text-gray-900">{caseSheet?.visitDate || new Date().toLocaleDateString()}</span></p>
                    </div>
                </div>

                {/* Patient Information Table */}
                <div className="mb-4">
                    <table className="w-full">
                        <tbody>
                            <tr>
                                <th className="w-1/6">Patient Name</th>
                                <td className="w-1/3 font-black text-blue-700">{patient.firstName} {patient.lastName}</td>
                                <th className="w-1/6">Patient ID</th>
                                <td className="w-1/3 font-mono font-bold">{patient.patientId}</td>
                            </tr>
                            <tr>
                                <th>Gender</th>
                                <td>{patient.gender}</td>
                                <th>Age</th>
                                <td>{patient.age} Years</td>
                            </tr>
                            <tr>
                                <th>Occupation</th>
                                <td>{caseSheet?.occupation || '--'}</td>
                                <th>Referred By</th>
                                <td>{caseSheet?.referredBy || 'Direct'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Vitals Section */}
                {sections.vitals && patient.vitals && (
                    <div className="mb-4">
                        <TableHeader title="Clinical Vitals" />
                        <div className="grid grid-cols-4 gap-2 px-2 py-1">
                            <div className="border p-2 rounded-lg bg-gray-50 text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Blood Pressure</p>
                                <p className="text-xs font-black">{patient.vitals.bp_sys}/{patient.vitals.bp_dia} <span className="text-[8px] font-medium">mmHg</span></p>
                            </div>
                            <div className="border p-2 rounded-lg bg-gray-50 text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Heart Rate</p>
                                <p className="text-xs font-black">{patient.vitals.heart_rate} <span className="text-[8px] font-medium">BPM</span></p>
                            </div>
                            <div className="border p-2 rounded-lg bg-gray-50 text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Temp / SpO2</p>
                                <p className="text-xs font-black">{patient.vitals.temperature}°C / {patient.vitals.spO2}%</p>
                            </div>
                            <div className="border p-2 rounded-lg bg-gray-50 text-center">
                                <p className="text-[8px] font-black text-gray-400 uppercase">Resp. Rate</p>
                                <p className="text-xs font-black">{patient.vitals.respiratory_rate} <span className="text-[8px] font-medium">/min</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Female Information */}
                {caseSheet && (
                    <div className="mb-4">
                        <TableHeader title="Female Partner Evaluation" />
                        <div className="grid grid-cols-2 gap-x-8">
                            <div className="space-y-0">
                                <DataRow label="Height" value={caseSheet.female?.height} unit="cm" />
                                <DataRow label="Weight" value={caseSheet.female?.weight} unit="kg" />
                                <DataRow label="BMI" value={caseSheet.female?.bmi} unit="kg/m²" />
                            </div>
                            <div className="space-y-0">
                                <DataRow label="BP / Pulse" value={`${caseSheet.female?.bp || '--'} / ${caseSheet.female?.pulse || '--'}`} />
                                <DataRow label="Married Since" value={caseSheet.female?.marriedYears} unit="Years" />
                                <DataRow label="Subfertility" value={caseSheet.female?.subfertilityYears} unit="Years" />
                            </div>
                        </div>

                        {/* Menstrual History */}
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100 italic text-[10px]">
                            <span className="font-black text-gray-400 uppercase mr-2 NOT-ITALIC">Menstrual History:</span>
                            Last Period: {caseSheet.female?.menstrualHistory?.lmp || 'N/A'} |
                            Cycle Pattern: {caseSheet.female?.menstrualHistory?.cyclePattern} ({caseSheet.female?.menstrualHistory?.cycleLength} Days) |
                            Dysmenorrhea: {caseSheet.female?.menstrualHistory?.pain ? 'Yes' : 'No'} |
                            Needs Withdrawal: {caseSheet.female?.menstrualHistory?.withdrawal ? 'Yes' : 'No'}
                        </div>
                    </div>
                )}

                {/* Obstetric History */}
                {caseSheet?.obstetric && (
                    <div className="mb-4">
                        <TableHeader title="Obstetric Status" />
                        <div className="flex gap-4 px-2 mb-2">
                            <div className="bg-blue-50 px-3 py-1 rounded-md border border-blue-100"><span className="text-[9px] font-black text-blue-400">G:</span> <span className="text-xs font-bold">{caseSheet.obstetric.gravida}</span></div>
                            <div className="bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100"><span className="text-[9px] font-black text-emerald-400">P:</span> <span className="text-xs font-bold">{caseSheet.obstetric.para}</span></div>
                            <div className="bg-red-50 px-3 py-1 rounded-md border border-red-100"><span className="text-[9px] font-black text-red-400">A:</span> <span className="text-xs font-bold">{caseSheet.obstetric.abortions}</span></div>
                            <div className="bg-gray-50 px-3 py-1 rounded-md border border-gray-100"><span className="text-[9px] font-black text-gray-400">L:</span> <span className="text-xs font-bold">{caseSheet.obstetric.living}</span></div>
                            {caseSheet.obstetric.ectopic > 0 && <div className="bg-amber-50 px-3 py-1 rounded-md border border-amber-100"><span className="text-[9px] font-black text-amber-400">ECTOPIC:</span> <span className="text-xs font-bold">{caseSheet.obstetric.ectopic}</span></div>}
                        </div>

                        {caseSheet.obstetricHistoryTable?.length > 0 && (
                            <table className="mt-2">
                                <thead>
                                    <tr>
                                        <th>Outcome</th>
                                        <th>Conception</th>
                                        <th>Weeks</th>
                                        <th>Delivery</th>
                                        <th>Outcome</th>
                                        <th>Complications</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {caseSheet.obstetricHistoryTable.map((h, i) => (
                                        <tr key={i}>
                                            <td>{h.outcome}</td>
                                            <td>{h.conception}</td>
                                            <td>{h.weeks}</td>
                                            <td>{h.delivery}</td>
                                            <td>{h.baby}</td>
                                            <td>{h.complications}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}


                {/* Fertility History */}
                {caseSheet && (caseSheet.ovulationInduction?.length > 0 || caseSheet.iuiHistory?.length > 0 || caseSheet.ivfHistory?.length > 0) && (
                    <div className="mb-4">
                        <TableHeader title="Previous Fertility Treatments" />

                        {caseSheet.ovulationInduction?.length > 0 && (
                            <div className="mb-2">
                                <p className="text-[9px] font-black uppercase text-gray-500 mb-1">a) Ovulation Induction</p>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Year</th>
                                            <th>Drug Used</th>
                                            <th>Trigger</th>
                                            <th>Outcome</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {caseSheet.ovulationInduction.map((row, i) => (
                                            <tr key={i}>
                                                <td>{row.year}</td>
                                                <td>{row.drug}</td>
                                                <td>{row.trigger}</td>
                                                <td>{row.outcome}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {caseSheet.iuiHistory?.length > 0 && (
                            <div className="mb-2">
                                <p className="text-[9px] font-black uppercase text-gray-500 mb-1">b) Intrauterine Insemination (IUI)</p>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Year</th>
                                            <th>Drug Used</th>
                                            <th>Trigger</th>
                                            <th>Outcome</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {caseSheet.iuiHistory.map((row, i) => (
                                            <tr key={i}>
                                                <td>{row.year}</td>
                                                <td>{row.drug}</td>
                                                <td>{row.trigger}</td>
                                                <td>{row.outcome}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {caseSheet.ivfHistory?.length > 0 && (
                            <div className="mb-2">
                                <p className="text-[9px] font-black uppercase text-gray-500 mb-1">c) In Vitro Fertilization (IVF)</p>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Year</th>
                                            <th>Center</th>
                                            <th>Protocol</th>
                                            <th>Eggs/Embryos</th>
                                            <th>Outcome</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {caseSheet.ivfHistory.map((row, i) => (
                                            <tr key={i}>
                                                <td>{row.year}</td>
                                                <td>{row.center}</td>
                                                <td>{row.protocol}</td>
                                                <td>{row.eggs}</td>
                                                <td>{row.outcome}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Chief Complaints */}
                {caseSheet?.chiefComplaints && (
                    <div className="mb-4">
                        <TableHeader title="Chief Complaints" />
                        <div className="p-2 border border-dashed border-gray-200 rounded text-xs">
                            {caseSheet.chiefComplaints}
                        </div>
                    </div>
                )}

                {/* Male Information */}
                {caseSheet?.male && (
                    <div className="mb-4">
                        <TableHeader title="Male Partner Evaluation" />
                        <div className="grid grid-cols-2 gap-x-8">
                            <div className="space-y-0">
                                <DataRow label="Height / Weight" value={`${caseSheet.male?.height || '--'}cm / ${caseSheet.male?.weight || '--'}kg`} />
                                <DataRow label="BMI" value={caseSheet.male?.bmi} unit="kg/m²" />
                            </div>
                            <div className="space-y-0">
                                <DataRow label="BP / Pulse" value={`${caseSheet.male?.bp || '--'} / ${caseSheet.male?.pulse || '--'}`} />
                                <DataRow label="Sexual Dysfunction" value={caseSheet.male?.sexualDysfunction ? 'Reported' : 'Nil'} />
                                {caseSheet.male?.others && <DataRow label="Other Notes" value={caseSheet.male.others} />}
                            </div>
                        </div>
                    </div>
                )}

                {/* Prescriptions */}
                {sections.medications && (patient.prescriptions?.length > 0 || caseSheet?.medications?.length > 0) && (
                    <div className="mb-4">
                        <TableHeader title="Treatment & Medications" />
                        <table>
                            <thead>
                                <tr>
                                    <th className="w-1/3">Medicine Name</th>
                                    <th>Patient</th>
                                    <th>Dose</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(patient.prescriptions || []).map((rx, i) => (
                                    <tr key={i}>
                                        <td className="font-bold">{rx.name || rx.brand}</td>
                                        <td>Self</td>
                                        <td>{rx.dosage}</td>
                                        <td>{rx.frequency}</td>
                                        <td>{rx.duration || 'As Advised'}</td>
                                    </tr>
                                ))}
                                {(caseSheet?.medications || []).map((med, i) => (
                                    <tr key={`case-${i}`}>
                                        <td className="font-bold">{med.brand || med.generic}</td>
                                        <td>{med.patient || 'Female'}</td>
                                        <td>{med.dose}</td>
                                        <td>{med.frequency}</td>
                                        <td>{med.duration}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Recommended Investigations */}
                <div className="mb-4">
                    <TableHeader title="Recommended Basic Investigations" />
                    <table className="w-full text-[9px]">
                        <thead>
                            <tr>
                                <th className="w-1/2 text-left">Investigation</th>
                                <th className="w-1/4 text-center">Female</th>
                                <th className="w-1/4 text-center">Male</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { key: 'cbc', label: 'CBC' },
                                { key: 'blood_group', label: 'Blood Group' },
                                { key: 'tsh', label: 'TSH' },
                                { key: 'prolactin', label: 'Prolactin' },
                                { key: 'amh', label: 'AMH' },
                                { key: 'fsh', label: 'FSH' },
                                { key: 'lh', label: 'LH' },
                                { key: 'semen_analysis', label: 'Semen Analysis', male: true },
                                { key: 'follicular_study', label: 'Follicular Study' },
                                { key: 'hsg', label: 'HSG' }
                            ].map((test, i) => {
                                const isOrdered = caseSheet?.orderedLabs?.[test.key];
                                return (
                                    <tr key={i}>
                                        <td className="font-bold border-r border-gray-100">{test.label}</td>
                                        <td className="text-center border-r border-gray-100">
                                            {!test.male && isOrdered ? <span className="font-black text-xs">✓</span> : ''}
                                        </td>
                                        <td className="text-center">
                                            {test.male && isOrdered ? <span className="font-black text-xs">✓</span> : ''}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Advice Section */}
                {sections.advice && (caseSheet?.doctorOpinion || caseSheet?.advice) && (
                    <div className="mb-4">
                        <TableHeader title="Clinical Advice / Recommendations" />
                        <div className="p-3 border rounded-xl bg-gray-50 min-h-[60px] text-xs font-bold text-gray-800 leading-relaxed">
                            {caseSheet?.doctorOpinion || caseSheet?.advice}
                        </div>
                    </div>
                )}

                {/* Investigations Table (Recommended & Done) */}
                <div className="mt-auto pt-4 flex justify-between items-end border-t border-gray-200">
                    <div className="text-[9px] font-bold text-gray-400">
                        <p>Electronically generated by Dr. Sarah Connor, MD</p>
                        <p>MediBed HMS Enterprise - ASCAS Fertility Center</p>
                    </div>
                    <div className="w-48 border-t border-gray-900 text-center pt-2">
                        <p className="text-[10px] font-black uppercase">Authorized Signature</p>
                    </div>
                </div>
            </div>

            {/* PAGE 2: SEMEN ANALYSIS DETAILS (Condition-based) */}
            {
                semenAnalysis && (
                    <div className="page-break min-h-[297mm] flex flex-col pt-10">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black uppercase tracking-widest border-b-2 border-gray-900 inline-block pb-1">Semen Analysis Report</h2>
                            <p className="text-[10px] font-bold text-gray-500 mt-2">WHO Reference Values 2021 (6th Edition)</p>
                        </div>

                        <div className="mb-6">
                            <TableHeader title="Macroscopic Examination" />
                            <div className="grid grid-cols-2 gap-x-12">
                                <DataRow label="Volume" value={semenAnalysis.data.volume} unit="ml" />
                                <DataRow label="Appearance" value={semenAnalysis.data.appearance} />
                                <DataRow label="pH" value={semenAnalysis.data.ph} />
                                <DataRow label="Liquefaction Time" value={semenAnalysis.data.liquefaction_time} unit="min" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <TableHeader title="Microscopic Examination (Concentration & Motility)" />
                            <table>
                                <thead>
                                    <tr>
                                        <th>Parameter</th>
                                        <th>Result</th>
                                        <th>WHO Reference</th>
                                    </tr>
                                </thead>
                                <tbody className="font-bold">
                                    <tr><td>Sperm Concentration</td><td className="text-blue-700">{semenAnalysis.data.sperm_concentration} M/ml</td><td>≥ 15 M/ml</td></tr>
                                    <tr><td>Total Sperm Count</td><td className="text-blue-700">{semenAnalysis.data.total_sperm_count} Million</td><td>≥ 39 Million</td></tr>
                                    <tr><td>Progressive Motility (PR)</td><td className={clsx(parseFloat(semenAnalysis.data.progressive_motility) < 32 && "text-red-600")}>{semenAnalysis.data.progressive_motility}%</td><td>≥ 32%</td></tr>
                                    <tr><td>Non-Progressive Motility (NP)</td><td>{semenAnalysis.data.non_progressive_motility}%</td><td>--</td></tr>
                                    <tr><td>Total Motility (PR + NP)</td><td className={clsx((parseFloat(semenAnalysis.data.progressive_motility) + parseFloat(semenAnalysis.data.non_progressive_motility)) < 40 && "text-red-600")}>{(parseFloat(semenAnalysis.data.progressive_motility) + parseFloat(semenAnalysis.data.non_progressive_motility))}%</td><td>≥ 40%</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-6">
                            <TableHeader title="Morphology Evaluation" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border rounded-xl p-4 bg-gray-50 flex justify-between items-center">
                                    <span className="text-xs font-black uppercase text-gray-500">Normal Forms</span>
                                    <span className={clsx("text-xl font-black", parseFloat(semenAnalysis.data.normal_forms) < 4 ? "text-red-600" : "text-emerald-600")}>{semenAnalysis.data.normal_forms}%</span>
                                </div>
                                <div className="border rounded-xl p-4 bg-gray-50 flex justify-between items-center text-xs">
                                    <span className="font-black text-blue-600">TMSC (Total Motile Sperm Count)</span>
                                    <span className="font-black text-gray-900">{semenAnalysis.data.total_motile_progressive || '--'} Million</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 flex justify-between items-end border-t border-gray-200">
                            <div className="text-[9px] font-bold text-gray-400 font-mono">Report ID: {semenAnalysis.reportId} | Verified electronically</div>
                            <div className="w-48 border-t border-gray-900 text-center pt-2">
                                <p className="text-[10px] font-black uppercase">Lab Consultant Signature</p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
});
