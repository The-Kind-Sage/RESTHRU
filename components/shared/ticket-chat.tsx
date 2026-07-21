'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, ImageIcon, X, Loader2, User, ShieldCheck, Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeTime } from '@/lib/format';
import { getTicketReplies, addTicketReply } from '@/lib/actions/support';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';

type Reply = {
  id: string;
  userId: string;
  role: string;
  message: string;
  imageUrl: string | null;
  createdAt: string | Date;
};

export function TicketChat({
  ticketId,
  currentUserId,
  currentRole,
}: {
  ticketId: string;
  currentUserId: string;
  currentRole: string;
}) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchReplies = useCallback(async () => {
    const res = await getTicketReplies(ticketId);
    if (res.data) setReplies(res.data);
  }, [ticketId]);

  useEffect(() => {
    fetchReplies();
    const interval = setInterval(fetchReplies, 5000);
    return () => clearInterval(interval);
  }, [fetchReplies]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const handleSend = async () => {
    if (!message.trim() && !imageFile) return;
    setSending(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const url = await uploadImage(imageFile, 'support');
        if (url) imageUrl = url;
      }
      const res = await addTicketReply(ticketId, message.trim(), imageUrl);
      if (res.error) {
        toast.error(res.error);
      } else {
        setMessage('');
        setImageFile(null);
        setImagePreview(null);
        await fetchReplies();
      }
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3">
          {replies.map((reply) => {
            const isOwn = reply.userId === currentUserId;
            return (
              <div key={reply.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {reply.role === 'SUPERADMIN' ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    <span className="text-[10px] font-medium opacity-70">
                      {reply.role === 'SUPERADMIN' ? 'Support' : 'You'}
                    </span>
                    <span className="text-[9px] opacity-50">{formatRelativeTime(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                  {reply.imageUrl && (
                    <a href={reply.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100">
                      <ImageIcon className="h-3 w-3" /> View attachment
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {imagePreview && (
        <div className="relative mx-4 mb-2 inline-block w-fit">
          <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-lg border object-cover" />
          <button
            onClick={() => { setImageFile(null); setImagePreview(null); }}
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="border-t border-border p-3 flex items-end gap-2">
        <label className="shrink-0 cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors">
          <Paperclip className="h-4 w-4" />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }} />
        </label>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message..."
          className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-9"
        />
        <Button size="icon" className="h-9 w-9 shrink-0" disabled={sending || (!message.trim() && !imageFile)} onClick={handleSend}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
