import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import {
  TableColumn,
  VirtualizedTable,
  useActiveColumns,
} from '@openshift-console/dynamic-plugin-sdk';
import PipelineRunsForRepositoriesRow from './PipelineRunsForRepositoriesRow';
import { SummaryProps, sortByNumbers, sortByProperty, sortTimeStrings, listPageTableColumnClasses as tableColumnClasses } from '../utils';


type PipelineRunsForRepositoriesListProps = {
  summaryData: SummaryProps[];
  summaryDataFiltered: SummaryProps[];
};

const PipelineRunsForRepositoriesList: React.FC<
  PipelineRunsForRepositoriesListProps
> = ({ summaryData, summaryDataFiltered }) => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  const EmptyMsg = () => (
    <EmptyState variant={EmptyStateVariant.large}>
      {t('No PipelineRuns found')}
    </EmptyState>
  );

  const plrColumns = React.useMemo<TableColumn<SummaryProps>[]>(
    () => [
      {
        id: 'repoName',
        title: t('Repository'),
        sort: (summary, direction: 'asc' | 'desc') => sortByProperty(summary, 'repoName', direction),        
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        id: 'namespace',
        title: t('Project'),
        sort: (summary, direction: 'asc' | 'desc') => sortByProperty(summary, 'namespace', direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        id: 'total',
        title: t('Total Pipelineruns'),
        sort: 'total',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        id: 'totalDuration',
        title: t('Total duration'),
        sort: (summary, direction: 'asc' | 'desc') => sortTimeStrings(summary, 'total_duration',direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        id: 'avgDuration',
        title: t('Average duration'),
        sort: (summary, direction: 'asc' | 'desc') =>  sortTimeStrings(summary, 'avg_duration',direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        id: 'successRate',
        title: t('Success rate'),
        sort: (summary, direction: 'asc' | 'desc') =>  sortByNumbers(summary, 'succeeded',direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        id: 'lastRunTime',
        title: t('Last run time'),
        sort: (summary, direction: 'asc' | 'desc') =>  sortTimeStrings(summary, 'last_runtime',direction),
        transforms: [sortable],
        props: { className: tableColumnClasses[6] },
      },
    ],
    [t],
  );

  const [columns] = useActiveColumns({ columns: plrColumns, showNamespaceOverride: false, columnManagementID: '' });

  return (
    <VirtualizedTable
      columns={columns}
      Row={PipelineRunsForRepositoriesRow}
      data={summaryDataFiltered || summaryData}
      loaded={true}
      loadError={false}
      unfilteredData={summaryData}
      EmptyMsg={EmptyMsg}
    />
  );
};

export default PipelineRunsForRepositoriesList;
