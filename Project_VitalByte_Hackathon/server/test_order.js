import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testCreateLabOrder() {
    try {
        console.log('--- Testing Lab Order Creation ---');

        // 1. Login as Doctor
        console.log('Logging in as Doctor...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'ravi@hms.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('✅ Logged in.');

        // 2. Create Lab Order for PAT-2024-001 (Male)
        console.log('Creating Lab Order...');
        const orderRes = await axios.post(`${API_URL}/lab/orders`, {
            patientId: 'PAT-2024-001',
            testCode: 'SEMEN_ANALYSIS',
            priority: 'ROUTINE',
            notes: 'Test order from script'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Order Created:', orderRes.data);

        // 3. Get Orders for patient
        console.log('Fetching orders for patient PAT-2024-001...');
        const ordersRes = await axios.get(`${API_URL}/lab/orders/patient/PAT-2024-001`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Orders Found:', ordersRes.data.length);
        console.log('Latest Order Details:', JSON.stringify(ordersRes.data[0]));

    } catch (err) {
        console.error('❌ Test Failed:', err.response?.data || err.message);
    }
}

testCreateLabOrder();
