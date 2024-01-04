import { updateSubscriptionItemQuantity } from '@documenso/ee/server-only/stripe/update-subscription-item-quantity';
import { prisma } from '@documenso/prisma';

import { IS_BILLING_ENABLED } from '../../constants/app';
import {
  TEAM_MEMBER_ROLE_PERMISSIONS_MAP,
  isTeamRoleWithinUserHierarchy,
} from '../../constants/teams';
import { AppError, AppErrorCode } from '../../errors/app-error';
import { getTeamSeatPriceId } from '../../utils/billing';

export type DeleteTeamMembersOptions = {
  /**
   * The ID of the user who is initiating this action.
   */
  userId: number;

  /**
   * The ID of the team to remove members from.
   */
  teamId: number;

  /**
   * The IDs of the team members to remove.
   */
  teamMemberIds: number[];
};

export const deleteTeamMembers = async ({
  userId,
  teamId,
  teamMemberIds,
}: DeleteTeamMembersOptions) => {
  await prisma.$transaction(async (tx) => {
    // Find the team and validate that the user is allowed to remove members.
    const team = await tx.team.findFirstOrThrow({
      where: {
        id: teamId,
        members: {
          some: {
            userId,
            role: {
              in: TEAM_MEMBER_ROLE_PERMISSIONS_MAP['MANAGE_TEAM'],
            },
          },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
          },
        },
      },
    });

    const currentTeamMember = team.members.find((member) => member.userId === userId);
    if (!currentTeamMember) {
      throw new AppError(AppErrorCode.NOT_FOUND, 'Team member does not exist');
    }

    const teamMembersToRemove = team.members.filter((member) => teamMemberIds.includes(member.id));
    if (teamMembersToRemove.find((member) => member.userId === team.ownerUserId)) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'Cannot remove the team owner');
    }

    const isMemberToRemoveHigherRole = teamMembersToRemove.some(
      (member) => !isTeamRoleWithinUserHierarchy(currentTeamMember.role, member.role),
    );

    if (isMemberToRemoveHigherRole) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, 'Cannot remove a member with a higher role');
    }

    // Remove the team members.
    await tx.teamMember.deleteMany({
      where: {
        id: {
          in: teamMemberIds,
        },
        teamId,
        userId: {
          not: team.ownerUserId,
        },
      },
    });

    if (IS_BILLING_ENABLED && team.subscriptionId) {
      const numberOfSeats = await tx.teamMember.count({
        where: {
          teamId,
        },
      });

      await updateSubscriptionItemQuantity({
        priceId: getTeamSeatPriceId(),
        subscriptionId: team.subscriptionId,
        quantity: numberOfSeats,
      });
    }
  });
};
