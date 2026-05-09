import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import type { RequestComment } from '@/types/api'

type CommentsPanelProps = {
  requestId: string | null
  requestName: string
  comments: RequestComment[]
  isLoading: boolean
  isOpen: boolean
  onToggle: () => void
  onAddComment: (bodyText: string) => void
  onDeleteComment: (id: number) => void
}

function formatCommentDate(value: string) {
  return new Date(value).toLocaleString()
}

export function CommentsPanel({
  requestId,
  requestName,
  comments,
  isLoading,
  isOpen,
  onToggle,
  onAddComment,
  onDeleteComment,
}: CommentsPanelProps) {
  const [draftComment, setDraftComment] = useState('')

  function handleAddComment() {
    if (!draftComment.trim()) {
      return
    }

    onAddComment(draftComment)
    setDraftComment('')
  }

  if (!isOpen) {
    return (
      <aside className="flex w-14 shrink-0 border-l border-border bg-card">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-col items-center justify-center gap-3 text-xs font-medium text-muted-foreground hover:bg-muted/40"
        >
          <span>{'<'}</span>
          <span className="[writing-mode:vertical-rl]">Comments</span>
          <Badge variant="outline">{comments.length}</Badge>
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-full shrink-0 border-t border-border bg-card lg:w-96 lg:border-t-0 lg:border-l">
      <Card className="h-full rounded-none border-none bg-transparent py-0 ring-0">
        <CardHeader className="border-b border-border py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Comments</CardTitle>
              <p className="text-sm text-muted-foreground">
                Notes for {requestId ? requestName || 'this request' : 'the current request'}.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onToggle}>
              Collapse
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex h-full min-h-0 flex-col gap-4 p-4">
          {!requestId && (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Save the request first to attach comments to it.
            </div>
          )}
          {requestId && (
            <>
              <div className="space-y-2">
                <Textarea
                  value={draftComment}
                  onChange={(event) => setDraftComment(event.target.value)}
                  className="min-h-24 text-sm"
                  placeholder="Add request notes, API quirks, edge cases, or reminders"
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddComment}>Add Comment</Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Comment List
                </p>
                <Badge variant="outline">{comments.length}</Badge>
              </div>
              <ScrollArea className="h-[28vh] rounded-lg border border-border bg-muted/20 lg:h-[calc(100vh-430px)]">
                <div className="space-y-3 p-3">
                  {isLoading && (
                    <p className="text-xs text-muted-foreground">Loading comments...</p>
                  )}
                  {!isLoading && comments.length === 0 && (
                    <p className="text-xs text-muted-foreground">No comments for this request yet.</p>
                  )}
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-muted-foreground">
                          {formatCommentDate(comment.createdAt)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteComment(comment.id)}
                        >
                          Delete
                        </Button>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">
                        {comment.bodyText}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}
