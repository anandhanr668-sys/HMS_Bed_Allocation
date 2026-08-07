// Script to test the bed sync between database and frontend

console.log('=== BED SYNC TEST ===\n');

console.log('Instructions:');
console.log('1. Open your browser at http://localhost:5173');
console.log('2. Open Developer Console (F12)');
console.log('3. Run this command to clear old bed data:');
console.log('   localStorage.removeItem("allBeds");');
console.log('   localStorage.removeItem("bedAllocationHistory");');
console.log('4. Refresh the page');
console.log('5. Check the console for: "HospitalLayoutContext: Loaded X beds from database"');
console.log('6. Navigate to Admin Dashboard and Ward Config to verify counts match\n');

console.log('Expected Results:');
console.log('- Admin Dashboard: 3 available beds (from database)');
console.log('- Ward Config: 3 available beds (from database)');
console.log('- Total beds: 7 (not 48 or 57)\n');

console.log('Database Reality (from checkBedCounts.js):');
console.log('- Total: 7 beds');
console.log('- Available: 3 beds');
console.log('- Occupied: 4 beds');
console.log('- Emergency: 0/1 available');
console.log('- General Ward: 1/3 available');
console.log('- ICU: 1/2 available');
console.log('- IPD First Floor: 1/1 available');
