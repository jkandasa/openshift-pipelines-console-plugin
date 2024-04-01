import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { taskRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import TaskRunDetailsSection from './TaskRunDetailsSection';
import { TaskRunModel } from '../../../models';
import ResultsList from './ResultList';
import { TaskRunKind } from '../../../types';
import './TaskRunDetails.scss';

export interface TaskRunDetailsProps {
  obj: TaskRunKind;
}

const TaskRunDetails: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <>
      <div className="co-m-pane__body">
        <TaskRunDetailsSection taskRun={taskRun} />
      </div>
      {taskRun?.status?.taskResults || taskRun?.status?.results ? (
        <div className="co-m-pane__body">
          <ResultsList
            results={taskRun.status?.taskResults || taskRun.status?.results}
            resourceName={t(TaskRunModel.labelKey)}
            status={taskRunFilterReducer(taskRun)}
          />
        </div>
      ) : null}
    </>
  );
};

export default TaskRunDetails;
