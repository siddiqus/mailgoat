import { useState, useEffect, useCallback } from 'react'

function TimePickerInput({ value, onChange, className = '' }) {
  const [hour, setHour] = useState('12')
  const [minute, setMinute] = useState('00')
  const [period, setPeriod] = useState('PM')

  // Parse incoming value (e.g., "02:00 PM")
  useEffect(() => {
    if (value) {
      const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
      if (match) {
        setHour(match[1].padStart(2, '0'))
        setMinute(match[2])
        setPeriod(match[3].toUpperCase())
      }
    }
  }, [value])

  // Memoize onChange callback to prevent infinite loops
  const handleChange = useCallback(
    (newHour, newMinute, newPeriod) => {
      const timeString = `${newHour}:${newMinute} ${newPeriod}`
      if (onChange) {
        onChange(timeString)
      }
    },
    [onChange]
  )

  // Update parent when any component changes
  useEffect(() => {
    handleChange(hour, minute, period)
  }, [hour, minute, period, handleChange])

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1
    return String(h).padStart(2, '0')
  })

  // Generate minute options (in 5-minute increments)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => {
    const m = i * 5
    return String(m).padStart(2, '0')
  })

  return (
    <div className={`d-flex gap-2 align-items-center ${className}`}>
      <div className="d-flex align-items-center">
        <select
          className="form-select"
          value={hour}
          onChange={e => setHour(e.target.value)}
          style={{ width: '70px' }}
          aria-label="Hour"
        >
          {hourOptions.map(h => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <span className="mx-1 fw-bold" style={{ fontSize: '1.2rem' }}>
          :
        </span>

        <select
          className="form-select"
          value={minute}
          onChange={e => setMinute(e.target.value)}
          style={{ width: '70px' }}
          aria-label="Minute"
        >
          {minuteOptions.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <select
        className="form-select"
        value={period}
        onChange={e => setPeriod(e.target.value)}
        style={{ width: '75px' }}
        aria-label="AM/PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

export default TimePickerInput
