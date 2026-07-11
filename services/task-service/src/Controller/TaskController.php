<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class TaskController
{
    #[Route('/api/tasks', methods: ['GET'])]
    public function index(): Response
    {
        return new Response('Task Service OK');
    }
}
