import { Prose } from "@/components/Prose";
import { SeasonTable } from "@/components/SeasonTable";
import {
  SUPPORTED_Y12,
  SUPPORTED_Y34,
  UNLOCK_ALL_SEASONS,
} from "@/config/liberator-builds";

export function SupportedSeasons() {
  return (
    <Prose>
      <div className="flex flex-wrap items-start gap-x-6">
        <SeasonTable rows={SUPPORTED_Y12} />
        <SeasonTable rows={SUPPORTED_Y34} showEvent />
        <SeasonTable rows={UNLOCK_ALL_SEASONS} />
      </div>
    </Prose>
  );
}
