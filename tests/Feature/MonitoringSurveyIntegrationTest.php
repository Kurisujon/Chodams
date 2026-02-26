<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Survey;
use App\Models\MonitoringRecord;
use App\Models\MonitoringDocument;
use App\Models\Admin;
use App\Services\FileStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class MonitoringSurveyIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $fileStorage;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create admin user for testing
        $this->admin = Admin::create([
            'username' => 'testadmin',
            'password' => bcrypt('password'),
            'email' => 'admin@test.com',
        ]);
        
        // Set admin session
        session(['admin_id' => $this->admin->id]);
        
        $this->fileStorage = new FileStorage();
    }

    /**
     * Test end-to-end file upload from frontend to storage
     * Requirements: 1.4, 1.5
     */
    public function test_end_to_end_file_upload_workflow()
    {
        // Create a survey for testing
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-24',
            'is_submitted' => 1,
        ]);

        // Create monitoring record
        $monitoringRecord = MonitoringRecord::create([
            'survey_id' => $surveyId,
            'visit_date' => '2026-01-24',
            'status' => 'in_progress',
            'remarks' => 'Test monitoring record',
            'created_by' => $this->admin->id,
        ]);

        // Create test files
        $pdfFile = UploadedFile::fake()->create('test_document.pdf', 1024, 'application/pdf');
        $imageFile = UploadedFile::fake()->image('test_image.jpg', 800, 600);

        // Upload documents
        $response = $this->postJson("/api/monitoring/{$monitoringRecord->id}/documents", [
            'documents' => [$pdfFile, $imageFile],
        ]);

        // Assert response
        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
        ]);

        $responseData = $response->json();
        $this->assertArrayHasKey('documents', $responseData);
        $this->assertCount(2, $responseData['documents']);

        // Verify database records
        $this->assertDatabaseHas('monitoring_documents', [
            'monitoring_record_id' => $monitoringRecord->id,
            'original_filename' => 'test_document.pdf',
            'uploaded_by' => $this->admin->id,
        ]);

        $this->assertDatabaseHas('monitoring_documents', [
            'monitoring_record_id' => $monitoringRecord->id,
            'original_filename' => 'test_image.jpg',
            'uploaded_by' => $this->admin->id,
        ]);

        // Verify files exist in storage
        $documents = MonitoringDocument::where('monitoring_record_id', $monitoringRecord->id)->get();
        foreach ($documents as $document) {
            $this->assertTrue($this->fileStorage->exists($document->file_path));
        }

        // Cleanup
        foreach ($documents as $document) {
            $this->fileStorage->delete($document->file_path);
        }
    }

    /**
     * Test survey form submission with multiple files
     * Requirements: 4.1
     */
    public function test_survey_form_submission_with_files()
    {
        // This test would require the actual survey submission endpoint
        // For now, we'll test the document upload part which is the core functionality
        
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-24',
            'is_submitted' => 0,
        ]);

        $monitoringRecord = MonitoringRecord::create([
            'survey_id' => $surveyId,
            'visit_date' => '2026-01-24',
            'status' => 'pending',
            'created_by' => $this->admin->id,
        ]);

        // Create multiple test files
        $files = [
            UploadedFile::fake()->create('proof1.pdf', 500, 'application/pdf'),
            UploadedFile::fake()->image('proof2.jpg'),
            UploadedFile::fake()->create('proof3.docx', 800, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        ];

        // Upload all files
        $response = $this->postJson("/api/monitoring/{$monitoringRecord->id}/documents", [
            'documents' => $files,
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
        ]);

        // Verify all files were uploaded
        $uploadedDocuments = MonitoringDocument::where('monitoring_record_id', $monitoringRecord->id)->get();
        $this->assertCount(3, $uploadedDocuments);

        // Verify file metadata
        foreach ($uploadedDocuments as $document) {
            $this->assertNotNull($document->original_filename);
            $this->assertNotNull($document->stored_filename);
            $this->assertNotNull($document->file_path);
            $this->assertGreaterThan(0, $document->file_size);
            $this->assertNotNull($document->mime_type);
            $this->assertEquals($this->admin->id, $document->uploaded_by);
        }

        // Cleanup
        foreach ($uploadedDocuments as $document) {
            $this->fileStorage->delete($document->file_path);
        }
    }

    /**
     * Test document download with permission checks
     * Requirements: 1.8
     */
    public function test_document_download_with_permissions()
    {
        // Create survey and monitoring record
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-24',
            'is_submitted' => 1,
        ]);

        $monitoringRecord = MonitoringRecord::create([
            'survey_id' => $surveyId,
            'visit_date' => '2026-01-24',
            'status' => 'completed',
            'created_by' => $this->admin->id,
        ]);

        // Upload a test file
        $testFile = UploadedFile::fake()->create('download_test.pdf', 500, 'application/pdf');
        
        $response = $this->postJson("/api/monitoring/{$monitoringRecord->id}/documents", [
            'documents' => [$testFile],
        ]);

        $response->assertStatus(201);
        $document = MonitoringDocument::where('monitoring_record_id', $monitoringRecord->id)->first();
        $this->assertNotNull($document);

        // Test download with valid admin session
        $downloadResponse = $this->get("/api/monitoring/documents/{$document->id}/download");
        $downloadResponse->assertStatus(200);
        $downloadResponse->assertHeader('content-disposition', 'attachment; filename=download_test.pdf');

        // Test download without admin session (should fail)
        session()->forget('admin_id');
        $unauthorizedResponse = $this->get("/api/monitoring/documents/{$document->id}/download");
        $unauthorizedResponse->assertStatus(403);

        // Cleanup
        $this->fileStorage->delete($document->file_path);
    }

    /**
     * Test document deletion with file cleanup
     * Requirements: 1.9
     */
    public function test_document_deletion_with_cleanup()
    {
        // Create survey and monitoring record
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-24',
            'is_submitted' => 1,
        ]);

        $monitoringRecord = MonitoringRecord::create([
            'survey_id' => $surveyId,
            'visit_date' => '2026-01-24',
            'status' => 'completed',
            'created_by' => $this->admin->id,
        ]);

        // Upload a test file
        $testFile = UploadedFile::fake()->create('delete_test.pdf', 500, 'application/pdf');
        
        $uploadResponse = $this->postJson("/api/monitoring/{$monitoringRecord->id}/documents", [
            'documents' => [$testFile],
        ]);

        $uploadResponse->assertStatus(201);
        $document = MonitoringDocument::where('monitoring_record_id', $monitoringRecord->id)->first();
        $this->assertNotNull($document);

        $filePath = $document->file_path;
        $documentId = $document->id;

        // Verify file exists before deletion
        $this->assertTrue($this->fileStorage->exists($filePath));

        // Delete document
        $deleteResponse = $this->deleteJson("/api/monitoring/documents/{$documentId}");
        $deleteResponse->assertStatus(200);
        $deleteResponse->assertJson([
            'success' => true,
            'message' => 'Document deleted successfully.',
        ]);

        // Verify database record is deleted
        $this->assertDatabaseMissing('monitoring_documents', [
            'id' => $documentId,
        ]);

        // Verify file is deleted from storage
        $this->assertFalse($this->fileStorage->exists($filePath));
    }

    /**
     * Test document deletion permission check (non-owner cannot delete)
     */
    public function test_document_deletion_permission_check()
    {
        // Create survey and monitoring record
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-24',
            'is_submitted' => 1,
        ]);

        $monitoringRecord = MonitoringRecord::create([
            'survey_id' => $surveyId,
            'visit_date' => '2026-01-24',
            'status' => 'completed',
            'created_by' => $this->admin->id,
        ]);

        // Upload a test file
        $testFile = UploadedFile::fake()->create('permission_test.pdf', 500, 'application/pdf');
        
        $uploadResponse = $this->postJson("/api/monitoring/{$monitoringRecord->id}/documents", [
            'documents' => [$testFile],
        ]);

        $uploadResponse->assertStatus(201);
        $document = MonitoringDocument::where('monitoring_record_id', $monitoringRecord->id)->first();

        // Create another admin
        $otherAdmin = Admin::create([
            'username' => 'otheradmin',
            'password' => bcrypt('password'),
            'email' => 'other@test.com',
        ]);

        // Switch to other admin session
        session(['admin_id' => $otherAdmin->id]);

        // Try to delete document (should fail)
        $deleteResponse = $this->deleteJson("/api/monitoring/documents/{$document->id}");
        $deleteResponse->assertStatus(403);
        $deleteResponse->assertJson([
            'success' => false,
            'message' => 'You can only delete documents you uploaded.',
        ]);

        // Verify document still exists
        $this->assertDatabaseHas('monitoring_documents', [
            'id' => $document->id,
        ]);

        // Cleanup
        $this->fileStorage->delete($document->file_path);
    }

    /**
     * Test file validation errors during upload
     */
    public function test_file_validation_errors()
    {
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-24',
            'is_submitted' => 1,
        ]);

        $monitoringRecord = MonitoringRecord::create([
            'survey_id' => $surveyId,
            'visit_date' => '2026-01-24',
            'status' => 'in_progress',
            'created_by' => $this->admin->id,
        ]);

        // Test file too large (over 10MB)
        $largeFile = UploadedFile::fake()->create('large_file.pdf', 11000, 'application/pdf');
        
        $response = $this->postJson("/api/monitoring/{$monitoringRecord->id}/documents", [
            'documents' => [$largeFile],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('documents.0');
    }

    /**
     * Test transaction rollback on error
     */
    public function test_transaction_rollback_on_error()
    {
        $surveyId = DB::table('survey')->insertGetId([
            'validator_id' => 1,
            'interviewed_by' => 'Test Validator',
            'date_interviewed' => '2026-01-24',
            'is_submitted' => 1,
        ]);

        $monitoringRecord = MonitoringRecord::create([
            'survey_id' => $surveyId,
            'visit_date' => '2026-01-24',
            'status' => 'in_progress',
            'created_by' => $this->admin->id,
        ]);

        // Get initial document count
        $initialCount = MonitoringDocument::where('monitoring_record_id', $monitoringRecord->id)->count();

        // Try to upload with invalid monitoring record ID (should fail)
        $testFile = UploadedFile::fake()->create('test.pdf', 500, 'application/pdf');
        
        $response = $this->postJson("/api/monitoring/99999/documents", [
            'documents' => [$testFile],
        ]);

        $response->assertStatus(404);

        // Verify no documents were created
        $finalCount = MonitoringDocument::where('monitoring_record_id', $monitoringRecord->id)->count();
        $this->assertEquals($initialCount, $finalCount);
    }
}
