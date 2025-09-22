import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      setToken(res.token)
      setUser(res.user)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message || 'Login failed' }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (data) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/signup', data)
      setToken(res.token)
      setUser(res.user)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message || 'Signup failed' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ token, user, setUser, login, signup, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}
