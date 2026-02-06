'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.trim()) {
      router.push(`/admin?key=${encodeURIComponent(password.trim())}`);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-login">
        <div className="admin-login-icon">⠃</div>
        <h1 className="admin-login-title">Admin Dashboard</h1>
        <p className="admin-login-subtitle">Enter your password to continue</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="admin-login-input"
            autoFocus
          />
          <button type="submit" className="admin-login-btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
