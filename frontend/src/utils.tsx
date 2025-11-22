import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { AxiosPromise } from "axios";
import { Typography } from "@mui/material";
import { Api } from "./api";
import { useDeepCompareEffectNoCheck } from "use-deep-compare-effect";

export type Nullable<T> = T | null | undefined;

// Define a function to fmap over a nullable value
export function mapNullable<T, U>(
  value: Nullable<T>,
  mapper: (val: T) => U,
): Nullable<U> {
  switch (value) {
    case null:
      return null;
    case undefined:
      return undefined;
    default:
      return mapper(value);
  }
}

export function randomInRange(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a));
}

export function randomBool() {
  return Math.random() >= 0.5;
}

export function formatDate(date: string) {
  return format(date, "MMMM d, yyyy");
}

export function getCurrDate(): string {
  return Date();
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize state with value from localStorage or fallback to initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    // TODO: note if key has already been used before
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored JSON string or return initial value
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Failed to retrieve data from localStorage", error);
      return initialValue;
    }
  });

  // Update localStorage whenever state changes
  useDeepCompareEffectNoCheck(() => {
    try {
      // TODO: check if types are equal, throw error if not
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// https://stackoverflow.com/a/66494926/13534562
export const stringToColor = (str: string): string => {
  let stringUniqueHash = [...str].reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${stringUniqueHash % 360}, 95%, 35%)`;
};

export const redirect = (to: string) => {
  window.location.href = to;
};

export const HardRedirect = ({ to }: { to: string }) => {
  useEffect(() => {
    window.location.href = to;
  }, [to]);

  return null;
};

export const ErrorWidget = ({
  errors,
}: {
  errors: (string | null | undefined)[];
}) => {
  return errors.map((error, i) => {
    return (
      error && (
        <Typography key={i} color="red">
          {error}
        </Typography>
      )
    );
  });
};

export function arraySwap<T>(arr: T[], i: number, j: number) {
  const newArr = [...arr];
  const temp = newArr[i];
  newArr[i] = newArr[j];
  newArr[j] = temp;
  return newArr;
}

export const handleApiErr = (error: any): string => {
  console.log(error);

  var errMsg;

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data.detail);
    console.log(error.response.status);
    console.log(error.response.headers);
    errMsg = "Error:" + error.response.data.detail;
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
    errMsg = "Error: No response received: " + error.request;
  } else if (error.message) {
    // Something happened in setting up the request that triggered an Error
    console.log(error.message);
    errMsg = "Error: " + error.message;
  } else {
    console.log("Error: Unkown Error");
    return "Error: Unkown Error";
  }

  console.log(error.config);
  return errMsg;
};

export const withApi = async (
  fn: (api: ApiType) => Promise<void>,
  setError: (error: string) => void,
  handleError?: (e: any) => void,
) => {
  try {
    await fn(Api);
  } catch (e) {
    try {
      if (handleError) {
        handleError(e);
      } else {
        setError(handleApiErr(e));
      }
    } catch (e: any) {
      setError(handleApiErr(e));
    }
  }
};

type AxiosPromiseType<T extends AxiosPromise<any>> =
  T extends AxiosPromise<infer U> ? U : never;
type PromiseType<T extends Promise<any>> =
  T extends Promise<infer U> ? U : never;

type ApiType = typeof Api;
type ApiMethod = keyof ApiType;
type ApiReturnType<T> = AxiosPromiseType<ReturnType<ApiType[T & ApiMethod]>>;

type ApiOnSuccess<T> = (
  response: PromiseType<ReturnType<ApiType[T & ApiMethod]>>,
) => void;

type ApiCBExtraParams<T> = {
  options?: EndpointToOptions<T>;
  onSuccess?: ApiOnSuccess<T>;
  handleError?: (e: any) => void;
};

type ApiCB<T> =
  EndpointToReqParam<T> extends undefined
    ? (
        requestParameters?: EndpointToReqParam<T>,
        extraParams?: ApiCBExtraParams<T>,
      ) => void
    : (
        requestParameters: EndpointToReqParam<T>,
        extraParams?: ApiCBExtraParams<T>,
      ) => void;

type ApiFnExtraParams<T> = {
  onSuccess?: ApiOnSuccess<T>;
  handleError?: (e: any) => void;
};

type ApiFnRet<T> = [string | null, ApiCB<T>, boolean];

type ApiFn<OneOfPossibleOptions> = <const T extends OneOfPossibleOptions>(
  method: T,
  extraParams?: ApiFnExtraParams<T>,
) => ApiFnRet<T>;

type IntersectionToRenderedIntersectionApi<U> = (
  U extends any ? (_: ApiFn<U>) => void : never
) extends (_: infer I) => void
  ? I
  : never;

export const useApi: IntersectionToRenderedIntersectionApi<ApiMethod> = <
  T extends ApiMethod,
>(
  method: T,
  extraParams?: ApiFnExtraParams<T>,
) => {
  const fnExtraParams = extraParams;
  // FIXME: only works for one request at a time
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendReq: ApiCB<T> = useCallback(
    async (
      requestParameters: EndpointToReqParam<T> | undefined,
      extraParams?: ApiCBExtraParams<T>,
    ) => {
      setLoading(true);
      setError(null);

      const fnOnSuccess = fnExtraParams?.onSuccess;
      const onSuccess = extraParams?.onSuccess;
      const options = extraParams?.options;
      await withApi(
        async (api) => {
          if (requestParameters !== undefined) {
            const response = await (api[method] as any)(
              requestParameters,
              options,
            );
            fnOnSuccess && fnOnSuccess(response);
            onSuccess && onSuccess(response);
          } else {
            const response = await (api[method] as any)(options);
            fnOnSuccess && fnOnSuccess(response);
            onSuccess && onSuccess(response);
          }
        },
        setError as (error: string) => void,
        extraParams?.handleError,
      );
      setLoading(false);
    },
    [method, ...Object.values(fnExtraParams ?? {})], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const res: ApiFnRet<T> = [error, sendReq, loading];

  return res;
};

type EndpointToReqParam<T> =
  Parameters<ApiType[T & ApiMethod]> extends [
    requestParameters: infer R,
    options?: infer _O,
  ]
    ? R
    : undefined;

type EndpointToOptions<T> =
  Parameters<ApiType[T & ApiMethod]> extends [options?: infer O]
    ? O
    : Parameters<ApiType[T & ApiMethod]> extends [
          requestParameters: infer _R,
          options?: infer O,
        ]
      ? O
      : undefined;

type ApiStateFnRet<T> = [
  string | null,
  ApiReturnType<T> | null,
  { loading: boolean; refetch: () => void },
];

type ApiStateFnExtraParams<T> = {
  options?: EndpointToOptions<T>;
  extraDeps?: any[];
  onSuccess?: ApiOnSuccess<T>;
  handleError?: (e: any) => void;
};

// https://github.com/microsoft/TypeScript/issues/27808
// Here you define how your function overload will look
type ApiStateFn<OneOfPossibleOptions> =
  EndpointToReqParam<OneOfPossibleOptions> extends undefined
    ? <const T extends OneOfPossibleOptions>(
        method: T,
        // if requestParameters is null, no requests are made
        // if requestParameters is undefined, the endpoint doesn't need them
        requestParameters?: EndpointToReqParam<T> | null,
        extraParams?: ApiStateFnExtraParams<T>,
      ) => ApiStateFnRet<T>
    : <const T extends OneOfPossibleOptions>(
        method: T,
        // if requestParameters is null, no requests are made
        requestParameters: EndpointToReqParam<T> | null,
        extraParams?: ApiStateFnExtraParams<T>,
      ) => ApiStateFnRet<T>;

type IntersectionToRenderedIntersectionApiState<U> = (
  U extends any ? (_: ApiStateFn<U>) => void : never
) extends (_: infer I) => void
  ? I
  : never;

export const useApiState: IntersectionToRenderedIntersectionApiState<
  ApiMethod
> = <T extends ApiMethod>(
  method: T,
  requestParameters: EndpointToReqParam<T> | null | undefined,
  extraParams?: ApiStateFnExtraParams<T>,
) => {
  type Data = ApiReturnType<T>;
  const [data, setData] = useState<Data | null>(null);
  // @ts-ignore
  const [error, cb, loading] = useApi<T>(method);

  const onSuccess = extraParams?.onSuccess;
  const sendReq: () => void = () => {
    if (requestParameters === null) {
      setData(null);
      return;
    }
    cb(
      // requestParameters can only be undefined, if EndpointToReqParam<T> extends undefined
      requestParameters as EndpointToReqParam<T>,
      {
        ...extraParams,
        onSuccess: (response) => {
          setData(response.data as any); // FIXME: ?
          onSuccess && onSuccess(response);
        },
      },
    );
  };

  useDeepCompareEffectNoCheck(sendReq, [
    requestParameters,
    extraParams?.extraDeps,
  ]);

  const res: ApiStateFnRet<T> = [error, data, { loading, refetch: sendReq }];

  return res;
};

type Endpoints = {
  [Property in keyof ApiType]: Property;
};

// helper to have autocompletion for the strings of all endpoints, should be used like this:
/* const [friends, setFriends, loadingFr, errorFr] = useApiState(DApi.apiFriendsGet); */
// @ts-ignore
export const DApi: Endpoints = Object.fromEntries(
  Object.keys(Api).map((endpoint) => [endpoint, endpoint]),
);

export function useTitle(name: string): void;
export function useTitle(fn: () => string): void;
export function useTitle(arg: string | (() => string)) {
  useEffect(() => {
    if (typeof arg === "string") {
      document.title = "TrainFriends - " + arg;
    } else {
      document.title = "TrainFriends - " + arg();
    }
    return () => {
      document.title = "TrainFriends";
    };
  }, [arg]);
}
