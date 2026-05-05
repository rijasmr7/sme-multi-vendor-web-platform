const axios = require('axios');

const GATEWAY_URL = 'http://localhost:5000'; // Outside docker network

async function runTest() {
    console.log('--- STARTING ORDER SERVICE PRODUCTION TEST ---');

    try {
        // 1. REGISTER CUSTOMER
        console.log('\n1. Registering Customer...');
        const customerReg = await axios.post(`${GATEWAY_URL}/customer/register`, {
            name: 'Test Customer',
            email: `cust_${Date.now()}@test.com`,
            password: 'password123'
        }).catch(e => e.response);
        
        const customerId = customerReg.data.data.id;
        console.log('✓ Customer Registered ID:', customerId);

        // 2. LOGIN CUSTOMER
        console.log('\n2. Logging in Customer...');
        const customerLogin = await axios.post(`${GATEWAY_URL}/customer/login`, {
            email: customerReg.data.data.email,
            password: 'password123'
        });
        const customerToken = customerLogin.data.data.token;
        console.log('✓ Customer Token Received');

        // 3. REGISTER VENDOR
        console.log('\n3. Registering Vendor...');
        const vendorReg = await axios.post(`${GATEWAY_URL}/register`, {
            name: 'Test Vendor',
            email: `vend_${Date.now()}@test.com`,
            password: 'password123',
            role: 'vendor'
        });
        const vendorId = vendorReg.data.data.id;
        console.log('✓ Vendor Registered ID:', vendorId);

        // 4. LOGIN VENDOR
        console.log('\n4. Logging in Vendor...');
        const vendorLogin = await axios.post(`${GATEWAY_URL}/login`, {
            email: vendorReg.data.data.email,
            password: 'password123'
        });
        const vendorToken = vendorLogin.data.data.token;
        console.log('✓ Vendor Token Received');

        // 5. CREATE ORDER (as Customer)
        console.log('\n5. Creating Order (Customer Role)...');
        const orderRes = await axios.post(`${GATEWAY_URL}/orders`, {
            vendor_id: vendorId,
            product_id: 'TEST_PROD_123',
            quantity: 2
        }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        const order = orderRes.data.data;
        console.log('✓ Order Created Successfully:');
        console.log(`   Order ID: ${order.id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Unit Price (Fallback): LKR ${order.unit_price}`);
        console.log(`   Total Price: LKR ${order.total_price}`);

        // 6. UPDATE STATUS (as Vendor)
        console.log('\n6. Updating Order Status to "confirmed" (Vendor Role)...');
        const updateRes = await axios.put(`${GATEWAY_URL}/orders/${order.id}/status`, {
            status: 'confirmed'
        }, {
            headers: { Authorization: `Bearer ${vendorToken}` }
        });
        console.log('✓ Status Updated:', updateRes.data.data.status);

        // 7. ATTEMPT FORBIDDEN ACTION (Vendor trying to update status of an order they don't own)
        // (Wait, in this test the vendor DOES own it. Let's try to update as Customer - should fail)
        console.log('\n7. Security Test: Attempting status update as Customer (Should fail)...');
        try {
            await axios.put(`${GATEWAY_URL}/orders/${order.id}/status`, {
                status: 'completed'
            }, {
                headers: { Authorization: `Bearer ${customerToken}` }
            });
            console.log('❌ FAIL: Customer was able to update status!');
        } catch (err) {
            console.log('✓ SUCCESS: Security blocked customer from updating status (403 Forbidden)');
        }

        console.log('\n--- TEST COMPLETED SUCCESSFULLY ---');

    } catch (error) {
        console.error('\n❌ TEST FAILED:');
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
        } else {
            console.error('Error:', error.message);
        }
    }
}

runTest();
