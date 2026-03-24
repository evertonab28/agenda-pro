<?php

namespace App\Logging;

use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

class PiiMaskingProcessor implements ProcessorInterface
{
    /**
     * Sensitive keys to mask.
     */
    protected array $maskKeys = [
        'email',
        'password',
        'document',
        'document_number',
        'phone',
        'birth_date',
        'card_number',
        'cvv',
    ];

    /**
     * Masking character.
     */
    protected string $maskChar = '*';

    public function __invoke(LogRecord $record): LogRecord
    {
        $context = $record->context;

        if (!empty($context)) {
            $record = $record->with(context: $this->maskArray($context));
        }

        return $record;
    }

    /**
     * Recursive mask function.
     */
    protected function maskArray(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->maskArray($value);
            } elseif (in_array(strtolower($key), $this->maskKeys)) {
                $data[$key] = $this->applyMask((string) $value);
            }
        }

        return $data;
    }

    /**
     * Apply masking logic.
     */
    protected function applyMask(string $value): string
    {
        $length = strlen($value);
        if ($length <= 4) {
            return str_repeat($this->maskChar, $length);
        }

        // Keep last 4 chars if long enough
        return str_repeat($this->maskChar, $length - 4) . substr($value, -4);
    }
}
