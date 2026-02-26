/**
 * Unit Tests: ValidationSummary Component
 * 
 * Feature: survey-form-validation
 * Task: 5.2 Create ValidationSummary component
 * 
 * **Validates: Requirements 3.3**
 * 
 * This test verifies that the ValidationSummary component correctly displays
 * a summary of validation errors at the top of the form, including an error icon,
 * summary message, and a list of field errors (up to 5, with count of additional).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ValidationSummary from '@/Components/ValidationSummary'

describe('ValidationSummary Component', () => {
  it('should return null when no validationSummary and no fieldErrors', () => {
    const { container } = render(
      <ValidationSummary validationSummary="" fieldErrors={{}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should return null when validationSummary is empty and fieldErrors is empty', () => {
    const { container } = render(
      <ValidationSummary validationSummary={null} fieldErrors={{}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should return null when validationSummary is empty and fieldErrors is undefined', () => {
    const { container } = render(
      <ValidationSummary validationSummary="" fieldErrors={undefined} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should display when validationSummary exists but no fieldErrors', () => {
    render(
      <ValidationSummary 
        validationSummary="Please fix the errors below" 
        fieldErrors={{}} 
      />
    )
    
    expect(screen.getByText('Validation Error')).toBeInTheDocument()
    expect(screen.getByText('Please fix the errors below')).toBeInTheDocument()
  })

  it('should display when fieldErrors exist but no validationSummary', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="" 
        fieldErrors={fieldErrors} 
      />
    )
    
    expect(screen.getByText('Validation Error')).toBeInTheDocument()
    const listItem = container.querySelector('li')
    expect(listItem).toHaveTextContent('last name')
    expect(listItem).toHaveTextContent('The last name field is required.')
  })

  it('should display error icon', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors} 
      />
    )
    
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-red-600')
  })

  it('should display summary message', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    
    render(
      <ValidationSummary 
        validationSummary="Validation failed. Please check the highlighted fields." 
        fieldErrors={fieldErrors} 
      />
    )
    
    expect(screen.getByText('Validation failed. Please check the highlighted fields.')).toBeInTheDocument()
  })

  it('should list first 5 field errors with field names', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.'],
      first_name: ['The first name field is required.'],
      birth_date: ['The birth date must be a valid date.']
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors} 
      />
    )
    
    const listItems = container.querySelectorAll('li')
    expect(listItems[0]).toHaveTextContent('last name')
    expect(listItems[0]).toHaveTextContent('The last name field is required.')
    expect(listItems[1]).toHaveTextContent('first name')
    expect(listItems[1]).toHaveTextContent('The first name field is required.')
    expect(listItems[2]).toHaveTextContent('birth date')
    expect(listItems[2]).toHaveTextContent('The birth date must be a valid date.')
  })

  it('should show count of additional errors when more than 5', () => {
    const fieldErrors = {
      field1: ['Error 1'],
      field2: ['Error 2'],
      field3: ['Error 3'],
      field4: ['Error 4'],
      field5: ['Error 5'],
      field6: ['Error 6'],
      field7: ['Error 7']
    }
    
    render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors} 
      />
    )
    
    expect(screen.getByText(/\.\.\. and 2 more errors/)).toBeInTheDocument()
  })

  it('should show singular "error" when only 1 additional error', () => {
    const fieldErrors = {
      field1: ['Error 1'],
      field2: ['Error 2'],
      field3: ['Error 3'],
      field4: ['Error 4'],
      field5: ['Error 5'],
      field6: ['Error 6']
    }
    
    render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors} 
      />
    )
    
    expect(screen.getByText(/\.\.\. and 1 more error$/)).toBeInTheDocument()
  })

  it('should not show additional error count when exactly 5 errors', () => {
    const fieldErrors = {
      field1: ['Error 1'],
      field2: ['Error 2'],
      field3: ['Error 3'],
      field4: ['Error 4'],
      field5: ['Error 5']
    }
    
    render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors} 
      />
    )
    
    expect(screen.queryByText(/\.\.\. and/)).not.toBeInTheDocument()
  })

  it('should replace underscores with spaces in field names', () => {
    const fieldErrors = {
      contact_number: ['The contact number format is invalid.'],
      birth_date: ['The birth date is required.']
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors} 
      />
    )
    
    const listItems = container.querySelectorAll('li')
    expect(listItems[0]).toHaveTextContent('contact number')
    expect(listItems[0]).toHaveTextContent('The contact number format is invalid.')
    expect(listItems[1]).toHaveTextContent('birth date')
    expect(listItems[1]).toHaveTextContent('The birth date is required.')
  })

  it('should display only the first error message for each field', () => {
    const fieldErrors = {
      birth_date: [
        'The birth date field is required.',
        'The birth date must be a valid date.',
        'The birth date must be before today.'
      ]
    }
    
    render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors} 
      />
    )
    
    expect(screen.getByText(/The birth date field is required\./)).toBeInTheDocument()
    expect(screen.queryByText(/The birth date must be a valid date\./)).not.toBeInTheDocument()
  })

  it('should have proper ARIA attributes for accessibility', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors} 
      />
    )
    
    const alert = container.firstChild
    expect(alert).toHaveAttribute('role', 'alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('should apply custom className', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors}
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
    expect(container.firstChild).toHaveClass('bg-red-50')
  })

  it('should pass through additional props', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors}
        data-testid="validation-summary"
      />
    )
    
    expect(container.firstChild).toHaveAttribute('data-testid', 'validation-summary')
  })

  it('should have proper styling classes', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors}
      />
    )
    
    const alert = container.firstChild
    expect(alert).toHaveClass('mb-6')
    expect(alert).toHaveClass('p-4')
    expect(alert).toHaveClass('rounded-xl')
    expect(alert).toHaveClass('bg-red-50')
    expect(alert).toHaveClass('border')
    expect(alert).toHaveClass('border-red-200')
  })

  it('should display field errors in a list', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.'],
      first_name: ['The first name field is required.']
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors}
      />
    )
    
    const list = container.querySelector('ul')
    expect(list).toBeInTheDocument()
    expect(list).toHaveClass('list-disc')
    expect(list).toHaveClass('list-inside')
  })

  it('should handle empty error arrays in fieldErrors', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.'],
      first_name: []
    }
    
    const { container } = render(
      <ValidationSummary 
        validationSummary="Validation failed" 
        fieldErrors={fieldErrors}
      />
    )
    
    // Should still display the field with empty array
    const listItems = container.querySelectorAll('li')
    expect(listItems[0]).toHaveTextContent('last name')
    expect(listItems[0]).toHaveTextContent('The last name field is required.')
  })
})
