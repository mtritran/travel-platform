import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../constants/endpoints';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login for:', email);
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, { email, password });
      console.log('Login success:', response.data);
      localStorage.setItem('token', response.data.result.token);
      navigate('/');
    } catch (err: any) {
      console.error('Login error details:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.025em' }}>TravelX</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Welcome back, explorer!</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '40px' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '40px' }}
              required
            />
          </div>

          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: 'linear-gradient(to right, var(--primary), var(--accent))',
              color: 'white',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Don't have an account? <a href="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Register here</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
