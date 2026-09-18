<?php

namespace App\Enum;

enum WorkspaceRole: string
{
    case OWNER = 'OWNER';
    case MEMBER = 'MEMBER';
}
