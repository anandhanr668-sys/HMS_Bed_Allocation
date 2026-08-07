
import PDFDocument from 'pdfkit';
import { query } from '../../config/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateDischargeReport = async (req, res) => {
    const { patientId } = req.params;
    const { visitId } = req.query; // Optional specific visit, else latest

    console.log(`[REPORT] Generating Discharge Report for Patient: ${patientId}, Visit: ${visitId || 'LATEST'}`);

    try {
        // 1. Fetch Patient Data
        const patientRes = await query('SELECT * FROM patients WHERE patient_id_str = $1', [patientId]);
        if (patientRes.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
        const patient = patientRes.rows[0];

        // 2. Fetch Visit Data (Latest or Specific)
        let visitQuery = `
            SELECT v.*, u.full_name as doctor_name 
            FROM visits v 
            LEFT JOIN users u ON v.doctor_id = u.id
            WHERE v.patient_id = $1 
            ORDER BY v.check_in_time DESC LIMIT 1
        `;
        let visitParams = [patientId];

        if (visitId) {
            visitQuery = `
                SELECT v.*, u.full_name as doctor_name 
                FROM visits v 
                LEFT JOIN users u ON v.doctor_id = u.id
                WHERE v.visit_id = $1
            `;
            visitParams = [visitId];
        }

        const visitRes = await query(visitQuery, visitParams);
        if (visitRes.rows.length === 0) return res.status(404).json({ error: 'No visit record found for discharge.' });
        const visit = visitRes.rows[0];
        const activeVisitId = visit.visit_id;

        // 3. Update Discharge Time if not set
        if (!visit.check_out_time) {
            await query('UPDATE visits SET status = $1, check_out_time = NOW() WHERE visit_id = $2', ['CLOSED', activeVisitId]);
            // Also free up bed
            if (patient.allocated_bed_id) {
                await query('UPDATE beds SET status = $1, patient_id = NULL WHERE bed_id_str = $2', ['AVAILABLE', patient.allocated_bed_id]);
                await query('UPDATE patients SET status = $1, allocated_bed_id = NULL WHERE patient_id_str = $2', ['DISCHARGED', patientId]);
            }
        }

        // 4. Fetch Clinical Data
        const vitalsRes = await query('SELECT * FROM vitals WHERE patient_id = $1 ORDER BY timestamp DESC LIMIT 1', [patientId]);
        const vitals = vitalsRes.rows[0] || {};

        const notesRes = await query('SELECT * FROM doctor_notes WHERE visit_id = $1 ORDER BY timestamp DESC LIMIT 1', [activeVisitId]);
        const notes = notesRes.rows[0] || {};

        const medications = notes.prescription_data ? notes.prescription_data : [];

        // 5. Fetch Billing Data
        const billingRes = await query('SELECT * FROM transactions WHERE patient_id = $1', [patientId]);
        const transactions = billingRes.rows;

        // 6. Fetch Lab Reports
        const labRes = await query(`
            SELECT lo.*, u.full_name as tech_name
            FROM lab_orders lo
            LEFT JOIN users u ON lo.assigned_technician_id = u.id
            WHERE lo.visit_id = $1 AND lo.status = 'COMPLETED'
        `, [activeVisitId]);
        const labs = labRes.rows;

        // 7. Fetch Fertility Case Sheet / Treatment History
        const treatmentHistoryRes = await query(`
            SELECT * FROM treatment_history 
            WHERE patient_id = $1 
            ORDER BY timestamp DESC
        `, [patientId]);
        const treatmentHistory = treatmentHistoryRes.rows;
        const fertilityCaseSheet = treatmentHistory.find(h => h.form_id === 'FERTILITY_CASE_SHEET');

        // --- PDF GENERATION ---
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Handle stream to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Discharge_Summary_${patientId}.pdf`);
        doc.pipe(res);

        // Helper: Header
        const printHeader = (title) => {
            doc.fontSize(20).font('Helvetica-Bold').text('MEDIBED HOSPITAL', { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('123 Health Avenue, Medical District, NY 10001', { align: 'center' });
            doc.text('Phone: +1-555-0199 | Email: reports@medibed.com', { align: 'center' });
            doc.moveDown(0.5);
            doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);
            doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
            doc.moveDown(1);
        };

        const printFooter = (pageNum) => {
            const bottom = doc.page.height - 50;
            doc.fontSize(8).text(`Page ${pageNum} | Generated: ${new Date().toLocaleString()}`, 50, bottom, { align: 'center', width: 500 });
        };

        // --- PAGE 1: DISCHARGE SUMMARY ---
        printHeader('HOSPITAL DISCHARGE SUMMARY');

        // Patient Info Box
        doc.rect(50, doc.y, 495, 80).stroke();
        const startY = doc.y + 10;

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Patient Name: ${patient.first_name} ${patient.last_name}`, 60, startY);
        doc.text(`Patient ID: ${patient.patient_id_str}`, 300, startY);

        doc.text(`Age/Gender: ${patient.age || '--'} / ${patient.gender || '--'}`, 60, startY + 20);
        doc.text(`Contact: ${patient.contact || '--'}`, 300, startY + 20);

        doc.text(`Admission Date: ${visit.check_in_time ? new Date(visit.check_in_time).toLocaleDateString() : '--'}`, 60, startY + 40);
        doc.text(`Discharge Date: ${new Date().toLocaleDateString()}`, 300, startY + 40);

        doc.moveDown(4);

        // Clinical Details
        doc.font('Helvetica-Bold').fontSize(12).text('PRIMARY DIAGNOSIS');
        doc.font('Helvetica').fontSize(10).text(notes.diagnosis || 'diagnosis pending...');
        doc.moveDown();

        doc.font('Helvetica-Bold').fontSize(12).text('VITALS AT DISCHARGE');
        const vitalsText = `BP: ${vitals.bp_systolic || '--'}/${vitals.bp_diastolic || '--'} mmHg  |  HR: ${vitals.bpm || '--'} bpm  |  SpO2: ${vitals.spo2 || '--'}%  |  Temp: ${vitals.temperature || '--'}°F`;
        doc.font('Helvetica').fontSize(10).text(vitalsText);
        doc.moveDown();

        doc.font('Helvetica-Bold').fontSize(12).text('CLINICAL SUMMARY & TREATMENT');
        doc.font('Helvetica').fontSize(10).text(notes.treatment_plan || notes.clinical_data || 'No summary available.');
        doc.moveDown();

        // Medications Table
        doc.font('Helvetica-Bold').fontSize(12).text('DISCHARGE MEDICATIONS');
        doc.moveDown(0.5);

        let medY = doc.y;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Drug Name', 60, medY);
        doc.text('Dosage', 250, medY);
        doc.text('Frequency', 350, medY);
        doc.text('Duration', 450, medY);
        doc.lineWidth(0.5).moveTo(60, medY + 12).lineTo(500, medY + 12).stroke();

        doc.font('Helvetica');
        medY += 15;
        if (Array.isArray(medications) && medications.length > 0) {
            medications.forEach(med => {
                doc.text(med.name, 60, medY);
                doc.text(med.dosage, 250, medY);
                doc.text(med.frequency || '-', 350, medY);
                doc.text(med.duration || '-', 450, medY);
                medY += 15;
            });
        } else {
            doc.text('No active prescriptions.', 60, medY);
            medY += 15;
        }

        doc.y = medY + 20;

        // Fertility Case Sheet Section (if exists)
        if (fertilityCaseSheet && fertilityCaseSheet.data) {
            doc.font('Helvetica-Bold').fontSize(12).text('FERTILITY CASE SHEET');
            doc.moveDown(0.5);

            const caseData = fertilityCaseSheet.data;

            // Partner Details
            if (caseData.partnerName || caseData.partnerAge) {
                doc.font('Helvetica-Bold').fontSize(10).text('Partner Information:');
                doc.font('Helvetica').fontSize(9);
                if (caseData.partnerName) doc.text(`  Name: ${caseData.partnerName}`);
                if (caseData.partnerAge) doc.text(`  Age: ${caseData.partnerAge}`);
                if (caseData.partnerOccupation) doc.text(`  Occupation: ${caseData.partnerOccupation}`);
                doc.moveDown(0.5);
            }

            // Menstrual History
            if (caseData.lmp || caseData.cycleLength) {
                doc.font('Helvetica-Bold').fontSize(10).text('Menstrual History:');
                doc.font('Helvetica').fontSize(9);
                if (caseData.lmp) doc.text(`  LMP: ${caseData.lmp}`);
                if (caseData.cycleLength) doc.text(`  Cycle Length: ${caseData.cycleLength} days`);
                if (caseData.flowDuration) doc.text(`  Flow Duration: ${caseData.flowDuration} days`);
                doc.moveDown(0.5);
            }

            // Obstetric History
            if (caseData.gravida || caseData.para) {
                doc.font('Helvetica-Bold').fontSize(10).text('Obstetric History:');
                doc.font('Helvetica').fontSize(9);
                doc.text(`  G${caseData.gravida || 0} P${caseData.para || 0} L${caseData.living || 0} A${caseData.abortion || 0}`);
                if (caseData.previousPregnancies) doc.text(`  Details: ${caseData.previousPregnancies}`);
                doc.moveDown(0.5);
            }

            // Infertility Details
            if (caseData.infertilityDuration || caseData.infertilityType) {
                doc.font('Helvetica-Bold').fontSize(10).text('Infertility Assessment:');
                doc.font('Helvetica').fontSize(9);
                if (caseData.infertilityType) doc.text(`  Type: ${caseData.infertilityType}`);
                if (caseData.infertilityDuration) doc.text(`  Duration: ${caseData.infertilityDuration}`);
                if (caseData.previousTreatments) doc.text(`  Previous Treatments: ${caseData.previousTreatments}`);
                doc.moveDown(0.5);
            }

            // Investigations
            if (caseData.investigations) {
                doc.font('Helvetica-Bold').fontSize(10).text('Investigations Done:');
                doc.font('Helvetica').fontSize(9).text(`  ${caseData.investigations}`);
                doc.moveDown(0.5);
            }

            // Treatment Plan
            if (caseData.treatmentPlan || caseData.recommendations) {
                doc.font('Helvetica-Bold').fontSize(10).text('Fertility Treatment Plan:');
                doc.font('Helvetica').fontSize(9);
                if (caseData.treatmentPlan) doc.text(`  ${caseData.treatmentPlan}`);
                if (caseData.recommendations) doc.text(`  Recommendations: ${caseData.recommendations}`);
                doc.moveDown(0.5);
            }

            doc.moveDown(1);
        }

        doc.font('Helvetica-Bold').fontSize(12).text('FOLLOW-UP INSTRUCTIONS');
        doc.font('Helvetica').fontSize(10).text('• Review in OPD after 7 days.');
        doc.text('• Continue medications as prescribed.');
        doc.text('• In case of emergency, visit nearest casualty.');

        doc.moveDown(4);

        // Signatures
        const sigY = 700;
        doc.lineWidth(1).moveTo(60, sigY).lineTo(200, sigY).stroke();
        doc.fontSize(10).font('Helvetica-Bold').text(`Dr. ${visit.doctor_name || 'Doctor'}`, 60, sigY + 5);
        doc.font('Helvetica').fontSize(8).text('(Treating Consultant)', 60, sigY + 15);

        doc.lineWidth(1).moveTo(350, sigY).lineTo(500, sigY).stroke();
        doc.fontSize(10).font('Helvetica-Bold').text('Patient / Relative', 350, sigY + 5);
        doc.font('Helvetica').fontSize(8).text('(Signature of Acknowledgement)', 350, sigY + 15);

        printFooter(1);

        // --- PAGE 2: BILLING STATEMENT ---
        doc.addPage();
        printHeader('PATIENT BILL SUMMARY');

        let billY = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Date', 60, billY);
        doc.text('Service / Description', 150, billY);
        doc.text('Cost', 450, billY, { align: 'right' });
        doc.lineWidth(0.5).moveTo(50, billY + 15).lineTo(550, billY + 15).stroke();

        billY += 25;
        doc.font('Helvetica');
        let total = 0.0;

        // Combine logic (Admission fee, Bed charges calc, etc.)
        // This is simplified based on transactions table
        if (transactions.length > 0) {
            transactions.forEach(txn => {
                const amt = parseFloat(txn.amount);
                doc.text(new Date(txn.timestamp).toLocaleDateString(), 60, billY);
                doc.text(`${txn.type} - ${txn.description || ''}`, 150, billY);
                doc.text(`$${amt.toFixed(2)}`, 450, billY, { align: 'right' });
                total += amt;
                billY += 20;
            });
        } else {
            doc.text('No billing records found.', 60, billY);
            billY += 20;
        }

        doc.lineWidth(0.5).moveTo(50, billY).lineTo(550, billY).stroke();
        billY += 10;

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('SUBTOTAL:', 300, billY);
        doc.text(`$${total.toFixed(2)}`, 450, billY, { align: 'right' });
        billY += 20;

        doc.text('TAX (0%):', 300, billY);
        doc.text('$0.00', 450, billY, { align: 'right' });
        billY += 20;

        doc.fontSize(14).fillColor('blue');
        doc.text('FINAL TOTAL:', 300, billY);
        doc.text(`$${total.toFixed(2)}`, 450, billY, { align: 'right' });
        doc.fillColor('black');

        doc.fontSize(12).text('PAYMENT STATUS: PAID / SETTLED', 60, billY + 40);

        printFooter(2);

        // --- PAGE 3+: LAB REPORTS ---
        let pageNum = 3;
        if (labs.length > 0) {
            labs.forEach((lab, index) => {
                doc.addPage();
                printHeader(`LAB REPORT: ${lab.test_type || lab.test_code}`);

                doc.fontSize(10).font('Helvetica-Bold');
                doc.text(`Order ID: ${lab.order_id}`, 60, doc.y);
                doc.text(`Date: ${new Date(lab.completed_at || lab.ordered_at).toLocaleString()}`, 300, doc.y);
                doc.moveDown(2);

                if (lab.results) {
                    const results = lab.results;
                    // Handle flexibility of JSONB results

                    doc.rect(50, doc.y, 495, 20).fill('#f0f0f0').stroke();
                    doc.fillColor('black');
                    doc.text('Parameter', 60, doc.y - 15);
                    doc.text('Result Value', 250, doc.y - 15);
                    doc.text('Reference Range', 380, doc.y - 15);

                    doc.moveDown(2);
                    doc.font('Helvetica');

                    // If simple Key-Value object
                    Object.entries(results).forEach(([key, val]) => {
                        if (typeof val === 'object' && val !== null) {
                            // Complex object handling
                            doc.text(key, 60, doc.y);
                            doc.text(JSON.stringify(val), 250, doc.y);
                        } else {
                            doc.text(key.replace(/_/g, ' ').toUpperCase(), 60, doc.y);
                            doc.text(String(val), 250, doc.y);
                            doc.text('--', 380, doc.y); // Schema needs ref ranges
                        }
                        doc.moveDown(0.5);
                        doc.lineWidth(0.1).moveTo(60, doc.y).lineTo(500, doc.y).stroke();
                        doc.moveDown(0.5);
                    });

                } else {
                    doc.text('Results pending or not standardized.', 60, doc.y);
                }

                doc.moveDown(5);
                doc.font('Helvetica-Bold').fontSize(10);
                doc.text(`Technician: ${lab.tech_name || 'Lab Staff'}`, 60, doc.y);
                doc.text(`Authorized by: Dr. Pathologist`, 300, doc.y);

                printFooter(pageNum++);
            });
        }

        doc.end();

    } catch (err) {
        console.error('Generaton Failed:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to generate report' });
    }
};
