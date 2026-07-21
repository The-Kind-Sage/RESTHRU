'use server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createSupportTicket(formData: FormData) {
  const session = await getSession();
  if (!session?.id) return { error: 'Unauthorized' };

  const restaurantId = formData.get('restaurantId') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;
  const imageUrl = formData.get('imageUrl') as string;

  if (!subject?.trim() || !message?.trim()) {
    return { error: 'Subject and message are required' };
  }

  if (!restaurantId) return { error: 'Restaurant ID required' };

  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        restaurantId,
        userId: session.id,
        subject: subject.trim(),
        message: message.trim(),
        imageUrl: imageUrl || null,
      },
    });
    revalidatePath('/owner/settings');
    return { success: true, data: ticket };
  } catch (error) {
    console.error('Failed to create support ticket:', error);
    return { error: 'Failed to send message' };
  }
}

export async function getSupportTickets() {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: { select: { name: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    return { data: tickets };
  } catch (error) {
    console.error('Failed to fetch support tickets:', error);
    return { error: 'Failed to fetch tickets' };
  }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });
    revalidatePath('/superadmin/support');
    return { success: true };
  } catch (error) {
    console.error('Failed to update ticket status:', error);
    return { error: 'Failed to update ticket' };
  }
}
