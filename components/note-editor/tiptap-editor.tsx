'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  CodeIcon,
  Link01Icon,
  BulletIcon,
  Task01Icon,
  QuoteUpIcon,
  ListPlusIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
}

export default function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] text-lg lg:text-xl leading-relaxed',
      },
    },
  });

  // Update content when value prop changes (e.g. on load)
  useEffect(() => {
    if (editor && value && JSON.stringify(value) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full">
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ state, from, to }) => {
            return from !== to && !state.selection.empty;
          }}
          // @ts-ignore
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 p-1 bg-popover border border-border rounded-lg shadow-xl backdrop-blur-md z-50"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn('size-8 p-0', editor.isActive('bold') && 'bg-accent text-accent-foreground')}
          >
            <HugeiconsIcon icon={TextBoldIcon} className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn('size-8 p-0', editor.isActive('italic') && 'bg-accent text-accent-foreground')}
          >
            <HugeiconsIcon icon={TextItalicIcon} className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn('size-8 p-0', editor.isActive('underline') && 'bg-accent text-accent-foreground')}
          >
            <HugeiconsIcon icon={TextUnderlineIcon} className="size-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn('size-8 p-0', editor.isActive('code') && 'bg-accent text-accent-foreground')}
          >
            <HugeiconsIcon icon={CodeIcon} className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const url = window.prompt('URL');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={cn('size-8 p-0', editor.isActive('link') && 'bg-accent text-accent-foreground')}
          >
            <HugeiconsIcon icon={Link01Icon} className="size-4" />
          </Button>
        </BubbleMenu>
      )}

      {editor && (
        <FloatingMenu
          editor={editor}
          shouldShow={({ state }) => {
            const { selection } = state;
            const { $from } = selection;
            return selection.empty && $from.parent.content.size === 0 && $from.parent.type.name === 'paragraph';
          }}
          // @ts-ignore
          tippyOptions={{ duration: 100 }}
          className="flex flex-col gap-1 p-1 bg-popover border border-border rounded-xl shadow-2xl min-w-[200px] overflow-hidden z-50 animate-in fade-in zoom-in duration-200"
        >
          <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Blocks
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="justify-start gap-2 h-9 px-2 text-xs"
          >
            <div className="size-6 rounded bg-primary/10 flex items-center justify-center text-primary">
              <span className="font-bold">H1</span>
            </div>
            Heading 1
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="justify-start gap-2 h-9 px-2 text-xs"
          >
            <div className="size-6 rounded bg-primary/10 flex items-center justify-center text-primary">
              <span className="font-bold">H2</span>
            </div>
            Heading 2
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="justify-start gap-2 h-9 px-2 text-xs"
          >
            <HugeiconsIcon icon={BulletIcon} className="size-4 text-muted-foreground" />
            Bulleted List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="justify-start gap-2 h-9 px-2 text-xs"
          >
            <HugeiconsIcon icon={ListPlusIcon} className="size-4 text-muted-foreground" />
            Numbered List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className="justify-start gap-2 h-9 px-2 text-xs"
          >
            <HugeiconsIcon icon={Task01Icon} className="size-4 text-muted-foreground" />
            Task List
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className="justify-start gap-2 h-9 px-2 text-xs"
          >
            <HugeiconsIcon icon={CodeIcon} className="size-4 text-muted-foreground" />
            Code Block
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="justify-start gap-2 h-9 px-2 text-xs"
          >
            <HugeiconsIcon icon={QuoteUpIcon} className="size-4 text-muted-foreground" />
            Quote
          </Button>
        </FloatingMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
