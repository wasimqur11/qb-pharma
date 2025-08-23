import DarkCorporateDashboard from './components/DarkCorporateDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { ConfigurationProvider } from './contexts/ConfigurationContext'
import { StakeholderProvider } from './contexts/StakeholderContext'
import { TransactionProvider } from './contexts/TransactionContext'
import { SettlementEquityProvider } from './contexts/SettlementEquityContext'
import { SimpleSettlementProvider } from './contexts/SimpleSettlementContext'
// import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <ConfigurationProvider>
          <StakeholderProvider>
            <TransactionProvider>
              <SettlementEquityProvider>
                <SimpleSettlementProvider>
                  <DarkCorporateDashboard />
                </SimpleSettlementProvider>
              </SettlementEquityProvider>
            </TransactionProvider>
          </StakeholderProvider>
        </ConfigurationProvider>
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App