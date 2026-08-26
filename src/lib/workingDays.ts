import { addDays, format, parseISO } from "date-fns";

export type CompanyClosure = {
  closed_weekdays?: number[] | null; // 0 = dimanche ... 6 = samedi
  closed_dates?: string[] | null; // "yyyy-MM-dd"
};

export const WEEKDAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

export const isOpenDay = (d: Date, c?: CompanyClosure | null) => {
  const closedWeekdays = c?.closed_weekdays ?? [0, 6];
  if (closedWeekdays.includes(d.getDay())) return false;
  const closedDates = c?.closed_dates ?? [];
  return !closedDates.includes(format(d, "yyyy-MM-dd"));
};

/** Prochain jour ouvré (le jour lui-même s'il est ouvert). */
export const nextOpenDay = (d: Date, c?: CompanyClosure | null) => {
  let cur = d;
  for (let i = 0; i < 400 && !isOpenDay(cur, c); i++) cur = addDays(cur, 1);
  return cur;
};

/**
 * Retourne la date de fin après `days` jours ouvrés (jour de début inclus).
 * days = 1 => la date de fin est le jour de début (s'il est ouvré).
 */
export const addWorkingDays = (start: Date, days: number, c?: CompanyClosure | null) => {
  let cur = nextOpenDay(start, c);
  let remaining = Math.max(1, days) - 1;
  let guard = 0;
  while (remaining > 0 && guard < 2000) {
    cur = addDays(cur, 1);
    if (isOpenDay(cur, c)) remaining--;
    guard++;
  }
  return cur;
};

export const toISODate = (d: Date) => format(d, "yyyy-MM-dd");
export const fromISODate = (s: string) => parseISO(s);
