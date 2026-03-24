<?php

namespace Tests\Unit\Security;

use App\Logging\PiiMaskingProcessor;
use Monolog\LogRecord;
use Monolog\Level;
use PHPUnit\Framework\TestCase;

class PiiMaskingTest extends TestCase
{
    /** @test */
    public function it_masks_sensitive_data_in_log_context()
    {
        $processor = new PiiMaskingProcessor();

        $record = new LogRecord(
            datetime: new \DateTimeImmutable(),
            channel: 'test',
            level: Level::Info,
            message: 'User updated profile',
            context: [
                'email' => 'joao@example.com',
                'phone' => '11999998888',
                'document' => '12345678901',
                'safe_field' => 'visible'
            ],
            extra: []
        );

        $processedRecord = $processor($record);
        $context = $processedRecord->context;

        $this->assertEquals('************.com', $context['email']);
        $this->assertEquals('*******8888', $context['phone']);
        $this->assertEquals('*******8901', $context['document']);
        $this->assertEquals('visible', $context['safe_field']);
    }
}
