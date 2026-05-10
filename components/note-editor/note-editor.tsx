'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types/api';
import TiptapEditor from './tiptap-editor';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Delete02Icon, SaveEnergy01Icon } from '@hugeicons/core-free-icons';

interface NoteEditorProps {
  initialNote?: Note | null;
}

export default function NoteEditor({ initialNote }: NoteEditorProps) {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState<any>(() => {
    if (initialNote?.content) {
      try {
        const parsed = JSON.parse(initialNote.content);
        // Basic check if it's Tiptap format (has 'type': 'doc')
        if (parsed.type === 'doc') return parsed;
        
        // If it's old Yoopta format or empty, return default Tiptap structure
        return {
          type: 'doc',
          content: [{ type: 'paragraph' }]
        };
      } catch (e) {
        console.error('Failed to parse note content', e);
      }
    }
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }]
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = initialNote ? `/api/notes/${initialNote.id}` : '/api/notes';
      const method = initialNote ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: JSON.stringify(content),
        }),
      });

      if (!response.ok) throw new Error('Failed to save note');

      const savedNote = await response.json();
      toast.success(initialNote ? 'Note updated' : 'Note created');

      if (!initialNote) {
        router.push(`/notes/${savedNote.id}`);
      } else {
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialNote) return;
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes/${initialNote.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');

      toast.success('Note deleted');
      router.push('/notes');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/notes')} className="hover:bg-muted/50 transition-colors">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </Button>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => router.push('/notes')}>Notes</span>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{title || 'Untitled'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {initialNote && (
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 transition-colors">
              <HugeiconsIcon icon={Delete02Icon} className="size-5" />
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-sm">
            <HugeiconsIcon icon={SaveEnergy01Icon} className="size-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <div className="mb-8">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-4xl lg:text-5xl font-bold border-none bg-transparent focus-visible:ring-0 px-0 h-auto placeholder:opacity-20 transition-all mb-4"
            placeholder="Untitled"
          />
          <div className="flex items-center gap-4 text-sm text-muted-foreground/60 border-b border-border/20 pb-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-green-500/50" />
              <span>Public</span>
            </div>
            {initialNote && (
              <div className="flex items-center gap-1.5">
                <span>Last edited</span>
                <span>{new Date(initialNote.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-[60vh]">
          <TiptapEditor
            value={content}
            onChange={setContent}
            placeholder="Type '/' for commands..."
          />
        </div>
      </main>
    </div>
  );
}
