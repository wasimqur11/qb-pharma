import DarkCorporateDashboard from './components/DarkCorporateDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ConfigurationProvider } from './contexts/ConfigurationContext'
import { StakeholderProvider } from './contexts/StakeholderContext'
import { TransactionProvider } from './contexts/TransactionContext'
// import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <ConfigurationProvider>
          <StakeholderProvider>
            <TransactionProvider>
              <DarkCorporateDashboard />
            </TransactionProvider>
          </StakeholderProvider>
        </ConfigurationProvider>
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App