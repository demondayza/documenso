import { hashSync } from '@documenso/lib/server-only/auth/hash';

import { prisma } from '..';
import { TeamMemberInviteStatus, TeamMemberRole } from '../client';
import { seedUser } from './users';

const EMAIL_DOMAIN = `test.documenso.com`;

type SeedTeamOptions = {
  createTeamMembers?: number;
  createTeamEmail?: true | string;
};

export const seedTeam = async ({
  createTeamMembers = 0,
  createTeamEmail,
}: SeedTeamOptions = {}) => {
  const teamId = `team-${Date.now()}`;

  const teamOwner = await seedUser({
    name: `${teamId}-original-owner`,
    email: `${teamId}-original-owner@${EMAIL_DOMAIN}`,
  });

  const teamEmail = createTeamEmail === true ? `${teamId}@${EMAIL_DOMAIN}` : createTeamEmail;

  const team = await prisma.team.create({
    data: {
      name: teamId,
      url: teamId,
      ownerUserId: teamOwner.id,
      members: {
        create: {
          userId: teamOwner.id,
          role: TeamMemberRole.ADMIN,
        },
      },
      teamEmail: teamEmail
        ? {
            create: {
              email: teamEmail,
              name: teamEmail,
            },
          }
        : undefined,
    },
  });

  for (let i = 0; i < createTeamMembers; i++) {
    await prisma.user.create({
      data: {
        name: `${teamId}-member-${i}`,
        email: `${teamId}-member-${i}@${EMAIL_DOMAIN}`,
        password: hashSync('password'),
        emailVerified: new Date(),
        teamMembers: {
          create: {
            teamId: team.id,
            role: TeamMemberRole.ADMIN,
          },
        },
      },
    });
  }

  return await prisma.team.findFirstOrThrow({
    where: {
      url: teamId,
    },
    include: {
      owner: true,
      members: {
        include: {
          user: true,
        },
      },
      teamEmail: true,
    },
  });
};

export const unseedTeam = async (teamUrl: string) => {
  const team = await prisma.team.findUnique({
    where: {
      url: teamUrl,
    },
    include: {
      members: true,
    },
  });

  if (!team) {
    return;
  }

  await prisma.team.delete({
    where: {
      url: teamUrl,
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: team.members.map((member) => member.userId),
      },
    },
  });
};

export const seedTeamTransfer = async (options: { newOwnerUserId: number; teamId: number }) => {
  return await prisma.teamTransferVerification.create({
    data: {
      teamId: options.teamId,
      token: Date.now().toString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      userId: options.newOwnerUserId,
      name: '',
      email: '',
    },
  });
};

export const seedTeamInvite = async ({
  email,
  teamId,
  role = TeamMemberRole.ADMIN,
}: {
  email: string;
  teamId: number;
  role?: TeamMemberRole;
}) => {
  return await prisma.teamMemberInvite.create({
    data: {
      email,
      teamId,
      role,
      status: TeamMemberInviteStatus.PENDING,
      token: Date.now().toString(),
    },
  });
};

export const seedTeamEmailVerification = async ({
  email,
  teamId,
}: {
  email: string;
  teamId: number;
}) => {
  return await prisma.teamEmailVerification.create({
    data: {
      teamId,
      email,
      name: email,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      token: Date.now().toString(),
    },
  });
};

export const unseedTeamEmailVerification = async ({ teamId }: { teamId: number }) => {
  return await prisma.teamEmailVerification.delete({
    where: {
      teamId,
    },
  });
};
