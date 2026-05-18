import DarkCorporateDashboard from './components/DarkCorporateDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { AlertProvider } from './contexts/AlertContext'
import { ConnectivityProvider } from './contexts/ConnectivityContext'
import { ConfigurationProvider } from './contexts/ConfigurationContext'
import { StakeholderProvider } from './contexts/StakeholderContext'
import { TransactionProvider } from './contexts/TransactionContext'
import { SettlementEquityProvider } from './contexts/SettlementEquityContext'
import { SimpleSettlementProvider } from './contexts/SimpleSettlementContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { UserPreferencesProvider } from './contexts/UserPreferencesContext'
import { SidebarProvider } from './contexts/SidebarContext'
// import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <ErrorBoundary level="page">
    <AlertProvider>
      <AuthProvider>
        <ConnectivityProvider checkInterval={15000} maxRetries={3}>
          <ProtectedRoute>
            <ConfigurationProvider>
              <UserPreferencesProvider>
                <SidebarProvider>
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
                </SidebarProvider>
              </UserPreferencesProvider>
            </ConfigurationProvider>
          </ProtectedRoute>
        </ConnectivityProvider>
      </AuthProvider>
    </AlertProvider>
    </ErrorBoundary>
  )
}

export default App