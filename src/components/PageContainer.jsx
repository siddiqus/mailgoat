import PropTypes from 'prop-types'
import './PageContainer.css'

function PageContainer({ children, className = '' }) {
  return (
    <div className="page-container">
      <div className={`page-inner ${className}`}>{children}</div>
    </div>
  )
}

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

export default PageContainer
