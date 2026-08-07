import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
    const testUsers = [
        { email: 'admin@hospital.com', password: 'admin123', role: 'ADMIN' },
        { email: 'doctor@hospital.com', password: 'doctor123', role: 'DOCTOR' },
        { email: 'nurse@hospital.com', password: 'nurse123', role: 'NURSE' },
        { email: 'frontdesk@hospital.com', password: 'frontdesk123', role: 'FRONT_DESK' }
    ];

    console.log('🧪 Testing Login API...\n');

    for (const user of testUsers) {
        try {
            console.log(`Testing ${user.role}...`);
            const response = await axios.post(`${API_URL}/auth/login`, {
                email: user.email,
                password: user.password
            });

            if (response.data.token) {
                console.log(`✅ ${user.role} login successful!`);
                console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
                console.log(`   User: ${response.data.user.fullName}\n`);
            }
        } catch (error) {
            console.log(`❌ ${user.role} login failed:`);
            console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
        }
    }
}

testLogin();
