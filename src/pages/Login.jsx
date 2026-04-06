import React, { useState, useEffect } from 'react'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { app } from '../../firebaseConfig'
import LoginBG from '../assets/img/LoginBG.png'
import '../resources/css/auth.css'

export default function Login() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const auth = getAuth(app)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      if (currentUser) {
        localStorage.setItem('isLoggedIn', 'true')
        setTimeout(() => {
          window.location.href = '/'
        }, 600)
      }
    })
    return () => unsubscribe()
  }, [auth])

  useEffect(() => {
    window.history.pushState({}, '', '/login')
  }, [])

  const saveUserToStorage = (loginUser, fallbackEmail) => {
    const defaultPFP =
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%2300ffff%22%3E%3Ccircle cx=%2212%22 cy=%228%22 r=%224%22/%3E%3Cpath d=%22M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z%22/%3E%3C/svg%3E'
    localStorage.setItem('userEmail', loginUser.email || fallbackEmail || '')
    localStorage.setItem('userName', loginUser.displayName || fallbackEmail || '')
    localStorage.setItem('userPFP', loginUser.photoURL || defaultPFP)
    localStorage.setItem('isLoggedIn', 'true')
  }

  const handleGoogleLogin = async () => {
    try {
      setError('')
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const loginUser = result.user
      saveUserToStorage(loginUser, loginUser.email)
      setUser(loginUser)
      setTimeout(() => {
        window.location.href = '/'
      }, 600)
    } catch (error) {
      console.error('Login error:', error)
      setError('Failed to login with Google')
    }
  }

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!email || !password) {
      setError('Please enter both email and password')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const loginUser = result.user
      saveUserToStorage(loginUser, email)
      setUser(loginUser)
      setTimeout(() => {
        window.location.href = '/'
      }, 600)
    } catch (error) {
      console.error('Login error:', error)
      if (error.code === 'auth/user-not-found') {
        setError('User not found')
      } else if (error.code === 'auth/wrong-password') {
        setError('Wrong password')
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email')
      } else {
        setError(error.message || 'Failed to login')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    window.location.href = '/'
  }

  const sharedBg = (
    <div className="auth-bg">
      <img src={LoginBG} alt="" className="auth-bg-img" />
      <div className="auth-bg-overlay auth-bg-overlay-1" />
      <div className="auth-bg-overlay auth-bg-overlay-2" />
      <div className="auth-bg-overlay auth-bg-overlay-3" />
      <div className="auth-bg-overlay auth-bg-overlay-4" />
    </div>
  )



  if (loading) {
    return (
      <div className="auth-page">
        {sharedBg}
      </div>
    )
  }

  if (user) {
    return (
      <div className="auth-page">
        {sharedBg}
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <div className="auth-left">{sharedBg}</div>

        <div className="auth-right">
          <button onClick={handleGoBack} className="auth-back-btn" aria-label="Go back">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">Welcome to Jaymantrix Website</h1>
              <p className="auth-subtitle">🔔 Sign in to:<br />● Change your settings preferences.<br />● Can delete your AI chat history.</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleEmailPasswordLogin} className="auth-form">
              <div className="auth-fields">
                <div className="field">
                  <input
                    type="email"
                    id="login-email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div className="field password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-input password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m7.538-1.15a3.375 3.375 0 01-3.957 3.957M9.6 9.6a3 3 0 114.243 4.243M3 3l18 18" />
                      </svg>
                    )}
                  </button>
                </div>

                <button type="submit" disabled={isSubmitting} className="auth-button">
                  {isSubmitting ? 'Logging in...' : 'Login with Email'}
                </button>
              </div>
            </form>

            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">Or</span>
              <div className="auth-divider-line" />
            </div>

            <button onClick={handleGoogleLogin} className="google-button">
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Gmail
            </button>

            <div className="auth-footer">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/signup'
                }}
                className="auth-link-button"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}