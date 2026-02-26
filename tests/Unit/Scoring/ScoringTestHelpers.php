<?php

namespace Tests\Unit\Scoring;

use Eris\Generator;

/**
 * Helper functions for scoring system tests
 */
class ScoringTestHelpers
{
    /**
     * Generate random valid survey data for testing
     * 
     * @return array
     */
    public static function generateRandomSurveyData(): array
    {
        return [
            'income_range' => fake()->randomElement([
                '0-2999', '3000-5999', '6000-8999', '9000-12999', '13000+'
            ]),
            'classification' => fake()->randomElement([
                'Displaced', 'Double-up', 'Homeless', 'Upgrading of land tenure'
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
                'Water Sealed', 'Open Pit/Antipolo', 'No Toilet', 'Others'
            ]),
            'water_source' => fake()->randomElement([
                'Community Water System (NAWASA)', 'Deep Well', 'Spring',
                'Rainwater', 'Surface water (river, lake, dam)', 'Others'
            ]),
            'electricity_source' => fake()->randomElement([
                'With own meter', 'Solar Panel', 'Candle/Lamp',
                'Tapping to the neighbor', 'Others'
            ])
        ];
    }

    /**
     * Generate survey data with randomly missing fields
     * 
     * @return array
     */
    public static function generateSurveyDataWithMissingFields(): array
    {
        $data = self::generateRandomSurveyData();
        $fields = array_keys($data);
        $numToRemove = fake()->numberBetween(1, count($fields) - 1);
        $fieldsToRemove = fake()->randomElements($fields, $numToRemove);
        
        foreach ($fieldsToRemove as $field) {
            unset($data[$field]);
        }
        
        return $data;
    }

    /**
     * Eris generator for income ranges
     * 
     * @return Generator\ElementsGenerator
     */
    public static function incomeRangeGenerator(): Generator\ElementsGenerator
    {
        return Generator\elements(
            '0-2999', '3000-5999', '6000-8999', '9000-12999', '13000+'
        );
    }

    /**
     * Eris generator for classifications
     * 
     * @return Generator\ElementsGenerator
     */
    public static function classificationGenerator(): Generator\ElementsGenerator
    {
        return Generator\elements(
            'Displaced', 'Double-up', 'Homeless', 'Upgrading of land tenure'
        );
    }

    /**
     * Eris generator for house structures
     * 
     * @return Generator\ElementsGenerator
     */
    public static function houseStructureGenerator(): Generator\ElementsGenerator
    {
        return Generator\elements(
            'Full Concrete',
            'Made of wood and metal roof',
            'Made of Amakan and Nipa',
            'Made of Amakan and metal roof',
            'Combination of concrete and wood',
            'Makeshift/Salvaged/Improvised material',
            'Others'
        );
    }

    /**
     * Eris generator for toilet types
     * 
     * @return Generator\ElementsGenerator
     */
    public static function toiletTypeGenerator(): Generator\ElementsGenerator
    {
        return Generator\elements(
            'Water Sealed', 'Open Pit/Antipolo', 'No Toilet', 'Others'
        );
    }

    /**
     * Eris generator for water sources
     * 
     * @return Generator\ElementsGenerator
     */
    public static function waterSourceGenerator(): Generator\ElementsGenerator
    {
        return Generator\elements(
            'Community Water System (NAWASA)', 
            'Deep Well', 
            'Spring',
            'Rainwater', 
            'Surface water (river, lake, dam)', 
            'Others'
        );
    }

    /**
     * Eris generator for electricity sources
     * 
     * @return Generator\ElementsGenerator
     */
    public static function electricitySourceGenerator(): Generator\ElementsGenerator
    {
        return Generator\elements(
            'With own meter', 
            'Solar Panel', 
            'Candle/Lamp',
            'Tapping to the neighbor', 
            'Others'
        );
    }
}
