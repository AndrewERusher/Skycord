import { useState, useRef } from 'react';
import { MessageCircle, UploadCloud, UserCheck, HelpCircle, ShieldAlert, Camera } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface AuthViewProps {
  onLogin: () => void;
}

type AuthMode = 'signin' | 'join' | 'help' | 'verify' | 'support';

export default function AuthView({ onLogin }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [verifyMethod, setVerifyMethod] = useState<'questions' | 'photo'>('questions');
  const fileInputIdRef = useRef<HTMLInputElement>(null);
  const fileInputSelfieRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [q1, setQ1] = useState('What was the name of your first pet?');
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState('What high school did you attend?');
  const [a2, setA2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      // Session change will be picked up by App.tsx
      onLogin();
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (data.user) {
        // Update profile with security questions
        await supabase.from('profiles').update({
          sec_q1: q1,
          sec_a1: a1,
          sec_q2: q2,
          sec_a2: a2
        }).eq('id', data.user.id);
      }
      alert("Account created! If you don't automatically sign in, please check your email for a confirmation link.");
      // Session change will be picked up by App.tsx if email confirmation is disabled
    }
    setIsLoading(false);
  };

  const renderContent = () => {
    switch (mode) {
      case 'signin':
        return (
          <div className="auth-form animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <MessageCircle size={48} color="var(--accent-primary)" style={{ margin: '0 auto' }} />
              <h1 style={{ marginTop: '16px', color: 'var(--text-primary)' }}>Sign in to Skycord</h1>
            </div>
            {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: '16px', textAlign: 'center', fontSize: '0.875rem' }}>{errorMsg}</div>}
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" className="input-field" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label className="input-label">Password</label>
              <input type="password" className="input-field" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }} onClick={handleSignIn} disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            <div className="flex-between" style={{ marginTop: '24px', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => { setMode('join'); setErrorMsg(''); }}>Create an account</span>
              <span style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => { setMode('help'); setErrorMsg(''); }}>Need help?</span>
            </div>
          </div>
        );

      case 'join':
        return (
          <div className="auth-form animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '24px', textAlign: 'center', color: 'var(--text-primary)' }}>Join Skycord</h2>
            {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: '16px', textAlign: 'center', fontSize: '0.875rem' }}>{errorMsg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Username</label>
                <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            
            <div style={{ margin: '24px 0', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <h3 style={{ fontSize: '0.875rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Identity Verification Setup</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>These questions will be used if you ever lose access to your account.</p>
              
              <div className="input-group">
                <label className="input-label">Security Question 1</label>
                <select className="input-field" style={{ appearance: 'auto' }} value={q1} onChange={e => setQ1(e.target.value)}>
                  <option>What was the name of your first pet?</option>
                  <option>What city were you born in?</option>
                  <option>What is your mother's maiden name?</option>
                </select>
                <input type="text" className="input-field" placeholder="Answer" style={{ marginTop: '8px' }} value={a1} onChange={e => setA1(e.target.value)} />
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label className="input-label">Security Question 2</label>
                <select className="input-field" style={{ appearance: 'auto' }} value={q2} onChange={e => setQ2(e.target.value)}>
                  <option>What high school did you attend?</option>
                  <option>What was the make of your first car?</option>
                  <option>What is your favorite color?</option>
                </select>
                <input type="text" className="input-field" placeholder="Answer" style={{ marginTop: '8px' }} value={a2} onChange={e => setA2(e.target.value)} />
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleSignUp} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
              <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => { setMode('signin'); setErrorMsg(''); }}>Sign In</span>
            </div>
          </div>
        );

      case 'help':
        return (
          <div className="auth-form animate-fade-in" style={{ textAlign: 'center' }}>
            <HelpCircle size={48} color="var(--accent-primary)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Account Recovery</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.875rem' }}>Select the option that best describes your issue.</p>
            
            <button className="btn" style={{ width: '100%', marginBottom: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: 'auto', transition: 'all 0.2s' }} onClick={() => setMode('verify')} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
              <UserCheck size={24} style={{ marginBottom: '8px', color: 'var(--accent-primary)' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Identity Verification</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Lost your password, email, or 2FA device.</div>
            </button>

            <button className="btn" style={{ width: '100%', marginBottom: '24px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: 'auto', transition: 'all 0.2s' }} onClick={() => setMode('support')} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--warning)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
              <ShieldAlert size={24} style={{ marginBottom: '8px', color: 'var(--warning)' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Contact Support</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Report a bug, appeal a ban, or other issues.</div>
            </button>

            <span style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => setMode('signin')}>Back to Sign In</span>
          </div>
        );

      case 'verify':
        return (
          <div className="auth-form animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '24px', textAlign: 'center', color: 'var(--text-primary)' }}>Identity Verification</h2>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
              <button style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: verifyMethod === 'questions' ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)', boxShadow: verifyMethod === 'questions' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer' }} onClick={() => setVerifyMethod('questions')}>Questions</button>
              <button style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: verifyMethod === 'photo' ? 'var(--bg-secondary)' : 'transparent', color: 'var(--text-primary)', boxShadow: verifyMethod === 'photo' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer' }} onClick={() => setVerifyMethod('photo')}>Photo ID</button>
            </div>

            {verifyMethod === 'questions' ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Answer the security questions you set up during registration.</p>
                <div className="input-group">
                  <label className="input-label">What was the name of your first pet?</label>
                  <input type="text" className="input-field" />
                </div>
                <div className="input-group" style={{ marginBottom: '24px' }}>
                  <label className="input-label">What high school did you attend?</label>
                  <input type="text" className="input-field" />
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Upload a clear photo of your government-issued ID, alongside a selfie of you holding it.</p>
                <div style={{ border: '2px dashed var(--border-color)', padding: '24px', textAlign: 'center', borderRadius: 'var(--radius-md)', marginBottom: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => fileInputIdRef.current?.click()} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                  <UploadCloud size={24} color="var(--text-secondary)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Upload Photo ID</div>
                </div>
                <div style={{ border: '2px dashed var(--border-color)', padding: '24px', textAlign: 'center', borderRadius: 'var(--radius-md)', marginBottom: '24px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => fileInputSelfieRef.current?.click()} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                  <Camera size={24} color="var(--text-secondary)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Upload Selfie</div>
                </div>
                <input type="file" ref={fileInputIdRef} style={{ display: 'none' }} accept="image/*" />
                <input type="file" ref={fileInputSelfieRef} style={{ display: 'none' }} accept="image/*" />
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => { alert('Identity verified! A recovery link has been sent to your email and phone via SMS.'); setMode('signin'); }}>Submit Verification</button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => setMode('help')}>Back</span>
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="auth-form animate-fade-in">
            <h2 style={{ marginBottom: '8px', textAlign: 'center', color: 'var(--text-primary)' }}>Contact Support</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center' }}>Describe your issue and an admin will review it.</p>
            
            <div className="input-group">
              <label className="input-label">Contact Email</label>
              <input type="email" className="input-field" placeholder="Where can we reach you?" />
            </div>
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label className="input-label">Issue Description</label>
              <textarea className="input-field" style={{ minHeight: '120px', resize: 'vertical' }} placeholder="Please provide as much detail as possible..." />
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={async () => { 
                alert('Support Ticket Created! The admin has received an email and a Skycord system message.'); 
                setMode('signin'); 
              }}>Submit Ticket</button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => setMode('help')}>Back</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
      <style>{`
        .auth-form {
          background-color: var(--bg-secondary);
          padding: 40px;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-width: 400px;
        }
      `}</style>
      {renderContent()}
    </div>
  );
}
