
import { updateTask, createTask, getTaskById } from '@/lib/actions/tasks';
import { createTag } from '@/lib/actions/tags';
import prisma from '@/lib/prisma';

async function verifyPersistence() {
    console.log('Starting persistence verification...');

    // 1. Create a dummy tag
    console.log('Creating test tag...');
    const tagResult = await createTag({ name: 'PersistenceTest-' + Date.now(), color: 'blue' });
    if (!tagResult.success || !tagResult.data) {
        console.error('Failed to create tag:', tagResult);
        return;
    }
    const tag = tagResult.data;
    console.log('Tag created:', tag.id, tag.name);

    // 2. Create a dummy task
    console.log('Creating test task...');
    const taskResult = await createTask({ title: 'Test Task Persistence' });
    if (!taskResult.success || !taskResult.data) {
        console.error('Failed to create task:', taskResult);
        return;
    }
    const task = taskResult.data;
    console.log('Task created:', task.id);

    // 3. Update task with tag
    console.log('Updating task with tag...');
    const updateResult = await updateTask({
        id: task.id,
        tagIds: [tag.id]
    });

    if (!updateResult.success) {
        console.error('Failed to update task:', updateResult);
        return;
    }
    console.log('Task updated successfully.');

    // 4. Verification
    console.log('Fetching task fresh from DB...');
    // Traverse relations manually to be sure or use getTaskById
    const freshTask = await prisma.task.findUnique({
        where: { id: task.id },
        include: {
            tags: {
                include: { tag: true }
            }
        }
    });

    if (!freshTask) {
        console.error('Task not found in DB!');
        return;
    }

    console.log('Fresh task tags:', JSON.stringify(freshTask.tags, null, 2));

    const hasTag = freshTask.tags.some(t => t.tagId === tag.id);
    if (hasTag) {
        console.log('SUCCESS: Tag persisted correctly.');
    } else {
        console.error('FAILURE: Tag did NOT persist.');
    }

    // Cleanup
    console.log('Cleaning up...');
    await prisma.task.delete({ where: { id: task.id } });
    await prisma.tag.delete({ where: { id: tag.id } });
}

verifyPersistence().catch(e => console.error(e));
