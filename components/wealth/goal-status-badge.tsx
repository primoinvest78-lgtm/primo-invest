import { Badge } from "@/components/ui/badge";
import { GOAL_STATUS_LABEL, type GoalStatus } from "@/lib/utils/goal-helpers";

const VARIANT: Record<GoalStatus, "default" | "destructive" | "outline" | "secondary"> = {
  em_dia: "default",
  atencao: "outline",
  em_risco: "destructive",
  concluida: "secondary",
};

const CLASS: Record<GoalStatus, string> = {
  em_dia: "",
  atencao: "border-warning/50 bg-warning/15 text-warning",
  em_risco: "",
  concluida: "bg-secondary text-secondary-foreground",
};

export function GoalStatusBadge({ status }: { status: GoalStatus }) {
  return <Badge variant={VARIANT[status]} className={CLASS[status]}>{GOAL_STATUS_LABEL[status]}</Badge>;
}
