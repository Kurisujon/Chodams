import React from 'react'

/**
 * OtherSpecifyField Component
 * 
 * A reusable component for displaying "Other" specify text input fields
 * that appear below their parent field when "Other" is selected.
 * 
 * @param {Object} props
 * @param {string} props.parentValue - The value of the parent field (e.g., dropdown selection)
 * @param {string} props.triggerValue - The value that triggers the specify field to show (default: "Other" or "Others" or "others")
 * @param {string} props.value - The current value of the specify field
 * @param {Function} props.onChange - Callback function when the specify field value changes
 * @param {string} props.placeholder - Placeholder text for the input field
 * @param {string} props.label - Optional label for the specify field
 * @param {string} props.inputClassName - CSS classes for the input field
 */
export default function OtherSpecifyField({
  parentValue,
  triggerValue = null,
  value,
  onChange,
  placeholder = 'Please specify',
  label = null,
  inputClassName = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 capitalize',
}) {
  // Determine if the specify field should be shown
  // Support multiple trigger values: "Other", "Others", "others"
  const shouldShow = triggerValue 
    ? parentValue === triggerValue 
    : (parentValue === 'Other' || parentValue === 'Others' || parentValue === 'others')

  if (!shouldShow) {
    return null
  }

  return (
    <div className="flex flex-col gap-2.5 other-specify-field" style={{ marginTop: '10px', width: '100%', maxWidth: '100%' }}>
      {label && (
        <div className="text-sm text-gray-500">{label}</div>
      )}
      <input
        type="text"
        className={inputClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ textTransform: 'capitalize', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
      />
    </div>
  )
}
