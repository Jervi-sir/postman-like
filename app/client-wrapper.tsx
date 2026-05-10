'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/api-client/sidebar';
import { useApiClientStore } from '@/store/use-api-client-store';
import { useRouter, useParams } from 'next/navigation';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  
  const initialize = useApiClientStore((state) => state.initialize);
  const requests = useApiClientStore((state) => state.requests);
  const history = useApiClientStore((state) => state.history);
  const draft = useApiClientStore((state) => state.draft);
  const activeHistoryId = useApiClientStore((state) => state.activeHistoryId);
  const isBootstrapping = useApiClientStore((state) => state.isBootstrapping);
  const newRequest = useApiClientStore((state) => state.newRequest);
  const selectRequest = useApiClientStore((state) => state.selectRequest);
  const selectHistory = useApiClientStore((state) => state.selectHistory);
  const clearHistory = useApiClientStore((state) => state.clearHistory);
  const renameGroup = useApiClientStore((state) => state.renameGroup);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Handle navigation on sidebar clicks
  const handleSelectRequest = (id: string) => {
    selectRequest(id);
    router.push(`/requests/${id}`);
  };

  const handleNewRequest = () => {
    newRequest();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row w-full font-sans">
      <Sidebar
        requests={requests}
        history={history}
        activeRequestId={draft.id}
        activeHistoryId={activeHistoryId}
        isLoading={isBootstrapping}
        onNewRequest={handleNewRequest}
        onClearHistory={() => void clearHistory()}
        onRenameGroup={(currentName, nextName) =>
          void renameGroup(currentName, nextName)
        }
        onSelectHistory={selectHistory}
        onSelectRequest={handleSelectRequest}
        onToggleIntegrated={(id, isIntegrated) =>
          void useApiClientStore.getState().toggleIntegratedStatus(id, isIntegrated)
        }
      />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
