import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './components/HomePage'
import TopBar from './components/TopBar'
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
          <div style={{ paddingTop: '56px' }}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/send-email" element={<SendEmail />} />
                <Route path="/history" element={<History />} />
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
