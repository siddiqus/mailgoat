import React from 'react'
import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="text-center mb-5">
            <h1 className="display-4 mb-3">Welcome to MailGoat</h1>
            <p className="lead text-muted">
              Manage your email templates and send personalized emails with ease
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <Link to="/templates" className="text-decoration-none">
                <div className="card h-100 shadow-sm hover-card">
                  <div className="card-body text-center p-5">
                    <div className="mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        fill="currentColor"
                        className="bi bi-file-earmark-text text-primary"
                        viewBox="0 0 16 16"
                      >
                        <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                        <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                      </svg>
                    </div>
                    <h3 className="card-title">Templates</h3>
                    <p className="card-text text-muted">
                      Create, edit, and manage your email templates with dynamic parameters
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            <div className="col-md-6">
              <Link to="/send-email" className="text-decoration-none">
                <div className="card h-100 shadow-sm hover-card">
                  <div className="card-body text-center p-5">
                    <div className="mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        fill="currentColor"
                        className="bi bi-send text-primary"
                        viewBox="0 0 16 16"
                      >
                        <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
                      </svg>
                    </div>
                    <h3 className="card-title">Send Email</h3>
                    <p className="card-text text-muted">
                      Send personalized emails using your templates and contact data
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-muted">
              <small>Get started by creating a template or sending an email</small>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
    </div>
  )
}

export default HomePage
