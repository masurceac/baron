import { assertNever } from '@baron/common';
import { SimulationExecutionStatus } from '@baron/db/enum';
import { Badge } from '@baron/ui/components/badge';

export function ExecutionStatus(props: { status: SimulationExecutionStatus }) {
  switch (props.status) {
    case SimulationExecutionStatus.Running:
      return (
        <Badge variant="blue" className="capitalize">
          {props.status}
        </Badge>
      );
    case SimulationExecutionStatus.Completed:
      return (
        <Badge variant="green" className="capitalize">
          {props.status}
        </Badge>
      );
    case SimulationExecutionStatus.Pending:
      return (
        <Badge variant="orange" className="capitalize">
          {props.status}
        </Badge>
      );
    case SimulationExecutionStatus.Failed:
    case SimulationExecutionStatus.LimitReached:
      return (
        <Badge variant="destructive" className="capitalize">
          {props.status}
        </Badge>
      );
    default:
      assertNever(props.status);
  }
}
