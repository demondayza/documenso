import { prisma } from '@documenso/prisma';
import type { Prisma } from '@documenso/prisma/client';

import { getTeamByUrl } from '../team/get-teams';

export type GetDocumentByIdOptions = {
  id: number;
  userId: number;
  teamUrl?: string;
};

export const getDocumentById = async ({ id, userId, teamUrl }: GetDocumentByIdOptions) => {
  const documentWhereInput = await getDocumentWhereInput({
    documentId: id,
    userId,
    teamUrl,
  });

  return await prisma.document.findFirstOrThrow({
    where: documentWhereInput,
    include: {
      documentData: true,
      documentMeta: true,
    },
  });
};

export type GetDocumentWhereInputOptions = {
  documentId: number;
  userId: number;
  teamUrl?: string;
};

/**
 * Generate the where input for a given Prisma document query.
 *
 * This will return a query that allows a user to get a document if they have valid access to it.
 */
export const getDocumentWhereInput = async ({
  documentId,
  userId,
  teamUrl,
}: GetDocumentWhereInputOptions) => {
  const documentWhereInput: Prisma.DocumentWhereUniqueInput = {
    id: documentId,
    OR: [
      {
        userId,
      },
    ],
  };

  if (teamUrl === undefined || !documentWhereInput.OR) {
    return documentWhereInput;
  }

  const team = await getTeamByUrl({ teamUrl, userId });

  // Allow access to team documents.
  documentWhereInput.OR.push({
    team: {
      is: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  // Allow access to documents sent to or from the team email.
  if (team.teamEmail) {
    documentWhereInput.OR.push(
      {
        Recipient: {
          some: {
            email: team.teamEmail.email,
          },
        },
      },
      {
        User: {
          email: team.teamEmail.email,
        },
      },
    );
  }

  console.log('Todo: Teams - Test');
  console.log(documentWhereInput);

  return documentWhereInput;
};
