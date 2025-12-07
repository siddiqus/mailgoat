import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AlertModal from './components/AlertModal'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './components/HomePage'
import Sidebar from './components/Sidebar'
import { AlertProvider } from './contexts/AlertContext'
import Analytics from './pages/Analytics'
import CalendarInvites from './pages/CalendarInvites'
import Campaigns from './pages/Campaigns'
import History from './pages/History'
import SendEmail from './pages/SendEmail'
import Settings from './pages/Settings'
import TemplateEditor from './pages/TemplateEditor'
import Templates from './pages/Templates'

function App() {
  return (
    <ErrorBoundary>
      <AlertProvider>
        <Router>
          <div className="App">
            <Sidebar />
            <div className="main-content">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/templates/new" element={<TemplateEditor />} />
                  <Route path="/templates/edit/:id" element={<TemplateEditor />} />
                  <Route path="/campaigns" element={<Campaigns />} />
                  <Route path="/send-email" element={<SendEmail />} />
                  <Route path="/calendar-invites" element={<CalendarInvites />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </ErrorBoundary>
            </div>
          </div>
          <AlertModal />
        </Router>
      </AlertProvider>
    </ErrorBoundary>
  )
}

export default App
