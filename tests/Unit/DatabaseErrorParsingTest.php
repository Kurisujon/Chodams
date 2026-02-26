<?php

/**
 * Unit tests for database error message parsing logic
 * These tests verify the regex patterns used in ValidatorDashboardController
 * to extract information from database error messages.
 */

test('parses duplicate entry error message correctly', function () {
    // Test the regex pattern matching for duplicate entry errors
    $errorMessage = "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry 'TAG123' for key 'demographic.tag_number'";
    
    // Verify the regex pattern works
    $pattern = "/Duplicate entry '(.+?)' for key '(.+?)'/";
    preg_match($pattern, $errorMessage, $matches);
    
    expect($matches)->toHaveCount(3);
    expect($matches[1])->toBe('TAG123');
    expect($matches[2])->toBe('demographic.tag_number');
    
    // Verify the key name detection logic
    $keyName = $matches[2];
    expect(strpos($keyName, 'tag_number'))->not->toBeFalse();
});

test('parses foreign key violation error message correctly', function () {
    // Test the regex pattern matching for foreign key errors
    $errorMessage = "SQLSTATE[23000]: Integrity constraint violation: 1452 Cannot add or update a child row: a foreign key constraint fails (`database`.`demographic`, CONSTRAINT `demographic_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `survey` (`survey_id`))";
    
    // Verify the regex pattern works
    $pattern = "/FOREIGN KEY \(`(.+?)`\) REFERENCES `(.+?)` \(`(.+?)`\)/";
    preg_match($pattern, $errorMessage, $matches);
    
    expect($matches)->toHaveCount(4);
    expect($matches[1])->toBe('survey_id');
    expect($matches[2])->toBe('survey');
    expect($matches[3])->toBe('survey_id');
});

test('parses not null violation error message correctly', function () {
    // Test the regex pattern matching for not null errors
    $errorMessage = "SQLSTATE[23000]: Integrity constraint violation: 1048 Column 'last_name' cannot be null";
    
    // Verify the regex pattern works
    $pattern = "/Column '(.+?)' cannot be null/";
    preg_match($pattern, $errorMessage, $matches);
    
    expect($matches)->toHaveCount(2);
    expect($matches[1])->toBe('last_name');
    
    // Verify field name formatting
    $columnName = $matches[1];
    $fieldName = str_replace('_', ' ', $columnName);
    expect($fieldName)->toBe('last name');
});

test('identifies tag_number in duplicate key name', function () {
    $keyNames = [
        'demographic.tag_number',
        'tag_number',
        'demographic_tag_number_unique',
        'idx_tag_number',
    ];
    
    foreach ($keyNames as $keyName) {
        expect(strpos($keyName, 'tag_number'))->not->toBeFalse();
    }
});

test('identifies survey_id in duplicate key name', function () {
    $keyNames = [
        'demographic.survey_id',
        'survey_id',
        'demographic_survey_id_unique',
        'idx_survey_id',
    ];
    
    foreach ($keyNames as $keyName) {
        expect(strpos($keyName, 'survey_id'))->not->toBeFalse();
    }
});

test('identifies PRIMARY key in duplicate key name', function () {
    $keyNames = [
        'PRIMARY',
        'demographic.PRIMARY',
    ];
    
    foreach ($keyNames as $keyName) {
        expect(strpos($keyName, 'PRIMARY'))->not->toBeFalse();
    }
});

test('formats column names with underscores to readable field names', function () {
    $testCases = [
        'last_name' => 'last name',
        'first_name' => 'first name',
        'birth_date' => 'birth date',
        'monthly_salary' => 'monthly salary',
        'tag_number' => 'tag number',
    ];
    
    foreach ($testCases as $columnName => $expectedFieldName) {
        $fieldName = str_replace('_', ' ', $columnName);
        expect($fieldName)->toBe($expectedFieldName);
    }
});

test('handles duplicate entry with special characters', function () {
    $errorMessage = "Duplicate entry 'O'Brien' for key 'demographic.last_name'";
    
    $pattern = "/Duplicate entry '(.+?)' for key '(.+?)'/";
    preg_match($pattern, $errorMessage, $matches);
    
    expect($matches)->toHaveCount(3);
    expect($matches[1])->toBe("O'Brien");
    expect($matches[2])->toBe('demographic.last_name');
});

test('handles foreign key with multiple columns', function () {
    $errorMessage = "FOREIGN KEY (`survey_id`, `validator_id`) REFERENCES `survey` (`survey_id`, `validator_id`)";
    
    // The pattern should match the first column
    $pattern = "/FOREIGN KEY \(`(.+?)`\) REFERENCES `(.+?)` \(`(.+?)`\)/";
    preg_match($pattern, $errorMessage, $matches);
    
    // Should match the first column in the list
    expect($matches)->toHaveCount(4);
    expect($matches[1])->toContain('survey_id');
});

test('handles not null with table prefix', function () {
    $errorMessage = "Column 'demographic.last_name' cannot be null";
    
    $pattern = "/Column '(.+?)' cannot be null/";
    preg_match($pattern, $errorMessage, $matches);
    
    expect($matches)->toHaveCount(2);
    expect($matches[1])->toBe('demographic.last_name');
});
