import axios from 'axios';

async function testApi() {
    try {
        const res = await axios.get('http://localhost:5000/api/admin/stats');
        console.log('SUCCESS:', res.data);
    } catch (err) {
        if (err.response) {
            console.error('ERROR STATUS:', err.response.status);
            console.error('ERROR DATA:', err.response.data);
        } else {
            console.error('ERROR:', err.message);
        }
    }
}

testApi();
