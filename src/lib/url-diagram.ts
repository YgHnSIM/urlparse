export type TokenKind =
  | "scheme"
  | "schemeColon"
  | "slashes"
  | "username"
  | "passwordColon"
  | "password"
  | "at"
  | "host"
  | "portColon"
  | "port"
  | "path"
  | "question"
  | "query"
  | "hash"
  | "fragment";

export type FocusId =
  | "scheme"
  | "authority"
  | "username"
  | "password"
  | "host"
  | "port"
  | "path"
  | "query"
  | "fragment"
  | "normalized";

export type Token = {
  kind: TokenKind;
  text: string;
  start: number;
  end: number;
};

export type Bracket = {
  id: FocusId;
  label: string;
  from: number;
  to: number;
};

export type QueryPair = {
  keyRaw: string;
  valueRaw: string | null;
  key: string;
  value: string | null;
  start: number;
  end: number;
  broken: boolean;
};

export type PathSegment = {
  raw: string;
  decoded: string;
  start: number;
  end: number;
  broken: boolean;
};

export type Normalized = {
  href: string;
  origin: string;
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  relative: boolean;
};

export type Step = {
  id: string;
  focus: FocusId;
  title: string;
};

export type Diagram = {
  raw: string;
  text: string;
  clipped: boolean;
  tokens: Token[];
  minor: Bracket[];
  major: Bracket[];
  pairs: QueryPair[];
  segments: PathSegment[];
  warnings: string[];
  normalized: Normalized | null;
  steps: Step[];
};

export type Range = { start: number; end: number };

export type Description = {
  kicker: string;
  title: string;
  value: string;
  rule: string;
  body: string;
  rows: { label: string; value: string }[];
};

const MAX_LEN = 8000;
const BASE = "https://example.com";

const RFC3986 =
  /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/;

export const DEFAULT_URL =
  "https://ada:secret@api.example.com:8443/v1/users?lang=ko&page=2#profile";

export const EXAMPLES: { id: string; label: string; url: string }[] = [
  { id: "full", label: "전체 구성", url: DEFAULT_URL },
  {
    id: "docs",
    label: "문서",
    url: "https://docs.example.com/guide/install?lang=ko&page=2#steps",
  },
  {
    id: "kr",
    label: "한글 도메인",
    url: "https://한글.한국/경로/문서?이름=값&q=검색어#섹션",
  },
  {
    id: "ipv6",
    label: "IPv6",
    url: "https://[2001:db8::1]:8080/index.html?x=1",
  },
  {
    id: "enc",
    label: "인코딩",
    url: "https://cdn.example.com/img/my%20photo.png?w=400&fmt=webp",
  },
  {
    id: "mail",
    label: "mailto",
    url: "mailto:hello@example.com?subject=Hello%20there",
  },
  { id: "rel", label: "상대 경로", url: "/docs/install?lang=ko#step" },
  { id: "norm", label: "정규화", url: "HTTPS://Example.COM:443/docs" },
];

const DELIMS = new Set<TokenKind>([
  "schemeColon",
  "slashes",
  "passwordColon",
  "at",
  "portColon",
  "question",
  "hash",
]);

export function isDelim(kind: TokenKind): boolean {
  return DELIMS.has(kind);
}

export function tokenFocus(kind: TokenKind): FocusId {
  switch (kind) {
    case "scheme":
    case "schemeColon":
      return "scheme";
    case "slashes":
    case "at":
      return "authority";
    case "username":
      return "username";
    case "password":
    case "passwordColon":
      return "password";
    case "host":
      return "host";
    case "port":
    case "portColon":
      return "port";
    case "path":
      return "path";
    case "question":
    case "query":
      return "query";
    case "hash":
    case "fragment":
      return "fragment";
  }
}

const AUTHORITY_FOCUS: FocusId[] = [
  "authority",
  "username",
  "password",
  "host",
  "port",
];

export function isTokenHot(kind: TokenKind, focus: FocusId): boolean {
  if (focus === "normalized") return false;
  const own = tokenFocus(kind);
  if (own === focus) return true;
  return focus === "authority" && AUTHORITY_FOCUS.includes(own);
}

export function isBracketHot(id: FocusId, focus: FocusId): boolean {
  if (id === focus) return true;
  return (
    id === "authority" &&
    (focus === "username" ||
      focus === "password" ||
      focus === "host" ||
      focus === "port")
  );
}

export function hasFocus(diagram: Diagram, focus: FocusId): boolean {
  if (focus === "normalized") return diagram.normalized !== null;
  if (focus === "authority") return diagram.major.some((b) => b.id === "authority");
  return (
    diagram.tokens.some((t) => tokenFocus(t.kind) === focus) ||
    diagram.major.some((b) => b.id === focus)
  );
}

const FOCUS_ORDER: FocusId[] = [
  "scheme",
  "authority",
  "host",
  "path",
  "query",
  "fragment",
  "username",
  "port",
  "password",
];

export function firstFocus(diagram: Diagram): FocusId {
  for (const id of FOCUS_ORDER) {
    if (hasFocus(diagram, id)) return id;
  }
  return diagram.normalized ? "normalized" : "scheme";
}

function decodePercent(input: string): { text: string; ok: boolean } {
  try {
    return { text: decodeURIComponent(input), ok: true };
  } catch {
    return { text: input, ok: false };
  }
}

function decodeForm(input: string): { text: string; ok: boolean } {
  try {
    return { text: decodeURIComponent(input.replace(/\+/g, " ")), ok: true };
  } catch {
    return { text: input, ok: false };
  }
}

function readNormalized(input: string): Normalized | null {
  if (!input) return null;
  const pack = (url: URL, relative: boolean): Normalized => ({
    href: url.href,
    origin: url.origin === "null" ? "" : url.origin,
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    relative,
  });
  try {
    return pack(new URL(input), false);
  } catch {
    try {
      return pack(new URL(input, BASE), true);
    } catch {
      return null;
    }
  }
}

function findKinds(
  tokens: Token[],
  kinds: TokenKind[],
): { from: number; to: number } | null {
  let from = -1;
  let to = -1;
  tokens.forEach((token, index) => {
    if (!kinds.includes(token.kind)) return;
    if (from < 0) from = index;
    to = index + 1;
  });
  return from < 0 ? null : { from, to };
}

export function parseUrl(rawInput: string): Diagram {
  const raw = rawInput ?? "";
  const clipped = raw.trim().length > MAX_LEN;
  const text = raw.trim().slice(0, MAX_LEN);
  const warnings: string[] = [];
  const tokens: Token[] = [];

  if (raw !== raw.trim()) {
    warnings.push("앞뒤 공백은 빼고 분해했습니다.");
  }
  if (clipped) {
    warnings.push("너무 길어서 앞 8000자만 분해했습니다.");
  }
  if (/\s/.test(text)) {
    warnings.push("주소 한가운데 공백이 있습니다. 공백은 %20으로 적어야 합니다.");
  }
  if (text.includes("\\")) {
    warnings.push(
      "역슬래시가 있습니다. 브라우저(WHATWG)는 특수 스킴에서 \\ 를 / 로 바꿉니다.",
    );
  }

  let pos = 0;
  const consume = (kind: TokenKind, value: string) => {
    if (!value) return;
    tokens.push({ kind, text: value, start: pos, end: pos + value.length });
    pos += value.length;
  };

  const match = RFC3986.exec(text);
  if (match && text) {
    const scheme = match[2];
    if (match[1] && scheme) {
      consume("scheme", scheme);
      consume("schemeColon", ":");
      if (!/^[A-Za-z][A-Za-z0-9+.-]*$/.test(scheme)) {
        warnings.push(
          "스킴은 글자로 시작하고 글자, 숫자, +, -, . 만 쓸 수 있습니다.",
        );
      }
    }
    if (match[3]) {
      consume("slashes", "//");
      consumeAuthority(match[4] ?? "", consume);
    }
    consume("path", match[5] ?? "");
    if (match[6] !== undefined) {
      consume("question", "?");
      consume("query", match[7] ?? "");
    }
    if (match[8] !== undefined) {
      consume("hash", "#");
      consume("fragment", match[9] ?? "");
    }
  }

  if (pos !== text.length && text) {
    tokens.length = 0;
    tokens.push({ kind: "path", text, start: 0, end: text.length });
    warnings.push("이 문자열은 표준 URL 문법으로 끝까지 나누지 못했습니다.");
  }

  const minor: Bracket[] = [];
  const pushMinor = (id: FocusId, label: string, kinds: TokenKind[]) => {
    const span = findKinds(tokens, kinds);
    if (span) minor.push({ id, label, ...span });
  };
  const hasAuthorityDetail = tokens.some((t) =>
    ["username", "password", "host", "port"].includes(t.kind),
  );
  if (hasAuthorityDetail) {
    pushMinor("username", "사용자", ["username"]);
    pushMinor("password", "비밀번호", ["password"]);
    pushMinor("host", "호스트", ["host"]);
    pushMinor("port", "포트", ["port"]);
  }

  const major: Bracket[] = [];
  const pushMajor = (id: FocusId, label: string, kinds: TokenKind[]) => {
    const span = findKinds(tokens, kinds);
    if (span) major.push({ id, label, ...span });
  };
  pushMajor("scheme", "스킴", ["scheme", "schemeColon"]);
  pushMajor("authority", "권한", [
    "slashes",
    "username",
    "passwordColon",
    "password",
    "at",
    "host",
    "portColon",
    "port",
  ]);
  pushMajor("path", "경로", ["path"]);
  pushMajor("query", "쿼리", ["question", "query"]);
  pushMajor("fragment", "프래그먼트", ["hash", "fragment"]);

  const queryToken = tokens.find((t) => t.kind === "query");
  const pairs = queryToken ? parsePairs(queryToken) : [];
  if (pairs.some((pair) => pair.broken)) {
    warnings.push("쿼리에 잘못된 퍼센트 인코딩이 있습니다.");
  }

  const pathToken = tokens.find((t) => t.kind === "path");
  const segments = pathToken ? parseSegments(pathToken) : [];
  if (segments.some((segment) => segment.broken)) {
    warnings.push("경로에 잘못된 퍼센트 인코딩이 있습니다.");
  }

  const password = tokens.find((t) => t.kind === "password");
  if (password) {
    warnings.push(
      "비밀번호가 주소에 들어 있습니다. 기록과 로그에 남을 수 있어 실제 서비스에서는 피합니다.",
    );
  }

  const port = tokens.find((t) => t.kind === "port");
  if (port && !/^\d+$/.test(port.text)) {
    warnings.push("포트는 0부터 65535까지의 숫자여야 합니다.");
  } else if (port && Number(port.text) > 65535) {
    warnings.push("포트 번호가 65535를 넘습니다.");
  } else if (tokens.some((t) => t.kind === "portColon") && !port) {
    warnings.push("포트 구분 콜론은 있는데 번호가 비어 있습니다.");
  }

  const hasSlashes = tokens.some((t) => t.kind === "slashes");
  const host = tokens.find((t) => t.kind === "host");
  if (hasSlashes && !host) {
    warnings.push("권한 구간에 호스트가 없습니다.");
  }
  if (host?.text.startsWith("[") && !host.text.endsWith("]")) {
    warnings.push("IPv6 대괄호가 닫히지 않았습니다.");
  }

  const normalized = readNormalized(text);
  const steps = buildSteps(tokens, normalized);

  return {
    raw,
    text,
    clipped,
    tokens,
    minor,
    major,
    pairs,
    segments,
    warnings,
    normalized,
    steps,
  };
}

function consumeAuthority(
  auth: string,
  consume: (kind: TokenKind, value: string) => void,
) {
  if (!auth) return;
  const at = auth.lastIndexOf("@");
  let hostport = auth;
  if (at >= 0) {
    const userinfo = auth.slice(0, at);
    const colon = userinfo.indexOf(":");
    if (colon >= 0) {
      consume("username", userinfo.slice(0, colon));
      consume("passwordColon", ":");
      consume("password", userinfo.slice(colon + 1));
    } else {
      consume("username", userinfo);
    }
    consume("at", "@");
    hostport = auth.slice(at + 1);
  }

  if (hostport.startsWith("[")) {
    const end = hostport.indexOf("]");
    if (end === -1) {
      consume("host", hostport);
      return;
    }
    consume("host", hostport.slice(0, end + 1));
    const rest = hostport.slice(end + 1);
    if (rest.startsWith(":")) {
      consume("portColon", ":");
      consume("port", rest.slice(1));
    } else if (rest) {
      consume("host", rest);
    }
    return;
  }

  const colon = hostport.indexOf(":");
  if (colon >= 0) {
    consume("host", hostport.slice(0, colon));
    consume("portColon", ":");
    consume("port", hostport.slice(colon + 1));
    return;
  }
  consume("host", hostport);
}

function parsePairs(token: Token): QueryPair[] {
  if (!token.text) return [];
  const parts = token.text.split("&");
  const pairs: QueryPair[] = [];
  let cursor = token.start;
  for (const part of parts) {
    const start = cursor;
    const end = cursor + part.length;
    cursor = end + 1;
    const eq = part.indexOf("=");
    const keyRaw = eq === -1 ? part : part.slice(0, eq);
    const valueRaw = eq === -1 ? null : part.slice(eq + 1);
    const keyDec = decodeForm(keyRaw);
    const valueDec = valueRaw === null ? null : decodeForm(valueRaw);
    pairs.push({
      keyRaw,
      valueRaw,
      key: keyDec.text,
      value: valueDec?.text ?? null,
      start,
      end,
      broken: !keyDec.ok || valueDec?.ok === false,
    });
  }
  return pairs;
}

function parseSegments(token: Token): PathSegment[] {
  if (!token.text) return [];
  const parts = token.text.split("/");
  const segments: PathSegment[] = [];
  let cursor = token.start;
  parts.forEach((part, index) => {
    const start = cursor;
    const end = cursor + part.length;
    cursor = end + (index < parts.length - 1 ? 1 : 0);
    if (!part) return;
    const decoded = decodePercent(part);
    segments.push({
      raw: part,
      decoded: decoded.text,
      start,
      end,
      broken: !decoded.ok,
    });
  });
  return segments;
}

function buildSteps(tokens: Token[], normalized: Normalized | null): Step[] {
  const has = (kind: TokenKind) => tokens.some((token) => token.kind === kind);
  const steps: Step[] = [];
  const push = (id: string, focus: FocusId, title: string, ok: boolean) => {
    if (ok) steps.push({ id, focus, title });
  };
  push("scheme", "scheme", "스킴", has("scheme"));
  push("authority", "authority", "권한", has("slashes") || has("host") || has("at"));
  push("username", "username", "사용자", has("username"));
  push("password", "password", "비밀번호", has("password"));
  push("host", "host", "호스트", has("host"));
  push("port", "port", "포트", has("port"));
  push("path", "path", "경로", has("path"));
  push("query", "query", "쿼리", has("question"));
  push("fragment", "fragment", "프래그먼트", has("hash"));
  push("normalized", "normalized", "정규화", normalized !== null);
  return steps;
}

function tokenText(tokens: Token[], kind: TokenKind): string {
  return tokens.find((token) => token.kind === kind)?.text ?? "";
}

function sliceText(tokens: Token[], kinds: TokenKind[]): string {
  return tokens
    .filter((token) => kinds.includes(token.kind))
    .map((token) => token.text)
    .join("");
}

export function describe(diagram: Diagram, focus: FocusId): Description {
  const { tokens, normalized, text } = diagram;
  const scheme = tokenText(tokens, "scheme");
  const host = tokenText(tokens, "host");
  const port = tokenText(tokens, "port");
  const path = tokenText(tokens, "path");
  const query = tokenText(tokens, "query");
  const fragment = tokenText(tokens, "fragment");
  const username = tokenText(tokens, "username");
  const password = tokenText(tokens, "password");

  if (!text) {
    return {
      kicker: "대기",
      title: "주소를 입력하세요",
      value: "",
      rule: "비어 있는 문자열은 나눌 구간이 없습니다.",
      body: "위의 입력창에 주소를 붙여 넣거나 예시를 고르면, 같은 문자 위에 구간 괄호가 그려집니다.",
      rows: [],
    };
  }

  switch (focus) {
    case "scheme":
      return {
        kicker: "scheme",
        title: "스킴",
        value: scheme,
        rule: "맨 앞에서 첫 : 이전. 글자로 시작하는 이름만 스킴입니다.",
        body: "이 주소를 어떤 규약으로 열지 정합니다. 웹에서는 http와 https가 대부분이고, mailto나 data처럼 권한(//) 없이 본문이 바로 이어지는 스킴도 있습니다. 브라우저는 스킴을 소문자로 바꿉니다.",
        rows: normalized
          ? [{ label: "브라우저 protocol", value: normalized.protocol || "—" }]
          : [],
      };
    case "authority":
      return {
        kicker: "authority",
        title: "권한",
        value: sliceText(tokens, [
          "slashes",
          "username",
          "passwordColon",
          "password",
          "at",
          "host",
          "portColon",
          "port",
        ]),
        rule: "// 다음부터 첫 /, ?, # 이전입니다. //는 권한 구간이 시작된다는 표시입니다.",
        body: "누가, 어느 호스트의 몇 번 포트인지가 이 안에 있습니다. 마지막 @ 왼쪽이 사용자 정보, 그 오른쪽이 호스트와 포트입니다. IPv6 호스트는 대괄호로 감쌉니다.",
        rows: [],
      };
    case "username":
      return {
        kicker: "userinfo",
        title: "사용자",
        value: username || "(비어 있음)",
        rule: "권한 안 마지막 @의 왼쪽에서, 첫 : 앞까지입니다.",
        body: "@가 여러 개면 마지막 것이 호스트와의 경계입니다. 그 앞의 @는 사용자 정보에 남고, 브라우저는 이를 %40으로 바꿉니다. 첫 :가 이름과 비밀번호를 나눕니다.",
        rows: normalized?.username
          ? [{ label: "브라우저 username", value: normalized.username }]
          : [],
      };
    case "password":
      return {
        kicker: "userinfo",
        title: "비밀번호",
        value: password || "(비어 있음)",
        rule: "사용자 정보 안의 첫 : 다음부터 @ 이전입니다.",
        body: "주소에 적힌 비밀번호는 브라우저 기록, 서버 로그, Referer에 남을 수 있습니다. 다이어그램용 예시가 아니라면 이 형식을 쓰지 마세요.",
        rows: normalized?.password
          ? [{ label: "브라우저 password", value: normalized.password }]
          : [],
      };
    case "host": {
      const rows: { label: string; value: string }[] = [];
      if (normalized?.hostname) {
        rows.push({ label: "브라우저 hostname", value: normalized.hostname });
      }
      if (
        normalized?.hostname &&
        host &&
        normalized.hostname.replace(/^\[|\]$/g, "") !== host.replace(/^\[|\]$/g, "")
      ) {
        rows.push({
          label: "차이",
          value: "적힌 호스트와 전송되는 호스트가 다릅니다. 비ASCII 도메인은 퓨니코드로 바뀝니다.",
        });
      }
      return {
        kicker: "host",
        title: "호스트",
        value: host || "(비어 있음)",
        rule: "사용자 정보를 뺀 권한의 나머지. 대괄호로 시작하면 닫는 대괄호까지가 IPv6이고, 그 외에는 첫 콜론 앞이 호스트입니다.",
        body: "서버의 도메인 이름 또는 IP 주소입니다. 대괄호는 IPv6라는 뜻이라 포트의 콜론과 헷갈리지 않게 합니다. 한글 도메인은 사람이 읽는 문자 그대로 적어도, 전송할 때는 xn-- 로 시작하는 퓨니코드가 됩니다.",
        rows,
      };
    }
    case "port":
      return {
        kicker: "port",
        title: "포트",
        value: port || "(비어 있음)",
        rule: "호스트 다음의 :. IPv6라면 ] 다음에 오는 : 입니다.",
        body: "TCP 포트 번호입니다. 생략하면 스킴의 기본 포트를 씁니다. http는 80, https는 443이며, 브라우저는 기본 포트를 정규화된 주소에서 빼 버립니다.",
        rows: [
          {
            label: "브라우저 port",
            value: normalized ? normalized.port || "(기본 포트라 비움)" : "—",
          },
        ],
      };
    case "path": {
      const decoded = decodePercent(path);
      const rows: { label: string; value: string }[] = [];
      if (path && decoded.ok && decoded.text !== path) {
        rows.push({ label: "퍼센트 디코딩", value: decoded.text });
      }
      if (normalized) {
        rows.push({ label: "브라우저 pathname", value: normalized.pathname || "—" });
      }
      return {
        kicker: "path",
        title: "경로",
        value: path || "(비어 있음)",
        rule: "권한 다음부터 ? 또는 # 전까지. //가 없는 스킴이면 : 다음이 경로(또는 불투명 부분)입니다.",
        body: "호스트 안의 자원 위치입니다. /로 세그먼트가 나뉩니다. 빈 경로는 브라우저가 /로 채웁니다. . 과 .. 세그먼트도 정규화 때 접힙니다. mailto처럼 권한 없는 스킴에서는 이 부분이 주소의 본문입니다.",
        rows,
      };
    }
    case "query":
      return {
        kicker: "query",
        title: "쿼리",
        value: query || "(비어 있음)",
        rule: "첫 ? 다음, # 이전. &로 쌍을 나누고, 각 쌍의 첫 =로 키와 값을 나눕니다.",
        body: "서버로 전달되는 비계층 데이터입니다. =가 없으면 값 없는 키입니다. 공백은 %20으로 적고, HTML 폼에서는 +를 공백으로 읽기도 합니다. 여기 값 풀이는 +를 공백으로 봅니다.",
        rows: [
          { label: "쌍 개수", value: String(diagram.pairs.length) },
          ...(normalized
            ? [{ label: "브라우저 search", value: normalized.search || "(없음)" }]
            : []),
        ],
      };
    case "fragment": {
      const decoded = decodePercent(fragment);
      const rows: { label: string; value: string }[] = [];
      if (fragment && decoded.ok && decoded.text !== fragment) {
        rows.push({ label: "퍼센트 디코딩", value: decoded.text });
      }
      return {
        kicker: "fragment",
        title: "프래그먼트",
        value: fragment || "(비어 있음)",
        rule: "첫 # 다음의 전부. 그 안에 다시 #가 있어도 잘리지 않습니다.",
        body: "문서 안의 위치입니다. HTTP 요청 줄에는 포함되지 않고, 브라우저만 사용합니다. 서버 접근 로그에도 남지 않는 것이 정상입니다.",
        rows,
      };
    }
    case "normalized":
      return {
        kicker: "WHATWG",
        title: "브라우저 정규화",
        value: normalized?.href ?? "(해석 불가)",
        rule: "브라우저는 글자 단위 상태 기계로 읽은 뒤, 저장용 주소로 고칩니다.",
        body: normalized
          ? normalized.relative
            ? `스킴이 없어 기준 주소 ${BASE} 에 붙여 해석했습니다. 상대 참조는 현재 문서의 주소를 기준으로 같은 방식으로 합쳐집니다.`
            : normalized.href === text
              ? "이 문자열은 브라우저가 고칠 것이 없습니다. 적힌 그대로 href가 됩니다."
              : "적힌 문자열과 href가 다릅니다. 스킴 소문자화, 기본 포트 제거, 빈 경로를 /로 채우기, 한글 도메인의 퓨니코드, 특수 문자의 퍼센트 인코딩이 흔한 차이입니다."
          : "이 문자열은 브라우저 URL 파서가 거절했습니다. 위의 괄호는 적힌 문자 그대로의 분해입니다.",
        rows: normalized
          ? [
              { label: "적힌 주소", value: text },
              { label: "href", value: normalized.href },
            ]
          : [],
      };
  }
}

export function highlightPieces(
  text: string,
  tokens: Token[],
  focus: FocusId,
  range: Range | null,
): { text: string; hot: boolean }[] {
  if (!text) return [];
  const hot = Array.from({ length: text.length }, () => false);
  if (range) {
    const start = Math.max(0, range.start);
    const end = Math.min(text.length, range.end);
    for (let i = start; i < end; i += 1) hot[i] = true;
  } else {
    for (const token of tokens) {
      if (!isTokenHot(token.kind, focus)) continue;
      for (let i = token.start; i < token.end; i += 1) hot[i] = true;
    }
  }
  const pieces: { text: string; hot: boolean }[] = [];
  let index = 0;
  while (index < text.length) {
    const flag = hot[index];
    let next = index + 1;
    while (next < text.length && hot[next] === flag) next += 1;
    pieces.push({ text: text.slice(index, next), hot: flag ?? false });
    index = next;
  }
  return pieces;
}
