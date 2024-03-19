import { K8sKind } from '@openshift-console/dynamic-plugin-sdk';
import { chart_color_black_400 as skippedColor } from '@patternfly/react-tokens/dist/js/chart_color_black_400';
import { chart_color_black_500 as cancelledColor } from '@patternfly/react-tokens/dist/js/chart_color_black_500';
import { chart_color_blue_100 as pendingColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_100';
import { chart_color_blue_300 as runningColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import { chart_color_green_400 as successColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { global_danger_color_100 as failureColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { TektonResourceLabel } from '../../consts';
import {
  ClusterTaskModel,
  ClusterTriggerBindingModel,
  PipelineModel,
  TaskModel,
  TriggerBindingModel,
} from '../../models';
import {
  ComputedStatus,
  PipelineKind,
  PipelineRunKind,
  PipelineTask,
  TaskRunKind,
} from '../../types';
import {
  SucceedConditionReason,
  pipelineRunFilterReducer,
} from './pipeline-filter-reducer';

interface Metadata {
  name: string;
  namespace?: string;
}

export interface PropPipelineData {
  metadata: Metadata;
  latestRun?: PipelineRunKind;
}

interface StatusMessage {
  message: string;
  pftoken: { name: string; value: string; var: string };
}

export interface TaskStatus {
  PipelineNotStarted: number;
  Pending: number;
  Running: number;
  Succeeded: number;
  Cancelled: number;
  Failed: number;
  Skipped: number;
}

export const getLatestRun = (
  runs: PipelineRunKind[],
  field: string,
): PipelineRunKind => {
  if (!runs || !(runs.length > 0) || !field) {
    return null;
  }
  let latestRun = runs[0];
  if (field === 'creationTimestamp') {
    for (let i = 1; i < runs.length; i++) {
      latestRun =
        runs[i] &&
        runs[i].metadata &&
        runs[i].metadata[field] &&
        new Date(runs[i].metadata[field]) > new Date(latestRun.metadata[field])
          ? runs[i]
          : latestRun;
    }
  } else if (field === 'startTime' || field === 'completionTime') {
    for (let i = 1; i < runs.length; i++) {
      latestRun =
        runs[i] &&
        runs[i].status &&
        runs[i].status[field] &&
        new Date(runs[i].status[field]) > new Date(latestRun.status[field])
          ? runs[i]
          : latestRun;
    }
  } else {
    latestRun = runs[runs.length - 1];
  }
  if (!latestRun.status) {
    latestRun = { ...latestRun, status: { pipelineSpec: { tasks: [] } } };
  }
  if (!latestRun.status.succeededCondition) {
    latestRun.status = { ...latestRun.status, succeededCondition: '' };
  }
  latestRun.status.succeededCondition = pipelineRunFilterReducer(latestRun);
  return latestRun;
};

export const augmentRunsToData = (
  pipelines: PropPipelineData[],
  pipelineruns: PipelineRunKind[],
): PropPipelineData[] => {
  return pipelines.map((pipeline) => {
    const prsForPipeline = pipelineruns.filter(
      (pr) =>
        pr.metadata.labels?.['tekton.dev/pipeline'] === pipeline.metadata.name,
    );
    pipeline.latestRun = getLatestRun(prsForPipeline, 'creationTimestamp');
    return pipeline;
  });
};

export const getRunStatusColor = (status: string, t): StatusMessage => {
  switch (status) {
    case ComputedStatus.Succeeded:
      return {
        message: t('Succeeded'),
        pftoken: successColor,
      };
    case ComputedStatus.Failed:
      return {
        message: t('Failed'),
        pftoken: failureColor,
      };
    case ComputedStatus.FailedToStart:
      return {
        message: t('PipelineRun failed to start'),
        pftoken: failureColor,
      };
    case ComputedStatus.Running:
      return {
        message: t('Running'),
        pftoken: runningColor,
      };
    case ComputedStatus['In Progress']:
      return {
        message: t('Running'),
        pftoken: runningColor,
      };

    case ComputedStatus.Skipped:
      return {
        message: t('Skipped'),
        pftoken: skippedColor,
      };
    case ComputedStatus.Cancelled:
      return {
        message: t('Cancelled'),
        pftoken: cancelledColor,
      };
    case ComputedStatus.Cancelling:
      return {
        message: t('Cancelling'),
        pftoken: cancelledColor,
      };
    case ComputedStatus.Idle:
    case ComputedStatus.Pending:
      return {
        message: t('Pending'),
        pftoken: pendingColor,
      };
    default:
      return {
        message: t('PipelineRun not started yet'),
        pftoken: pendingColor,
      };
  }
};

export const truncateName = (name: string, length: number): string =>
  name.length < length ? name : `${name.slice(0, length - 1)}...`;

export const getPipelineFromPipelineRun = (
  pipelineRun: PipelineRunKind,
): PipelineKind => {
  const pipelineName =
    pipelineRun?.metadata?.labels?.[TektonResourceLabel.pipeline] ||
    pipelineRun?.metadata?.name;
  const pipelineSpec =
    pipelineRun?.status?.pipelineSpec || pipelineRun?.spec?.pipelineSpec;
  if (!pipelineName || !pipelineSpec) {
    return null;
  }
  return {
    apiVersion: `${PipelineModel.apiGroup}/${PipelineModel.apiVersion}`,
    kind: PipelineModel.kind,
    metadata: {
      name: pipelineName,
      namespace: pipelineRun.metadata.namespace,
    },
    spec: pipelineSpec,
  };
};

export const totalPipelineRunTasks = (
  executedPipeline: PipelineKind,
): number => {
  if (!executedPipeline) {
    return 0;
  }
  const totalTasks = (executedPipeline.spec?.tasks || []).length ?? 0;
  const finallyTasks = (executedPipeline.spec?.finally || []).length ?? 0;
  return totalTasks + finallyTasks;
};

export const getTaskStatus = (
  pipelinerun: PipelineRunKind,
  pipeline: PipelineKind,
  taskRuns: TaskRunKind[],
): TaskStatus => {
  const totalTasks = totalPipelineRunTasks(pipeline);
  const plrTasks = (): string[] => {
    if (pipelinerun?.status?.taskRuns) {
      return Object.keys(pipelinerun.status.taskRuns);
    }
    if (taskRuns) {
      return taskRuns?.map((tRun) => tRun.metadata.name);
    }
    return [];
  };
  const plrTaskLength = plrTasks().length;
  const skippedTaskLength = (pipelinerun?.status?.skippedTasks || []).length;
  const taskStatus: TaskStatus = {
    PipelineNotStarted: 0,
    Pending: 0,
    Running: 0,
    Succeeded: 0,
    Failed: 0,
    Cancelled: 0,
    Skipped: skippedTaskLength,
  };

  if (pipelinerun?.status?.taskRuns || taskRuns) {
    plrTasks().forEach((taskRun) => {
      const status = pipelineRunFilterReducer(
        taskRuns?.find((tRun) => tRun.metadata.name === taskRun) ||
          pipelinerun.status.taskRuns[taskRun],
      );
      if (status === 'Succeeded') {
        taskStatus[ComputedStatus.Succeeded]++;
      } else if (status === 'Running') {
        taskStatus[ComputedStatus.Running]++;
      } else if (status === 'Failed') {
        taskStatus[ComputedStatus.Failed]++;
      } else if (status === 'Cancelled') {
        taskStatus[ComputedStatus.Cancelled]++;
      } else {
        taskStatus[ComputedStatus.Pending]++;
      }
    });

    const pipelineRunHasFailure = taskStatus[ComputedStatus.Failed] > 0;
    const pipelineRunIsCancelled =
      pipelineRunFilterReducer(pipelinerun) === ComputedStatus.Cancelled;
    const unhandledTasks =
      totalTasks >= plrTaskLength
        ? totalTasks - plrTaskLength - skippedTaskLength
        : totalTasks;

    if (pipelineRunHasFailure || pipelineRunIsCancelled) {
      taskStatus[ComputedStatus.Cancelled] += unhandledTasks;
    } else {
      taskStatus[ComputedStatus.Pending] += unhandledTasks;
    }
  } else if (
    pipelinerun?.status?.conditions?.[0]?.status === 'False' ||
    pipelinerun?.spec.status === SucceedConditionReason.PipelineRunCancelled
  ) {
    taskStatus[ComputedStatus.Cancelled] = totalTasks;
  } else if (
    pipelinerun?.spec.status === SucceedConditionReason.PipelineRunPending
  ) {
    taskStatus[ComputedStatus.Pending] += totalTasks;
  } else {
    taskStatus[ComputedStatus.PipelineNotStarted]++;
  }
  return taskStatus;
};

export const getResourceModelFromTaskKind = (kind: string): K8sKind => {
  if (kind === ClusterTaskModel.kind) {
    return ClusterTaskModel;
  }
  if (kind === TaskModel.kind || kind === undefined) {
    return TaskModel;
  }
  return null;
};

export const getSafeTaskResourceKind = (kind: string): string =>
  (getResourceModelFromTaskKind(kind) || TaskModel).kind;

export const getResourceModelFromBindingKind = (kind: string): K8sKind => {
  if (kind === ClusterTriggerBindingModel.kind) {
    return ClusterTriggerBindingModel;
  }
  if (kind === TriggerBindingModel.kind || kind === undefined) {
    return TriggerBindingModel;
  }
  return null;
};

export const getSafeBindingResourceKind = (kind: string): string =>
  (getResourceModelFromBindingKind(kind) || TriggerBindingModel).kind;

export const getResourceModelFromTask = (task: PipelineTask): K8sKind => {
  const {
    taskRef: { kind },
  } = task;

  return getResourceModelFromTaskKind(kind);
};

export const pipelineRefExists = (pipelineRun: PipelineRunKind): boolean =>
  !!pipelineRun.spec.pipelineRef?.name;

// export const getModelReferenceFromTaskKind = (
//   kind: string,
// ): GroupVersionKind => {
//   const model = getResourceModelFromTaskKind(kind);
//   return getGroupVersionKindForModel(model);
// };

export const countRunningTasks = (
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
): number => {
  const taskStatuses =
    taskRuns && getTaskStatus(pipelineRun, undefined, taskRuns);
  return taskStatuses?.Running;
};

export const shouldHidePipelineRunStop = (
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
): boolean =>
  !(
    pipelineRun &&
    (countRunningTasks(pipelineRun, taskRuns) > 0 ||
      pipelineRunFilterReducer(pipelineRun) === ComputedStatus.Running)
  );

export const shouldHidePipelineRunCancel = (
  pipelineRun: PipelineRunKind,
  taskRuns: TaskRunKind[],
): boolean =>
  !(
    pipelineRun &&
    countRunningTasks(pipelineRun, taskRuns) > 0 &&
    pipelineRunFilterReducer(pipelineRun) !== ComputedStatus.Cancelled
  );