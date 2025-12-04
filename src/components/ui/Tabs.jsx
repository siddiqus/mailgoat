import { useState, useEffect } from 'react'
import './Tabs.css'

function Tabs({ children, defaultTab, onChange }) {
  const [activeTab, setActiveTab] = useState(defaultTab || '')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleTabClick = tabValue => {
    setActiveTab(tabValue)
    if (onChange) {
      onChange(tabValue)
    }
  }

  return (
    <div className={`modern-tabs ${isMobile ? 'mobile' : ''}`}>
      <div className="modern-tabs-nav">
        {children.map((child, index) => {
          if (child.type.displayName === 'Tab') {
            const isActive = activeTab === child.props.value
            return (
              <button
                key={index}
                className={`modern-tab-button ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(child.props.value)}
              >
                {child.props.label}
              </button>
            )
          }
          return null
        })}
      </div>
      <div className="modern-tabs-content">
        {children.map((child, index) => {
          if (child.type.displayName === 'Tab' && activeTab === child.props.value) {
            return <div key={index}>{child.props.children}</div>
          }
          return null
        })}
      </div>
    </div>
  )
}

function Tab({ children }) {
  return <>{children}</>
}

Tab.displayName = 'Tab'

Tabs.Tab = Tab

export default Tabs
