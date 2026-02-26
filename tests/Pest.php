<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "uses()" function to bind a different classes or traits.
|
*/

uses(
    Tests\TestCase::class,
    // Illuminate\Foundation\Testing\RefreshDatabase::class,
)->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * Generate random valid survey data for all 7 scoring categories
 * 
 * @return array
 */
function generateRandomSurveyData(): array
{
    return [
        'income_range' => fake()->randomElement([
            '0-2999',
            '3000-5999',
            '6000-8999',
            '9000-12999',
            '13000+'
        ]),
        'classification' => fake()->randomElement([
            'Displaced',
            'Double-up',
            'Homeless',
            'Upgrading of land tenure'
        ]),
        'owns_lot' => fake()->boolean(),
        'owns_house' => fake()->boolean(),
        'temporary_housing' => fake()->boolean(),
        'house_structure' => fake()->randomElement([
            'Full Concrete',
            'Made of wood and metal roof',
            'Made of Amakan and Nipa',
            'Made of Amakan and metal roof',
            'Combination of concrete and wood',
            'Makeshift/Salvaged/Improvised material',
            'Others'
        ]),
        'toilet_type' => fake()->randomElement([
            'Water Sealed',
            'Open Pit/Antipolo',
            'No Toilet',
            'Others'
        ]),
        'water_source' => fake()->randomElement([
            'Community Water System (NAWASA)',
            'Deep Well',
            'Spring',
            'Rainwater',
            'Surface water (river, lake, dam)',
            'Others'
        ]),
        'electricity_source' => fake()->randomElement([
            'With own meter',
            'Solar Panel',
            'Candle/Lamp',
            'Tapping to the neighbor',
            'Others'
        ])
    ];
}

/**
 * Generate survey data with randomly missing fields
 * Ensures at least one field is present
 * 
 * @return array
 */
function generateSurveyDataWithMissingFields(): array
{
    // Start with complete data
    $data = generateRandomSurveyData();
    
    // Get all field keys
    $fields = array_keys($data);
    
    // Determine how many fields to remove (at least 1, at most all but 1)
    $numToRemove = fake()->numberBetween(1, count($fields) - 1);
    
    // Randomly select fields to remove
    $fieldsToRemove = fake()->randomElements($fields, $numToRemove);
    
    // Remove the selected fields
    foreach ($fieldsToRemove as $field) {
        unset($data[$field]);
    }
    
    return $data;
}
