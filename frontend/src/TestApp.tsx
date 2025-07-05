import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🍕 Bite Club Test Page</h1>
      <p>If you can see this, React is working!</p>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Login Test</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          alert('Form submitted! This means JavaScript is working.');
        }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Email:</label><br />
            <input 
              type="email" 
              defaultValue="student@fau.edu"
              style={{ padding: '8px', width: '300px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Password:</label><br />
            <input 
              type="password" 
              defaultValue="student123"
              style={{ padding: '8px', width: '300px', marginTop: '5px' }}
            />
          </div>
          <button 
            type="submit"
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#f59332', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Test Login
          </button>
        </form>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>API Test</h3>
        <button
          onClick={async () => {
            try {
              const response = await fetch('http://localhost:3001/health');
              const data = await response.json();
              alert('Backend is working! Response: ' + JSON.stringify(data));
            } catch (error) {
              alert('Backend connection failed: ' + error);
            }
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test Backend Connection
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>If you see this page, React is loading correctly</li>
          <li>Click "Test Login" to check if forms work</li>
          <li>Click "Test Backend Connection" to check API</li>
          <li>Check browser console for any error messages</li>
        </ol>
      </div>
    </div>
  );
};

export default TestApp;