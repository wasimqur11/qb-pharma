import DarkCorporateDashboard from './components/DarkCorporateDashboard'
import { ConfigurationProvider } from './contexts/ConfigurationContext'
import { StakeholderProvider } from './contexts/StakeholderContext'
import { TransactionProvider } from './contexts/TransactionContext'

function App() {
  return (
    <ConfigurationProvider>
      <StakeholderProvider>
        <TransactionProvider>
          <DarkCorporateDashboard />
        </TransactionProvider>
      </StakeholderProvider>
    </ConfigurationProvider>
  )
}

export default App