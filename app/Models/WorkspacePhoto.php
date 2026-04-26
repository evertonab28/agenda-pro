<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class WorkspacePhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'image_path',
        'sort_order',
    ];

    protected $appends = ['url'];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function getUrlAttribute()
    {
        return $this->image_path ? Storage::url($this->image_path) : null;
    }
}
