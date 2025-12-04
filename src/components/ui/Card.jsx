import './Card.css'

function Card({ children, className = '', noPadding = false }) {
  return <div className={`modern-card ${className}`}>{children}</div>
}

function CardHeader({ children, className = '' }) {
  return <div className={`modern-card-header ${className}`}>{children}</div>
}

function CardBody({ children, className = '' }) {
  return <div className={`modern-card-body ${className}`}>{children}</div>
}

Card.Header = CardHeader
Card.Body = CardBody

export default Card
