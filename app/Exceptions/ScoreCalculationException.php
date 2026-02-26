<?php

namespace App\Exceptions;

use Exception;

class ScoreCalculationException extends Exception
{
    /**
     * Additional context about the exception
     *
     * @var array
     */
    private array $context;
    
    /**
     * Create a new exception instance
     *
     * @param string $message
     * @param array $context
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(string $message, array $context = [], int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
        $this->context = $context;
    }
    
    /**
     * Get the exception context
     *
     * @return array
     */
    public function getContext(): array
    {
        return $this->context;
    }
}
