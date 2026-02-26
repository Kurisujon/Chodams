<?php

namespace App\Services;

use App\Models\Survey;
use App\Services\Scoring\ScoreCalculator;
use App\Exceptions\ScoreCalculationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class BeneficiaryScoreService
{
    /**
     * The score calculator instance
     *
     * @var ScoreCalculator
     */
    private ScoreCalculator $calculator;
    
    /**
     * Create a new service instance
     *
     * @param ScoreCalculator|null $calculator
     */
    public function __construct(?ScoreCalculator $calculator = null)
    {
        $this->calculator = $calculator ?? new ScoreCalculator();
    }
    
    /**
     * Calculate and save the priority score for a survey
     * 
     * @param Survey $survey
     * @return float The calculated score
     * @throws ScoreCalculationException
     */
    public function calculateAndSave(Survey $survey): float
    {
        try {
            // Extract survey data from related tables
            $surveyData = $this->extractSurveyData($survey);
            
            // Validate survey data
            if (!$this->validateSurveyData($surveyData)) {
                Log::warning('Invalid survey data detected', [
                    'survey_id' => $survey->survey_id,
                    'survey_data' => $surveyData
                ]);
            }
            
            // Calculate the score
            $score = $this->calculator->calculateScore($surveyData);
            
            // Persist the score to database
            DB::beginTransaction();
            try {
                $survey->priority_score = $score;
                $survey->score_calculated_at = now();
                $survey->save();
                
                DB::commit();
                
                return $score;
            } catch (\Exception $e) {
                DB::rollBack();
                throw new ScoreCalculationException(
                    'Failed to persist score to database',
                    [
                        'survey_id' => $survey->survey_id,
                        'calculated_score' => $score,
                        'error' => $e->getMessage()
                    ],
                    0,
                    $e
                );
            }
        } catch (ScoreCalculationException $e) {
            // Re-throw score calculation exceptions
            throw $e;
        } catch (\Exception $e) {
            // Wrap other exceptions
            Log::error('Score calculation failed', [
                'survey_id' => $survey->survey_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new ScoreCalculationException(
                'Failed to calculate score for survey',
                [
                    'survey_id' => $survey->survey_id,
                    'error' => $e->getMessage()
                ],
                0,
                $e
            );
        }
    }
    
    /**
     * Recalculate scores for all surveys
     * 
     * @return int Number of scores recalculated
     */
    public function recalculateAll(): int
    {
        $count = 0;
        $surveys = Survey::all();
        
        foreach ($surveys as $survey) {
            try {
                $this->calculateAndSave($survey);
                $count++;
            } catch (ScoreCalculationException $e) {
                Log::error('Failed to recalculate score during batch operation', [
                    'survey_id' => $survey->survey_id,
                    'error' => $e->getMessage(),
                    'context' => $e->getContext()
                ]);
                // Continue with next survey
            }
        }
        
        return $count;
    }
    
    /**
     * Validate survey data before calculation
     * 
     * @param array $surveyData
     * @return bool
     */
    private function validateSurveyData(array $surveyData): bool
    {
        // Define valid values for each category
        $validIncomeRanges = ['0-2999', '3000-5999', '6000-8999', '9000-12999', '13000+'];
        $validClassifications = ['Displaced', 'Double-up', 'Homeless', 'Upgrading of land tenure'];
        $validHouseStructures = [
            'Full Concrete',
            'Made of wood and metal roof',
            'Made of Amakan and Nipa',
            'Made of Amakan and metal roof',
            'Combination of concrete and wood',
            'Makeshift/Salvaged/Improvised material',
            'Others'
        ];
        $validToiletTypes = ['Water Sealed', 'Open Pit/Antipolo', 'No Toilet', 'Others'];
        $validWaterSources = [
            'Community Water System (NAWASA)',
            'Deep Well',
            'Spring',
            'Rainwater',
            'Surface water (river, lake, dam)',
            'Others'
        ];
        $validElectricitySources = [
            'With own meter',
            'Solar Panel',
            'Candle/Lamp',
            'Tapping to the neighbor',
            'Others'
        ];
        
        $isValid = true;
        
        // Validate income range
        if (isset($surveyData['income_range']) && !in_array($surveyData['income_range'], $validIncomeRanges)) {
            Log::warning('Invalid income range value', ['value' => $surveyData['income_range']]);
            $isValid = false;
        }
        
        // Validate classification
        if (isset($surveyData['classification']) && !in_array($surveyData['classification'], $validClassifications)) {
            Log::warning('Invalid classification value', ['value' => $surveyData['classification']]);
            $isValid = false;
        }
        
        // Validate house structure
        if (isset($surveyData['house_structure']) && !in_array($surveyData['house_structure'], $validHouseStructures)) {
            Log::warning('Invalid house structure value', ['value' => $surveyData['house_structure']]);
            $isValid = false;
        }
        
        // Validate toilet type
        if (isset($surveyData['toilet_type']) && !in_array($surveyData['toilet_type'], $validToiletTypes)) {
            Log::warning('Invalid toilet type value', ['value' => $surveyData['toilet_type']]);
            $isValid = false;
        }
        
        // Validate water source
        if (isset($surveyData['water_source']) && !in_array($surveyData['water_source'], $validWaterSources)) {
            Log::warning('Invalid water source value', ['value' => $surveyData['water_source']]);
            $isValid = false;
        }
        
        // Validate electricity source
        if (isset($surveyData['electricity_source']) && !in_array($surveyData['electricity_source'], $validElectricitySources)) {
            Log::warning('Invalid electricity source value', ['value' => $surveyData['electricity_source']]);
            $isValid = false;
        }
        
        // Validate boolean fields
        if (isset($surveyData['owns_lot']) && !is_bool($surveyData['owns_lot'])) {
            Log::warning('Invalid owns_lot value', ['value' => $surveyData['owns_lot']]);
            $isValid = false;
        }
        
        if (isset($surveyData['owns_house']) && !is_bool($surveyData['owns_house'])) {
            Log::warning('Invalid owns_house value', ['value' => $surveyData['owns_house']]);
            $isValid = false;
        }
        
        if (isset($surveyData['temporary_housing']) && !is_bool($surveyData['temporary_housing'])) {
            Log::warning('Invalid temporary_housing value', ['value' => $surveyData['temporary_housing']]);
            $isValid = false;
        }
        
        return $isValid;
    }
    
    /**
     * Extract survey data from related tables
     * 
     * @param Survey $survey
     * @return array
     */
    private function extractSurveyData(Survey $survey): array
    {
        $surveyData = [];
        
        // Load relationships if not already loaded
        $survey->loadMissing(['demographic', 'demographic.survey']);
        
        // Get classification data
        $classification = DB::table('classification')
            ->where('survey_id', $survey->survey_id)
            ->first();
        
        if ($classification) {
            // Map classification field to text value
            $classificationMap = [
                1 => 'Displaced',
                2 => 'Double-up',
                3 => 'Homeless',
                4 => 'Upgrading of land tenure'
            ];
            
            if (isset($classification->classification) && isset($classificationMap[$classification->classification])) {
                $surveyData['classification'] = $classificationMap[$classification->classification];
            }
        }
        
        // Get household data
        $household = DB::table('household')
            ->where('survey_id', $survey->survey_id)
            ->first();
        
        if ($household) {
            // Map lot ownership
            $surveyData['owns_lot'] = $household->lot_ownership === 'Owned' || $household->lot_ownership === 'owned';
            
            // Map house ownership
            $surveyData['owns_house'] = $household->house_ownership === 'Owned' || $household->house_ownership === 'owned';
            
            // Map temporary housing
            $surveyData['temporary_housing'] = $household->temporary_living_area === 'Yes' || $household->temporary_living_area === 'yes';
            
            // Map house structure - convert underscores to spaces
            if ($household->housing_structure) {
                $surveyData['house_structure'] = str_replace('_', ' ', $household->housing_structure);
            }
            
            // Map toilet type - convert underscores to spaces and handle legacy values
            if ($household->type_of_toilet) {
                $toiletType = $household->type_of_toilet;
                // Handle legacy values
                if ($toiletType === 'Pit' || $toiletType === 'pit') {
                    $toiletType = 'Open Pit/Antipolo';
                } elseif ($toiletType === 'None' || $toiletType === 'none') {
                    $toiletType = 'No Toilet';
                } elseif ($toiletType === 'Water-sealed' || $toiletType === 'Water_Sealed') {
                    $toiletType = 'Water Sealed';
                } else {
                    $toiletType = str_replace('_', ' ', $toiletType);
                }
                $surveyData['toilet_type'] = $toiletType;
            }
            
            // Map water source - convert underscores to spaces and handle special cases
            if ($household->source_of_water) {
                $waterSource = $household->source_of_water;
                if ($waterSource === 'NAWASA') {
                    $waterSource = 'Community Water System (NAWASA)';
                } elseif ($waterSource === 'Surface_Water' || $waterSource === 'Surface Water') {
                    $waterSource = 'Surface water (river, lake, dam)';
                } else {
                    $waterSource = str_replace('_', ' ', $waterSource);
                }
                $surveyData['water_source'] = $waterSource;
            }
            
            // Map electricity source - convert underscores to spaces
            if ($household->source_of_electricity) {
                $electricitySource = str_replace('_', ' ', $household->source_of_electricity);
                $surveyData['electricity_source'] = $electricitySource;
            }
        }
        
        // Get economic data
        $economic = DB::table('economic')
            ->where('survey_id', $survey->survey_id)
            ->first();
        
        if ($economic && $economic->combine_monthly_income) {
            // Map income range
            $income = $economic->combine_monthly_income;
            
            // Parse income string to determine range
            if (is_numeric($income)) {
                $incomeValue = (float) $income;
                
                if ($incomeValue < 3000) {
                    $surveyData['income_range'] = '0-2999';
                } elseif ($incomeValue < 6000) {
                    $surveyData['income_range'] = '3000-5999';
                } elseif ($incomeValue < 9000) {
                    $surveyData['income_range'] = '6000-8999';
                } elseif ($incomeValue < 13000) {
                    $surveyData['income_range'] = '9000-12999';
                } else {
                    $surveyData['income_range'] = '13000+';
                }
            } elseif (is_string($income)) {
                // Handle string income ranges
                $surveyData['income_range'] = $income;
            }
        }
        
        return $surveyData;
    }
}
