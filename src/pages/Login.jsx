import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import haroldUrl from '../assets/svgs/rompy.svg'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      setError('Invalid email or password.')
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.elephantWrap}>
          <img src={haroldUrl} alt="Harold" style={{ width: 120, height: 120, objectFit: 'contain' }} />
        </div>
        <h1 style={styles.title}>Harold</h1>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.loginBtn} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  )
}


const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  elephantWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  title: {
    fontSize: '2.2rem',
    color: '#3D2E6B',
    marginBottom: '24px',
    fontWeight: '700',
    letterSpacing: '1px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    padding: '14px 18px',
    borderRadius: '12px',
    border: '2px solid #e0e0e0',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  loginBtn: {
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #7E6BAD, #9B8EC4)',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  error: {
    color: '#e74c3c',
    marginTop: '12px',
    fontSize: '0.9rem',
  },
}

export default Login
