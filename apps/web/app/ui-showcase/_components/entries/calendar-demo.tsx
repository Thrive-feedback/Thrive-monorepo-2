'use client';

import { useState } from 'react';
import { Calendar } from '@/components/atoms/calendar';
import { Label } from '@/components/atoms/label';
import { DatePicker } from '@/components/molecules/date-picker';
import { TimePicker } from '@/components/molecules/time-picker';

/** Fixed days, so the showcase draws the same month on any day it is opened. */
const TODAY = '2026-11-26';

export function CalendarDemo({
  initial = '2026-12-02',
  min,
}: {
  initial?: string | null;
  min?: string;
}) {
  const [day, setDay] = useState<string | null>(initial);
  return <Calendar value={day} onChange={setDay} today={TODAY} min={min} />;
}

export function DatePickerDemo({
  id,
  label,
  initial = null,
  clearable = false,
  min,
  placeholder,
}: {
  id: string;
  label: string;
  initial?: string | null;
  clearable?: boolean;
  min?: string;
  placeholder?: string;
}) {
  const [day, setDay] = useState<string | null>(initial);
  return (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <DatePicker
        id={id}
        value={day}
        onChange={setDay}
        today={TODAY}
        min={min}
        clearable={clearable}
        placeholder={placeholder}
      />
    </div>
  );
}

export function TimePickerDemo({
  id,
  label,
  initial = null,
}: {
  id: string;
  label: string;
  initial?: number | null;
}) {
  const [minutes, setMinutes] = useState<number | null>(initial);
  return (
    <div className="flex w-40 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <TimePicker id={id} value={minutes} onChange={setMinutes} />
    </div>
  );
}
