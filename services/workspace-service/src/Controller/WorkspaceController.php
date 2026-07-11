<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class WorkspaceController
{
    #[Route('/api/workspaces', methods: ['GET'])]
    public function index(): Response
    {
        return new Response('Workspace Service OK');
    }
}
