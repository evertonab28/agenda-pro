<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use RuntimeException;

class Setting extends Model
{
    use \App\Traits\BelongsToTenant;

    protected $fillable = [
        'workspace_id',
        'key',
        'value',
    ];

    protected static function resolveWorkspaceId(): int
    {
        $workspaceId = auth()->user()?->workspace_id;

        if (!$workspaceId) {
            throw new RuntimeException(
                'Não foi possível resolver o workspace_id em Setting. Autentique um usuário ou use setForWorkspace().'
            );
        }

        return $workspaceId;
    }

    public static function get(string $key, $default = null)
    {
        $workspaceId = auth()->user()?->workspace_id;

        if (!$workspaceId) {
            return $default;
        }

        $setting = self::where('workspace_id', $workspaceId)
            ->where('key', $key)
            ->first();

        return $setting ? $setting->value : $default;
    }

    public static function set(string $key, $value)
    {
        return self::setForWorkspace(
            static::resolveWorkspaceId(),
            $key,
            $value
        );
    }

    public static function setForWorkspace(int $workspaceId, string $key, $value)
    {
        return self::updateOrCreate(
            [
                'workspace_id' => $workspaceId,
                'key' => $key,
            ],
            [
                'value' => $value,
            ]
        );
    }

    public static function getForWorkspace(int $workspaceId, string $key, $default = null)
    {
        $setting = self::where('workspace_id', $workspaceId)
            ->where('key', $key)
            ->first();

        return $setting ? $setting->value : $default;
    }
}