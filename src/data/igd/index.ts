/**
 * Skenario mode IGD.
 * ⚠ Konten klinis BELUM DITINJAU DOKTER (lihat docs/igd.md).
 */
import type { EdScenario } from '../../core/igd/types';
import { JANTUNG } from './scenarios/jantung';
import { NEURO } from './scenarios/neuro';
import { OBSTETRI_RINGAN } from './scenarios/obstetri_ringan';
import { PERNAPASAN } from './scenarios/pernapasan';
import { TOKSIK_SYOK } from './scenarios/toksik_syok';
import { TRAUMA } from './scenarios/trauma';

export const ED_SCENARIOS: readonly EdScenario[] = [...PERNAPASAN, ...JANTUNG, ...NEURO, ...TRAUMA, ...TOKSIK_SYOK, ...OBSTETRI_RINGAN];

export const ED_SCENARIOS_BY_ID: ReadonlyMap<string, EdScenario> = new Map(ED_SCENARIOS.map((s) => [s.id, s]));
