/**
 * This hook is used to initialize the Datadog RUM SDK.
 *
 * TODO expand functionality https://docs.datadoghq.com/real_user_monitoring/browser/modifying_data_and_context/?tab=npm
 */

import { useEffect, useContext, createContext } from 'react';
import { datadogRum } from '@datadog/browser-rum';

export const DatadogContext = createContext({});

export const DatadogProvider = DatadogContext.Provider;

export const useDatadog = () => {
  const context = useContext(DatadogContext);
  if (!context) {
    throw new Error('useDatadog must be used within a DatadogProvider');
  }

  useEffect(() => {
    if (!context.applicationId || !context.clientToken || !context.service) {
      return;
    }

    if (datadogRum.getInitConfiguration()) return;
    datadogRum.init({
      applicationId: context.applicationId,
      clientToken: context.clientToken,
      site: context.site || 'datadoghq.com',
      service: context.service,
      env: context.env,
      version: context.version,
      sampleRate: context.sampleRate || 100,
      sessionReplaySampleRate: context.sessionReplaySampleRate || 20,
      trackResources: true,
      trackLongTasks: true,
      trackInteractions: true,
      trackFrustrations: true,
      defaultPrivacyLevel: 'mask-user-input',
    });

    datadogRum.startSessionReplayRecording();
  }, [context]);
};
