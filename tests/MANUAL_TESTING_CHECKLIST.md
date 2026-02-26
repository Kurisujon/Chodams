# Manual Testing Checklist - Monitoring and Survey Improvements

This document provides a comprehensive checklist for manually testing the UI improvements implemented in the monitoring and survey system.

## Test Environment Setup

- [ ] Ensure the application is running locally or on a test server
- [ ] Have access to an admin account for testing monitoring features
- [ ] Have access to a validator account for testing survey forms
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on multiple devices (Desktop, Tablet, Mobile)

## 1. Dropdown Visibility Testing (Requirements 2.1, 2.2, 2.3)

### Desktop Testing
- [ ] Open the Survey Form page
- [ ] Scroll to various sections of the form
- [ ] Click on each dropdown menu throughout the form
- [ ] **Verify**: Dropdown options appear ABOVE all input fields (no overlap)
- [ ] **Verify**: Dropdown menu has higher z-index than surrounding elements
- [ ] **Verify**: All dropdown options are fully visible and clickable

### Scroll Position Testing
- [ ] Open a dropdown near the top of the form
- [ ] Scroll down while the dropdown is open
- [ ] **Verify**: Dropdown maintains proper positioning relative to its trigger
- [ ] Repeat for dropdowns in the middle and bottom of the form

### Multiple Dropdowns Testing
- [ ] Locate areas where multiple dropdowns are close together
- [ ] Open each dropdown one at a time
- [ ] **Verify**: Each dropdown renders above form inputs when opened
- [ ] **Verify**: No visual overlap between dropdowns and other elements

### Test Locations in Survey Form
Test the following specific dropdowns:
- [ ] Religion dropdown
- [ ] Tribe dropdown
- [ ] Spouse Religion dropdown (if applicable)
- [ ] Spouse Tribe dropdown (if applicable)
- [ ] Housing Structure dropdown
- [ ] Type of Toilet dropdown
- [ ] Source of Water dropdown
- [ ] Source of Electricity dropdown
- [ ] Main Income Source dropdown
- [ ] Work Status dropdown
- [ ] Specific Skill dropdown
- [ ] Specific Organization dropdown

## 2. Other Specify Field Placement Testing (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)

### Vertical Placement Testing
For each field with an "Other" option:
- [ ] Select "Other" from the dropdown/radio group
- [ ] **Verify**: Specify textbox appears BELOW the parent field
- [ ] **Verify**: Layout is vertical (not horizontal)
- [ ] **Verify**: Spacing between parent field and specify textbox is 8-12 pixels
- [ ] Measure spacing using browser dev tools if needed

### Conditional Visibility Testing
- [ ] Select "Other" from a field
- [ ] **Verify**: Specify textbox appears
- [ ] Change selection to a non-"Other" option
- [ ] **Verify**: Specify textbox disappears/hides
- [ ] Repeat for all fields with "Other" options

### Consistency Testing
Test the following "Other" specify fields:
- [ ] Religion → Other Religion specify field
- [ ] Tribe → Other Tribe specify field
- [ ] Spouse Religion → Other Spouse Religion specify field
- [ ] Spouse Tribe → Other Spouse Tribe specify field
- [ ] Housing Structure → Other Housing Structure specify field
- [ ] Type of Toilet → Other Toilet Type specify field
- [ ] Source of Water → Other Water Source specify field
- [ ] Source of Electricity → Other Electricity Source specify field
- [ ] Main Income Source → Other Income Source specify field
- [ ] Work Status → Other Work Status specify field
- [ ] Specific Skill → Other Skill specify field
- [ ] Specific Organization → Other Organization specify field

For each field above:
- [ ] **Verify**: Consistent vertical layout
- [ ] **Verify**: Consistent spacing (8-12px)
- [ ] **Verify**: No horizontal layouts
- [ ] **Verify**: Proper show/hide behavior

## 3. Mobile Responsive Design Testing (Requirements 6.1, 6.2, 6.3, 6.4)

### Device Testing
Test on the following devices/screen sizes:
- [ ] iPhone (375px width)
- [ ] Android phone (360px width)
- [ ] iPad (768px width)
- [ ] Small tablet (600px width)

### Form Field Layout Testing (Requirement 6.1)
On screens < 768px width:
- [ ] Open the Survey Form
- [ ] **Verify**: All form fields are full width (100%)
- [ ] **Verify**: Form fields stack vertically
- [ ] **Verify**: No horizontal scrolling required
- [ ] Scroll through entire form to check all sections

### Dropdown Visibility on Mobile (Requirement 6.2)
- [ ] Open various dropdowns on mobile device
- [ ] **Verify**: Dropdown options remain visible within viewport
- [ ] **Verify**: No options are cut off or hidden
- [ ] **Verify**: Dropdowns are easy to interact with on touch screen

### Other Specify Field Mobile Testing (Requirement 6.3)
- [ ] Select "Other" from various fields on mobile
- [ ] **Verify**: Specify textbox appears below parent field
- [ ] **Verify**: No horizontal scrolling occurs
- [ ] **Verify**: Specify field is full width
- [ ] **Verify**: Text input is easy to use on mobile keyboard

### Touch Target Testing (Requirement 6.4)
- [ ] Locate file upload buttons on mobile
- [ ] **Verify**: Upload buttons are at least 44px × 44px
- [ ] **Verify**: Buttons are easy to tap with finger
- [ ] **Verify**: No accidental taps on nearby elements
- [ ] Test with actual finger taps (not just mouse clicks)

### Viewport Testing
Use browser dev tools to test specific widths:
- [ ] 320px width (small phone)
- [ ] 375px width (iPhone)
- [ ] 414px width (large phone)
- [ ] 600px width (small tablet)
- [ ] 767px width (just below tablet breakpoint)
- [ ] 768px width (tablet breakpoint)

## 4. File Upload Testing (Requirements 1.2, 1.3, 1.6, 1.7, 1.8, 1.9)

### Upload Interface Testing
- [ ] Navigate to a monitoring record page
- [ ] **Verify**: Upload interface is visible and accessible
- [ ] **Verify**: File selection button is clearly labeled
- [ ] **Verify**: Multiple file selection is supported

### File Validation Testing
- [ ] Try uploading a file larger than 10MB
- [ ] **Verify**: Error message appears indicating file is too large
- [ ] Try uploading an invalid file type (e.g., .exe, .zip)
- [ ] **Verify**: Error message appears indicating invalid file type
- [ ] Upload valid files (PDF, JPG, PNG, DOC, DOCX)
- [ ] **Verify**: Files are accepted and upload successfully

### Upload List Display Testing (Requirement 1.6)
- [ ] Upload multiple documents
- [ ] **Verify**: Uploaded documents appear in a list
- [ ] **Verify**: Each document shows original filename
- [ ] **Verify**: Each document shows upload date
- [ ] **Verify**: List is easy to read and navigate

### Error Message Testing (Requirement 1.7)
- [ ] Upload a mix of valid and invalid files
- [ ] **Verify**: Specific error messages appear for each failed file
- [ ] **Verify**: Error messages indicate which file failed
- [ ] **Verify**: Error messages explain why the file failed
- [ ] **Verify**: Valid files still upload successfully

### Download Testing (Requirement 1.8)
- [ ] Click download button for an uploaded document
- [ ] **Verify**: File downloads successfully
- [ ] **Verify**: Downloaded file has correct filename
- [ ] **Verify**: Downloaded file content matches original
- [ ] Test with different file types (PDF, image, document)

### Delete Testing (Requirement 1.9)
- [ ] Click delete button for a document you uploaded
- [ ] **Verify**: Confirmation dialog appears
- [ ] Confirm deletion
- [ ] **Verify**: Document is removed from the list
- [ ] **Verify**: Document is no longer accessible
- [ ] Try to delete a document uploaded by another user
- [ ] **Verify**: Permission error appears (if applicable)

## 5. Cross-Browser Testing

Test all above scenarios on:
- [ ] Google Chrome (latest version)
- [ ] Mozilla Firefox (latest version)
- [ ] Safari (latest version, if on Mac)
- [ ] Microsoft Edge (latest version)

## 6. Accessibility Testing

- [ ] Navigate form using keyboard only (Tab, Enter, Arrow keys)
- [ ] **Verify**: All dropdowns are keyboard accessible
- [ ] **Verify**: All "Other" specify fields are keyboard accessible
- [ ] **Verify**: File upload buttons are keyboard accessible
- [ ] Test with screen reader (if available)
- [ ] **Verify**: All form elements have proper labels
- [ ] **Verify**: Error messages are announced by screen reader

## 7. Performance Testing

- [ ] Upload multiple large files (close to 10MB each)
- [ ] **Verify**: Upload progress is shown
- [ ] **Verify**: Application remains responsive during upload
- [ ] Open form with many "Other" specify fields visible
- [ ] **Verify**: Form renders quickly without lag
- [ ] Scroll through long form with many dropdowns
- [ ] **Verify**: Smooth scrolling performance

## Test Results Summary

### Passed Tests
- List all tests that passed

### Failed Tests
- List all tests that failed with details

### Issues Found
- Document any bugs or issues discovered during testing

### Recommendations
- Suggest any improvements or fixes needed

## Sign-off

- **Tester Name**: ___________________________
- **Date**: ___________________________
- **Overall Status**: [ ] Pass [ ] Fail [ ] Pass with Issues
- **Notes**: ___________________________

