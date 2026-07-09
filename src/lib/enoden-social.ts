import type { EnodenScheduleResponse, SocialPost } from './enoden-types';

const API_PATH = '/api/enoden-schedule';

export async function fetchEnodenSchedule(): Promise<
  { success: true; data: EnodenScheduleResponse } | { success: false; error: string }
> {
  try {
    const response = await fetch(API_PATH, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    const data = (await response.json()) as EnodenScheduleResponse;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Derived from loo-ool.com's own rendering code (both its timetable-list function
// and its live-position function route direction===1 rows to the "下り" column/
// container and direction===2 rows to "上り") — reasonably confident, but not
// spot-checked against the live site's physical Fujisawa/Kamakura orientation.
const DIRECTION_LABELS: Record<1 | 2, string> = {
  1: '下り',
  2: '上り',
};

const WEEKDAY_LABELS_JA = ['日', '月', '火', '水', '木', '金', '土'];

export function formatScheduleAsSocialPost(data: EnodenScheduleResponse): SocialPost {
  const date = new Date(data.generatedAt);
  const dateLabel = `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_LABELS_JA[date.getDay()]})`;
  const timeLabel = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const lines =
    data.trains.length > 0
      ? data.trains.map((train, index) => {
          const label = train.isFinalLeg ? '終着間近' : DIRECTION_LABELS[train.direction];
          return `[${index + 1}] 運用${train.tripId} (${label} ${train.prevStation}→${train.nextStation})`;
        })
      : ['本日の運行情報はまだありません'];

  return {
    id: data.generatedAt,
    author: '@loo-ool (community feed)',
    content: [`${dateLabel}#江ノ電運用 ${timeLabel} 現在`, ...lines].join('\n'),
    timestamp: date,
  };
}
