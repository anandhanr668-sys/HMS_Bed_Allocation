import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testSubmitReport() {
    try {
        // 1. Login as Lab Assistant
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'testlab@hms.com',
            password: 'password123'
        });
        const token = loginRes.data.token;

        // 2. Fetch an order to submit for
        const assignments = await axios.get(`${API_URL}/lab/my-assignments`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (assignments.data.length === 0) {
            console.log('❌ No assignments.');
            return;
        }

        const order = assignments.data[0];
        console.log(`Submitting for Order: ${order.order_id}`);

        // 3. Submit Report
        const reportData = {
            collection_time: new Date().toISOString(),
            examination_time: new Date().toISOString(),
            technician_name: 'Test Tech',
            technician_signature: 'SIG_001'
        };

        const semenAnalysisData = {
            sample_collection_type: 'Masturbation',
            collection_time: new Date().toISOString(),
            examination_time: new Date().toISOString(),
            abstinence_period: '3 Days',
            volume: 3.5,
            appearance: 'Grey-white',
            viscosity: 'Normal',
            ph: 7.5,
            liquefaction_time: 20,
            sperm_concentration: 50.5,
            total_sperm_count: 150,
            progressive_motility: 45,
            non_progressive_motility: 10,
            immotile: 45,
            vitality: 70,
            agglutination: 'Absent',
            pus_cells: '0-1/hpf',
            normal_forms: 98548,
            head_abnormalities: 451,
            midpiece_abnormalities: 10,
            tail_abnormalities: 6
        };

        const submitRes = await axios.post(`${API_URL}/lab/submit-report`, {
            orderId: order.order_id,
            reportData,
            semenAnalysisData
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Report Submitted:', submitRes.data);

    } catch (err) {
        if (err.response?.data) {
            console.error('❌ Test Failed Details:', err.response.data.details);
        } else {
            console.error('❌ Test Failed:', err.message);
        }
    }
}

testSubmitReport();
