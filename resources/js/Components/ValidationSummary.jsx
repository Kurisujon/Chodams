/**
 * ValidationSummary Component
 * 
 * Displays a summary of validation errors at the top of the form.
 * Shows an error icon, summary message, and lists the first 5 field errors.
 * If there are more than 5 errors, shows a count of additional errors.
 * 
 * @param {string} validationSummary - Summary message to display
 * @param {Object} fieldErrors - Object containing field-specific error arrays
 * @param {string} className - Optional additional CSS classes
 * 
 * @returns {JSX.Element|null} Validation summary or null if no errors
 */
export default function ValidationSummary({ validationSummary, fieldErrors, className = '', ...props }) {
  // Only display when validationSummary or fieldErrors exist
  if (!validationSummary && (!fieldErrors || Object.keys(fieldErrors).length === 0)) {
    return null;
  }

  const errorEntries = Object.entries(fieldErrors || {});
  const firstFiveErrors = errorEntries.slice(0, 5);
  const additionalErrorCount = errorEntries.length - 5;

  return (
    <div 
      className={`mb-6 p-4 rounded-xl bg-red-50 border border-red-200 ${className}`}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <svg 
          className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            clipRule="evenodd" 
          />
        </svg>

        <div className="flex-1">
          {/* Summary Message */}
          <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
          {validationSummary && (
            <p className="mt-1 text-sm text-red-700">{validationSummary}</p>
          )}

          {/* List of Field Errors */}
          {errorEntries.length > 0 && (
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
              {firstFiveErrors.map(([field, errors]) => (
                <li key={field}>
                  <span className="font-medium">{field.replace(/_/g, ' ')}</span>: {errors[0]}
                </li>
              ))}
              {additionalErrorCount > 0 && (
                <li className="font-medium">
                  ... and {additionalErrorCount} more {additionalErrorCount === 1 ? 'error' : 'errors'}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
