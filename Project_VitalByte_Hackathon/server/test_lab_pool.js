import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testLabAssignments() {
    try {
        console.log('--- Testing Lab Assignments (Pooling) ---');

        // 1. Login as Lab Assistant
        console.log('Logging in as Lab Assistant...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'testlab@hms.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('✅ Logged in.');

        // 2. Fetch Assignments
        console.log('Fetching assignments...');
        const res = await axios.get(`${API_URL}/lab/my-assignments`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Assignments Found:', res.data.length);
        if (res.data.length > 0) {
            console.log('First Assignment:', res.data[0].order_id, '| Assigned To:', res.data[0].assigned_to);
        }
    } catch (err) {
        console.error('❌ Test Failed:', err);
    }
}

testLabAssignments();
