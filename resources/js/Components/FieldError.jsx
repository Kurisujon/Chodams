/**
 * FieldError Component
 * 
 * Displays validation error messages for a specific form field.
 * Reads errors from the fieldErrors state object and displays them
 * in red text below the field.
 * 
 * @param {string} fieldName - The name of the field to display errors for
 * @param {Object} fieldErrors - Object containing field-specific error arrays
 * @param {string} className - Optional additional CSS classes
 * 
 * @returns {JSX.Element|null} Error message(s) or null if no errors
 */
export default function FieldError({ fieldName, fieldErrors, className = '', ...props }) {
  const errors = fieldErrors[fieldName];
  
  if (!errors || errors.length === 0) {
    return null;
  }
  
  return (
    <div className={`mt-1 text-sm text-red-600 ${className}`} {...props}>
      {errors.map((error, index) => (
        <div key={index}>{error}</div>
      ))}
    </div>
  );
}
