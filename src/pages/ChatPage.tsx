import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Check, FileText, Loader2, Paperclip, Plus } from 'lucide-react';
import type { BriefField, ChatMessage } from '@/types';
import { PDF_BRIEF, SEARCH_STEPS, STARTER_PROMPTS, type QuickReply } from '@/data/scenarios';
import { useStore } from '@/store/useStore';
import { getProvider } from '@/lib/ai';
import { BriefDataPanel } from '@/components/BriefDataPanel';
import { PageHeader, Section } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { cn, sleep, uid } from '@/lib/utils';

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Avatar({ role }: { role: ChatMessage['role'] }) {
  if (role === 'user') {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-pill border border-hairline bg-paper text-[10px] font-semibold">
        LB
      </span>
    );
  }
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-pill bg-ink text-[10px] font-bold text-lime">
      AI
    </span>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('rise flex gap-3', isUser && 'flex-row-reverse')}>
      <Avatar role={message.role} />
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-[14px] leading-relaxed',
          isUser ? 'bg-ink text-paper' : 'bg-surface text-ink',
        )}
      >
        {message.content}
        {message.attachmentName && (
          <span
            className={cn(
              'mt-2 flex w-fit items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px]',
              isUser ? 'border-paper/25 text-paper' : 'border-hairline bg-paper',
            )}
          >
            <FileText className="size-3" />
            {message.attachmentName}
          </span>
        )}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <Avatar role="assistant" />
      <div className="flex items-center gap-1 rounded-3xl bg-surface px-4 py-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dot size-1.5 rounded-full bg-ink"
            style={{ animationDelay: `${i * 0.14}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function SearchSequence({ step }: { step: number }) {
  return (
    <div className="rise flex gap-3">
      <Avatar role="assistant" />
      <div className="w-full max-w-[420px] rounded-3xl border border-hairline bg-paper p-4">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Catalog search
        </span>
        <ul className="mt-3 flex flex-col gap-2">
          {SEARCH_STEPS.map((label, index) => (
            <li key={label} className="flex items-center gap-2 text-[13px]">
              {index < step ? (
                <Check className="size-3.5 text-good" />
              ) : index === step ? (
                <Loader2 className="size-3.5 animate-spin text-ink" />
              ) : (
                <span className="size-3.5 rounded-full border border-hairline" />
              )}
              <span className={index <= step ? 'text-ink' : 'text-muted'}>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ChatPage() {
  const navigate = useNavigate();
  const briefs = useStore((s) => s.briefs);
  const chats = useStore((s) => s.chats);
  const askedIdsMap = useStore((s) => s.askedIds);
  const activeBriefId = useStore((s) => s.activeBriefId);
  const aiMode = useStore((s) => s.aiMode);

  const createBrief = useStore((s) => s.createBrief);
  const setActiveBrief = useStore((s) => s.setActiveBrief);
  const updateBrief = useStore((s) => s.updateBrief);
  const appendChat = useStore((s) => s.appendChat);
  const markAsked = useStore((s) => s.markAsked);
  const runMatch = useStore((s) => s.runMatch);

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [stream, setStream] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchStep, setSearchStep] = useState<number | null>(null);
  const [recentFields, setRecentFields] = useState<BriefField[]>([]);
  const [busy, setBusy] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const brief = briefs.find((b) => b.id === activeBriefId) ?? null;
  const messages = useMemo(() => (brief ? chats[brief.id] ?? [] : []), [brief, chats]);
  const provider = getProvider(aiMode);

  useEffect(() => {
    const state = useStore.getState();
    const active = state.briefs.find((b) => b.id === state.activeBriefId);
    if (active && active.status === 'draft') return;
    const draft = state.briefs.find((b) => b.status === 'draft');
    if (draft) setActiveBrief(draft.id);
    else createBrief('chat', '');
  }, [createBrief, setActiveBrief]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, stream, typing, searchStep]);

  async function streamAssistant(briefId: string, text: string) {
    if (prefersReducedMotion()) {
      appendChat(briefId, {
        id: uid('msg'),
        role: 'assistant',
        content: text,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    const tokens = text.split(/(\s+)/);
    let acc = '';
    setStream('');
    for (const token of tokens) {
      acc += token;
      setStream(acc);
      await sleep(14 + Math.random() * 20);
    }
    setStream(null);
    appendChat(briefId, {
      id: uid('msg'),
      role: 'assistant',
      content: text,
      timestamp: new Date().toISOString(),
    });
  }

  async function runSearch(briefId: string) {
    updateBrief(briefId, { status: 'matching' });
    for (let step = 0; step < SEARCH_STEPS.length; step += 1) {
      setSearchStep(step);
      await sleep(prefersReducedMotion() ? 60 : 520);
    }
    setSearchStep(null);
    runMatch(briefId);
    await sleep(200);
    navigate(`/results/${briefId}`);
  }

  async function send(text: string, options: { display?: string; attachmentName?: string } = {}) {
    if (!brief || busy) return;
    setBusy(true);
    setQuickReplies([]);
    setSelected([]);

    // Chips send a machine-readable value but the transcript shows their label.
    appendChat(brief.id, {
      id: uid('msg'),
      role: 'user',
      content: options.display ?? text.replace('__skip__', 'No preference'),
      timestamp: new Date().toISOString(),
      attachmentName: options.attachmentName,
    });
    if (!brief.raw) updateBrief(brief.id, { raw: text });

    setTyping(true);
    await sleep(600 + Math.random() * 500);

    const current = useStore.getState().briefs.find((b) => b.id === brief.id)!;
    const result = await provider.chatTurn({
      brief: current,
      userText: text,
      askedIds: askedIdsMap[brief.id] ?? [],
      history: useStore.getState().chats[brief.id] ?? [],
    });
    setTyping(false);

    const patchFields = Object.keys(result.patch) as BriefField[];
    if (patchFields.length) {
      updateBrief(brief.id, result.patch);
      setRecentFields(patchFields);
      setTimeout(() => setRecentFields([]), 1600);
    }
    if (result.askedQuestionId) markAsked(brief.id, result.askedQuestionId);

    await streamAssistant(brief.id, result.reply);

    setQuickReplies(result.quickReplies);
    setMultiSelect(result.multiSelect);
    setBusy(false);

    if (result.ready) await runSearch(brief.id);
  }

  async function handleUpload() {
    if (!brief || busy) return;
    setBusy(true);
    setQuickReplies([]);
    appendChat(brief.id, {
      id: uid('msg'),
      role: 'user',
      content: 'Please take the specification from this RFQ.',
      timestamp: new Date().toISOString(),
      attachmentName: PDF_BRIEF.fileName,
    });

    setTyping(true);
    await sleep(1100);
    setTyping(false);

    updateBrief(brief.id, {
      ...PDF_BRIEF.patch,
      raw: PDF_BRIEF.raw,
      inputMethod: 'pdf',
      confidence: PDF_BRIEF.confidence,
    });
    setRecentFields(Object.keys(PDF_BRIEF.patch) as BriefField[]);
    setTimeout(() => setRecentFields([]), 2200);

    await streamAssistant(
      brief.id,
      `Analysed ${PDF_BRIEF.fileName} — 3 pages, one specification table. I extracted 10 fields; every field carries an extraction confidence in the panel.\n\nLabel type is only 71% certain because the document says "own brand" instead of naming private label explicitly. Everything else is unambiguous, so I am searching the catalog now…`,
    );
    setBusy(false);
    await runSearch(brief.id);
  }

  function startNewBrief() {
    const id = createBrief('chat', '');
    setActiveBrief(id);
    setQuickReplies([]);
    setSelected([]);
    setStream(null);
  }

  const showStarters = messages.length === 0 && !typing && !stream;

  return (
    <Section>
      <PageHeader
        index="01 / Briefing"
        title="AI briefing"
        description="Describe the product in your own words or upload an RFQ. The assistant asks back only what is missing and turns the conversation into a structured brief."
        actions={
          <Button variant="outline" onClick={startNewBrief}>
            <Plus /> New brief
          </Button>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-h-[560px] flex-col rounded-card border border-hairline bg-paper">
          <div
            ref={scrollRef}
            className="scrollbar-thin flex-1 overflow-y-auto p-5 lg:p-6"
            style={{ maxHeight: 'calc(100vh - 320px)' }}
          >
            {showStarters && (
              <div className="rise flex flex-col gap-4">
                <div className="flex gap-3">
                  <Avatar role="assistant" />
                  <div className="max-w-[85%] rounded-3xl bg-surface px-4 py-3 text-[14px] leading-relaxed">
                    Good afternoon, Ms Brandt. Which product would you like to develop? A sentence is
                    enough — I will ask for the rest.
                  </div>
                </div>
                <div className="ml-10 flex max-w-2xl flex-col">
                  <span className="mb-1 text-[11px] uppercase tracking-[0.14em] text-muted">
                    Start
                  </span>
                  {STARTER_PROMPTS.map((starter, index) => (
                    <button
                      key={starter.label}
                      type="button"
                      onClick={() => void send(starter.value)}
                      className="flex items-baseline gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface"
                    >
                      <span className="num text-[11px] text-muted">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 text-[14px]">{starter.label}</span>
                      <span className="text-[11px] text-muted">{starter.hint}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => void handleUpload()}
                    className="flex items-baseline gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface"
                  >
                    <span className="num text-[11px] text-muted">04</span>
                    <span className="flex flex-1 items-center gap-2 text-[14px]">
                      <Paperclip className="size-3.5" /> Upload an RFQ (PDF)
                    </span>
                    <span className="text-[11px] text-muted">Scenario D — one-shot extraction</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <Bubble key={message.id} message={message} />
              ))}

              {typing && <TypingBubble />}

              {stream !== null && (
                <div className="flex gap-3">
                  <Avatar role="assistant" />
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-surface px-4 py-3 text-[14px] leading-relaxed">
                    {stream}
                    <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-ink" />
                  </div>
                </div>
              )}

              {searchStep !== null && <SearchSequence step={searchStep} />}
            </div>
          </div>

          <div className="border-t border-hairline p-4 lg:p-5">
            {quickReplies.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {quickReplies.map((reply) => {
                  const isSelected = selected.includes(reply.value);
                  return (
                    <button
                      key={reply.label}
                      type="button"
                      onClick={() => {
                        if (!multiSelect) {
                          void send(reply.value, { display: reply.label });
                          return;
                        }
                        if (reply.value === '__skip__') {
                          void send('__skip__', { display: reply.label });
                          return;
                        }
                        setSelected((prev) =>
                          prev.includes(reply.value)
                            ? prev.filter((v) => v !== reply.value)
                            : [...prev, reply.value],
                        );
                      }}
                      className={cn(
                        'rounded-pill border px-3.5 py-1.5 text-[13px] transition-colors',
                        isSelected
                          ? 'border-ink bg-ink text-paper'
                          : 'border-hairline hover:border-ink/30 hover:bg-surface',
                      )}
                    >
                      {reply.label}
                    </button>
                  );
                })}
                {multiSelect && selected.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() =>
                      void send(selected.join(', '), {
                        display: quickReplies
                          .filter((r) => selected.includes(r.value))
                          .map((r) => r.label)
                          .join(', '),
                      })
                    }
                  >
                    Confirm ({selected.length})
                  </Button>
                )}
              </div>
            )}

            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const text = input.trim();
                if (!text) return;
                setInput('');
                void send(text);
              }}
            >
              <input ref={fileInputRef} type="file" className="hidden" onChange={() => void handleUpload()} />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Upload RFQ"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip />
              </Button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. I need a cream for the nose, 100 ml, vegan…"
                disabled={busy}
                className="h-11 flex-1 rounded-pill border border-hairline bg-paper px-4 text-sm placeholder:text-muted focus-visible:border-ink focus-visible:outline-none disabled:opacity-60"
              />
              <Button type="submit" size="icon" disabled={busy || !input.trim()} title="Send">
                <ArrowUp />
              </Button>
            </form>
          </div>
        </div>

        {brief && (
          <BriefDataPanel
            brief={brief}
            recentFields={recentFields}
            className="h-fit lg:sticky lg:top-20"
          />
        )}
      </div>
    </Section>
  );
}
