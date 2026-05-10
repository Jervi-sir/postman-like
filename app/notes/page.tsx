import { listNotes } from '@/lib/services';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Notebook01Icon } from '@hugeicons/core-free-icons';

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const notes = await listNotes();

  return (
    <div className="flex-1 overflow-auto bg-background/50 backdrop-blur-sm">
      <div className="container max-w-6xl mx-auto py-12 px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={Notebook01Icon} className="size-6" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">My Notes</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Document your APIs, architectural thoughts, and team knowledge in a Notion-like environment.
            </p>
          </div>
          <Link href="/notes/new">
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl px-6">
              <HugeiconsIcon icon={PlusSignIcon} className="size-5" />
              Create Note
            </Button>
          </Link>
        </div>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-border/60 rounded-3xl bg-muted/20 backdrop-blur-sm">
            <div className="size-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <HugeiconsIcon icon={Notebook01Icon} className="size-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Empty Library</h2>
            <p className="text-muted-foreground mb-8 text-center max-w-sm">
              You haven't created any notes yet. Start documenting your journey today.
            </p>
            <Link href="/notes/new">
              <Button variant="outline" size="lg" className="gap-2 rounded-xl">
                <HugeiconsIcon icon={PlusSignIcon} className="size-5" />
                Start Writing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {notes.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`} className="group">
                <Card className="h-full border-border/40 bg-card/40 backdrop-blur-md hover:border-primary/40 hover:bg-card/60 transition-all duration-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 cursor-pointer">
                  <div className="h-2 w-full bg-primary/10 group-hover:bg-primary/30 transition-colors" />
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {note.title || 'Untitled Note'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                      <span className="size-1.5 rounded-full bg-primary/40" />
                      <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
