import {
  K8sGroupVersionKind,
  K8sModel,
  K8sResourceKindReference,
} from '@openshift-console/dynamic-plugin-sdk';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom-v5-compat';

export const alphanumericCompare = (a: string, b: string): number => {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
};

export type SummaryProps = {
  total?: number;
  avg_duration?: string;
  succeeded?: number;
  failed?: number;
  running?: number;
  cancelled?: number;
  max_duration?: string;
  min_duration?: string;
  total_duration?: string;
  others?: number;
  group_value?: string;
  last_runtime?: number;
};

export type mainDataType = {
  repoName?: string;
  projectName?: string;
  pipelineName?: string;
  summary?: SummaryProps;
};

export const listPageTableColumnClasses = [
  '', //name
  '', //namespace
  'pf-m-hidden pf-m-visible-on-md', //total plr
  'pf-m-hidden pf-m-visible-on-md', //total duration
  'pf-m-hidden pf-m-visible-on-xl', //avg duration
  'pf-m-hidden pf-m-visible-on-xl', //success rate
  'pf-m-hidden pf-m-visible-on-xl', //last run time
];

export const TimeRangeOptions = () => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  return {
    '1d': t('Last day'),
    '2w': t('Last weeks'),
    '4w 2d': t('Last month'),
    '12w': t('Last quarter'),
    '52w': t('Last year'),
  };
};

export const StatusOptions = () => {
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  return {
    Succeeded: t('Succeeded'),
    Failed: t('Failed'),
    Running: t('Running'),
    Pending: t('Pending'),
    Cancelled: t('Cancelled'),
  };
};

export const IntervalOptions = () => {
  const OFF_KEY = 'OFF_KEY';
  const { t } = useTranslation('plugin__pipeline-console-plugin');
  return {
    [OFF_KEY]: t('Refresh off'),
    '15s': t('{{count}} second', { count: 15 }),
    '30s': t('{{count}} second', { count: 30 }),
    '1m': t('{{count}} minute', { count: 1 }),
    '5m': t('{{count}} minute', { count: 5 }),
    '15m': t('{{count}} minute', { count: 15 }),
    '30m': t('{{count}} minute', { count: 30 }),
    '1h': t('{{count}} hour', { count: 1 }),
    '2h': t('{{count}} hour', { count: 2 }),
    '1d': t('{{count}} day', { count: 1 }),
  };
};

export const useBoolean = (
  initialValue: boolean,
): [boolean, () => void, () => void, () => void] => {
  const [value, setValue] = React.useState(initialValue);
  const toggle = React.useCallback(() => setValue((v) => !v), []);
  const setTrue = React.useCallback(() => setValue(true), []);
  const setFalse = React.useCallback(() => setValue(false), []);
  return [value, toggle, setTrue, setFalse];
};

export const LAST_LANGUAGE_LOCAL_STORAGE_KEY = 'bridge/last-language';

export const getLastLanguage = (): string =>
  localStorage.getItem(LAST_LANGUAGE_LOCAL_STORAGE_KEY);

export const getReferenceForModel = (
  model: K8sModel,
): K8sResourceKindReference =>
  getReference({
    group: model.apiGroup,
    version: model.apiVersion,
    kind: model.kind,
  });

export const getReference = ({
  group,
  version,
  kind,
}: K8sGroupVersionKind): K8sResourceKindReference =>
  [group || 'core', version, kind].join('~');

export const sortByProperty = (
  array: SummaryProps[],
  prop: string,
  direction: string,
) => {
  return array.sort((a: SummaryProps, b: SummaryProps) => {
    const nameA =
      prop === 'namespace'
        ? a.group_value.split('/')[0].toLowerCase()
        : a.group_value.split('/')[1].toLowerCase();
    const nameB =
      prop === 'namespace'
        ? b.group_value.split('/')[0].toLowerCase()
        : b.group_value.split('/')[1].toLowerCase();

    const numberA = parseInt(nameA.replace(/^\D+/g, '')) || 0;
    const numberB = parseInt(nameB.replace(/^\D+/g, '')) || 0;

    const nameComparison = nameA.localeCompare(nameB);

    if (nameComparison === 0) {
      return direction === 'desc' ? numberB - numberA : numberA - numberB;
    }

    return direction === 'desc' ? nameComparison * -1 : nameComparison;
  });
};

export const sortTimeStrings = (
  array: SummaryProps[],
  prop: string,
  direction: string,
) => {
  return array.slice().sort((a, b) => {
    const getTimeValue = (timeString) => {
      const components = timeString?.split(/\s+/);
      let totalSeconds = 0;

      for (const component of components) {
        const value = parseInt(component);
        if (!isNaN(value)) {
          if (component.includes('year')) {
            totalSeconds += value * 365 * 24 * 3600; // Assuming 1 year = 365 days
          } else if (component.includes('month')) {
            totalSeconds += value * 30 * 24 * 3600; // Assuming 1 month = 30 days
          } else if (component.includes('day')) {
            totalSeconds += value * 24 * 3600;
          } else if (component.includes(':')) {
            // Parse HH:mm:ss.ms
            const timeParts = component.split(':').map(Number);
            totalSeconds +=
              timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            if (timeParts.length === 4) {
              totalSeconds += timeParts[3] / 1000;
            }
          }
        }
      }

      return totalSeconds;
    };

    const timeA = getTimeValue(a[prop]);
    const timeB = getTimeValue(b[prop]);

    return direction === 'asc' ? timeA - timeB : timeB - timeA;
  });
};

export const sortByTimestamp = (
  items: SummaryProps[],
  prop: string,
  direction: string,
) => {
  const compareTimestamps = (a: SummaryProps, b: SummaryProps) => {
    const timestampA = a[prop];
    const timestampB = b[prop];

    return direction === 'asc'
      ? timestampA - timestampB
      : timestampB - timestampA;
  };

  const sortedItems = [...items].sort(compareTimestamps);

  return sortedItems;
};

export const sortByNumbers = (
  array: SummaryProps[],
  prop: string,
  direction: string,
) => {
  const modifier = direction === 'desc' ? -1 : 1;

  return array.slice().sort((a, b) => {
    const valueA = a[prop];
    const valueB = b[prop];

    // If 0 is a valid value, handle it separately
    if (valueA === 0 || valueB === 0) {
      return modifier * (valueA - valueB);
    }

    return modifier * (valueA || Infinity) - (valueB || Infinity);
  });
};

export const useInterval = (
  getData: () => void,
  interval: number,
  namespace: string,
  date: string,
  pageFlag?: number,
) => {
  React.useEffect(() => {
    getData();
    if (interval !== null) {
      const intervalID = setInterval(() => getData(), interval);
      return () => clearInterval(intervalID);
    }
  }, [interval, namespace, date, pageFlag]);
};

export const getFilter = (date, parentName, kind): string => {
  const filter = [`data.status.startTime>timestamp("${date}")`];
  if (kind === 'Pipeline') {
    filter.push(`data.spec.pipelineRef.contains("name")`);
  } else if (kind === 'Repository') {
    filter.push(
      `data.metadata.labels.contains('pipelinesascode.tekton.dev/repository')`,
    );
  }
  if (parentName) {
    if (kind === 'Pipeline') {
      filter.push(
        `data.metadata.labels['tekton.dev/pipeline']=="${parentName}"`,
      );
    } else if (kind === 'Repository') {
      filter.push(
        `data.metadata.labels['pipelinesascode.tekton.dev/repository']=="${parentName}"`,
      );
    }
  }
  return filter.join(' && ');
};

export const useQueryParams = (param) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    key,
    value,
    setValue,
    defaultValue,
    options,
    displayFormat,
    loadFormat,
  } = param;
  const [isLoaded, setIsLoaded] = React.useState(0);
  //Loads Url Params Data
  React.useEffect(() => {
    if (searchParams.has(key)) {
      const paramValue = searchParams.get(key);
      if (!options || options[paramValue])
        setValue(loadFormat ? loadFormat(paramValue) : paramValue);
    }
  }, []);

  //If Url Params doesn't contain a key, initializes with defaultValue
  React.useEffect(() => {
    if (isLoaded >= 0) {
      if (!searchParams.has(key)) {
        const newValue = displayFormat
          ? displayFormat(defaultValue)
          : defaultValue;
        if (newValue) {
          setSearchParams((prevParams) => {
            const newParams = new URLSearchParams(prevParams);
            newParams.append(key, newValue);
            return newParams;
          });
          setIsLoaded(isLoaded + 1);
        }
      } else {
        setIsLoaded(-1);
      }
    }
  }, [isLoaded]);

  //Updating Url Params when values of filter changes
  React.useEffect(() => {
    const newValue = displayFormat ? displayFormat(value) : value;
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      if (newValue)
        newParams.has(key)
          ? newParams.set(key, newValue)
          : newParams.append(key, newValue);
      else if (newParams.has(key)) newParams.delete(key);
      return newParams;
    });
  }, [value]);
};
