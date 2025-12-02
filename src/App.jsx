import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import TopBar from './components/TopBar'
import HomePage from './components/HomePage'
import Templates from './pages/Templates'
import SendEmail from './pages/SendEmail'

function App() {
  return (
    <Router>
      <div className="App">
        <TopBar />
        <div style={{ paddingTop: '56px' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/send-email" element={<SendEmail />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
