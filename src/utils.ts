// Utility helpers

/** Generate a 6-char uppercase room code */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Generate a UUID-like ID */
export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Format timestamp to HH:MM:SS */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

/** Format elapsed seconds */
export function formatElapsed(startMs: number): string {
  const secs = Math.floor((Date.now() - startMs) / 1000);
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Speaker color index cycling */
export function getColorIndex(index: number): 1 | 2 | 3 | 4 {
  return ((index % 4) + 1) as 1 | 2 | 3 | 4;
}

/** Get speaker CSS color variable */
export function getSpeakerColor(colorIndex: 1 | 2 | 3 | 4): string {
  const map = {
    1: '#0d9488',
    2: '#4f46e5',
    3: '#e11d48',
    4: '#d97706',
  };
  return map[colorIndex];
}

/** Get speaker background variable */
export function getSpeakerBg(colorIndex: 1 | 2 | 3 | 4): string {
  const map = {
    1: '#f0fdfa',
    2: '#eef2ff',
    3: '#fff1f2',
    4: '#fffbeb',
  };
  return map[colorIndex];
}

/** Get initials from name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Build join URL */
export function buildJoinUrl(code: string): string {
  return `${window.location.origin}/join/${code}`;
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
}

/** Clamp a value */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/** Export transcript as TXT */
export function exportTranscriptTxt(captions: { speakerName: string; text: string; finalizedAt?: number; startedAt: number }[]): void {
  const lines = captions
    .filter((c) => c.text.trim())
    .map((c) => `[${formatTime(c.finalizedAt ?? c.startedAt)}] ${c.speakerName}: ${c.text}`)
    .join('\n');
  downloadFile('transcript.txt', lines, 'text/plain');
}

/** Export transcript as JSON */
export function exportTranscriptJson(captions: unknown[]): void {
  const json = JSON.stringify(captions, null, 2);
  downloadFile('transcript.json', json, 'application/json');
}

/** Export transcript as SRT */
export function exportTranscriptSrt(
  captions: { speakerName: string; text: string; startedAt: number; finalizedAt?: number }[]
): void {
  const lines = captions
    .filter((c) => c.text.trim())
    .map((c, i) => {
      const start = msToSrt(c.startedAt);
      const end = msToSrt((c.finalizedAt ?? c.startedAt) + 3000);
      return `${i + 1}\n${start} --> ${end}\n${c.speakerName}: ${c.text}\n`;
    })
    .join('\n');
  downloadFile('transcript.srt', lines, 'text/plain');
}

function msToSrt(ms: number): string {
  const d = new Date(ms);
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  const ss = d.getUTCSeconds().toString().padStart(2, '0');
  const mmm = d.getUTCMilliseconds().toString().padStart(3, '0');
  return `${hh}:${mm}:${ss},${mmm}`;
}

function downloadFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
