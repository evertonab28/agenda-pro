<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'messaging' => [
        'evolution' => [
            'url' => env('EVOLUTION_API_URL', 'http://evolution-api:8080'),
        ],
        // Default genérico apenas para testes limitados ou fallback de admin
        'webhook_secret' => env('MESSAGING_WEBHOOK_SECRET'),
    ],

    'payment' => [
        'asaas' => [
            'url' => env('ASAAS_API_URL', 'https://sandbox.asaas.com/api/v3'),
            'key' => env('ASAAS_API_KEY'),
            'webhook_token' => env('ASAAS_SAAS_WEBHOOK_TOKEN'),
        ],
    ],

];
