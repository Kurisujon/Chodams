<?php

use App\Services\Scoring\CategoryCalculatorInterface;

test('CategoryCalculatorInterface defines required methods', function () {
    $reflection = new ReflectionClass(CategoryCalculatorInterface::class);
    
    // Check that interface has calculate method
    expect($reflection->hasMethod('calculate'))->toBeTrue();
    
    // Check that interface has getWeight method
    expect($reflection->hasMethod('getWeight'))->toBeTrue();
    
    // Check that interface has getName method
    expect($reflection->hasMethod('getName'))->toBeTrue();
});

test('CategoryCalculatorInterface calculate method has correct signature', function () {
    $reflection = new ReflectionClass(CategoryCalculatorInterface::class);
    $method = $reflection->getMethod('calculate');
    
    // Check method has one parameter
    expect($method->getNumberOfParameters())->toBe(1);
    
    // Check return type is float
    expect($method->getReturnType()->getName())->toBe('float');
});

test('CategoryCalculatorInterface getWeight method returns float', function () {
    $reflection = new ReflectionClass(CategoryCalculatorInterface::class);
    $method = $reflection->getMethod('getWeight');
    
    // Check return type is float
    expect($method->getReturnType()->getName())->toBe('float');
});

test('CategoryCalculatorInterface getName method returns string', function () {
    $reflection = new ReflectionClass(CategoryCalculatorInterface::class);
    $method = $reflection->getMethod('getName');
    
    // Check return type is string
    expect($method->getReturnType()->getName())->toBe('string');
});
