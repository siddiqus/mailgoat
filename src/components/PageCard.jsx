import PropTypes from 'prop-types'
import './PageCard.css'

function PageCard({ children, className = '', header, headerActions }) {
  return (
    <div className={`page-card ${className}`}>
      {header && (
        <div className="page-card-header">
          <div className="page-card-header-content">
            {typeof header === 'string' ? <h5 className="mb-0">{header}</h5> : header}
          </div>
          {headerActions && <div className="page-card-header-actions">{headerActions}</div>}
        </div>
      )}
      <div className="page-card-body">{children}</div>
    </div>
  )
}

PageCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  header: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  headerActions: PropTypes.node,
}

export default PageCard
