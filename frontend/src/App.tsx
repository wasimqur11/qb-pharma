import DarkCorporateDashboard from './components/DarkCorporateDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { AlertProvider } from './contexts/AlertContext'
import { ConnectivityProvider } from './contexts/ConnectivityContext'
import { ConfigurationProvider } from './contexts/ConfigurationContext'
import { StakeholderProvider } from './contexts/StakeholderContext'
import { TransactionProvider } from './contexts/TransactionContext'
import { SettlementEquityProvider } from './contexts/SettlementEquityContext'
import { SimpleSettlementProvider } from './contexts/SimpleSettlementContext'
import { NotificationProvider } from './contexts/NotificationContext'
// import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <ConnectivityProvider checkInterval={15000} maxRetries={3}>
          <ProtectedRoute>
            <ConfigurationProvider>
              <StakeholderProvider>
                <TransactionProvider>
                  <NotificationProvider>
                    <SettlementEquityProvider>
                      <SimpleSettlementProvider>
                        <DarkCorporateDashboard />
                      </SimpleSettlementProvider>
                    </SettlementEquityProvider>
                  </NotificationProvider>
                </TransactionProvider>
              </StakeholderProvider>
            </ConfigurationProvider>
          </ProtectedRoute>
        </ConnectivityProvider>
      </AuthProvider>
    </AlertProvider>
  )
}

export default App