/**
 * Unit Tests: FieldError Component
 * 
 * Feature: survey-form-validation
 * Task: 5.1 Create FieldError component
 * 
 * **Validates: Requirements 3.1**
 * 
 * This test verifies that the FieldError component correctly displays
 * error messages for specific fields and returns null when no errors exist.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FieldError from '@/Components/FieldError'

describe('FieldError Component', () => {
  it('should return null when fieldErrors is empty', () => {
    const { container } = render(
      <FieldError fieldName="last_name" fieldErrors={{}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should return null when field has no errors', () => {
    const fieldErrors = {
      first_name: ['The first name field is required.']
    }
    const { container } = render(
      <FieldError fieldName="last_name" fieldErrors={fieldErrors} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should return null when field errors array is empty', () => {
    const fieldErrors = {
      last_name: []
    }
    const { container } = render(
      <FieldError fieldName="last_name" fieldErrors={fieldErrors} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should display single error message in red text', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    render(<FieldError fieldName="last_name" fieldErrors={fieldErrors} />)
    
    const errorElement = screen.getByText('The last name field is required.')
    expect(errorElement).toBeInTheDocument()
    expect(errorElement.parentElement).toHaveClass('text-red-600')
    expect(errorElement.parentElement).toHaveClass('text-sm')
    expect(errorElement.parentElement).toHaveClass('mt-1')
  })

  it('should display multiple error messages for a field', () => {
    const fieldErrors = {
      birth_date: [
        'The birth date field is required.',
        'The birth date must be a valid date.'
      ]
    }
    render(<FieldError fieldName="birth_date" fieldErrors={fieldErrors} />)
    
    expect(screen.getByText('The birth date field is required.')).toBeInTheDocument()
    expect(screen.getByText('The birth date must be a valid date.')).toBeInTheDocument()
  })

  it('should accept custom className prop', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    const { container } = render(
      <FieldError 
        fieldName="last_name" 
        fieldErrors={fieldErrors} 
        className="custom-class"
      />
    )
    
    const errorContainer = container.firstChild
    expect(errorContainer).toHaveClass('custom-class')
    expect(errorContainer).toHaveClass('text-red-600')
  })

  it('should pass through additional props', () => {
    const fieldErrors = {
      last_name: ['The last name field is required.']
    }
    const { container } = render(
      <FieldError 
        fieldName="last_name" 
        fieldErrors={fieldErrors}
        data-testid="error-message"
      />
    )
    
    expect(container.firstChild).toHaveAttribute('data-testid', 'error-message')
  })

  it('should handle field names with underscores', () => {
    const fieldErrors = {
      'contact_number': ['The contact number format is invalid.']
    }
    render(<FieldError fieldName="contact_number" fieldErrors={fieldErrors} />)
    
    expect(screen.getByText('The contact number format is invalid.')).toBeInTheDocument()
  })

  it('should handle field names with dots (nested fields)', () => {
    const fieldErrors = {
      'name.0': ['The name field is required.']
    }
    render(<FieldError fieldName="name.0" fieldErrors={fieldErrors} />)
    
    expect(screen.getByText('The name field is required.')).toBeInTheDocument()
  })

  it('should render each error in a separate div', () => {
    const fieldErrors = {
      last_name: [
        'Error 1',
        'Error 2',
        'Error 3'
      ]
    }
    render(<FieldError fieldName="last_name" fieldErrors={fieldErrors} />)
    
    expect(screen.getByText('Error 1')).toBeInTheDocument()
    expect(screen.getByText('Error 2')).toBeInTheDocument()
    expect(screen.getByText('Error 3')).toBeInTheDocument()
  })
})
