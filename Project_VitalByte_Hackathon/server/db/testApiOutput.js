import axios from 'axios';

async function testApi() {
    try {
        console.log('Fetching /api/admin/stats...');
        const res = await axios.get('http://localhost:5000/api/admin/stats');
        console.log('API Response Structure:');
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error('API Error:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
        }
    }
}

testApi();
