export type EventScheduleInput = {
  start_at?: string;
  end_at?: string;
  event_date?: string;
  expire_date?: string;
  is_all_day?: boolean;
};

export function resolveSchedule(payload: EventScheduleInput) {
  let startAt = payload.start_at ? new Date(payload.start_at) : null;
  let endAt = payload.end_at ? new Date(payload.end_at) : null;

  if (!startAt && payload.event_date) startAt = new Date(`${payload.event_date}T00:00:00.000Z`);
  if (!endAt && payload.expire_date) endAt = new Date(`${payload.expire_date}T23:59:59.000Z`);

  if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return null;
  }

  if (payload.is_all_day) {
    const startDate = startAt.toISOString().slice(0, 10);
    const endDate = endAt.toISOString().slice(0, 10);
    startAt = new Date(`${startDate}T00:00:00.000Z`);
    endAt = new Date(`${endDate}T23:59:59.000Z`);
  }

  return { startAt, endAt };
}
