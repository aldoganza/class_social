// Quick test to verify auth endpoints work
const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  console.log('Testing server endpoints...\n');
  
  // Test health check
  try {
    const health = await makeRequest('GET', '/health');
    console.log('✓ Health check:', health.status === 200 ? 'OK' : 'FAILED');
  } catch (e) {
    console.log('✗ Health check failed:', e.message);
    return;
  }

  // Test signup
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123'
  };

  try {
    const signup = await makeRequest('POST', '/auth/signup', testUser);
    if (signup.status === 201) {
      console.log('✓ Signup successful');
      console.log('  User ID:', signup.data.user.id);
      console.log('  Token:', signup.data.token.substring(0, 20) + '...');
    } else {
      console.log('✗ Signup failed:', signup.status, signup.data);
    }
  } catch (e) {
    console.log('✗ Signup error:', e.message);
  }

  // Test login
  try {
    const login = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    if (login.status === 200) {
      console.log('✓ Login successful');
      console.log('  User:', login.data.user.name);
    } else {
      console.log('✗ Login failed:', login.status, login.data);
    }
  } catch (e) {
    console.log('✗ Login error:', e.message);
  }

  console.log('\n✓ All tests completed!');
}

test();
