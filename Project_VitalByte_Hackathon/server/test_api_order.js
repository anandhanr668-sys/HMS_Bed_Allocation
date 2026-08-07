import axios from 'axios';

async function testApi() {
    try {
        // We need a valid token to test authorization, but I can use the dev bypass token if the server supports it
        const token = 'dev-token-bypass-doctor'; // Mock token

        const response = await axios.post('http://localhost:5000/api/lab/orders', {
            patientId: 'PAT-1770364443404',
            testCode: 'SEMEN_ANALYSIS',
            priority: 'ROUTINE'
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('API Response:', response.data);
    } catch (err) {
        console.error('API Error:', err.response?.status, err.response?.data || err.message);
    }
}

testApi();
