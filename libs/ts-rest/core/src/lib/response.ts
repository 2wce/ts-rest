import {
  AppRoute,
  ContractAnyType,
  ContractNoBody,
  ContractNoBodyType,
  ContractOtherResponse,
} from './dsl';
import { HTTPStatusCode } from './status-codes';
import { validateIfSchema } from './standard-schema-utils';
import { StandardSchemaError } from './validation-error';

export const isAppRouteResponse = (
  value: unknown,
): value is { status: HTTPStatusCode; body?: any } => {
  return (
    value != null &&
    typeof value === 'object' &&
    'status' in value &&
    typeof value.status === 'number'
  );
};

export const isAppRouteOtherResponse = (
  response:
    | ContractAnyType
    | ContractNoBodyType
    | ContractOtherResponse<ContractAnyType>,
): response is ContractOtherResponse<ContractAnyType> => {
  return (
    response != null &&
    typeof response === 'object' &&
    'contentType' in response
  );
};

export const isAppRouteNoBody = (
  response:
    | ContractAnyType
    | ContractNoBodyType
    | ContractOtherResponse<ContractAnyType>,
): response is ContractNoBodyType => {
  return response === ContractNoBody;
};

export type ResponseMetadata = {
  status: number;
  bodyKind: 'none' | 'value';
  contentType: string | undefined;
};

export type ResponseEvaluation =
  | { success: true; metadata: ResponseMetadata; body: unknown }
  | { success: false; metadata: ResponseMetadata; error: StandardSchemaError };

/**
 * Evaluate a supplied response body against its contract declaration.
 * Callers choose validation enablement and own native errors and response writes.
 * Invalid declarations and asynchronous validators retain configuration errors.
 */
export function evaluateResponse({
  appRoute,
  response,
  validateBody,
}: {
  appRoute: AppRoute;
  response: { status: number; body?: unknown };
  validateBody: boolean;
}): ResponseEvaluation {
  const declaration = appRoute.responses[response.status];
  const otherResponse = isAppRouteOtherResponse(declaration);
  const metadata: ResponseMetadata = {
    status: response.status,
    bodyKind: isAppRouteNoBody(declaration) ? 'none' : 'value',
    contentType: otherResponse ? declaration.contentType : undefined,
  };
  if (!validateBody) {
    return { success: true, metadata, body: response.body };
  }
  const schema = otherResponse ? declaration.body : declaration;
  const validation = validateIfSchema(response.body, schema);
  if (validation.error) {
    return { success: false, metadata, error: validation.error };
  }
  return { success: true, metadata, body: validation.value };
}
