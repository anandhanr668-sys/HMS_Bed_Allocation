const ruleService = require("./ruleService");
const allocationService = require("./allocationService");

exports.processVitalsWorkflow = async (patientId, metrics) => {
  const riskStatus = await ruleService.evaluateRisk(metrics);

  const allocationResult = await allocationService.allocateBed(
    patientId,
    riskStatus
  );

  return {
    riskStatus,
    allocationResult,
  };
};
