/**
 * All-day DATE DTEND is exclusive (RFC 5545).
 * A one-day event DTSTART=D / DTEND=D+1 must occupy only local day D.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ICAL = require("ical.js");

function startOfLocalDay(d) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day;
}

function localDateMidnightIso(date) {
  return new Date(date.year, date.month - 1, date.day, 0, 0, 0).toISOString();
}

function allDayRangeIso(start, end) {
  const startsAt = localDateMidnightIso(start);
  let endsAt = end ? localDateMidnightIso(end) : startsAt;
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    const next = new Date(start.year, start.month - 1, start.day + 1, 0, 0, 0);
    endsAt = next.toISOString();
  }
  return { startsAt, endsAt };
}

function eventOverlapsLocalDay(event, dayStart, dayEnd) {
  const starts = new Date(event.startsAt).getTime();
  const ends = new Date(event.endsAt).getTime();
  return starts < dayEnd.getTime() && ends > dayStart.getTime();
}

/** Old bug: pin exclusive DATE DTEND to local noon, so it leaks into that day. */
function oldAllDayLocalIso(time) {
  return new Date(time.year, time.month - 1, time.day, 12, 0, 0).toISOString();
}

function dayBounds(year, month, day) {
  const dayStart = startOfLocalDay(new Date(year, month - 1, day));
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { dayStart, dayEnd };
}

function parseAllDay(ics) {
  const root = new ICAL.Component(ICAL.parse(ics));
  const event = new ICAL.Event(root.getFirstSubcomponent("vevent"));
  return { event, range: allDayRangeIso(event.startDate, event.endDate) };
}

const oneDayIcs = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:one-day
DTSTART;VALUE=DATE:20261115
DTEND;VALUE=DATE:20261116
SUMMARY:School closed
END:VEVENT
END:VCALENDAR`;

const twoDayIcs = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:two-day
DTSTART;VALUE=DATE:20261115
DTEND;VALUE=DATE:20261117
SUMMARY:Weekend trip
END:VEVENT
END:VCALENDAR`;

let failed = 0;
function assert(name, ok) {
  if (!ok) {
    failed += 1;
    console.error(`FAIL ${name}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

const one = parseAllDay(oneDayIcs);
const d15 = dayBounds(2026, 11, 15);
const d16 = dayBounds(2026, 11, 16);
const d17 = dayBounds(2026, 11, 17);

assert("one-day occupies 15 Nov", eventOverlapsLocalDay(one.range, d15.dayStart, d15.dayEnd));
assert(
  "one-day does not occupy 16 Nov",
  !eventOverlapsLocalDay(one.range, d16.dayStart, d16.dayEnd),
);

const oldLeak = {
  startsAt: oldAllDayLocalIso(one.event.startDate),
  endsAt: oldAllDayLocalIso(one.event.endDate),
};
assert(
  "old noon DTEND leaked onto 16 Nov",
  eventOverlapsLocalDay(oldLeak, d16.dayStart, d16.dayEnd),
);

const two = parseAllDay(twoDayIcs);
assert("two-day occupies 15 Nov", eventOverlapsLocalDay(two.range, d15.dayStart, d15.dayEnd));
assert("two-day occupies 16 Nov", eventOverlapsLocalDay(two.range, d16.dayStart, d16.dayEnd));
assert(
  "two-day does not occupy 17 Nov",
  !eventOverlapsLocalDay(two.range, d17.dayStart, d17.dayEnd),
);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nall-day exclusive DTEND checks passed");
