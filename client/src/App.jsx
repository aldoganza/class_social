import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import Chat from './pages/Chat.jsx'
import Search from './pages/Search.jsx'
import Notifications from './pages/Notifications.jsx'
import Reels from './pages/Reels.jsx'
import Create from './pages/Create.jsx'
import Settings from './pages/Settings.jsx'
import Groups from './pages/Groups.jsx'
import GroupChat from './pages/GroupChat.jsx'
import Sidebar from './components/Sidebar.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
export default function App() {
  const location = useLocation()
  const isChat = location.pathname.startsWith('/chat') || location.pathname.startsWith('/groups/')
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className={`layout ${isChat ? 'collapsed' : ''}`}>
          <Sidebar />
          <main className="content">
            <div className={`page-container ${isChat ? 'wide' : ''}`}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
              

              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/chat/:id?"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <Create />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reels"
                element={
                  <ProtectedRoute>
                    <Reels />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/groups"
                element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/groups/:id"
                element={
                  <ProtectedRoute>
                    <GroupChat />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  )
}
