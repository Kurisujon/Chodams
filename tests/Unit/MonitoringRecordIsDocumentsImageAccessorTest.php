<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\MonitoringRecord;

/**
 * Test suite for MonitoringRecord is_documents_image accessor.
 * 
 * Validates: Requirements 2.4, 7.4
 */
class MonitoringRecordIsDocumentsImageAccessorTest extends TestCase
{
    /**
     * Test that is_documents_image returns true for jpg extension.
     * 
     * @test
     */
    public function is_documents_image_returns_true_for_jpg()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.jpg';

        $this->assertTrue($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns true for jpeg extension.
     * 
     * @test
     */
    public function is_documents_image_returns_true_for_jpeg()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.jpeg';

        $this->assertTrue($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns true for png extension.
     * 
     * @test
     */
    public function is_documents_image_returns_true_for_png()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.png';

        $this->assertTrue($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns true for gif extension.
     * 
     * @test
     */
    public function is_documents_image_returns_true_for_gif()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.gif';

        $this->assertTrue($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns true for webp extension.
     * 
     * @test
     */
    public function is_documents_image_returns_true_for_webp()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.webp';

        $this->assertTrue($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns true for uppercase extensions.
     * 
     * @test
     */
    public function is_documents_image_returns_true_for_uppercase_extensions()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.JPG';

        $this->assertTrue($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns false for pdf extension.
     * 
     * @test
     */
    public function is_documents_image_returns_false_for_pdf()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.pdf';

        $this->assertFalse($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns false for doc extension.
     * 
     * @test
     */
    public function is_documents_image_returns_false_for_doc()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.doc';

        $this->assertFalse($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns false for docx extension.
     * 
     * @test
     */
    public function is_documents_image_returns_false_for_docx()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.docx';

        $this->assertFalse($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns false for null documents_path.
     * 
     * @test
     */
    public function is_documents_image_returns_false_for_null_path()
    {
        $record = new MonitoringRecord();
        $record->documents_path = null;

        $this->assertFalse($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns false for empty documents_path.
     * 
     * @test
     */
    public function is_documents_image_returns_false_for_empty_path()
    {
        $record = new MonitoringRecord();
        $record->documents_path = '';

        $this->assertFalse($record->is_documents_image);
    }

    /**
     * Test that is_documents_image returns false for path without extension.
     * 
     * @test
     */
    public function is_documents_image_returns_false_for_path_without_extension()
    {
        $record = new MonitoringRecord();
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345';

        $this->assertFalse($record->is_documents_image);
    }

    /**
     * Test that is_documents_image is included in array serialization.
     * 
     * @test
     */
    public function is_documents_image_is_included_in_array_serialization()
    {
        $record = new MonitoringRecord();
        $record->survey_id = 1;
        $record->visit_date = '2024-01-15';
        $record->status = MonitoringRecord::STATUS_HOUSE_CONSTRUCTED;
        $record->remarks = 'Test record';
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.jpg';
        $record->created_by = 1;

        $array = $record->toArray();

        $this->assertArrayHasKey('is_documents_image', $array);
        $this->assertTrue($array['is_documents_image']);
    }

    /**
     * Test that both documents_url and is_documents_image are included in array serialization.
     * 
     * @test
     */
    public function both_accessors_are_included_in_array_serialization()
    {
        $record = new MonitoringRecord();
        $record->survey_id = 1;
        $record->visit_date = '2024-01-15';
        $record->status = MonitoringRecord::STATUS_HOUSE_CONSTRUCTED;
        $record->remarks = 'Test record';
        $record->documents_path = 'storage/monitoring_documents/monitoring_12345.png';
        $record->created_by = 1;

        $array = $record->toArray();

        $this->assertArrayHasKey('documents_url', $array);
        $this->assertArrayHasKey('is_documents_image', $array);
        $this->assertNotNull($array['documents_url']);
        $this->assertTrue($array['is_documents_image']);
    }
}
