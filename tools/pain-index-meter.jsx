import React, { useState, useMemo } from "react";

// ──────────────────────────────────────────────────────────────
//  고통지수 측정기 (Pain Index Meter)
//  댓글을 붙여넣으면 이 아티팩트 안에서 AI가 직접:
//   1) 고통 신호 추출  2) 1~10 분류(규칙)  3) 8~10 집단 정의
//  백엔드/API키 설정 없이 동작. AI 호출은 Anthropic API로 처리.
// ──────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=JetBrains+Mono:wght@400;500;700&display=swap');

.pim-root{
  --bg:#15120f; --bg2:#1c1815; --surface:#221d19; --line:#352c25;
  --ink:#ece3d8; --muted:#9a8e80; --faint:#6b6157;
  --ember:#e0703a;
  --p-low:#6fb89a; --p-mid:#d9b44a; --p-high:#e0853c; --p-crit:#d44a3a;
  background:var(--bg);
  color:var(--ink);
  font-family:'Fraunces',Georgia,'Apple SD Gothic Neo','Malgun Gothic',serif;
  min-height:100%;
  padding:32px 20px 80px;
  position:relative;
}
.pim-root::before{
  content:""; position:absolute; inset:0; pointer-events:none;
  background-image:radial-gradient(circle at 18% 12%, rgba(224,112,58,.10), transparent 42%);
}
.pim-mono{ font-family:'JetBrains Mono',ui-monospace,monospace; }
.pim-wrap{ max-width:760px; margin:0 auto; position:relative; }

.pim-kicker{ font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:var(--ember); margin:0 0 10px; }
.pim-title{ font-size:46px; line-height:1; font-weight:900; margin:0; letter-spacing:-.02em; }
.pim-sub{ color:var(--muted); font-size:15px; margin:14px 0 0; max-width:560px; line-height:1.55; }

.pim-card{ background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:22px; margin-top:24px; }
.pim-label{ font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--faint); margin:0 0 10px; }

.pim-ta{ width:100%; min-height:170px; background:var(--bg2); border:1px solid var(--line); border-radius:12px; color:var(--ink); padding:14px; font-family:'JetBrains Mono',monospace; font-size:13px; line-height:1.6; resize:vertical; box-sizing:border-box; }
.pim-ta:focus{ outline:none; border-color:var(--ember); }
.pim-note{ font-size:13px; color:var(--muted); line-height:1.55; margin:12px 0 0; }

.pim-row{ display:flex; gap:10px; margin-top:16px; flex-wrap:wrap; }
.pim-btn{ font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:500; letter-spacing:.04em; padding:12px 22px; border-radius:10px; border:1px solid var(--ember); background:var(--ember); color:#1a120c; cursor:pointer; transition:transform .12s, opacity .12s; }
.pim-btn:hover{ transform:translateY(-1px); }
.pim-btn:disabled{ opacity:.4; cursor:not-allowed; transform:none; }
.pim-btn.ghost{ background:transparent; color:var(--muted); border-color:var(--line); }
.pim-btn.ghost:hover{ color:var(--ink); border-color:var(--muted); }

.pim-stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:24px; }
.pim-stat{ background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:18px 16px; }
.pim-stat .v{ font-size:40px; font-weight:900; line-height:1; letter-spacing:-.02em; }
.pim-stat .k{ font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--faint); margin-top:8px; }

.pim-band{ display:flex; align-items:center; gap:14px; padding:11px 0; }
.pim-band .name{ font-family:'JetBrains Mono',monospace; font-size:12px; width:96px; flex:none; color:var(--muted); }
.pim-track{ flex:1; height:26px; background:var(--bg2); border-radius:7px; overflow:hidden; }
.pim-fill{ height:100%; border-radius:7px; transition:width .8s cubic-bezier(.2,.7,.2,1); }
.pim-band .pct{ font-family:'JetBrains Mono',monospace; font-size:13px; width:78px; text-align:right; flex:none; }

.pim-crit{ background:linear-gradient(160deg, rgba(212,74,58,.16), rgba(34,29,25,.6)); border:1px solid rgba(212,74,58,.45); border-radius:18px; padding:24px; margin-top:24px; }
.pim-crit .hd{ display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.pim-crit h3{ margin:0; font-size:22px; font-weight:900; }
.pim-conf{ font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; padding:5px 10px; border-radius:999px; border:1px solid var(--line); color:var(--muted); }
.pim-persona{ font-size:18px; line-height:1.6; margin:16px 0 0; }
.pim-evid{ display:flex; gap:18px; margin-top:18px; flex-wrap:wrap; font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--muted); }
.pim-evid b{ color:var(--p-crit); font-weight:700; }

.pim-quote{ border-left:2px solid var(--p-crit); padding:8px 0 8px 14px; margin:14px 0 0; font-size:14px; line-height:1.55; color:var(--ink); }

.pim-list{ margin-top:8px; max-height:340px; overflow:auto; }
.pim-item{ display:flex; gap:12px; align-items:flex-start; padding:11px 0; border-bottom:1px solid var(--line); }
.pim-score{ font-family:'JetBrains Mono',monospace; font-weight:700; font-size:14px; width:34px; height:34px; flex:none; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#15120f; }
.pim-itext{ font-size:14px; line-height:1.5; }
.pim-tags{ margin-top:5px; display:flex; gap:6px; flex-wrap:wrap; }
.pim-tag{ font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.04em; padding:2px 7px; border-radius:5px; border:1px solid var(--line); color:var(--muted); }

.pim-err{ color:var(--p-crit); font-family:'JetBrains Mono',monospace; font-size:13px; margin-top:14px; }
.pim-prog{ font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--ember); margin-top:16px; display:flex; align-items:center; gap:10px; }
.pim-dot{ width:8px; height:8px; border-radius:50%; background:var(--ember); animation:pim-pulse 1s infinite; }
@keyframes pim-pulse{ 0%,100%{opacity:.25} 50%{opacity:1} }
.pim-guard{ font-size:13px; color:var(--faint); line-height:1.6; margin-top:24px; border-top:1px solid var(--line); padding-top:18px; }
.pim-pred{ background:linear-gradient(160deg, rgba(224,112,58,.12), rgba(34,29,25,.5)); border:1px solid rgba(224,112,58,.4); border-radius:18px; padding:22px; margin-top:24px; }
.pim-pred h3{ margin:0 0 4px; font-size:22px; font-weight:900; }
.pim-pred .lead{ color:var(--muted); font-size:13px; margin:0 0 14px; line-height:1.5; }
.pim-pitem{ padding:14px 0; border-top:1px solid var(--line); }
.pim-pitem .top{ display:flex; align-items:baseline; gap:10px; }
.pim-prank{ font-family:'JetBrains Mono',monospace; font-weight:700; font-size:13px; color:var(--ember); flex:none; }
.pim-ppain{ font-size:17px; font-weight:600; line-height:1.4; }
.pim-psig{ font-size:13px; color:var(--muted); line-height:1.5; margin:6px 0 0; padding-left:22px; }
.pim-pmeta{ font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--faint); margin:8px 0 0; padding-left:22px; }
.pim-pmeta .ex{ color:var(--muted); }
.pim-handoff{ background:var(--surface); border:1px dashed var(--ember); border-radius:18px; padding:22px; margin-top:24px; }
.pim-handoff h3{ margin:0 0 4px; font-size:20px; font-weight:900; }
.pim-handoff .lead{ color:var(--muted); font-size:13px; line-height:1.55; margin:0 0 16px; }
`;

const SAMPLE = `이거 진짜 똑같이 따라했는데 왜 제 건 이렇게 안 나오죠? 미치겠네요
프롬프트 좀 공유해주실 수 있나요? 어떤 AI 쓰신 거예요?
와 퀄리티 미쳤다 멋져요
저는 이걸로 클라이언트 영상 납품해야 하는데 결과가 매번 달라서 진짜 답이 없어요. 강의도 들어봤는데 안 됨
유료 강의나 패키지로 팔면 살 의향 있어요 진짜
크레딧만 날리고 결과물은 별로네요 ㅠㅠ 다른 툴이 나으려나
그냥 외주 맡기는 게 빠를 듯
오 정보 감사합니다
런웨이 쓰다가 너무 비싸서 포기했어요
툴이 너무 많아서 뭘 써야 할지 모르겠어요 추천 좀
초보인데 따라하기 좋네요 ㅎㅎ
이거 채널 키우려고 하는데 일관성이 없어서 못 쓰겠어요`;

const MODEL = "claude-sonnet-4-20250514";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 에러 성격 분류:
//  hard  = 세션 한도 초과. 같은 세션에서 재시도해봤자 호출만 더 소모됨 → 새로고침 필요
//  soft  = 일시적 과부하/속도제한. 잠깐 기다리면 풀림 → 재시도 가능
//  other = 그 외(파싱오류 등) → 재시도 안 함
function classifyError(status, msg) {
  const m = msg || "";
  if (/reload|새로고침|session/i.test(m)) return "hard";
  if (status === 429 || /rate.?limit|too many|overloaded|quota|exceeded/i.test(m))
    return "soft";
  return "other";
}

async function callClaudeOnce(prompt) {
  const ctrl = new AbortController();
  const TIMEOUT = 30000; // 30초
  let timer;
  const timeoutP = new Promise((_, reject) => {
    timer = setTimeout(() => {
      try { ctrl.abort(); } catch (e) {}
      reject(new Error("응답 시간 초과(30초)"));
    }, TIMEOUT);
  });
  const work = (async () => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    });
    let data = null;
    let rawText = "";
    try {
      data = await res.clone().json();
    } catch (e) {
      try { rawText = await res.text(); } catch (e2) {}
    }
    if (!res.ok || (data && data.error)) {
      const m =
        (data && data.error ? data.error.message || data.error.type : "") ||
        rawText ||
        "응답 없음";
      const err = new Error("API 오류 HTTP " + res.status + ": " + m);
      err.status = res.status;
      err.kind = classifyError(res.status, m);
      throw err;
    }
    return (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  })();
  try {
    return await Promise.race([work, timeoutP]);
  } finally {
    clearTimeout(timer);
  }
}

// soft(일시적 제한)만 짧게 백오프 재시도. hard(세션 한도)는 즉시 중단해서
// 같은 세션에서 호출을 더 낭비하지 않는다.
async function callClaude(prompt, onWait) {
  const MAX_RETRY = 3;
  let wait = 2000; // 2 → 4 → 8초
  for (let attempt = 0; ; attempt++) {
    try {
      return await callClaudeOnce(prompt);
    } catch (e) {
      // fetch 자체가 던진 에러는 .kind가 없으니 메시지로 다시 분류
      const kind = (e && e.kind) || classifyError(e && e.status, e && e.message);
      if (e) e.kind = kind;
      if (kind === "soft" && attempt < MAX_RETRY) {
        if (onWait) onWait(Math.round(wait / 1000), attempt + 1);
        await sleep(wait + Math.random() * 400);
        wait = Math.min(wait * 2, 8000);
        continue;
      }
      throw e; // hard / other / 재시도 소진 → 위로 전달
    }
  }
}

function salvageObjects(t) {
  // 응답이 중간에 잘렸을 때, 완성된 {…} 객체만 골라 파싱
  const out = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === "{") { if (depth === 0) start = i; depth++; }
    else if (c === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try { out.push(JSON.parse(t.slice(start, i + 1))); } catch (e) {}
        start = -1;
      }
    }
  }
  return out;
}

function extractJSON(text) {
  let t = (text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = t.search(/[\[{]/);
  if (start > 0) t = t.slice(start);
  try {
    return JSON.parse(t);
  } catch (e) {
    const cut = Math.max(t.lastIndexOf("]"), t.lastIndexOf("}"));
    if (cut > 0) {
      try {
        return JSON.parse(t.slice(0, cut + 1));
      } catch (e2) {}
    }
    const salv = salvageObjects(t);
    if (salv.length) return salv;
    throw new Error("JSON 파싱 실패");
  }
}

const STAGE1 = (block) => `너는 유튜브 댓글에서 사용자의 "고통 신호"를 추출하는 분석기다.
점수를 매기지 마라. 객관적으로 보이는 신호만 표시한다. 근거가 없으면 반드시 "불명"으로 둬라. 추측해서 채우지 마라.
다른 텍스트/마크다운/설명 없이 JSON 배열만 출력하라.

각 댓글에 대해:
{
 "id": <인덱스 정수>,
 "is_pain": true|false,
 "pain_topic": "<고통 내용 한 줄, 없으면 ''>",
 "intensity": "약함"|"보통"|"강함",
 "alternative": "있음"|"없음"|"불명",
 "desperation": "있음"|"없음",
 "knowledge_gap": true|false,
 "willing_to_pay": true|false,
 "segment": "수익압박"|"취미"|"불명"
}

댓글:
${block}`;

const STAGE3 = (block) => `아래는 고통지수 8~10으로 분류된 유튜브 댓글들이다.
이 사람들의 공통점을 정의하라. 근거가 부족하면 솔직히 그렇게 말하라. 미화하지 마라.
JSON 객체만 출력:
{
 "persona": "'___을 하려는 ___한 사람들이며, ___에서 막히고, ___을 시도했지만 실패함' 형태의 한두 문장",
 "evidence_count": <근거 댓글 수 정수>,
 "confidence": "높음"|"보통"|"낮음(표본부족)"
}

댓글:
${block}`;

const STAGE4 = (block) => `아래는 어떤 유튜브 영상의 댓글들이다.
너의 임무는 이 댓글들을 "단서"로 삼고, 거기에 너의 폭넓은 지식과 이 분야에 대한 일반적 이해까지 더해서,
"이 사람들이 진짜로 원하거나 필요로 하는 게 무엇일지"를 예측하는 것이다.
중요한 원칙:
- 표본이 작아도 입을 다물지 마라. 단서가 적으면 적은 대로, 네 지식을 활용해 과감하게 최선의 추정을 제시하라.
- 댓글에 직접 안 적혀 있어도, 행간과 패턴에서 "대부분의 사람들이 이런 걸 필요로 하지 않을까" 하는 통찰을 끌어내라.
- 각 니즈마다, 그것을 풀어줄 "이런 제품/서비스/기능이 있으면 좋겠다"는 구체적 솔루션 아이디어를 한 줄 제안하라.
- 단, 댓글 단서에서 나온 부분과 네 추정인 부분을 솔직히 구분하고, confidence로 표시하라.
모든 값은 한국어로. 가능성 높은 순으로 3~6개 정렬.
다른 텍스트 없이 JSON 객체만 출력:
{
 "predicted_needs": [
   {
     "need": "<사람들이 원하거나 필요로 할 것으로 보이는 것 한 줄>",
     "reasoning": "<댓글 단서 + 너의 일반 지식 기반 근거>",
     "solution": "<이런 걸 만들면 좋겠다는 구체적 제품/기능 아이디어 한 줄>",
     "confidence": "높음"|"보통"|"낮음(추정)"
   }
 ]
}

댓글:
${block}`;

function scoreSignal(s) {
  if (!s || !s.is_pain) return 0;
  const strong = s.intensity === "강함";
  const mid = s.intensity === "보통";
  const altNone = s.alternative === "없음";
  const altYes = s.alternative === "있음";
  const gap = !!s.knowledge_gap;
  const desp = s.desperation === "있음";
  const pay = !!s.willing_to_pay;
  const revenue = s.segment === "수익압박";
  let sc;
  if (strong && altNone && revenue && (pay || desp)) {
    sc = 8 + (pay ? 1 : 0) + (desp ? 1 : 0);
  } else if (strong && altNone && (gap || desp)) {
    sc = 6 + (gap && desp ? 1 : 0);
  } else if (strong && altYes) {
    sc = 4 + (gap ? 1 : 0);
  } else if (strong && altNone) {
    sc = 6;
  } else if (mid) {
    sc = altYes ? 3 : 4;
  } else {
    sc = altYes && !gap ? 1 : 2;
  }
  return Math.max(1, Math.min(10, Math.round(sc)));
}

function bandColor(score) {
  if (score >= 8) return "var(--p-crit)";
  if (score >= 6) return "var(--p-high)";
  if (score >= 4) return "var(--p-mid)";
  return "var(--p-low)";
}

export default function PainIndexMeter() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle|running|done|error
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]); // {id,text,signal,score}
  const [segment, setSegment] = useState(null); // {persona,evidence_count,confidence} | {tooFew:true}
  const [predicted, setPredicted] = useState(null); // {predicted_pains:[...]}

  const MAX_COMMENTS = 150;
  const parseComments = (raw) =>
    raw
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 5 && !/^(답글|reply|\d+\s*(개)?|좋아요)$/i.test(l))
      .slice(0, MAX_COMMENTS);

  async function analyze() {
    setError("");
    setSegment(null);
    setPredicted(null);
    setRows([]);
    const allLines = input
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 5 && !/^(답글|reply|\d+\s*(개)?|좋아요)$/i.test(l));
    const comments = allLines.slice(0, MAX_COMMENTS);
    const trimmed = allLines.length - comments.length;
    if (comments.length === 0) {
      setError("분석할 댓글이 없습니다. 한 줄에 댓글 하나씩 붙여넣어 주세요.");
      return;
    }
    setStatus("running");
    setProgress(
      trimmed > 0
        ? `상위 ${comments.length}개만 분석합니다 (좋아요순, ${trimmed}개 제외)`
        : `${comments.length}개 분석 시작`
    );

    try {
      // ── 1단계: 배치 신호 추출 ──
      const BATCH = 15;      // 묶음 크기 ↑ (총 호출 수 최소화)
      const CONCURRENCY = 1; // 순차 처리 (세션 호출 한도 보호)
      const signals = new Array(comments.length).fill(null);
      const batchCount = Math.ceil(comments.length / BATCH);
      const batchOk = new Array(batchCount).fill(false);
      let lastErr = null;
      let okBatches = 0;
      let doneBatches = 0;
      let hardStop = false; // 세션 한도(새로고침 필요) 감지 시 즉시 중단

      const runBatch = async (b, isRetry) => {
        const offset = b * BATCH;
        const slice = comments.slice(offset, offset + BATCH);
        const block = slice.map((c, i) => `[${offset + i}] ${c}`).join("\n");
        let parsed = null;
        try {
          parsed = extractJSON(
            await callClaude(STAGE1(block), (sec, n) =>
              setProgress(`요청이 많아 ${sec}초 대기 후 재시도 중 (${n}회)`)
            )
          );
        } catch (e) {
          lastErr = e;
          if (e && e.kind === "hard") hardStop = true; // 세션 한도 → 더 쏘지 않음
        }
        const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
        if (arr.length) {
          if (!batchOk[b]) okBatches++;
          batchOk[b] = true;
        }
        arr.forEach((o) => {
          if (o && typeof o.id === "number" && o.id < comments.length) signals[o.id] = o;
        });
        if (!isRetry) {
          doneBatches++;
          setProgress(`신호 추출 중 ${doneBatches}/${batchCount}`);
        }
      };

      // 워커 풀: 하나 끝나면 다음 묶음 처리. hardStop이면 즉시 중단
      let nextIdx = 0;
      const worker = async () => {
        while (nextIdx < batchCount && !hardStop) {
          const b = nextIdx++;
          await runBatch(b, false);
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, batchCount) }, () => worker())
      );

      // 실패한 묶음 1회 재시도 — 단, 세션 한도 상황에선 시도하지 않음
      if (!hardStop) {
        const failed = [];
        for (let b = 0; b < batchCount; b++) if (!batchOk[b]) failed.push(b);
        for (let i = 0; i < failed.length && !hardStop; i++) {
          setProgress(`못 받은 묶음 재시도 중 ${i + 1}/${failed.length}`);
          await runBatch(failed[i], true);
        }
      }

      // 모든 배치가 실패하면 원인 에러를 그대로 던져 성격(kind)을 보존
      if (okBatches === 0) {
        throw lastErr || new Error("AI 응답을 받지 못함");
      }

      // ── 2단계: 규칙 기반 점수 ──
      const scored = comments.map((text, id) => {
        const sig = signals[id] || { is_pain: false };
        return { id, text, signal: sig, score: scoreSignal(sig) };
      });
      setRows(scored);

      // ── 3단계: 가장 고통이 큰 사람들 정의 (표본 작아도 의견 제시) ──
      const ranked = [...scored].filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
      const critSet = ranked.filter((r) => r.score >= 8);
      const segInput = critSet.length >= 3 ? critSet : ranked.slice(0, Math.min(8, ranked.length));
      if (segInput.length >= 1 && !hardStop) {
        setProgress("가장 고통이 큰 집단 정의 중");
        const block = segInput.map((r) => `- ${r.text}`).join("\n");
        try {
          let seg = extractJSON(
            await callClaude(STAGE3(block), (sec, n) =>
              setProgress(`요청이 많아 ${sec}초 대기 후 재시도 중 (${n}회)`)
            )
          );
          if (Array.isArray(seg)) seg = seg[0] || null;
          if (seg) setSegment(seg);
        } catch (e) {
          /* 집단 정의 실패는 치명적 아님 */
        }
      }

      // ── 4단계: 댓글 + 지식 기반 니즈·솔루션 예측 (표본 작아도 항상) ──
      if (!hardStop) {
        setProgress("사람들이 원하는 것 예측 중");
        const block = scored.slice(0, 80).map((r) => `- ${r.text}`).join("\n");
        try {
          let pred = extractJSON(
            await callClaude(STAGE4(block), (sec, n) =>
              setProgress(`요청이 많아 ${sec}초 대기 후 재시도 중 (${n}회)`)
            )
          );
          if (Array.isArray(pred)) pred = { predicted_needs: pred };
          if (pred && Array.isArray(pred.predicted_needs)) setPredicted(pred);
        } catch (e) {
          /* 예측 실패는 치명적 아님 — 나머지 결과는 유지 */
        }
      }

      setStatus("done");
      setProgress("");
    } catch (e) {
      console.error(e);
      const kind = (e && e.kind) || classifyError(e && e.status, e && e.message);
      let msg;
      if (kind === "hard") {
        msg =
          "AI 호출 한도에 도달했습니다. 이 페이지를 새로고침(F5)한 뒤, 댓글 수를 30개 이하로 줄여 다시 시도해 주세요. (한 영상당 30~50개면 8~10 비율 보기에 충분합니다)";
      } else if (kind === "soft") {
        msg =
          "지금 AI 요청이 몰려 일시적으로 제한됐습니다. 잠시 후 다시 눌러주세요. 계속되면 댓글 수를 줄여보세요.";
      } else {
        msg = "오류: " + (e && e.message ? e.message : "알 수 없는 오류");
      }
      setError(msg);
      setStatus("error");
    }
  }

  const summary = useMemo(() => {
    const pain = rows.filter((r) => r.score > 0);
    if (pain.length === 0) return null;
    const avg = pain.reduce((s, r) => s + r.score, 0) / pain.length;
    const band = (lo, hi) => pain.filter((r) => r.score >= lo && r.score <= hi).length;
    const total = rows.length;
    const dist = [
      { name: "1–3 가벼움", n: band(1, 3), c: "var(--p-low)" },
      { name: "4–5 신경쓰임", n: band(4, 5), c: "var(--p-mid)" },
      { name: "6–7 자꾸생각", n: band(6, 7), c: "var(--p-high)" },
      { name: "8–10 감당불가", n: band(8, 10), c: "var(--p-crit)" },
    ];
    const critN = band(8, 10);
    return { total, painN: pain.length, avg, dist, critN, gapN: pain.filter(r=>r.signal.knowledge_gap).length, payN: pain.filter(r=>r.signal.willing_to_pay).length };
  }, [rows]);

  const critQuotes = useMemo(
    () => rows.filter((r) => r.score >= 8).sort((a, b) => b.score - a.score).slice(0, 3),
    [rows]
  );

  const [copied, setCopied] = useState(false);

  const buildHandoffPrompt = () => {
    if (!summary) return "";
    const pct = (n) => (summary.painN ? Math.round((n / summary.painN) * 100) : 0);
    const topComments = rows
      .filter((r) => r.score >= 6)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map((r) => `- (고통 ${r.score}) ${r.text}`)
      .join("\n");
    const needsBlock =
      predicted && predicted.predicted_needs
        ? predicted.predicted_needs
            .map((p, i) => `${i + 1}. ${p.need} — ${p.reasoning || ""}`)
            .join("\n")
        : "(예측 데이터 없음)";
    const segLine = segment && segment.persona ? segment.persona : "(집단 정의 없음)";

    return `너는 시장조사 분석가다. 아래는 어떤 유튜브 영상 댓글들을 "고통지수 측정기"로 분석한 결과다.

[고통지수 척도]
1~3: 불편하지만 크게 신경 안 씀
4~5: 신경 쓰이지만 대체재 있음
6~7: 대체재 없고 자꾸 생각남
8~10: 삶의 질 저하, 감당 불가

[분석 결과 요약]
- 분석한 고통 댓글: ${summary.painN}개 (전체 ${summary.total}개 중)
- 평균 고통지수: ${summary.avg.toFixed(1)}
- 분포: 1~3 ${pct(summary.dist[0].n)}% / 4~5 ${pct(summary.dist[1].n)}% / 6~7 ${pct(summary.dist[2].n)}% / 8~10 ${pct(summary.dist[3].n)}%
- "어떤 툴/프롬프트 쓰냐" 질문(지식공백): ${summary.gapN}건
- "유료라도 사겠다" 지불의사 표현: ${summary.payN}건

[가장 고통이 큰 집단(추정)]
${segLine}

[댓글에서 읽은 사람들의 니즈(추정)]
${needsBlock}

[고통지수 6 이상 대표 댓글]
${topComments || "(없음)"}

[요청]
위 데이터를 근거로, 이 고통("어떤 프롬프트·어떤 AI 도구 조합을 써야 할지 몰라 결과가 안 나오고 시간·비용만 낭비하는 답답함")을 고통지수 10으로 느낄 만한 핵심 그룹을 4~5가지로 정의해줘.
각 그룹마다 다음을 포함해라:
1) 그룹 이름 (한 줄)
2) 왜 이들에게는 10인가 (대체재가 없거나, 돈/마감/체면이 걸려 물러설 수 없는 이유)
3) 이들이 실제로 원하는 해결책
4) 신뢰도 (높음/보통/낮음) — 위 데이터로 뒷받침되는지, 아니면 일반 지식 기반 추정인지 구분
표본이 작아도 네 폭넓은 지식을 동원해 과감하게 추정하되, 데이터 근거와 추정을 솔직히 구분해라.`;
  };

  const copyPrompt = async () => {
    const text = buildHandoffPrompt();
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e2) {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="pim-root">
      <style>{STYLES}</style>
      <div className="pim-wrap">
        <p className="pim-kicker">Pain Index Meter · 검증 도구</p>
        <h1 className="pim-title">고통지수 측정기</h1>
        <p className="pim-sub">
          댓글을 붙여넣으면 AI가 고통 신호를 추출하고 1~10으로 분류한 뒤,
          <b style={{ color: "var(--ink)" }}> 8~10에 모인 사람들이 누구인지</b>를 정의합니다.
          이 분석은 이 화면 안에서 직접 실행됩니다.
        </p>

        {/* 입력 */}
        <div className="pim-card">
          <p className="pim-label">댓글 입력 — 한 줄에 하나</p>
          <textarea
            className="pim-ta"
            placeholder={"유튜브 댓글을 복사해 붙여넣으세요.\n불만 영상만 넣지 말고 잘 나온 결과물·튜토리얼 영상 댓글도 섞으세요.\n그래야 8~10 비율이 정직하게 나옵니다."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="pim-row">
            <button className="pim-btn" onClick={analyze} disabled={status === "running"}>
              {status === "running" ? "분석 중…" : "고통지수 측정"}
            </button>
            <button
              className="pim-btn ghost"
              onClick={() => setInput(SAMPLE)}
              disabled={status === "running"}
            >
              예시 채우기
            </button>
            {input && status !== "running" && (
              <button className="pim-btn ghost" onClick={() => { setInput(""); setRows([]); setSegment(null); setStatus("idle"); }}>
                지우기
              </button>
            )}
          </div>
          {status === "running" && (
            <div className="pim-prog"><span className="pim-dot" />{progress || "준비 중"}</div>
          )}
          {error && <p className="pim-err">{error}</p>}
        </div>

        {/* 결과 */}
        {summary && (
          <>
            <div className="pim-stats">
              <div className="pim-stat">
                <div className="v">{summary.painN}</div>
                <div className="k">고통 댓글 / 총 {summary.total}</div>
              </div>
              <div className="pim-stat">
                <div className="v" style={{ color: bandColor(summary.avg) }}>{summary.avg.toFixed(1)}</div>
                <div className="k">평균 고통지수</div>
              </div>
              <div className="pim-stat">
                <div className="v" style={{ color: "var(--p-crit)" }}>
                  {summary.painN ? Math.round((summary.critN / summary.painN) * 100) : 0}%
                </div>
                <div className="k">8–10 비중 ({summary.critN}명)</div>
              </div>
            </div>

            <div className="pim-card">
              <p className="pim-label">고통지수 분포</p>
              {summary.dist.map((d) => (
                <div className="pim-band" key={d.name}>
                  <span className="name">{d.name}</span>
                  <div className="pim-track">
                    <div
                      className="pim-fill"
                      style={{
                        width: `${summary.painN ? (d.n / summary.painN) * 100 : 0}%`,
                        background: d.c,
                      }}
                    />
                  </div>
                  <span className="pim-mono pct">{d.n}명 / {summary.painN ? Math.round((d.n / summary.painN) * 100) : 0}%</span>
                </div>
              ))}
            </div>

            {/* 사람들이 원하는 것 예측 (댓글 + 지식 기반) */}
            {predicted && predicted.predicted_needs && predicted.predicted_needs.length > 0 && (
              <div className="pim-pred">
                <h3>사람들이 원하는 것 예측</h3>
                <p className="lead">댓글을 단서로, 일반 지식까지 더해 "사람들이 진짜 원할 만한 것 + 그걸 풀어줄 아이디어"를 예측한 결과입니다. 표본이 작으면 추정 비중이 커지니 신뢰도를 함께 보세요.</p>
                {predicted.predicted_needs.map((p, i) => (
                  <div className="pim-pitem" key={i}>
                    <div className="top">
                      <span className="pim-prank">#{i + 1}</span>
                      <span className="pim-ppain">{p.need}</span>
                    </div>
                    {p.reasoning && <p className="pim-psig">↳ 근거: {p.reasoning}</p>}
                    {p.solution && (
                      <p className="pim-psig" style={{ color: "var(--ember)" }}>💡 아이디어: {p.solution}</p>
                    )}
                    <p className="pim-pmeta">신뢰도 · {p.confidence || "보통"}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 가장 고통이 큰 집단 정의 */}
            {segment && segment.persona && (
              <div className="pim-crit">
                <div className="hd">
                  <h3>★ 가장 고통이 큰 집단</h3>
                  <span className="pim-conf">신뢰도 · {segment.confidence || "보통"}</span>
                </div>
                <p className="pim-persona">{segment.persona}</p>
                {critQuotes.map((q) => (
                  <p className="pim-quote" key={q.id}>“{q.text}”</p>
                ))}
                <div className="pim-evid">
                  <span>근거 댓글 <b>{segment.evidence_count ?? summary.critN}</b>건</span>
                  <span>지식공백 질문 <b>{summary.gapN}</b>건</span>
                  <span>지불의사 표현 <b>{summary.payN}</b>건</span>
                </div>
              </div>
            )}

            {/* 클로드 AI에게 그룹 정의 물어보기용 프롬프트 */}
            <div className="pim-handoff">
              <h3>다른 Claude에게 그룹 정의 물어보기</h3>
              <p className="lead">아래 버튼을 누르면 위 분석 결과가 담긴 프롬프트가 복사됩니다. Claude(또는 다른 AI)에 붙여넣으면 "이 고통을 10으로 느끼는 그룹 4~5가지"를 정의해 줍니다.</p>
              <button className="pim-btn" onClick={copyPrompt}>
                {copied ? "복사됨 ✓ — 붙여넣으세요" : "그룹 정의 프롬프트 복사"}
              </button>
            </div>

            {/* 전체 분류 */}
            <div className="pim-card">
              <p className="pim-label">댓글별 분류</p>
              <div className="pim-list">
                {[...rows].sort((a, b) => b.score - a.score).map((r) => (
                  <div className="pim-item" key={r.id}>
                    <span className="pim-score" style={{ background: r.score ? bandColor(r.score) : "var(--line)", color: r.score ? "#15120f" : "var(--faint)" }}>
                      {r.score || "–"}
                    </span>
                    <div>
                      <div className="pim-itext">{r.text}</div>
                      {r.score > 0 && (
                        <div className="pim-tags">
                          <span className="pim-tag">{r.signal.intensity}</span>
                          <span className="pim-tag">대체재 {r.signal.alternative}</span>
                          <span className="pim-tag">{r.signal.segment}</span>
                          {r.signal.knowledge_gap && <span className="pim-tag">지식공백</span>}
                          {r.signal.willing_to_pay && <span className="pim-tag">지불의사</span>}
                          {r.signal.desperation === "있음" && <span className="pim-tag">절박</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="pim-guard">
              읽는 법 — 평균 점수 하나에 매달리지 마세요. 평균이 5여도 8–10 집단이
              뚜렷하고 지불의사가 보이면 GO 신호입니다. 8–10은 표본이 작으니 인원수와
              신뢰도를 함께 보고, “불명”이 많은 건 추측을 안 한 정직한 결과입니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
