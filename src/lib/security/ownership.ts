import type { Prisma } from '@prisma/client'
import type prisma from '@/lib/prisma'
import { AppError, ErrorCodes } from '@/lib/error-handler'

/**
 * Write-side tenancy guards.
 *
 * Reads are scoped by userId at every call site, which stops one user seeing
 * another's data. This module covers the other half: an id the client *sends us*
 * must also belong to them. Zod validates the shape of a projectId, never its
 * owner, so without these checks an authenticated user could attach their own
 * task to somebody else's project, section or tag just by supplying that id.
 *
 * Deliberately not in a 'use server' file — every export there becomes a callable
 * endpoint, and a guard is not something to expose. Keeping it here also makes it
 * directly unit-testable, which a security control ought to be.
 */

/** Prisma client or an interactive transaction client — both expose the delegates we need. */
export type PrismaLike = typeof prisma | Prisma.TransactionClient

export interface OwnedRelations {
    projectId?: string | null
    sectionId?: string | null
    tagIds?: string[]
    /**
     * Project the task already belongs to. Used when a section is moved without
     * also supplying a project, so the section is still checked against the
     * project it will actually live under.
     */
    fallbackProjectId?: string | null
}

/**
 * Throw unless every relation id supplied by the client belongs to `userId`.
 *
 * The checks are independent, so they run concurrently — one round trip rather
 * than three. Every lookup is by primary key (`id`), so each costs one index
 * descent plus one heap fetch to test the owner column; negligible beside the
 * write it guards.
 *
 * Errors deliberately read as "not found" rather than "forbidden": confirming that
 * an id exists but belongs to someone else is itself a disclosure.
 */
export async function assertRelationsOwned(
    db: PrismaLike,
    userId: string,
    { projectId, sectionId, tagIds, fallbackProjectId }: OwnedRelations
): Promise<void> {
    const checks: Promise<void>[] = []

    if (projectId) {
        checks.push(
            db.project.count({ where: { id: projectId, userId } }).then(count => {
                if (count === 0) {
                    throw new AppError(
                        `Project ${projectId} not found for user`,
                        ErrorCodes.NOT_FOUND,
                        404,
                        'That project could not be found.'
                    )
                }
            })
        )
    }

    if (sectionId) {
        // Sections carry no userId — ownership is transitive through the project.
        // Pin the section to the project the task will end up in, otherwise a task
        // could be filed under a section its project page never renders.
        const owningProjectId = projectId !== undefined && projectId !== null ? projectId : fallbackProjectId

        checks.push(
            db.section
                .count({
                    where: {
                        id: sectionId,
                        project: {
                            userId,
                            ...(owningProjectId ? { id: owningProjectId } : {}),
                        },
                    },
                })
                .then(count => {
                    if (count === 0) {
                        throw new AppError(
                            `Section ${sectionId} not found in user's project`,
                            ErrorCodes.NOT_FOUND,
                            404,
                            'That section could not be found in this project.'
                        )
                    }
                })
        )
    }

    if (tagIds && tagIds.length > 0) {
        // Dedupe first: a caller may legitimately repeat an id, and a raw length
        // comparison would reject that as if a tag were missing.
        const uniqueTagIds = [...new Set(tagIds)]

        checks.push(
            db.tag.count({ where: { id: { in: uniqueTagIds }, userId } }).then(count => {
                if (count !== uniqueTagIds.length) {
                    throw new AppError(
                        'One or more tags not found for user',
                        ErrorCodes.NOT_FOUND,
                        404,
                        'One or more of those tags could not be found.'
                    )
                }
            })
        )
    }

    if (checks.length > 0) {
        await Promise.all(checks)
    }
}
