import { useCallback, useEffect, useState } from 'react';
import { useInstantDBConnection } from '~/lib/hooks/useInstantDBConnection';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { Dialog, DialogRoot, DialogClose, DialogTitle, DialogButton } from '~/components/ui/Dialog';
import { themeStore } from '~/lib/stores/theme';
import { useInstantDBOAuthHandler } from '~/lib/hooks/useInstantDBOAuthHandler';

export function InstantDbConnection() {
  const theme = useStore(themeStore);

  const iconSrc = theme === 'dark' ? '/icons/InstantDB.dark.svg' : '/icons/InstantDB.svg';

  const {
    connection: instantdbConn,
    connecting,
    updateToken,
    instantDBOAuthClientId,
    handleConnect,
    fetchingApps,
    isAppsExpanded,
    setIsAppsExpanded,
    handleCreateApp,
    selectApp,
    handleDisconnect,
    fetchApps,
  } = useInstantDBConnection();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [oauthConnectLoading, setOauthConnectLoading] = useState(false);

  const oauthHandler = useInstantDBOAuthHandler();

  useEffect(() => {
    const handleOpenConnectionDialog = () => {
      setIsDialogOpen(true);
    };

    document.addEventListener('open-instantdb-connection', handleOpenConnectionDialog);

    return () => {
      document.removeEventListener('open-instantdb-connection', handleOpenConnectionDialog);
    };
  }, [setIsDialogOpen]);

  const oauthConnect = useCallback(() => {
    if (!oauthHandler) {
      return;
    }

    oauthHandler
      .startClientOnlyFlow()
      .then((token) => {
        updateToken({ ...token, type: 'oauth-access-token' });
        handleConnect();
      })
      .catch((e) => console.error(e))
      .finally(() => setOauthConnectLoading(false));

    return;
  }, [instantDBOAuthClientId]);

  return (
    <div className="relative">
      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden mr-2 text-sm">
        <Button
          active
          disabled={connecting}
          onClick={() => setIsDialogOpen(!isDialogOpen)}
          className="hover:bg-bolt-elements-item-backgroundActive !text-white light:!text-black flex items-center gap-2"
        >
          <img
            className="w-4 h-4 dark:border-solid dark:border-white"
            height="20"
            width="20"
            crossOrigin="anonymous"
            src={iconSrc}
          />
          {instantdbConn.isConnected && instantdbConn.selectedApp && (
            <span className="ml-1 text-xs max-w-[100px] truncate">{instantdbConn.selectedApp.title}</span>
          )}
        </Button>
      </div>

      <DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {isDialogOpen ? (
          <Dialog className="max-w-[520px] p-6">
            {!instantdbConn.isConnected ? (
              <div className="space-y-4">
                <DialogTitle>
                  <img className="w-5 h-5" height="24" width="24" crossOrigin="anonymous" src={iconSrc} />
                  Connect to InstantDB
                </DialogTitle>
                {oauthHandler ? (
                  <Button disabled={oauthConnectLoading} onClick={oauthConnect}>
                    Connect via OAuth
                  </Button>
                ) : null}
                {!instantdbConn.token || instantdbConn.token.type === 'personal-access-token' ? (
                  <div>
                    <label className="block text-sm text-bolt-elements-textSecondary mb-2">Personal Access Token</label>
                    <input
                      type="password"
                      value={instantdbConn.token?.token || ''}
                      onChange={(e) => updateToken({ type: 'personal-access-token', token: e.target.value })}
                      disabled={connecting}
                      placeholder="Enter your InstantDB Personal access token"
                      className={classNames(
                        'w-full px-3 py-2 rounded-lg text-sm',
                        'bg-[#F8F8F8] dark:bg-[#1A1A1A]',
                        'border border-[#E5E5E5] dark:border-[#333333]',
                        'text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary',
                        'focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]',
                        'disabled:opacity-50',
                      )}
                    />
                    <div className="mt-2 text-sm text-bolt-elements-textSecondary">
                      <a
                        href="https://www.instantdb.com/dash?s=personal-access-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3ECF8E] hover:underline inline-flex items-center gap-1"
                      >
                        Get your token
                        <div className="i-ph:arrow-square-out w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-end gap-2 mt-6">
                  <DialogClose asChild>
                    <DialogButton type="secondary">Cancel</DialogButton>
                  </DialogClose>
                  <button
                    onClick={handleConnect}
                    disabled={connecting || !instantdbConn.token}
                    className={classNames(
                      'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
                      'bg-[#3ECF8E] text-white',
                      'hover:bg-[#3BBF84]',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    {connecting ? (
                      <>
                        <div className="i-ph:spinner-gap animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <div className="i-ph:plug-charging w-4 h-4" />
                        Connect
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle>
                    <img className="w-5 h-5" height="24" width="24" crossOrigin="anonymous" src={iconSrc} />
                    InstantDB Connection
                  </DialogTitle>
                </div>
                <div>
                  {fetchingApps ? (
                    <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
                      <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
                      Fetching InstantDB Apps...
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => setIsAppsExpanded(!isAppsExpanded)}
                          className="bg-transparent text-left text-sm font-medium text-bolt-elements-textPrimary flex items-center gap-2"
                        >
                          <div className="i-ph:database w-4 h-4" />
                          Your Apps ({instantdbConn.apps?.length || 0})
                          <div
                            className={classNames(
                              'i-ph:caret-down w-4 h-4 transition-transform',
                              isAppsExpanded ? 'rotate-180' : '',
                            )}
                          />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchApps(instantdbConn.token!)}
                            className="px-2 py-1 rounded-md text-xs bg-[#F0F0F0] dark:bg-[#252525] text-bolt-elements-textSecondary hover:bg-[#E5E5E5] dark:hover:bg-[#333333] flex items-center gap-1"
                            title="Refresh projects list"
                          >
                            <div className="i-ph:arrows-clockwise w-3 h-3" />
                            Refresh
                          </button>
                          <button
                            onClick={() => handleCreateApp()}
                            className="px-2 py-1 rounded-md text-xs bg-[#3ECF8E] text-white hover:bg-[#3BBF84] flex items-center gap-1"
                          >
                            <div className="i-ph:plus w-3 h-3" />
                            New InstantDB App
                          </button>
                        </div>
                      </div>

                      {isAppsExpanded && (
                        <>
                          {!instantdbConn.selectedApp && (
                            <div className="mb-2 p-3 bg-[#F8F8F8] dark:bg-[#1A1A1A] rounded-lg text-sm text-bolt-elements-textSecondary">
                              Select an InstantDB App or create a new one for this chat
                            </div>
                          )}

                          {instantdbConn.apps?.length ? (
                            <div className="grid gap-2 max-h-60 overflow-y-auto">
                              {instantdbConn.apps.map((app) => (
                                <div
                                  key={app.id}
                                  className="block p-3 rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A] hover:border-[#3ECF8E] dark:hover:border-[#3ECF8E] transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="text-sm font-medium text-bolt-elements-textPrimary flex items-center gap-1">
                                        <div className="i-ph:database w-3 h-3 text-[#3ECF8E]" />
                                        {app.title}
                                      </h5>
                                    </div>
                                    <button
                                      onClick={() => selectApp(app.id)}
                                      className={classNames(
                                        'px-3 py-1 rounded-md text-xs',
                                        instantdbConn.selectedAppId === app.id
                                          ? 'bg-[#3ECF8E] text-white'
                                          : 'bg-[#F0F0F0] dark:bg-[#252525] text-bolt-elements-textSecondary hover:bg-[#3ECF8E] hover:text-white',
                                      )}
                                    >
                                      {instantdbConn.selectedAppId === app.id ? (
                                        <span className="flex items-center gap-1">
                                          <div className="i-ph:check w-3 h-3" />
                                          Selected
                                        </span>
                                      ) : (
                                        'Select'
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-bolt-elements-textSecondary flex items-center gap-2">
                              <div className="i-ph:info w-4 h-4" />
                              No projects found
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-6">
                    <DialogClose asChild>
                      <DialogButton type="secondary">Close</DialogButton>
                    </DialogClose>
                    <DialogButton type="danger" onClick={handleDisconnect}>
                      <div className="i-ph:plugs w-4 h-4" />
                      Disconnect
                    </DialogButton>
                  </div>
                </div>
              </div>
            )}
          </Dialog>
        ) : null}
      </DialogRoot>
    </div>
  );
}

interface ButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: any;
  onClick?: VoidFunction;
  className?: string;
}

function Button({ active = false, disabled = false, children, onClick, className }: ButtonProps) {
  return (
    <button
      className={classNames(
        'flex items-center p-1.5',
        {
          'bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary':
            !active,
          'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentAccent': active && !disabled,
          'bg-bolt-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
            disabled,
        },
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
