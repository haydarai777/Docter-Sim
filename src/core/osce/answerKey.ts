/**
 * Jawaban ideal tatalaksana per kasus (resep + non-farmakologi + KIE) yang disusun dari kunci OSCE.
 * Dipakai oleh tes (memastikan kunci selalu bisa dicapai) dan oleh bot simulasi keseimbangan.
 */
import { matchesCondition, type ConditionContext } from '../conditions';
import type { PatientCase } from '../types';
import { adviceApplies } from './advice';
import type { OsceContent } from './content';
import { drugCausesAllergy, expectedQuantity, patientWeight } from './prescription';
import type { DoseOption, PrescriptionLine, TherapyItem, TreatmentWork } from './types';

const fitsWeight = (o: DoseOption, kg: number) => !o.unitsByWeight || o.unitsByWeight.some((b) => kg >= b.minKg && kg < b.maxKg + 1);

/** Baris resep yang benar untuk satu pilihan dosis. */
export function idealLine(opt: DoseOption, c: PatientCase, osce: OsceContent): PrescriptionLine {
  const drug = osce.drugsById.get(opt.drug)!;
  const form = drug.forms.find((f) => !opt.forms || opt.forms.includes(f.id))!;
  const kg = patientWeight(c) ?? 60;
  let units = 1;
  if (opt.unitsByWeight) units = opt.unitsByWeight.find((b) => kg >= b.minKg && kg < b.maxKg + 1)?.units ?? 1;
  else if (opt.dose) units = opt.dose[0] / form.strength;
  else if (opt.dosePerKg) units = Math.round((((opt.dosePerKg[0] + opt.dosePerKg[1]) / 2) * kg) / form.strength * 4) / 4;
  const line: PrescriptionLine = {
    drug: opt.drug,
    form: form.id,
    units,
    schedule: opt.schedules[0]!,
    timesPerDay: opt.timesPerDay?.[0] ?? 1,
    days: opt.days?.[0] ?? 3,
    quantity: 0,
  };
  line.quantity = expectedQuantity(line, form);
  return line;
}

/** Pilihan dosis yang aman untuk pasien ini (tidak membuat alergi, sesuai pita berat badan). */
export function safeOption(item: TherapyItem, c: PatientCase, osce: OsceContent): DoseOption {
  const kg = patientWeight(c) ?? 60;
  return item.options.find((o) => !drugCausesAllergy(osce.drugsById.get(o.drug)!, c.allergy, osce) && fitsWeight(o, kg)) ?? item.options[0]!;
}

/** Jawaban ideal lengkap; `pick` menentukan butir mana yang ikut (bawaan: semua). */
export function idealTreatment(
  c: PatientCase,
  ctx: ConditionContext,
  osce: OsceContent,
  pick: (kind: 'obat' | 'nonPharm' | 'education', id: string) => boolean = () => true,
): TreatmentWork {
  const def = osce.casesById.get(c.diseaseId);
  if (!def) return { prescription: [], nonPharm: [], education: [] };
  const prescription: PrescriptionLine[] = [];
  for (const item of def.therapy.items) {
    if (!matchesCondition(item.when, ctx) || !pick('obat', item.id)) continue;
    prescription.push(idealLine(safeOption(item, c, osce), c, osce));
  }
  return {
    prescription,
    nonPharm: def.nonPharm.filter((a) => adviceApplies(a, ctx) && pick('nonPharm', a.id)).map((a) => a.id),
    education: def.education.filter((a) => adviceApplies(a, ctx) && pick('education', a.id)).map((a) => a.id),
  };
}
