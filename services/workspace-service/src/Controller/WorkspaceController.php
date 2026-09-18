<?php

namespace App\Controller;

use App\Entity\Workspace;
use App\Entity\WorkspaceMember;
use App\Enum\WorkspaceRole;
use App\Repository\WorkspaceMemberRepository;
use App\Repository\WorkspaceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class WorkspaceController
{
    #[Route('/api/workspaces', methods: ['GET'])]
    public function index(
        WorkspaceRepository $workspaceRepository
    ): JsonResponse
    {
        $workspaces = $workspaceRepository->findAll();

        $data = [];

        foreach ($workspaces as $workspace) {

            $data[] = [
                'id' => $workspace->getId(),
                'name' => $workspace->getName(),
                'ownerId' => $workspace->getOwnerId(),
                'createdAt' => $workspace->getCreatedAt()?->format('Y-m-d H:i:s'),
                'membersCount' => $workspace->getMembers()->count(),
            ];
        }

        return new JsonResponse($data);
    }

    #[Route('/api/workspaces', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $payload = $this->getPayload($request);
        $name = isset($payload['name']) ? trim((string) $payload['name']) : '';
        $ownerId = $payload['ownerId'] ?? null;

        if ($name === '' || !is_int($ownerId) || $ownerId < 1) {
            return $this->error('Les champs name et ownerId sont obligatoires.', 400);
        }

        $workspace = (new Workspace())
            ->setName($name)
            ->setOwnerId($ownerId);

        $ownerMembership = (new WorkspaceMember())
            ->setUserId($ownerId)
            ->setRole(WorkspaceRole::OWNER);
        $workspace->addMember($ownerMembership);

        $entityManager->persist($workspace);
        $entityManager->persist($ownerMembership);
        $entityManager->flush();

        return new JsonResponse($this->workspaceData($workspace, true), 201);
    }

    #[Route('/api/workspaces/{id}', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function show(int $id, WorkspaceRepository $workspaceRepository): JsonResponse
    {
        $workspace = $workspaceRepository->find($id);

        return $workspace
            ? new JsonResponse($this->workspaceData($workspace, true))
            : $this->error('Workspace introuvable.', 404);
    }

    #[Route('/api/workspaces/{id}/members', requirements: ['id' => '\\d+'], methods: ['GET'])]
    public function members(int $id, WorkspaceRepository $workspaceRepository): JsonResponse
    {
        $workspace = $workspaceRepository->find($id);

        return $workspace
            ? new JsonResponse($this->membersData($workspace))
            : $this->error('Workspace introuvable.', 404);
    }

    #[Route('/api/workspaces/{id}/members', requirements: ['id' => '\\d+'], methods: ['POST'])]
    public function addMember(
        int $id,
        Request $request,
        WorkspaceRepository $workspaceRepository,
        WorkspaceMemberRepository $memberRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $workspace = $workspaceRepository->find($id);
        if (!$workspace) {
            return $this->error('Workspace introuvable.', 404);
        }

        $payload = $this->getPayload($request);
        $userId = $payload['userId'] ?? null;
        if (!is_int($userId) || $userId < 1) {
            return $this->error('Le champ userId est obligatoire.', 400);
        }

        if ($memberRepository->findOneBy(['workspace' => $workspace, 'userId' => $userId])) {
            return $this->error('Cet utilisateur est déjà membre du workspace.', 409);
        }

        $member = (new WorkspaceMember())
            ->setWorkspace($workspace)
            ->setUserId($userId)
            ->setRole(WorkspaceRole::MEMBER);

        $entityManager->persist($member);
        $entityManager->flush();

        return new JsonResponse($this->memberData($member), 201);
    }

    #[Route('/api/workspaces/{id}/members/{userId}', requirements: ['id' => '\\d+', 'userId' => '\\d+'], methods: ['GET'])]
    public function membership(int $id, int $userId, WorkspaceRepository $workspaceRepository, WorkspaceMemberRepository $memberRepository): JsonResponse
    {
        $workspace = $workspaceRepository->find($id);
        if (!$workspace) {
            return $this->error('Workspace introuvable.', 404);
        }

        $member = $memberRepository->findOneBy(['workspace' => $workspace, 'userId' => $userId]);

        return new JsonResponse([
            'isMember' => $member !== null,
            'member' => $member ? $this->memberData($member) : null,
        ]);
    }

    #[Route('/api/workspaces/{id}/members/{userId}', requirements: ['id' => '\\d+', 'userId' => '\\d+'], methods: ['DELETE'])]
    public function removeMember(int $id, int $userId, WorkspaceRepository $workspaceRepository, WorkspaceMemberRepository $memberRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $workspace = $workspaceRepository->find($id);
        if (!$workspace) {
            return $this->error('Workspace introuvable.', 404);
        }

        $member = $memberRepository->findOneBy(['workspace' => $workspace, 'userId' => $userId]);
        if (!$member) {
            return $this->error('Membre introuvable.', 404);
        }

        if ($member->getRole() === WorkspaceRole::OWNER) {
            return $this->error('Le propriétaire du workspace ne peut pas être supprimé.', 422);
        }

        $entityManager->remove($member);
        $entityManager->flush();

        return new JsonResponse(null, 204);
    }

    #[Route('/api/workspaces/{id}/members/{userId}/role', requirements: ['id' => '\\d+', 'userId' => '\\d+'], methods: ['PUT'])]
    public function updateMemberRole(int $id, int $userId, Request $request, WorkspaceRepository $workspaceRepository, WorkspaceMemberRepository $memberRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $workspace = $workspaceRepository->find($id);
        if (!$workspace) {
            return $this->error('Workspace introuvable.', 404);
        }

        $member = $memberRepository->findOneBy(['workspace' => $workspace, 'userId' => $userId]);
        if (!$member) {
            return $this->error('Membre introuvable.', 404);
        }

        $role = WorkspaceRole::tryFrom((string) ($this->getPayload($request)['role'] ?? ''));
        if (!$role) {
            return $this->error('Le rôle doit être OWNER ou MEMBER.', 400);
        }

        if ($role === WorkspaceRole::MEMBER && $member->getRole() === WorkspaceRole::OWNER) {
            return $this->error('Transférez d’abord la propriété à un autre membre.', 422);
        }

        if ($role === WorkspaceRole::OWNER) {
            $currentOwner = $memberRepository->findOneBy(['workspace' => $workspace, 'role' => WorkspaceRole::OWNER]);
            if ($currentOwner && $currentOwner !== $member) {
                $currentOwner->setRole(WorkspaceRole::MEMBER);
            }
            $workspace->setOwnerId($userId);
        }

        $member->setRole($role);
        $entityManager->flush();

        return new JsonResponse($this->memberData($member));
    }

    private function getPayload(Request $request): array
    {
        $payload = json_decode($request->getContent(), true);

        return is_array($payload) ? $payload : [];
    }

    private function workspaceData(Workspace $workspace, bool $withMembers = false): array
    {
        $data = [
            'id' => $workspace->getId(),
            'name' => $workspace->getName(),
            'ownerId' => $workspace->getOwnerId(),
            'createdAt' => $workspace->getCreatedAt()?->format(DATE_ATOM),
            'membersCount' => $workspace->getMembers()->count(),
        ];

        if ($withMembers) {
            $data['members'] = $this->membersData($workspace);
        }

        return $data;
    }

    private function membersData(Workspace $workspace): array
    {
        return array_map($this->memberData(...), $workspace->getMembers()->toArray());
    }

    private function memberData(WorkspaceMember $member): array
    {
        return [
            'id' => $member->getId(),
            'userId' => $member->getUserId(),
            'role' => $member->getRole()?->value,
            'createdAt' => $member->getCreatedAt()?->format(DATE_ATOM),
        ];
    }

    private function error(string $message, int $status): JsonResponse
    {
        return new JsonResponse(['message' => $message], $status);
    }
}
