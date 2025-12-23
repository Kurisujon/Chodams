<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'submit_survey_api.php',
        'validate_validator_api.php',
        'Chodams/survey/submit_survey_api.php',
        'Chodams/survey/validate_validator_api.php',
        'admin/api/*',
        'validator/api/*',
    ];
}
