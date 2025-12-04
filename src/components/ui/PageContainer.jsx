import './PageContainer.css'

function PageContainer({ children, maxWidth = '1200px', className = '' }) {
  return (
    <div className={`page-container ${className}`}>
      <div className="page-container-inner" style={{ maxWidth }}>
        <div className="page-container-content">{children}</div>
      </div>
    </div>
  )
}

export default PageContainer
