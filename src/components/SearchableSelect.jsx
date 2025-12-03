import { useState, useRef, useEffect } from 'react'

/**
 * SearchableSelect - A dropdown with search/filter functionality
 * @param {Object} props
 * @param {Array} props.options - Array of {value, label} objects
 * @param {string} props.value - Currently selected value
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.label - Label for the select
 * @param {boolean} props.allowClear - Whether to show a clear button
 */
function SearchableSelect({ options, value, onChange, placeholder, label, allowClear = true }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get current selected option
  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = optionValue => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = e => {
    e.stopPropagation()
    onChange('all')
    setSearchTerm('')
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  return (
    <div className="position-relative" ref={dropdownRef}>
      {label && <label className="form-label mb-2 fw-bold">{label}</label>}

      {/* Select Button */}
      <div
        className="form-control d-flex justify-content-between align-items-center"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={handleToggle}
      >
        <span className={selectedOption ? '' : 'text-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="d-flex align-items-center gap-2">
          {allowClear && value !== 'all' && (
            <button
              type="button"
              className="btn btn-sm p-0 border-0"
              onClick={handleClear}
              title="Clear selection"
              style={{ fontSize: '1.2rem', lineHeight: 1 }}
            >
              ×
            </button>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            fill="currentColor"
            className={`bi bi-chevron-down transition ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16"
            style={{ transition: 'transform 0.2s' }}
          >
            <path
              fillRule="evenodd"
              d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="position-absolute w-100 bg-white border rounded shadow-lg"
          style={{ top: '100%', zIndex: 1000, maxHeight: '300px', marginTop: '4px' }}
        >
          {/* Search Input */}
          <div className="p-2 border-bottom">
            <input
              ref={inputRef}
              type="text"
              className="form-control form-control-sm"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-muted">No results found</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`p-2 px-3 ${option.value === value ? 'bg-primary text-white' : 'hover-bg-light'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={e => {
                    if (option.value !== value) {
                      e.target.style.backgroundColor = '#f8f9fa'
                    }
                  }}
                  onMouseLeave={e => {
                    if (option.value !== value) {
                      e.target.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {option.label}
                  {option.value === value && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-check float-end"
                      viewBox="0 0 16 16"
                    >
                      <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
