import { useEffect, useState } from 'react';
import { getCurrentUser, login, register } from './authApi';
import { clearAccessToken, getAccessToken, saveAccessToken } from './authStorage';

function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    getCurrentUser(token).then(setUser).catch(() => clearAccessToken());
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      if (mode === 'register') {
        await register({ email, password });
        setMode('login');
        setStatus({ type: 'success', message: 'Account created. Sign in to continue.' });
      } else {
        const result = await login({ email, password });
        saveAccessToken(result.accessToken);
        setUser(await getCurrentUser(result.accessToken));
        setStatus({ type: 'success', message: 'Session active.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    clearAccessToken();
    setUser(null);
    setPassword('');
    setStatus({ type: 'success', message: 'Signed out.' });
  }

  return (
    <main className="shell">
      <section className="signal-panel">
        <div className="brand-lockup"><span className="brand-mark" aria-hidden="true">↗</span><span>HookRelay</span></div>
        <div className="signal-copy"><p className="eyebrow">Reliable event infrastructure</p><h1>Keep the signal moving.</h1><p>Route webhooks with confidence, visibility, and a clean handoff from producer to receiver.</p></div>
        <div className="signal-visual" aria-hidden="true"><span className="node node-a" /><span className="node node-b" /><span className="node node-c" /><span className="path path-a" /><span className="path path-b" /><span className="packet packet-a" /><span className="packet packet-b" /></div>
        <p className="signal-footnote">Built for the moments where delivery is the product.</p>
      </section>

      <section className="form-panel">
        {user ? <div className="session-card"><p className="eyebrow">Connection established</p><h2>Welcome back.</h2><p className="muted">You are signed in as <strong>{user.email}</strong>.</p><button className="button primary" type="button" onClick={signOut}>Sign out</button></div> : <>
          <div className="form-heading"><p className="eyebrow">Developer console</p><h2>{mode === 'login' ? 'Sign in to your relay.' : 'Create your relay account.'}</h2><p className="muted">One workspace for every event that matters.</p></div>
          <div className="mode-tabs" role="tablist" aria-label="Authentication mode"><button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>Sign in</button><button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>Register</button></div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="password">Password</label><input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" maxLength="128" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {status.message && <p className={`form-status ${status.type}`} role="status">{status.message}</p>}
            <button className="button primary" type="submit" disabled={busy}>{busy ? 'Working…' : mode === 'login' ? 'Continue →' : 'Create account →'}</button>
          </form>
        </>}
        <p className="form-footer">JWT sessions expire after one hour. Keep your credentials private.</p>
      </section>
    </main>
  );
}

export default AuthPage;
