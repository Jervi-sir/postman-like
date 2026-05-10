import { getNote } from '@/lib/services';
import NoteEditor from '@/components/note-editor/note-editor';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);

  if (!note) {
    notFound();
  }

  return <NoteEditor initialNote={note} />;
}
