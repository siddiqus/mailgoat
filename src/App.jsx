import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './components/HomePage'
import TopBar from './components/TopBar'
import Analytics from './pages/Analytics'
import Campaigns from './pages/Campaigns'
import History from './pages/History'
import SendEmail from './pages/SendEmail'
import Settings from './pages/Settings'
import Templates from './pages/Templates'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <TopBar />
          <div style={{ paddingTop: '56px', height: '100vh', overflow: 'hidden' }}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/send-email" element={<SendEmail />} />
                <Route path="/history" element={<History />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
