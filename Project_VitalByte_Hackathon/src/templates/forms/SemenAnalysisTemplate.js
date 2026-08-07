// Semen Analysis Form Template - Pre-configured for Admin Form Builder
// This JSON represents the form structure that Admin creates using the no-code builder

export const SEMEN_ANALYSIS_TEMPLATE = {
    formId: 'semen_analysis_v1',
    formName: 'Semen Analysis – Laboratory Report',
    category: 'LABORATORY',
    genderRestriction: 'MALE',
    version: '1.0',
    whoReferenceYear: '2021',

    sections: [
        {
            id: 'patient_info',
            title: 'Patient & Sample Information',
            subtitle: 'Auto-filled from patient record',
            readOnly: true,
            fields: [
                {
                    id: 'patient_id',
                    type: 'text',
                    label: 'Patient ID',
                    required: true,
                    readOnly: true,
                    autoFill: 'patient.patientId'
                },
                {
                    id: 'patient_name',
                    type: 'text',
                    label: 'Patient Name',
                    required: true,
                    readOnly: true,
                    autoFill: 'patient.fullName'
                },
                {
                    id: 'age',
                    type: 'number',
                    label: 'Age',
                    required: true,
                    readOnly: true,
                    autoFill: 'patient.age',
                    unit: 'years'
                },
                {
                    id: 'gender',
                    type: 'text',
                    label: 'Gender',
                    required: true,
                    readOnly: true,
                    autoFill: 'patient.gender',
                    validation: { mustBe: 'Male' }
                },
                {
                    id: 'sample_collection_type',
                    type: 'select',
                    label: 'Sample Collection Type',
                    required: true,
                    options: ['Masturbation', 'Condom Collection', 'Other'],
                    width: 'half'
                },
                {
                    id: 'abstinence_period',
                    type: 'text',
                    label: 'Abstinence Period',
                    placeholder: 'e.g., 3 Days',
                    helperText: 'Recommended: 2-7 days',
                    width: 'half'
                },
                {
                    id: 'collection_time',
                    type: 'datetime',
                    label: 'Time of Collection',
                    required: true,
                    width: 'half'
                },
                {
                    id: 'examination_time',
                    type: 'datetime',
                    label: 'Time of Examination',
                    required: true,
                    width: 'half'
                }
            ]
        },

        {
            id: 'macroscopic',
            title: 'Macroscopic Examination',
            subtitle: 'Physical characteristics of the sample',
            fields: [
                {
                    id: 'volume',
                    type: 'number',
                    label: 'Volume',
                    required: true,
                    unit: 'ml',
                    step: 0.1,
                    min: 0,
                    max: 10,
                    width: 'half',
                    validation: {
                        min: 0.5,
                        max: 8,
                        warning: 'Typical range: 1.5 - 5.0 ml'
                    }
                },
                {
                    id: 'appearance',
                    type: 'select',
                    label: 'Appearance',
                    required: true,
                    options: ['Grey-white (Normal)', 'Yellowish', 'Reddish-brown', 'Clear'],
                    width: 'half'
                },
                {
                    id: 'viscosity',
                    type: 'select',
                    label: 'Viscosity',
                    required: true,
                    options: ['Normal', 'Increased', 'Decreased'],
                    width: 'half'
                },
                {
                    id: 'ph',
                    type: 'number',
                    label: 'pH',
                    required: true,
                    step: 0.1,
                    min: 6.0,
                    max: 9.0,
                    width: 'half',
                    validation: {
                        min: 7.2,
                        max: 8.0,
                        warning: 'WHO Reference: ≥ 7.2'
                    }
                },
                {
                    id: 'liquefaction_time',
                    type: 'number',
                    label: 'Time of Liquefaction',
                    required: true,
                    unit: 'minutes',
                    min: 0,
                    max: 120,
                    width: 'half',
                    validation: {
                        max: 60,
                        warning: 'Normal: Within 60 minutes'
                    }
                }
            ]
        },

        {
            id: 'microscopic',
            title: 'Microscopic Examination',
            subtitle: 'Sperm count, motility, and cellular analysis',
            fields: [
                {
                    id: 'sperm_concentration',
                    type: 'number',
                    label: 'Sperm Concentration',
                    required: true,
                    unit: 'million/ml',
                    step: 0.1,
                    min: 0,
                    width: 'half',
                    validation: {
                        min: 15,
                        warning: 'WHO Reference: ≥ 15 million/ml'
                    }
                },
                {
                    id: 'total_sperm_count',
                    type: 'number',
                    label: 'Total Sperm Count',
                    required: true,
                    unit: 'million',
                    step: 0.1,
                    min: 0,
                    width: 'half',
                    validation: {
                        min: 39,
                        warning: 'WHO Reference: ≥ 39 million per ejaculate'
                    }
                },
                {
                    id: 'progressive_motility',
                    type: 'number',
                    label: 'Progressive Motility (PR)',
                    required: true,
                    unit: '%',
                    step: 0.1,
                    min: 0,
                    max: 100,
                    width: 'third',
                    validation: {
                        min: 32,
                        warning: 'WHO Reference: ≥ 32%'
                    }
                },
                {
                    id: 'non_progressive_motility',
                    type: 'number',
                    label: 'Non-progressive Motility (NP)',
                    required: true,
                    unit: '%',
                    step: 0.1,
                    min: 0,
                    max: 100,
                    width: 'third'
                },
                {
                    id: 'immotile',
                    type: 'number',
                    label: 'Immotile (IM)',
                    required: true,
                    unit: '%',
                    step: 0.1,
                    min: 0,
                    max: 100,
                    width: 'third'
                },
                {
                    id: 'total_motility',
                    type: 'number',
                    label: 'Total Motility (PR + NP)',
                    required: true,
                    unit: '%',
                    step: 0.1,
                    min: 0,
                    max: 100,
                    width: 'half',
                    autoCalculate: 'progressive_motility + non_progressive_motility',
                    validation: {
                        min: 40,
                        warning: 'WHO Reference: ≥ 40%'
                    }
                },
                {
                    id: 'vitality',
                    type: 'number',
                    label: 'Vitality (Live Spermatozoa)',
                    required: true,
                    unit: '%',
                    step: 0.1,
                    min: 0,
                    max: 100,
                    width: 'half',
                    validation: {
                        min: 58,
                        warning: 'WHO Reference: ≥ 58%'
                    }
                },
                {
                    id: 'agglutination',
                    type: 'select',
                    label: 'Agglutination',
                    required: true,
                    options: ['Absent', 'Present - Mild', 'Present - Moderate', 'Present - Severe'],
                    width: 'half'
                },
                {
                    id: 'pus_cells',
                    type: 'text',
                    label: 'Pus Cells / HPF',
                    required: true,
                    placeholder: 'e.g., 0-2 cells/HPF',
                    width: 'half',
                    helperText: 'Normal: < 1 million/ml or <5 cells/HPF'
                }
            ]
        },

        {
            id: 'morphology',
            title: 'Morphology',
            subtitle: 'Sperm structural analysis (Strict Criteria)',
            fields: [
                {
                    id: 'normal_forms',
                    type: 'number',
                    label: 'Normal Forms',
                    required: true,
                    unit: '%',
                    step: 0.1,
                    min: 0,
                    max: 100,
                    width: 'half',
                    validation: {
                        min: 4,
                        warning: 'WHO Reference: ≥ 4% (Strict Criteria)'
                    }
                },
                {
                    id: 'head_abnormalities',
                    type: 'number',
                    label: 'Head Abnormalities',
                    required: true,
                    unit: '%',
                    step: 0.1,
                    min: 0,
                    max: 100,
                    width: 'half'
                },
                {
                    id: 'midpiece_abnormalities',
                    type: 'number',
                    label: 'Midpiece Abnormalities',
                    required: true,
                    unit: '%',
                    step: 0.1,
                    min: 0,
                    max: 100,
                    width: 'half'
                },
                {
                    id: 'tail_abnormalities',
                    type: 'number',
                    label: 'Tail Abnormalities',
                    required: true,
                    unit: '%',
                    step: 0.1,
                    min: 0,
                    max: 100,
                    width: 'half'
                }
            ]
        },

        {
            id: 'reference_values',
            title: 'WHO Reference Values (2021 Edition)',
            subtitle: 'Lower reference limits (5th percentile)',
            readOnly: true,
            displayOnly: true,
            content: {
                type: 'table',
                data: [
                    { parameter: 'Semen Volume', value: '≥ 1.5 ml' },
                    { parameter: 'Sperm Concentration', value: '≥ 15 million/ml' },
                    { parameter: 'Total Sperm Number', value: '≥ 39 million per ejaculate' },
                    { parameter: 'Total Motility (PR + NP)', value: '≥ 40%' },
                    { parameter: 'Progressive Motility (PR)', value: '≥ 32%' },
                    { parameter: 'Vitality', value: '≥ 58%' },
                    { parameter: 'Normal Forms (Strict Criteria)', value: '≥ 4%' },
                    { parameter: 'pH', value: '≥ 7.2' },
                    { parameter: 'Leukocytes', value: '< 1 million/ml' }
                ]
            }
        },

        {
            id: 'lab_authentication',
            title: 'Laboratory Authentication',
            subtitle: 'Technician verification and signature',
            fields: [
                {
                    id: 'technician_name',
                    type: 'text',
                    label: 'Lab Technician Name',
                    required: true,
                    autoFill: 'user.fullName',
                    readOnly: true,
                    width: 'half'
                },
                {
                    id: 'report_date',
                    type: 'datetime',
                    label: 'Report Date & Time',
                    required: true,
                    autoFill: 'currentDateTime',
                    readOnly: true,
                    width: 'half'
                },
                {
                    id: 'technician_signature',
                    type: 'signature',
                    label: 'Digital Signature',
                    required: true,
                    helperText: 'Sign to authenticate this report'
                },
                {
                    id: 'remarks',
                    type: 'textarea',
                    label: 'Additional Remarks / Comments',
                    placeholder: 'Any additional observations or notes...',
                    rows: 3
                }
            ]
        }
    ],

    // Validation Rules
    validationRules: {
        motilitySum: {
            fields: ['progressive_motility', 'non_progressive_motility', 'immotile'],
            rule: 'sum_equals_100',
            message: 'Progressive + Non-progressive + Immotile must equal 100%'
        },
        morphologySum: {
            fields: ['normal_forms', 'head_abnormalities', 'midpiece_abnormalities', 'tail_abnormalities'],
            rule: 'sum_equals_100',
            message: 'Morphology percentages should sum to 100%'
        }
    },

    // Submission Settings
    submission: {
        allowDraft: true,
        requireSignature: true,
        lockAfterSubmit: true,
        notifyDoctor: true,
        generatePDF: true
    }
};

export default SEMEN_ANALYSIS_TEMPLATE;
