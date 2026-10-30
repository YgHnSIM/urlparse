import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, EyeOff, Pause, Play, TriangleAlert } from "lucide-react";
import {
  EXAMPLES,
  describe,
  firstFocus,
  hasFocus,
  highlightPieces,
  isBracketHot,
  isDelim,
  isTokenHot,
  parseUrl,
  tokenFocus,
  type Bracket,
  type Diagram,
  type FocusId,
  type Range,
  type Token,
} from "@/lib/url-diagram";

const DEFAULT = EXAMPLES[0]?.url ?? "";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function UrlStudio() {
  const [url, setUrl] = useState(DEFAULT);
  const [focus, setFocus] = useState<FocusId>("scheme");
  const [range, setRange] = useState<Range | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [masked, setMasked] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const diagram = useMemo(() => parseUrl(url), [url]);

  useEffect(() => {
    setRange(null);
    setPlaying(false);
    setCursor(0);
    setFocus((prev) => (hasFocus(diagram, prev) ? prev : firstFocus(diagram)));
  }, [diagram]);

  useEffect(() => {
    if (!playing) return;
    if (diagram.steps.length === 0) return;
    const timer = window.setInterval(() => {
      setCursor((current) => (current + 1) % diagram.steps.length);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [playing, diagram]);

  useEffect(() => {
    if (!playing) return;
    const step = diagram.steps[cursor];
    if (!step) return;
    setFocus(step.focus);
    setRange(null);
  }, [cursor, playing, diagram]);

  function pick(next: FocusId, nextRange: Range | null = null) {
    setPlaying(false);
    setFocus(next);
    setRange(nextRange);
    const index = diagram.steps.findIndex((step) => step.focus === next);
    if (index >= 0) setCursor(index);
  }

  async function copyText(key: string, value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1400);
    } catch {
      setCopied(null);
    }
  }

  const description = describe(diagram, focus);
  const activeExample = EXAMPLES.find((example) => example.url === url.trim())?.id;
  const hasPassword = diagram.tokens.some((token) => token.kind === "password");

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="h-1 bg-teal" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
        <header className="max-w-3xl">
          <p className="font-mono text-xs text-teal">RFC 3986 · WHATWG</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            URL 파싱 다이어그램
          </h1>
          <p className="mt-3 text-base text-muted">
            주소 한 줄을 스킴, 권한, 경로, 쿼리, 프래그먼트로 나눕니다. 괄호는
            적힌 문자 그대로이고, 아래쪽은 브라우저가 정규화한 값입니다.
          </p>
        </header>

        <section>
          <label htmlFor="url-input" className="text-sm font-medium">
            주소
          </label>
          <textarea
            id="url-input"
            value={url}
            rows={2}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/path?q=1#section"
            className="mt-2 w-full resize-y rounded-md border border-line bg-card px-3 py-3 font-mono text-base text-ink focus-visible:border-teal"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => {
              const on = example.id === activeExample;
              return (
                <button
                  key={example.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setUrl(example.url)}
                  className={cn(
                    "min-h-11 rounded-md border px-3 text-sm",
                    on
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-card text-ink hover:border-ink",
                  )}
                >
                  {example.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">구간</h2>
            <p className="text-xs text-muted">
              {diagram.text ? `${diagram.text.length}자` : "비어 있음"}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-4 sm:p-6">
            <SourceLine diagram={diagram} focus={focus} range={range} />
            <div className="mt-5 overflow-x-auto pb-1">
              <div className="w-max min-w-full px-3 py-2">
                <AnatomyFigure
                  diagram={diagram}
                  focus={focus}
                  masked={masked}
                  onPick={pick}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted sm:hidden">
              괄호 그림이 길면 옆으로 밀어 보세요.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">
                조각을 누르면 자르는 기준이 아래에 고정됩니다.
              </p>
              {hasPassword ? (
                <button
                  type="button"
                  onClick={() => setMasked((value) => !value)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm"
                >
                  {masked ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  {masked ? "비밀번호 보기" : "비밀번호 가리기"}
                </button>
              ) : null}
            </div>
          </div>
          {diagram.warnings.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {diagram.warnings.map((warning) => (
                <li
                  key={warning}
                  className="flex gap-2 rounded-md bg-copper-soft px-3 py-2 text-sm text-ink"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-copper" aria-hidden="true" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">자르는 순서</h2>
            <button
              type="button"
              onClick={() => {
                if (diagram.steps.length === 0) return;
                setPlaying((value) => !value);
              }}
              disabled={diagram.steps.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-teal px-3 text-sm text-teal-ink disabled:opacity-50"
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {playing ? "일시정지" : "순서대로 보기"}
            </button>
          </div>
          {diagram.steps.length === 0 ? (
            <p className="text-sm text-muted">주소가 있으면 분해 순서가 여기 나타납니다.</p>
          ) : (
            <ol className="flex flex-wrap gap-2">
              {diagram.steps.map((step, index) => {
                const on = step.focus === focus;
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => pick(step.focus)}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm",
                        on
                          ? "border-teal bg-teal text-teal-ink"
                          : "border-line bg-card text-ink hover:border-teal",
                      )}
                    >
                      <span className="font-mono text-xs">{index + 1}</span>
                      {step.title}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section
          className="rounded-lg border border-line bg-card p-4 sm:p-6"
          aria-live="polite"
        >
          <p className="font-mono text-xs text-teal">{description.kicker}</p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">{description.title}</h2>
            {description.value ? (
              <button
                type="button"
                onClick={() => copyText("detail", description.value)}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-line px-3 text-sm"
              >
                {copied === "detail" ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied === "detail" ? "복사됨" : "복사"}
              </button>
            ) : null}
          </div>
          {description.value ? (
            <p className="mt-3 font-mono text-lg break-all text-ink sm:text-xl">
              {focus === "password" && masked ? "•".repeat(description.value.length) : description.value}
            </p>
          ) : null}
          <p className="mt-4 rounded-md bg-paper px-3 py-3 text-sm text-ink">{description.rule}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{description.body}</p>
          {description.rows.length > 0 ? (
            <dl className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
              {description.rows.map((row) => (
                <div key={row.label} className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-3">
                  <dt className="text-xs text-muted">{row.label}</dt>
                  <dd className="font-mono text-sm break-all">{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>

        {diagram.segments.length > 0 || diagram.pairs.length > 0 ? (
          <section className="grid gap-6 lg:grid-cols-2">
            {diagram.segments.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold tracking-tight">경로 세그먼트</h2>
                <p className="mt-1 text-sm text-muted">
                  / 로 나뉜 조각입니다. 누르면 원문에서 그 위치만 표시합니다.
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {diagram.segments.map((segment, index) => {
                    const on =
                      range?.start === segment.start && range?.end === segment.end;
                    return (
                      <li key={`${segment.start}-${segment.raw}`}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            pick("path", { start: segment.start, end: segment.end })
                          }
                          className={cn(
                            "flex min-h-11 w-full items-baseline gap-3 rounded-md border px-3 py-2 text-left",
                            on
                              ? "border-teal bg-teal-soft"
                              : "border-line bg-card hover:border-ink",
                          )}
                        >
                          <span className="font-mono text-xs text-muted">{index + 1}</span>
                          <span className="font-mono text-sm break-all">{segment.decoded}</span>
                          {segment.decoded !== segment.raw ? (
                            <span className="ml-auto font-mono text-xs text-muted break-all">
                              {segment.raw}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {diagram.pairs.length > 0 ? (
              <div>
                <h2 className="text-lg font-semibold tracking-tight">쿼리 쌍</h2>
                <p className="mt-1 text-sm text-muted">
                  & 로 나누고, 첫 = 로 키와 값을 나눴습니다. + 는 공백으로 풀었습니다.
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {diagram.pairs.map((pair, index) => {
                    const on = range?.start === pair.start && range?.end === pair.end;
                    return (
                      <li key={`${pair.start}-${pair.keyRaw}`}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => pick("query", { start: pair.start, end: pair.end })}
                          className={cn(
                            "flex min-h-11 w-full flex-wrap items-baseline gap-x-2 rounded-md border px-3 py-2 text-left",
                            on
                              ? "border-teal bg-teal-soft"
                              : "border-line bg-card hover:border-ink",
                          )}
                        >
                          <span className="font-mono text-xs text-muted">{index + 1}</span>
                          <span className="font-mono text-sm break-all">
                            {pair.key || "(빈 키)"}
                          </span>
                          {pair.valueRaw !== null ? (
                            <>
                              <span className="text-muted">=</span>
                              <span className="font-mono text-sm break-all">
                                {pair.value ?? ""}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted">값 없음</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <BrowserPanel diagram={diagram} active={focus === "normalized"} onPick={() => pick("normalized")} />

        <details className="rounded-lg border border-line bg-card px-4 py-3 sm:px-6">
          <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-medium">
            이 괄호에 쓴 문법
          </summary>
          <p className="pb-2 text-sm leading-relaxed text-muted">
            위 다이어그램은 RFC 3986 부록 B의 정규식으로 입력 문자열을 그대로 자른 것입니다.
            브라우저의 실제 파서는 한 글자씩 상태를 바꾸며 읽고, 역슬래시·공백·비ASCII·기본
            포트를 정규화합니다. 그래서 두 결과가 다를 수 있습니다.
          </p>
          <p className="pb-4 font-mono text-xs break-all text-ink sm:text-sm">
            ^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$
          </p>
        </details>
      </main>
    </div>
  );
}

function SourceLine({
  diagram,
  focus,
  range,
}: {
  diagram: Diagram;
  focus: FocusId;
  range: Range | null;
}) {
  if (!diagram.text) {
    return <p className="text-sm text-muted">분해할 주소가 없습니다.</p>;
  }
  const pieces = highlightPieces(diagram.text, diagram.tokens, focus, range);
  return (
    <p className="font-mono text-base leading-relaxed break-all sm:text-lg">
      {pieces.map((piece, index) =>
        piece.hot ? (
          <span key={index} className="rounded-sm bg-teal px-0.5 text-teal-ink">
            {piece.text}
          </span>
        ) : (
          <span key={index}>{piece.text}</span>
        ),
      )}
    </p>
  );
}

function AnatomyFigure({
  diagram,
  focus,
  masked,
  onPick,
}: {
  diagram: Diagram;
  focus: FocusId;
  masked: boolean;
  onPick: (focus: FocusId) => void;
}) {
  const showMinor = diagram.minor.length > 0;
  const tokenRow = showMinor ? 2 : 1;
  const majorRow = showMinor ? 3 : 2;
  const count = diagram.tokens.length;

  if (count === 0) {
    return (
      <p className="text-sm text-muted">
        스킴, 권한, 경로, 쿼리, 프래그먼트 괄호가 이 자리에 그려집니다.
      </p>
    );
  }

  return (
    <div
      className="grid items-center gap-x-1"
      style={{
        gridTemplateColumns: `repeat(${count}, max-content)`,
      }}
    >
      {showMinor
        ? diagram.minor.map((bracket) => (
            <BracketButton
              key={bracket.id}
              bracket={bracket}
              row={1}
              direction="down"
              hot={isBracketHot(bracket.id, focus)}
              onPick={onPick}
            />
          ))
        : null}
      {diagram.tokens.map((token, index) => (
        <TokenButton
          key={`${token.kind}-${token.start}`}
          token={token}
          column={index + 1}
          row={tokenRow}
          hot={isTokenHot(token.kind, focus)}
          masked={masked}
          onPick={onPick}
        />
      ))}
      {diagram.major.map((bracket) => (
        <BracketButton
          key={bracket.id}
          bracket={bracket}
          row={majorRow}
          direction="up"
          hot={isBracketHot(bracket.id, focus)}
          onPick={onPick}
        />
      ))}
    </div>
  );
}

function TokenButton({
  token,
  column,
  row,
  hot,
  masked,
  onPick,
}: {
  token: Token;
  column: number;
  row: number;
  hot: boolean;
  masked: boolean;
  onPick: (focus: FocusId) => void;
}) {
  const delim = isDelim(token.kind);
  const shown =
    masked && token.kind === "password" ? "•".repeat(Math.max(token.text.length, 1)) : token.text;
  const width =
    token.kind === "host" || token.kind === "fragment" || token.kind === "query"
      ? "min-w-24"
      : delim
        ? ""
        : "min-w-16";

  return (
    <button
      type="button"
      style={{ gridColumn: column, gridRow: row }}
      onClick={() => onPick(tokenFocus(token.kind))}
      className={cn(
        "rounded-sm px-1 py-2 text-center font-mono text-lg transition-colors duration-150 sm:text-xl",
        width,
        hot ? "bg-teal text-teal-ink" : delim ? "text-muted" : "text-ink hover:bg-teal-soft",
      )}
    >
      {shown}
    </button>
  );
}

function BracketButton({
  bracket,
  row,
  direction,
  hot,
  onPick,
}: {
  bracket: Bracket;
  row: number;
  direction: "up" | "down";
  hot: boolean;
  onPick: (focus: FocusId) => void;
}) {
  const rule = hot ? "border-teal" : "border-ink";
  const label = hot ? "text-teal" : "text-muted";
  return (
    <button
      type="button"
      style={{ gridColumn: `${bracket.from + 1} / ${bracket.to + 1}`, gridRow: row }}
      onClick={() => onPick(bracket.id)}
      className="relative h-10 w-full"
      aria-label={bracket.label}
    >
      {direction === "down" ? (
        <>
          <span
            className={cn(
              "absolute inset-x-0 top-0 text-center font-sans text-xs font-medium whitespace-nowrap",
              label,
            )}
          >
            {bracket.label}
          </span>
          <span
            className={cn(
              "absolute inset-x-1 bottom-0 h-3 rounded-t-md border-t-2 border-r-2 border-l-2",
              rule,
            )}
          />
        </>
      ) : (
        <>
          <span
            className={cn(
              "absolute inset-x-1 top-0 h-3 rounded-b-md border-r-2 border-b-2 border-l-2",
              rule,
            )}
          />
          <span
            className={cn(
              "absolute inset-x-0 top-4 text-center font-sans text-xs font-medium whitespace-nowrap",
              label,
            )}
          >
            {bracket.label}
          </span>
        </>
      )}
    </button>
  );
}

function BrowserPanel({
  diagram,
  active,
  onPick,
}: {
  diagram: Diagram;
  active: boolean;
  onPick: () => void;
}) {
  const normalized = diagram.normalized;
  const fields: { label: string; hint: string; value: string }[] = normalized
    ? [
        { label: "href", hint: "정규화된 전체 주소", value: normalized.href },
        { label: "origin", hint: "스킴, 호스트, 포트", value: normalized.origin || "(불투명 출처)" },
        { label: "protocol", hint: "스킴과 콜론", value: normalized.protocol },
        { label: "username", hint: "사용자 이름", value: normalized.username },
        { label: "password", hint: "비밀번호", value: normalized.password },
        { label: "hostname", hint: "호스트. 한글 도메인은 퓨니코드", value: normalized.hostname },
        { label: "port", hint: "기본 포트면 비어 있음", value: normalized.port },
        { label: "pathname", hint: "경로", value: normalized.pathname },
        { label: "search", hint: "물음표를 포함한 쿼리", value: normalized.search },
        { label: "hash", hint: "해시를 포함한 프래그먼트", value: normalized.hash },
      ]
    : [];

  return (
    <section
      className={cn(
        "rounded-lg border bg-card p-4 sm:p-6",
        active ? "border-teal" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">브라우저가 읽는 값</h2>
          <p className="mt-1 text-sm text-muted">
            {normalized?.relative
              ? "상대 주소라 기준 https://example.com 에 붙여 계산했습니다."
              : "WHATWG URL 파서의 결과입니다. 프래그먼트는 요청에 실리지 않습니다."}
          </p>
        </div>
        <button
          type="button"
          onClick={onPick}
          className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-line px-3 text-sm"
        >
          이 단계 보기
        </button>
      </div>
      {!normalized ? (
        <p className="mt-4 text-sm text-muted">이 문자열은 브라우저 URL로 해석되지 않습니다.</p>
      ) : (
        <dl className="mt-4 divide-y divide-line">
          {fields.map((field) => (
            <div
              key={field.label}
              className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:items-baseline sm:gap-4"
            >
              <dt>
                <span className="font-mono text-xs text-teal">{field.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{field.hint}</span>
              </dt>
              <dd className={cn("font-mono text-sm break-all", field.value ? "text-ink" : "text-muted")}>
                {field.value || "—"}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
