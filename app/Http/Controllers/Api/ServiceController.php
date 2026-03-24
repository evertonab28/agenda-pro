<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceRequest;
use App\Models\Service;

class ServiceController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Service::class, 'service');
    }

    public function index()
{
return Service::latest()->paginate(20);
}

public function store(StoreServiceRequest $request)
{
$service = Service::create($request->validated());
return response()->json($service, 201);
}

public function show(Service $service)
{
return $service;
}

public function update(StoreServiceRequest $request, Service $service)
{
$service->update($request->validated());
return $service;
}

public function destroy(Service $service)
{
$service->delete();
return response()->noContent();
}
}