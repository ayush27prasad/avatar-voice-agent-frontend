'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { MediaTiles } from '@/components/livekit/media-tiles';
import { Button } from '@/components/ui/button';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

type ToolEventPayload = {
  tool?: string;
  status?: string;
  data?: Record<string, unknown>;
  ts?: string;
};

type CallSummaryPayload = {
  summary?: string;
  preferences?: string[];
  booked_slots?: string[];
  contact_number?: string;
  created_at?: string;
};

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
}

export const SessionView = ({
  appConfig,
  disabled,
  sessionStarted,
  ref,
}: React.ComponentProps<'div'> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const [toolEvents, setToolEvents] = useState<ToolEventPayload[]>([]);
  const [callSummary, setCallSummary] = useState<CallSummaryPayload | null>(null);
  const [showSummaryOverlay, setShowSummaryOverlay] = useState(false);
  const { messages, send } = useChatAndTranscription();
  const room = useRoomContext();

  useDebugMode({
    enabled: process.env.NODE_END !== 'production',
  });

  async function handleSendMessage(message: string) {
    await send(message);
  }

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 20_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  useEffect(() => {
    const handleToolEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail as ToolEventPayload;
      setToolEvents((prev) => [...prev, detail]);
    };
    const handleSummary = (event: Event) => {
      const detail = (event as CustomEvent).detail as CallSummaryPayload;
      setCallSummary(detail);
    };
    window.addEventListener('lk-tool-event', handleToolEvent);
    window.addEventListener('lk-call-summary', handleSummary);
    return () => {
      window.removeEventListener('lk-tool-event', handleToolEvent);
      window.removeEventListener('lk-call-summary', handleSummary);
    };
  }, []);

  // Reset state when session starts (new conversation)
  useEffect(() => {
    if (sessionStarted) {
      setToolEvents([]);
      setCallSummary(null);
      setShowSummaryOverlay(false);
      setChatOpen(false);
    }
  }, [sessionStarted]);

  // Show summary overlay when summary arrives
  useEffect(() => {
    if (callSummary) {
      // Show summary immediately when received
      setShowSummaryOverlay(true);
    }
  }, [callSummary]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  return (
    <main
      ref={ref}
      inert={disabled}
      className="flex h-svh w-full overflow-hidden"
    >
      {chatOpen ? (
        <>
          {/* Left */}
            <div className="flex w-1/2 items-center justify-center bg-background/50 p-4">
              <MediaTiles chatOpen={true} />
            </div>

          {/* Right */}
          <div className="flex w-1/2 flex-col bg-background">
            {/* Top gradient */}
            <div className="bg-background h-16 shrink-0">
              <div className="from-background absolute bottom-0 left-0 h-8 w-full translate-y-full bg-gradient-to-b to-transparent" />
            </div>

            {/* Scrollable chat area */}
            <div className="flex-1 overflow-y-auto px-4">
              <ChatMessageView className="min-h-full w-full pb-4">
                <div className="space-y-3 whitespace-pre-wrap">
                  {toolEvents.length > 0 && (
                    <section className="rounded-xl border border-border bg-card/60 p-4 shadow-sm">
                      <p className="text-sm font-semibold">Tool activity</p>
                      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {toolEvents.slice(-6).map((event, index) => (
                          <div
                            key={`${event.tool ?? 'tool'}-${event.ts ?? index}`}
                            className="flex items-start justify-between gap-2"
                          >
                            <span className="font-medium text-foreground">
                              {event.tool ?? 'tool'}
                            </span>
                            <span>{event.status ?? 'ok'}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {callSummary && (
                    <section className="rounded-xl border border-border bg-accent/30 p-4 shadow-sm">
                      <p className="text-sm font-semibold">Call summary</p>
                      {callSummary.summary && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {callSummary.summary}
                        </p>
                      )}
                      {callSummary.booked_slots && callSummary.booked_slots.length > 0 && (
                        <div className="mt-3 text-sm">
                          <p className="font-medium text-foreground">Booked appointments</p>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            {callSummary.booked_slots.map((slot) => (
                              <li key={slot}>{slot}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {callSummary.preferences && callSummary.preferences.length > 0 && (
                        <div className="mt-3 text-sm">
                          <p className="font-medium text-foreground">Preferences</p>
                          <ul className="mt-1 space-y-1 text-muted-foreground">
                            {callSummary.preferences.map((preference) => (
                              <li key={preference}>{preference}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {callSummary.contact_number && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Contact: {callSummary.contact_number}
                        </p>
                      )}
                    </section>
                  )}
                  <AnimatePresence>
                    {messages.map((message: ReceivedChatMessage) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      >
                        <ChatEntry hideName key={message.id} entry={message} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ChatMessageView>
            </div>

        {/* Bottom control bar */}
        <div className="bg-background shrink-0 px-2 pb-4 pt-2 md:px-6">
          <motion.div
            key="control-bar"
            initial={{ opacity: 0, translateY: '100%' }}
            animate={{
              opacity: sessionStarted ? 1 : 0,
              translateY: sessionStarted ? '0%' : '100%',
            }}
            transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
          >
            <div className="relative z-10 mx-auto w-full max-w-3xl">
              {appConfig.isPreConnectBufferEnabled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                    transition: {
                      ease: 'easeIn',
                      delay: messages.length > 0 ? 0 : 0.8,
                      duration: messages.length > 0 ? 0.2 : 0.5,
                    },
                  }}
                  aria-hidden={messages.length > 0}
                  className={cn(
                    'absolute inset-x-0 -top-12 text-center',
                    sessionStarted && messages.length === 0 && 'pointer-events-none'
                  )}
                >
                  <p className="animate-text-shimmer inline-block !bg-clip-text text-sm font-semibold text-transparent">
                    Agent is listening, ask it a question
                  </p>
                </motion.div>
              )}

              <AgentControlBar
                capabilities={capabilities}
                chatOpen={chatOpen}
                onChatOpenChange={setChatOpen}
                onSendMessage={handleSendMessage}
              />
            </div>
          </motion.div>
        </div>
          </div>
        </>
      ) : (
        <div className="relative flex h-full w-full flex-col items-center justify-center">
          <MediaTiles chatOpen={false} />

          {/* Bottom control bar */}
          <div className="bg-background fixed right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
            <motion.div
              key="control-bar"
              initial={{ opacity: 0, translateY: '100%' }}
              animate={{
                opacity: sessionStarted ? 1 : 0,
                translateY: sessionStarted ? '0%' : '100%',
              }}
              transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
            >
              <div className="relative z-10 mx-auto w-full max-w-4xl">
                {appConfig.isPreConnectBufferEnabled && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                      transition: {
                        ease: 'easeIn',
                        delay: messages.length > 0 ? 0 : 0.8,
                        duration: messages.length > 0 ? 0.2 : 0.5,
                      },
                    }}
                    aria-hidden={messages.length > 0}
                    className={cn(
                      'absolute inset-x-0 -top-12 text-center',
                      sessionStarted && messages.length === 0 && 'pointer-events-none'
                    )}
                  >
                    <p className="animate-text-shimmer inline-block !bg-clip-text text-sm font-semibold text-transparent">
                      Agent is listening, ask it a question
                    </p>
                  </motion.div>
                  )}

                <AgentControlBar
                  capabilities={capabilities}
                  chatOpen={chatOpen}
                  onChatOpenChange={setChatOpen}
                  onSendMessage={handleSendMessage}
                />
              </div>
              {/* gradient above control bar */}
              <div className="from-background border-background absolute top-0 left-0 h-12 w-full -translate-y-full bg-gradient-to-t to-transparent" />
            </motion.div>
          </div>
        </div>
      )}

      {/* Summary Overlay - shown after call ends */}
      {showSummaryOverlay && callSummary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-background mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border p-8 shadow-2xl"
          >
            <h2 className="mb-6 text-2xl font-bold">Call Summary</h2>
            
            {callSummary.summary && (
              <div className="mb-6">
                <h3 className="text-muted-foreground mb-2 text-sm font-semibold uppercase">Summary</h3>
                <p className="leading-relaxed">{callSummary.summary}</p>
              </div>
            )}

            {callSummary.booked_slots && callSummary.booked_slots.length > 0 && (
              <div className="mb-6">
                <h3 className="text-muted-foreground mb-2 text-sm font-semibold uppercase">
                  Booked Appointments
                </h3>
                <ul className="space-y-2">
                  {callSummary.booked_slots.map((slot) => (
                    <li key={slot} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{slot}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {callSummary.preferences && callSummary.preferences.length > 0 && (
              <div className="mb-6">
                <h3 className="text-muted-foreground mb-2 text-sm font-semibold uppercase">
                  Preferences
                </h3>
                <ul className="space-y-1">
                  {callSummary.preferences.map((preference) => (
                    <li key={preference} className="text-muted-foreground">• {preference}</li>
                  ))}
                </ul>
              </div>
            )}

            {callSummary.contact_number && (
              <div className="border-border mb-6 border-t pt-4">
                <p className="text-muted-foreground text-sm">
                  Contact: <span className="text-foreground font-medium">{callSummary.contact_number}</span>
                </p>
              </div>
            )}

            <Button
              onClick={() => {
                setShowSummaryOverlay(false);
                // Disconnect and return to welcome screen
                room.disconnect();
              }}
              className="mt-4 w-full"
              variant="primary"
              size="lg"
            >
              Close & Return to Welcome
            </Button>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
};
