import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as EyeOff, i as Eye, n as Play, o as Copy, r as Pause, s as Check, t as TriangleAlert } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DuVl8CHl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MAX_LEN = 8e3;
var BASE = "https://example.com";
var RFC3986 = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/;
var EXAMPLES = [
	{
		id: "full",
		label: "전체 구성",
		url: "https://ada:secret@api.example.com:8443/v1/users?lang=ko&page=2#profile"
	},
	{
		id: "docs",
		label: "문서",
		url: "https://docs.example.com/guide/install?lang=ko&page=2#steps"
	},
	{
		id: "kr",
		label: "한글 도메인",
		url: "https://한글.한국/경로/문서?이름=값&q=검색어#섹션"
	},
	{
		id: "ipv6",
		label: "IPv6",
		url: "https://[2001:db8::1]:8080/index.html?x=1"
	},
	{
		id: "enc",
		label: "인코딩",
		url: "https://cdn.example.com/img/my%20photo.png?w=400&fmt=webp"
	},
	{
		id: "mail",
		label: "mailto",
		url: "mailto:hello@example.com?subject=Hello%20there"
	},
	{
		id: "rel",
		label: "상대 경로",
		url: "/docs/install?lang=ko#step"
	},
	{
		id: "norm",
		label: "정규화",
		url: "HTTPS://Example.COM:443/docs"
	}
];
var DELIMS = /* @__PURE__ */ new Set([
	"schemeColon",
	"slashes",
	"passwordColon",
	"at",
	"portColon",
	"question",
	"hash"
]);
function isDelim(kind) {
	return DELIMS.has(kind);
}
function tokenFocus(kind) {
	switch (kind) {
		case "scheme":
		case "schemeColon": return "scheme";
		case "slashes":
		case "at": return "authority";
		case "username": return "username";
		case "password":
		case "passwordColon": return "password";
		case "host": return "host";
		case "port":
		case "portColon": return "port";
		case "path": return "path";
		case "question":
		case "query": return "query";
		case "hash":
		case "fragment": return "fragment";
	}
}
var AUTHORITY_FOCUS = [
	"authority",
	"username",
	"password",
	"host",
	"port"
];
function isTokenHot(kind, focus) {
	if (focus === "normalized") return false;
	const own = tokenFocus(kind);
	if (own === focus) return true;
	return focus === "authority" && AUTHORITY_FOCUS.includes(own);
}
function isBracketHot(id, focus) {
	if (id === focus) return true;
	return id === "authority" && (focus === "username" || focus === "password" || focus === "host" || focus === "port");
}
function hasFocus(diagram, focus) {
	if (focus === "normalized") return diagram.normalized !== null;
	if (focus === "authority") return diagram.major.some((b) => b.id === "authority");
	return diagram.tokens.some((t) => tokenFocus(t.kind) === focus) || diagram.major.some((b) => b.id === focus);
}
var FOCUS_ORDER = [
	"scheme",
	"authority",
	"host",
	"path",
	"query",
	"fragment",
	"username",
	"port",
	"password"
];
function firstFocus(diagram) {
	for (const id of FOCUS_ORDER) if (hasFocus(diagram, id)) return id;
	return diagram.normalized ? "normalized" : "scheme";
}
function decodePercent(input) {
	try {
		return {
			text: decodeURIComponent(input),
			ok: true
		};
	} catch {
		return {
			text: input,
			ok: false
		};
	}
}
function decodeForm(input) {
	try {
		return {
			text: decodeURIComponent(input.replace(/\+/g, " ")),
			ok: true
		};
	} catch {
		return {
			text: input,
			ok: false
		};
	}
}
function readNormalized(input) {
	if (!input) return null;
	const pack = (url, relative) => ({
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
		relative
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
function findKinds(tokens, kinds) {
	let from = -1;
	let to = -1;
	tokens.forEach((token, index) => {
		if (!kinds.includes(token.kind)) return;
		if (from < 0) from = index;
		to = index + 1;
	});
	return from < 0 ? null : {
		from,
		to
	};
}
function parseUrl(rawInput) {
	const raw = rawInput ?? "";
	const clipped = raw.trim().length > MAX_LEN;
	const text = raw.trim().slice(0, MAX_LEN);
	const warnings = [];
	const tokens = [];
	if (raw !== raw.trim()) warnings.push("앞뒤 공백은 빼고 분해했습니다.");
	if (clipped) warnings.push("너무 길어서 앞 8000자만 분해했습니다.");
	if (/\s/.test(text)) warnings.push("주소 한가운데 공백이 있습니다. 공백은 %20으로 적어야 합니다.");
	if (text.includes("\\")) warnings.push("역슬래시가 있습니다. 브라우저(WHATWG)는 특수 스킴에서 \\ 를 / 로 바꿉니다.");
	let pos = 0;
	const consume = (kind, value) => {
		if (!value) return;
		tokens.push({
			kind,
			text: value,
			start: pos,
			end: pos + value.length
		});
		pos += value.length;
	};
	const match = RFC3986.exec(text);
	if (match && text) {
		const scheme = match[2];
		if (match[1] && scheme) {
			consume("scheme", scheme);
			consume("schemeColon", ":");
			if (!/^[A-Za-z][A-Za-z0-9+.-]*$/.test(scheme)) warnings.push("스킴은 글자로 시작하고 글자, 숫자, +, -, . 만 쓸 수 있습니다.");
		}
		if (match[3]) {
			consume("slashes", "//");
			consumeAuthority(match[4] ?? "", consume);
		}
		consume("path", match[5] ?? "");
		if (match[6] !== void 0) {
			consume("question", "?");
			consume("query", match[7] ?? "");
		}
		if (match[8] !== void 0) {
			consume("hash", "#");
			consume("fragment", match[9] ?? "");
		}
	}
	if (pos !== text.length && text) {
		tokens.length = 0;
		tokens.push({
			kind: "path",
			text,
			start: 0,
			end: text.length
		});
		warnings.push("이 문자열은 표준 URL 문법으로 끝까지 나누지 못했습니다.");
	}
	const minor = [];
	const pushMinor = (id, label, kinds) => {
		const span = findKinds(tokens, kinds);
		if (span) minor.push({
			id,
			label,
			...span
		});
	};
	if (tokens.some((t) => [
		"username",
		"password",
		"host",
		"port"
	].includes(t.kind))) {
		pushMinor("username", "사용자", ["username"]);
		pushMinor("password", "비밀번호", ["password"]);
		pushMinor("host", "호스트", ["host"]);
		pushMinor("port", "포트", ["port"]);
	}
	const major = [];
	const pushMajor = (id, label, kinds) => {
		const span = findKinds(tokens, kinds);
		if (span) major.push({
			id,
			label,
			...span
		});
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
		"port"
	]);
	pushMajor("path", "경로", ["path"]);
	pushMajor("query", "쿼리", ["question", "query"]);
	pushMajor("fragment", "프래그먼트", ["hash", "fragment"]);
	const queryToken = tokens.find((t) => t.kind === "query");
	const pairs = queryToken ? parsePairs(queryToken) : [];
	if (pairs.some((pair) => pair.broken)) warnings.push("쿼리에 잘못된 퍼센트 인코딩이 있습니다.");
	const pathToken = tokens.find((t) => t.kind === "path");
	const segments = pathToken ? parseSegments(pathToken) : [];
	if (segments.some((segment) => segment.broken)) warnings.push("경로에 잘못된 퍼센트 인코딩이 있습니다.");
	if (tokens.find((t) => t.kind === "password")) warnings.push("비밀번호가 주소에 들어 있습니다. 기록과 로그에 남을 수 있어 실제 서비스에서는 피합니다.");
	const port = tokens.find((t) => t.kind === "port");
	if (port && !/^\d+$/.test(port.text)) warnings.push("포트는 0부터 65535까지의 숫자여야 합니다.");
	else if (port && Number(port.text) > 65535) warnings.push("포트 번호가 65535를 넘습니다.");
	else if (tokens.some((t) => t.kind === "portColon") && !port) warnings.push("포트 구분 콜론은 있는데 번호가 비어 있습니다.");
	const hasSlashes = tokens.some((t) => t.kind === "slashes");
	const host = tokens.find((t) => t.kind === "host");
	if (hasSlashes && !host) warnings.push("권한 구간에 호스트가 없습니다.");
	if (host?.text.startsWith("[") && !host.text.endsWith("]")) warnings.push("IPv6 대괄호가 닫히지 않았습니다.");
	const normalized = readNormalized(text);
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
		steps: buildSteps(tokens, normalized)
	};
}
function consumeAuthority(auth, consume) {
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
		} else consume("username", userinfo);
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
		} else if (rest) consume("host", rest);
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
function parsePairs(token) {
	if (!token.text) return [];
	const parts = token.text.split("&");
	const pairs = [];
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
			broken: !keyDec.ok || valueDec?.ok === false
		});
	}
	return pairs;
}
function parseSegments(token) {
	if (!token.text) return [];
	const parts = token.text.split("/");
	const segments = [];
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
			broken: !decoded.ok
		});
	});
	return segments;
}
function buildSteps(tokens, normalized) {
	const has = (kind) => tokens.some((token) => token.kind === kind);
	const steps = [];
	const push = (id, focus, title, ok) => {
		if (ok) steps.push({
			id,
			focus,
			title
		});
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
function tokenText(tokens, kind) {
	return tokens.find((token) => token.kind === kind)?.text ?? "";
}
function sliceText(tokens, kinds) {
	return tokens.filter((token) => kinds.includes(token.kind)).map((token) => token.text).join("");
}
function describe(diagram, focus) {
	const { tokens, normalized, text } = diagram;
	const scheme = tokenText(tokens, "scheme");
	const host = tokenText(tokens, "host");
	const port = tokenText(tokens, "port");
	const path = tokenText(tokens, "path");
	const query = tokenText(tokens, "query");
	const fragment = tokenText(tokens, "fragment");
	const username = tokenText(tokens, "username");
	const password = tokenText(tokens, "password");
	if (!text) return {
		kicker: "대기",
		title: "주소를 입력하세요",
		value: "",
		rule: "비어 있는 문자열은 나눌 구간이 없습니다.",
		body: "위의 입력창에 주소를 붙여 넣거나 예시를 고르면, 같은 문자 위에 구간 괄호가 그려집니다.",
		rows: []
	};
	switch (focus) {
		case "scheme": return {
			kicker: "scheme",
			title: "스킴",
			value: scheme,
			rule: "맨 앞에서 첫 : 이전. 글자로 시작하는 이름만 스킴입니다.",
			body: "이 주소를 어떤 규약으로 열지 정합니다. 웹에서는 http와 https가 대부분이고, mailto나 data처럼 권한(//) 없이 본문이 바로 이어지는 스킴도 있습니다. 브라우저는 스킴을 소문자로 바꿉니다.",
			rows: normalized ? [{
				label: "브라우저 protocol",
				value: normalized.protocol || "—"
			}] : []
		};
		case "authority": return {
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
				"port"
			]),
			rule: "// 다음부터 첫 /, ?, # 이전입니다. //는 권한 구간이 시작된다는 표시입니다.",
			body: "누가, 어느 호스트의 몇 번 포트인지가 이 안에 있습니다. 마지막 @ 왼쪽이 사용자 정보, 그 오른쪽이 호스트와 포트입니다. IPv6 호스트는 대괄호로 감쌉니다.",
			rows: []
		};
		case "username": return {
			kicker: "userinfo",
			title: "사용자",
			value: username || "(비어 있음)",
			rule: "권한 안 마지막 @의 왼쪽에서, 첫 : 앞까지입니다.",
			body: "@가 여러 개면 마지막 것이 호스트와의 경계입니다. 그 앞의 @는 사용자 정보에 남고, 브라우저는 이를 %40으로 바꿉니다. 첫 :가 이름과 비밀번호를 나눕니다.",
			rows: normalized?.username ? [{
				label: "브라우저 username",
				value: normalized.username
			}] : []
		};
		case "password": return {
			kicker: "userinfo",
			title: "비밀번호",
			value: password || "(비어 있음)",
			rule: "사용자 정보 안의 첫 : 다음부터 @ 이전입니다.",
			body: "주소에 적힌 비밀번호는 브라우저 기록, 서버 로그, Referer에 남을 수 있습니다. 다이어그램용 예시가 아니라면 이 형식을 쓰지 마세요.",
			rows: normalized?.password ? [{
				label: "브라우저 password",
				value: normalized.password
			}] : []
		};
		case "host": {
			const rows = [];
			if (normalized?.hostname) rows.push({
				label: "브라우저 hostname",
				value: normalized.hostname
			});
			if (normalized?.hostname && host && normalized.hostname.replace(/^\[|\]$/g, "") !== host.replace(/^\[|\]$/g, "")) rows.push({
				label: "차이",
				value: "적힌 호스트와 전송되는 호스트가 다릅니다. 비ASCII 도메인은 퓨니코드로 바뀝니다."
			});
			return {
				kicker: "host",
				title: "호스트",
				value: host || "(비어 있음)",
				rule: "사용자 정보를 뺀 권한의 나머지. 대괄호로 시작하면 닫는 대괄호까지가 IPv6이고, 그 외에는 첫 콜론 앞이 호스트입니다.",
				body: "서버의 도메인 이름 또는 IP 주소입니다. 대괄호는 IPv6라는 뜻이라 포트의 콜론과 헷갈리지 않게 합니다. 한글 도메인은 사람이 읽는 문자 그대로 적어도, 전송할 때는 xn-- 로 시작하는 퓨니코드가 됩니다.",
				rows
			};
		}
		case "port": return {
			kicker: "port",
			title: "포트",
			value: port || "(비어 있음)",
			rule: "호스트 다음의 :. IPv6라면 ] 다음에 오는 : 입니다.",
			body: "TCP 포트 번호입니다. 생략하면 스킴의 기본 포트를 씁니다. http는 80, https는 443이며, 브라우저는 기본 포트를 정규화된 주소에서 빼 버립니다.",
			rows: [{
				label: "브라우저 port",
				value: normalized ? normalized.port || "(기본 포트라 비움)" : "—"
			}]
		};
		case "path": {
			const decoded = decodePercent(path);
			const rows = [];
			if (path && decoded.ok && decoded.text !== path) rows.push({
				label: "퍼센트 디코딩",
				value: decoded.text
			});
			if (normalized) rows.push({
				label: "브라우저 pathname",
				value: normalized.pathname || "—"
			});
			return {
				kicker: "path",
				title: "경로",
				value: path || "(비어 있음)",
				rule: "권한 다음부터 ? 또는 # 전까지. //가 없는 스킴이면 : 다음이 경로(또는 불투명 부분)입니다.",
				body: "호스트 안의 자원 위치입니다. /로 세그먼트가 나뉩니다. 빈 경로는 브라우저가 /로 채웁니다. . 과 .. 세그먼트도 정규화 때 접힙니다. mailto처럼 권한 없는 스킴에서는 이 부분이 주소의 본문입니다.",
				rows
			};
		}
		case "query": return {
			kicker: "query",
			title: "쿼리",
			value: query || "(비어 있음)",
			rule: "첫 ? 다음, # 이전. &로 쌍을 나누고, 각 쌍의 첫 =로 키와 값을 나눕니다.",
			body: "서버로 전달되는 비계층 데이터입니다. =가 없으면 값 없는 키입니다. 공백은 %20으로 적고, HTML 폼에서는 +를 공백으로 읽기도 합니다. 여기 값 풀이는 +를 공백으로 봅니다.",
			rows: [{
				label: "쌍 개수",
				value: String(diagram.pairs.length)
			}, ...normalized ? [{
				label: "브라우저 search",
				value: normalized.search || "(없음)"
			}] : []]
		};
		case "fragment": {
			const decoded = decodePercent(fragment);
			const rows = [];
			if (fragment && decoded.ok && decoded.text !== fragment) rows.push({
				label: "퍼센트 디코딩",
				value: decoded.text
			});
			return {
				kicker: "fragment",
				title: "프래그먼트",
				value: fragment || "(비어 있음)",
				rule: "첫 # 다음의 전부. 그 안에 다시 #가 있어도 잘리지 않습니다.",
				body: "문서 안의 위치입니다. HTTP 요청 줄에는 포함되지 않고, 브라우저만 사용합니다. 서버 접근 로그에도 남지 않는 것이 정상입니다.",
				rows
			};
		}
		case "normalized": return {
			kicker: "WHATWG",
			title: "브라우저 정규화",
			value: normalized?.href ?? "(해석 불가)",
			rule: "브라우저는 글자 단위 상태 기계로 읽은 뒤, 저장용 주소로 고칩니다.",
			body: normalized ? normalized.relative ? `스킴이 없어 기준 주소 ${BASE} 에 붙여 해석했습니다. 상대 참조는 현재 문서의 주소를 기준으로 같은 방식으로 합쳐집니다.` : normalized.href === text ? "이 문자열은 브라우저가 고칠 것이 없습니다. 적힌 그대로 href가 됩니다." : "적힌 문자열과 href가 다릅니다. 스킴 소문자화, 기본 포트 제거, 빈 경로를 /로 채우기, 한글 도메인의 퓨니코드, 특수 문자의 퍼센트 인코딩이 흔한 차이입니다." : "이 문자열은 브라우저 URL 파서가 거절했습니다. 위의 괄호는 적힌 문자 그대로의 분해입니다.",
			rows: normalized ? [{
				label: "적힌 주소",
				value: text
			}, {
				label: "href",
				value: normalized.href
			}] : []
		};
	}
}
function highlightPieces(text, tokens, focus, range) {
	if (!text) return [];
	const hot = Array.from({ length: text.length }, () => false);
	if (range) {
		const start = Math.max(0, range.start);
		const end = Math.min(text.length, range.end);
		for (let i = start; i < end; i += 1) hot[i] = true;
	} else for (const token of tokens) {
		if (!isTokenHot(token.kind, focus)) continue;
		for (let i = token.start; i < token.end; i += 1) hot[i] = true;
	}
	const pieces = [];
	let index = 0;
	while (index < text.length) {
		const flag = hot[index];
		let next = index + 1;
		while (next < text.length && hot[next] === flag) next += 1;
		pieces.push({
			text: text.slice(index, next),
			hot: flag ?? false
		});
		index = next;
	}
	return pieces;
}
var DEFAULT = EXAMPLES[0]?.url ?? "";
function cn(...parts) {
	return parts.filter(Boolean).join(" ");
}
function UrlStudio() {
	const [url, setUrl] = (0, import_react.useState)(DEFAULT);
	const [focus, setFocus] = (0, import_react.useState)("scheme");
	const [range, setRange] = (0, import_react.useState)(null);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [cursor, setCursor] = (0, import_react.useState)(0);
	const [masked, setMasked] = (0, import_react.useState)(false);
	const [copied, setCopied] = (0, import_react.useState)(null);
	const diagram = (0, import_react.useMemo)(() => parseUrl(url), [url]);
	(0, import_react.useEffect)(() => {
		setRange(null);
		setPlaying(false);
		setCursor(0);
		setFocus((prev) => hasFocus(diagram, prev) ? prev : firstFocus(diagram));
	}, [diagram]);
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		if (diagram.steps.length === 0) return;
		const timer = window.setInterval(() => {
			setCursor((current) => (current + 1) % diagram.steps.length);
		}, 1200);
		return () => window.clearInterval(timer);
	}, [playing, diagram]);
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		const step = diagram.steps[cursor];
		if (!step) return;
		setFocus(step.focus);
		setRange(null);
	}, [
		cursor,
		playing,
		diagram
	]);
	function pick(next, nextRange = null) {
		setPlaying(false);
		setFocus(next);
		setRange(nextRange);
		const index = diagram.steps.findIndex((step) => step.focus === next);
		if (index >= 0) setCursor(index);
	}
	async function copyText(key, value) {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			setCopied(key);
			window.setTimeout(() => setCopied((current) => current === key ? null : current), 1400);
		} catch {
			setCopied(null);
		}
	}
	const description = describe(diagram, focus);
	const activeExample = EXAMPLES.find((example) => example.url === url.trim())?.id;
	const hasPassword = diagram.tokens.some((token) => token.kind === "password");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-paper text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1 bg-teal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "max-w-3xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs text-teal",
							children: "RFC 3986 · WHATWG"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 text-3xl font-semibold tracking-tight sm:text-4xl",
							children: "URL 파싱 다이어그램"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-base text-muted",
							children: "주소 한 줄을 스킴, 권한, 경로, 쿼리, 프래그먼트로 나눕니다. 괄호는 적힌 문자 그대로이고, 아래쪽은 브라우저가 정규화한 값입니다."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: "url-input",
						className: "text-sm font-medium",
						children: "주소"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						id: "url-input",
						value: url,
						rows: 2,
						spellCheck: false,
						autoCapitalize: "off",
						autoCorrect: "off",
						onChange: (event) => setUrl(event.target.value),
						placeholder: "https://example.com/path?q=1#section",
						className: "mt-2 w-full resize-y rounded-md border border-line bg-card px-3 py-3 font-mono text-base text-ink focus-visible:border-teal"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: EXAMPLES.map((example) => {
							const on = example.id === activeExample;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-pressed": on,
								onClick: () => setUrl(example.url),
								className: cn("min-h-11 rounded-md border px-3 text-sm", on ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-ink"),
								children: example.label
							}, example.id);
						})
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-end justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-semibold tracking-tight",
								children: "구간"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: diagram.text ? `${diagram.text.length}자` : "비어 있음"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-line bg-card p-4 sm:p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SourceLine, {
									diagram,
									focus,
									range
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-5 overflow-x-auto pb-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-max min-w-full px-3 py-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnatomyFigure, {
											diagram,
											focus,
											masked,
											onPick: pick
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted sm:hidden",
									children: "괄호 그림이 길면 옆으로 밀어 보세요."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 flex flex-wrap items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted",
										children: "조각을 누르면 자르는 기준이 아래에 고정됩니다."
									}), hasPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setMasked((value) => !value),
										className: "inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm",
										children: [masked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }), masked ? "비밀번호 보기" : "비밀번호 가리기"]
									}) : null]
								})
							]
						}),
						diagram.warnings.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 flex flex-col gap-2",
							children: diagram.warnings.map((warning) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-2 rounded-md bg-copper-soft px-3 py-2 text-sm text-ink",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
									className: "mt-0.5 size-4 shrink-0 text-copper",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: warning })]
							}, warning))
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold tracking-tight",
						children: "자르는 순서"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							if (diagram.steps.length === 0) return;
							setPlaying((value) => !value);
						},
						disabled: diagram.steps.length === 0,
						className: "inline-flex min-h-11 items-center gap-2 rounded-md bg-teal px-3 text-sm text-teal-ink disabled:opacity-50",
						children: [playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), playing ? "일시정지" : "순서대로 보기"]
					})]
				}), diagram.steps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "주소가 있으면 분해 순서가 여기 나타납니다."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "flex flex-wrap gap-2",
					children: diagram.steps.map((step, index) => {
						const on = step.focus === focus;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"aria-pressed": on,
							onClick: () => pick(step.focus),
							className: cn("inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm", on ? "border-teal bg-teal text-teal-ink" : "border-line bg-card text-ink hover:border-teal"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: index + 1
							}), step.title]
						}) }, step.id);
					})
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-lg border border-line bg-card p-4 sm:p-6",
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs text-teal",
							children: description.kicker
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-2xl font-semibold tracking-tight",
								children: description.title
							}), description.value ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => copyText("detail", description.value),
								className: "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-line px-3 text-sm",
								children: [copied === "detail" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied === "detail" ? "복사됨" : "복사"]
							}) : null]
						}),
						description.value ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-mono text-lg break-all text-ink sm:text-xl",
							children: focus === "password" && masked ? "•".repeat(description.value.length) : description.value
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 rounded-md bg-paper px-3 py-3 text-sm text-ink",
							children: description.rule
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm leading-relaxed text-muted",
							children: description.body
						}),
						description.rows.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
							className: "mt-4 flex flex-col gap-3 border-t border-line pt-4",
							children: description.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
									className: "text-xs text-muted",
									children: row.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
									className: "font-mono text-sm break-all",
									children: row.value
								})]
							}, row.label))
						}) : null
					]
				}),
				diagram.segments.length > 0 || diagram.pairs.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-6 lg:grid-cols-2",
					children: [diagram.segments.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold tracking-tight",
							children: "경로 세그먼트"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "/ 로 나뉜 조각입니다. 누르면 원문에서 그 위치만 표시합니다."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 flex flex-col gap-2",
							children: diagram.segments.map((segment, index) => {
								const on = range?.start === segment.start && range?.end === segment.end;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": on,
									onClick: () => pick("path", {
										start: segment.start,
										end: segment.end
									}),
									className: cn("flex min-h-11 w-full items-baseline gap-3 rounded-md border px-3 py-2 text-left", on ? "border-teal bg-teal-soft" : "border-line bg-card hover:border-ink"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-xs text-muted",
											children: index + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-sm break-all",
											children: segment.decoded
										}),
										segment.decoded !== segment.raw ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-auto font-mono text-xs text-muted break-all",
											children: segment.raw
										}) : null
									]
								}) }, `${segment.start}-${segment.raw}`);
							})
						})
					] }) : null, diagram.pairs.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold tracking-tight",
							children: "쿼리 쌍"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: "& 로 나누고, 첫 = 로 키와 값을 나눴습니다. + 는 공백으로 풀었습니다."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 flex flex-col gap-2",
							children: diagram.pairs.map((pair, index) => {
								const on = range?.start === pair.start && range?.end === pair.end;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"aria-pressed": on,
									onClick: () => pick("query", {
										start: pair.start,
										end: pair.end
									}),
									className: cn("flex min-h-11 w-full flex-wrap items-baseline gap-x-2 rounded-md border px-3 py-2 text-left", on ? "border-teal bg-teal-soft" : "border-line bg-card hover:border-ink"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-xs text-muted",
											children: index + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-sm break-all",
											children: pair.key || "(빈 키)"
										}),
										pair.valueRaw !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted",
											children: "="
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-sm break-all",
											children: pair.value ?? ""
										})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted",
											children: "값 없음"
										})
									]
								}) }, `${pair.start}-${pair.keyRaw}`);
							})
						})
					] }) : null]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrowserPanel, {
					diagram,
					active: focus === "normalized",
					onPick: () => pick("normalized")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: "rounded-lg border border-line bg-card px-4 py-3 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
							className: "min-h-11 cursor-pointer list-none py-2 text-sm font-medium",
							children: "이 괄호에 쓴 문법"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pb-2 text-sm leading-relaxed text-muted",
							children: "위 다이어그램은 RFC 3986 부록 B의 정규식으로 입력 문자열을 그대로 자른 것입니다. 브라우저의 실제 파서는 한 글자씩 상태를 바꾸며 읽고, 역슬래시·공백·비ASCII·기본 포트를 정규화합니다. 그래서 두 결과가 다를 수 있습니다."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pb-4 font-mono text-xs break-all text-ink sm:text-sm",
							children: "^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$"
						})
					]
				})
			]
		})]
	});
}
function SourceLine({ diagram, focus, range }) {
	if (!diagram.text) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "분해할 주소가 없습니다."
	});
	const pieces = highlightPieces(diagram.text, diagram.tokens, focus, range);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "font-mono text-base leading-relaxed break-all sm:text-lg",
		children: pieces.map((piece, index) => piece.hot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "rounded-sm bg-teal px-0.5 text-teal-ink",
			children: piece.text
		}, index) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: piece.text }, index))
	});
}
function AnatomyFigure({ diagram, focus, masked, onPick }) {
	const showMinor = diagram.minor.length > 0;
	const tokenRow = showMinor ? 2 : 1;
	const majorRow = showMinor ? 3 : 2;
	const count = diagram.tokens.length;
	if (count === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "스킴, 권한, 경로, 쿼리, 프래그먼트 괄호가 이 자리에 그려집니다."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid items-center gap-x-1",
		style: { gridTemplateColumns: `repeat(${count}, max-content)` },
		children: [
			showMinor ? diagram.minor.map((bracket) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BracketButton, {
				bracket,
				row: 1,
				direction: "down",
				hot: isBracketHot(bracket.id, focus),
				onPick
			}, bracket.id)) : null,
			diagram.tokens.map((token, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TokenButton, {
				token,
				column: index + 1,
				row: tokenRow,
				hot: isTokenHot(token.kind, focus),
				masked,
				onPick
			}, `${token.kind}-${token.start}`)),
			diagram.major.map((bracket) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BracketButton, {
				bracket,
				row: majorRow,
				direction: "up",
				hot: isBracketHot(bracket.id, focus),
				onPick
			}, bracket.id))
		]
	});
}
function TokenButton({ token, column, row, hot, masked, onPick }) {
	const delim = isDelim(token.kind);
	const shown = masked && token.kind === "password" ? "•".repeat(Math.max(token.text.length, 1)) : token.text;
	const width = token.kind === "host" || token.kind === "fragment" || token.kind === "query" ? "min-w-24" : delim ? "" : "min-w-16";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		style: {
			gridColumn: column,
			gridRow: row
		},
		onClick: () => onPick(tokenFocus(token.kind)),
		className: cn("rounded-sm px-1 py-2 text-center font-mono text-lg transition-colors duration-150 sm:text-xl", width, hot ? "bg-teal text-teal-ink" : delim ? "text-muted" : "text-ink hover:bg-teal-soft"),
		children: shown
	});
}
function BracketButton({ bracket, row, direction, hot, onPick }) {
	const rule = hot ? "border-teal" : "border-ink";
	const label = hot ? "text-teal" : "text-muted";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		style: {
			gridColumn: `${bracket.from + 1} / ${bracket.to + 1}`,
			gridRow: row
		},
		onClick: () => onPick(bracket.id),
		className: "relative h-10 w-full",
		"aria-label": bracket.label,
		children: direction === "down" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("absolute inset-x-0 top-0 text-center font-sans text-xs font-medium whitespace-nowrap", label),
			children: bracket.label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute inset-x-1 bottom-0 h-3 rounded-t-md border-t-2 border-r-2 border-l-2", rule) })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute inset-x-1 top-0 h-3 rounded-b-md border-r-2 border-b-2 border-l-2", rule) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("absolute inset-x-0 top-4 text-center font-sans text-xs font-medium whitespace-nowrap", label),
			children: bracket.label
		})] })
	});
}
function BrowserPanel({ diagram, active, onPick }) {
	const normalized = diagram.normalized;
	const fields = normalized ? [
		{
			label: "href",
			hint: "정규화된 전체 주소",
			value: normalized.href
		},
		{
			label: "origin",
			hint: "스킴, 호스트, 포트",
			value: normalized.origin || "(불투명 출처)"
		},
		{
			label: "protocol",
			hint: "스킴과 콜론",
			value: normalized.protocol
		},
		{
			label: "username",
			hint: "사용자 이름",
			value: normalized.username
		},
		{
			label: "password",
			hint: "비밀번호",
			value: normalized.password
		},
		{
			label: "hostname",
			hint: "호스트. 한글 도메인은 퓨니코드",
			value: normalized.hostname
		},
		{
			label: "port",
			hint: "기본 포트면 비어 있음",
			value: normalized.port
		},
		{
			label: "pathname",
			hint: "경로",
			value: normalized.pathname
		},
		{
			label: "search",
			hint: "물음표를 포함한 쿼리",
			value: normalized.search
		},
		{
			label: "hash",
			hint: "해시를 포함한 프래그먼트",
			value: normalized.hash
		}
	] : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("rounded-lg border bg-card p-4 sm:p-6", active ? "border-teal" : "border-line"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold tracking-tight",
				children: "브라우저가 읽는 값"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: normalized?.relative ? "상대 주소라 기준 https://example.com 에 붙여 계산했습니다." : "WHATWG URL 파서의 결과입니다. 프래그먼트는 요청에 실리지 않습니다."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onPick,
				className: "inline-flex min-h-11 shrink-0 items-center rounded-md border border-line px-3 text-sm",
				children: "이 단계 보기"
			})]
		}), !normalized ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-muted",
			children: "이 문자열은 브라우저 URL로 해석되지 않습니다."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
			className: "mt-4 divide-y divide-line",
			children: fields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:items-baseline sm:gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-xs text-teal",
					children: field.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-0.5 block text-xs text-muted",
					children: field.hint
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
					className: cn("font-mono text-sm break-all", field.value ? "text-ink" : "text-muted"),
					children: field.value || "—"
				})]
			}, field.label))
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UrlStudio, {});
}
//#endregion
export { Home as component };
