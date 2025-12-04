import { Link } from 'react-router-dom'

function TopBar() {
  const closeNavbar = () => {
    const navbarCollapse = document.getElementById('navbarNav')
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      const navbarToggler = document.querySelector('.navbar-toggler')
      if (navbarToggler) {
        navbarToggler.click()
      }
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4 d-flex align-items-center" to="/">
          <img src="/logo.png" alt="MailGoat Logo" height="50" className="me-2" />
          MailGoat
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item mx-3">
              <Link className="nav-link" to="/" onClick={closeNavbar}>
                Home
              </Link>
            </li>
            <li className="nav-item mx-3">
              <Link className="nav-link" to="/templates" onClick={closeNavbar}>
                Templates
              </Link>
            </li>
            <li className="nav-item mx-3">
              <Link className="nav-link" to="/campaigns" onClick={closeNavbar}>
                Campaigns
              </Link>
            </li>
            <li className="nav-item mx-3">
              <Link className="nav-link" to="/send-email" onClick={closeNavbar}>
                Send Email
              </Link>
            </li>
            <li className="nav-item mx-3">
              <Link className="nav-link" to="/history" onClick={closeNavbar}>
                History
              </Link>
            </li>
            <li className="nav-item mx-3">
              <Link className="nav-link" to="/analytics" onClick={closeNavbar}>
                Analytics
              </Link>
            </li>
            <li className="nav-item mx-3">
              <Link className="nav-link" to="/settings" onClick={closeNavbar}>
                Settings
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default TopBar
