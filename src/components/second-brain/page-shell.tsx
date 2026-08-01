import { PageHeader } from './primitives'

/**
 * The frame every Second Brain section sits in.
 *
 * Thirteen routes had each repeated the same wrapper and hand-written the same
 * `<h1>` with hardcoded type values, while `PageHeader` sat in primitives used
 * by exactly one screen. That is the failure mode where the tokens exist but the
 * pages drift off them one copy-paste at a time — changing the page title size
 * meant thirteen edits, so in practice it would never have been changed.
 *
 * Horizontal padding steps down on small screens. At a flat `px-8` a 375px phone
 * gave up 64px — a sixth of the viewport — to margin.
 */
export function SecondBrainPage({
    title,
    description,
    children,
}: {
    /** Omitted by the command center, which renders its own greeting as the h1. */
    title?: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <div className="mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
            {title && (
                <div className="mb-8">
                    <PageHeader title={title} description={description} />
                </div>
            )}
            {children}
        </div>
    )
}
