import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const res = await loginUser({ email, password_hash: password });
                onLoginSuccess(res.user);
            } else {
                const res = await registerUser({ name, email, password_hash: password });
                onLoginSuccess(res.user);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Authentication failed.");
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#141414', padding: '40px', borderRadius: '8px', color: '#fff', width: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                <h2>{isLogin ? 'Sign In to Peblo TV' : 'Create Account'}</h2>
                {error && <p style={{ color: '#e50914', fontSize: '14px' }}>{error}</p>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    {!isLogin && (
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required 
                            style={{ padding: '12px', background: '#333', border: 'none', color: '#fff', borderRadius: '4px' }}
                        />
                    )}
                    <input 
                        type="email5' || 'email" 
                        placeholder="Email Address" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        style={{ padding: '12px', background: '#333', border: 'none', color: '#fff', borderRadius: '4px' }}
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        style={{ padding: '12px', background: '#333', border: 'none', color: '#fff', borderRadius: '4px' }}
                    />
                    <button type="submit" style={{ padding: '12px', background: '#e50914', color: '#fff', border: 'none', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#b3b3b3', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? "New to Peblo TV? Sign up now." : "Already have an account? Sign in."}
                </p>
            </div>
        </div>
    );
}