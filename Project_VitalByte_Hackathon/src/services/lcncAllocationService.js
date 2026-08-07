// Risk Evaluation Service - Based ONLY on Vitals
export const evaluateRisk = (patientData, vitals, medicalProtocols = []) => {
  const { spo2, bpm, temperature, bp_systolic } = vitals || {};

  // 1. Dynamic Protocol Evaluation (Admin Configured)
  if (medicalProtocols && medicalProtocols.length > 0) {
    let highestSeverity = 'LOW';
    const severityRank = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };

    // Normalize Vitals for comparison
    const V = {
      'SpO2': parseFloat(spo2),
      'Heart Rate': parseFloat(bpm),
      'Temperature': parseFloat(temperature),
      'BP_SYS': parseFloat(bp_systolic)
    };

    let matched = false;

    for (const rule of medicalProtocols) {
      if (!rule.isActive) continue;

      const val = V[rule.parameter];
      if (val === undefined || isNaN(val)) continue;

      let triggered = false;
      if (rule.min && val < parseFloat(rule.min)) triggered = true;
      if (rule.max && val > parseFloat(rule.max)) triggered = true;

      if (triggered) {
        matched = true;
        const ruleSeverity = rule.severity || 'Low';
        const currentRank = severityRank[highestSeverity] || 0;
        const newRank = severityRank[ruleSeverity] || 0;

        if (newRank > currentRank) {
          highestSeverity = ruleSeverity;
        }
      }
    }

    if (matched) {
      // Map to System Constants
      if (highestSeverity === 'Medium') return 'MODERATE';
      return highestSeverity.toUpperCase();
    }
  }

  // 2. Fallback to Hardcoded Logic if no protocols match
  // CRITICAL severity thresholds
  if (typeof spo2 === 'number' && spo2 < 85) return 'CRITICAL';
  if (typeof bpm === 'number' && (bpm > 140 || bpm < 40)) return 'CRITICAL';
  if (typeof temperature === 'number' && temperature > 41) return 'CRITICAL';

  // HIGH severity thresholds
  if (typeof spo2 === 'number' && spo2 < 90) return 'HIGH';
  if (typeof bpm === 'number' && (bpm > 120 || bpm < 50)) return 'HIGH';
  if (typeof temperature === 'number' && temperature > 39.5) return 'HIGH';

  // MODERATE severity thresholds
  if (typeof spo2 === 'number' && spo2 < 94) return 'MODERATE';
  if (typeof bpm === 'number' && (bpm > 100 || bpm < 60)) return 'MODERATE';
  if (typeof temperature === 'number' && (temperature > 39 || temperature < 36)) return 'MODERATE';
  if (typeof bp_systolic === 'number' && (bp_systolic > 160 || bp_systolic < 90)) return 'MODERATE';

  // Default to LOW risk if all vitals are normal
  return 'LOW';
};

// Bed Allocation Logic
// Bed Allocation Logic
export const allocateBed = (riskLevel, condition, conditionMapping, getAvailableBeds) => {
  const normalize = (s) => s ? s.toUpperCase() : '';

  // Step 1: Risk-Based Ward Selection
  let preferredWards = [];

  switch (riskLevel) {
    case 'CRITICAL':
    case 'HIGH':
      preferredWards = ['EMERGENCY', 'ICU', 'Emergency', 'Intensive Care Unit'];
      break;
    case 'MODERATE':
      preferredWards = ['GENERAL', 'General Ward', 'HDU'];
      break;
    case 'LOW':
    default:
      preferredWards = ['GENERAL', 'General Ward', 'OPD'];
      break;
  }

  // Step 2: Get condition-specific bed mapping (overrides ward prioritization if present)
  let targetBedType = null;
  const mapping = conditionMapping ? conditionMapping.find(cm => cm.condition === condition) : null;

  if (mapping) {
    // If a specific rule exists, prioritize that ward/bedType
    if (mapping.ward) preferredWards = [mapping.ward, ...preferredWards];
    if (mapping.bedType) targetBedType = mapping.bedType;
  }

  // Step 3: Find available bed - Try all preferred wards in order
  let availableBeds = [];
  let allocatedWard = '';

  for (const ward of preferredWards) {
    // Try with specific bed type first if defined
    if (targetBedType) {
      availableBeds = getAvailableBeds(ward, targetBedType);
      if (availableBeds && availableBeds.length > 0) {
        allocatedWard = ward;
        break;
      }
    }

    // Fallback: Any bed in this ward
    const bedsInWard = getAvailableBeds(ward);
    if (bedsInWard && bedsInWard.length > 0) {
      availableBeds = bedsInWard;
      allocatedWard = ward;
      break;
    }
  }

  if (availableBeds && availableBeds.length > 0) {
    return {
      success: true,
      bed: availableBeds[0], // Pick first available
      ward: allocatedWard,
      riskLevel
    };
  }

  return {
    success: false,
    message: `No available beds found for ${riskLevel} risk (Checked: ${preferredWards.join(', ')})`,
    ward: preferredWards[0],
    riskLevel
  };
};

export const getWardForRiskLevel = (riskLevel) => {
  const wardMap = {
    'CRITICAL': 'EMERGENCY / ICU',
    'HIGH': 'EMERGENCY / ICU',
    'LOW': 'GENERAL',
    'OPD': 'OPD'
  };
  return wardMap[riskLevel] || 'GENERAL';
};
