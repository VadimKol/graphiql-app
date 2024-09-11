'use client';

import { notFound, usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { useEffect, useRef } from 'react';

import { USER_LOGOUT } from '@/common/constants';
import { AuthRoute } from '@/components/auth-route/AuthRoute';
import type { ObjectWithId } from '@/components/client-table/types';
import ResponseContainer from '@/components/response-container/ResponseContainer';
import RestFieldset from '@/components/rest-fieldset/RestFieldset';
import { useAppDispatch } from '@/hooks/store-hooks';
import { useCurrentLocale } from '@/locales/client';
import { setBody, setEndpoint, setHeaders, setMethod, setResponseBody, setStatus } from '@/store/rest-slice/rest-slice';
import { decodeBase64, generateUniqueId } from '@/utils/utils.ts';

import styles from './Rest.module.scss';

interface RestProps {
  responseData: {
    status?: string;
    data?: object;
    errorMessage?: string;
  } | null;
}

function Rest({ responseData }: RestProps): ReactNode {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const didMount = useRef(false);
  const locale = useCurrentLocale();
  useEffect(() => {
    if (responseData) {
      dispatch(setStatus(responseData.status || ''));
      if (responseData.errorMessage) {
        dispatch(setResponseBody(responseData.errorMessage));
      } else {
        dispatch(setResponseBody(JSON.stringify(responseData.data, null, 2)));
      }
    }
  }, [responseData, dispatch]);

  useEffect(() => {
    if (!didMount.current) {
      const pathParts: string[] = pathname.split('/').filter((_, index) => index > 1);

      if (pathParts.length >= 4) {
        notFound();
      }

      const [methodParam, endpointParam, bodyParam] = pathParts;
      dispatch(setMethod(methodParam || 'GET'));

      if (pathParts.length < 2) {
        dispatch({ type: USER_LOGOUT });
        dispatch(setHeaders([{ id: generateUniqueId(), key: 'Content-Type', value: 'application/json' }]));
      }

      if (pathParts.length >= 2) {
        dispatch(setEndpoint(decodeBase64(endpointParam || '') || ''));
        dispatch(setBody(decodeBase64(bodyParam || '') || ''));
      }

      const decodedHeaders: ObjectWithId[] = [];

      searchParams.forEach((value, key) => {
        decodedHeaders.push({ id: generateUniqueId(), key: decodeURIComponent(key), value: decodeURIComponent(value) });
      });
      dispatch(setHeaders(decodedHeaders));

      didMount.current = true;
    }
  }, [pathname, searchParams, dispatch, locale]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>REST Client</h1>
        <RestFieldset />
      </div>
      <ResponseContainer type="rest" />
    </div>
  );
}

export default AuthRoute(Rest);
