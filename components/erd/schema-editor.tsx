'use client';

import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { Button } from '@/components/ui/button';
import { Code2, Play, Info } from 'lucide-react';

// Define custom language for ERD DSL
const erdDsl = {
  'comment': /\/\/.*|#.*/,
  'keyword': /\btable\b|\bpk\b|\bfk\b/,
  'function': /\b(uuid|text|int|integer|boolean|timestamp|date|jsonb|varchar|serial)\b/,
  'punctuation': /[{}.]/,
  'string': {
    pattern: /\b[a-zA-Z_]\w*\b/,
    alias: 'variable'
  }
};

interface SchemaEditorProps {
  code: string;
  onChange: (code: string) => void;
  onApply: () => void;
}

export function SchemaEditor({ code, onChange, onApply }: SchemaEditorProps) {
  return (
    <div className="w-[450px] border-l bg-card flex flex-col h-full overflow-hidden shadow-2xl transition-all border-primary/10">
      <div className="p-3 border-b flex items-center justify-between bg-secondary/20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Code2 size={14} className="text-primary" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Schema IDE</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="xs" onClick={onApply} className="h-7 gap-1.5 px-3 shadow-sm bg-primary hover:bg-primary/90">
            <Play size={10} />
            Apply
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 custom-scrollbar">
        <Editor
          value={code}
          onValueChange={onChange}
          highlight={(code) => highlight(code, erdDsl, 'erd')}
          padding={10}
          style={{
            fontFamily: '"Fira Code", "Fira Mono", monospace',
            fontSize: 12,
            minHeight: '100%',
            outline: 'none',
          }}
          className="text-foreground/90 leading-relaxed"
        />
      </div>

      <div className="p-4 border-t bg-muted/30 border-primary/5">
        <div className="flex items-start gap-3 text-[10px] text-muted-foreground/70 leading-relaxed">
          <div className="p-1.5 bg-blue-500/10 rounded-full shrink-0">
            <Info size={12} className="text-blue-500" />
          </div>
          <p>
            Write <b>table roles {"{ id uuid pk }"}</b>. Use <b>fk table.col</b> for relationships. Existing table positions are preserved.
          </p>
        </div>
      </div>

      <style jsx global>{`
        /* Prism colors for custom language */
        .token.keyword { color: #cc99cd; }
        .token.function { color: #f08d49; }
        .token.punctuation { color: #ccc; }
        .token.variable { color: #7ec699; }
        .token.comment { color: #999; }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
