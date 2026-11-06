import { AppRoute } from './dsl';
import { evaluateResponse, isAppRouteResponse } from './response';
import { TsRestResponseValidationError } from './response-validation-error';

export {
  isAppRouteResponse,
  isAppRouteOtherResponse,
  isAppRouteNoBody,
} from './response';

export const validateResponse = ({
  appRoute,
  response,
}: {
  appRoute: AppRoute;
  response: { status: number; body?: unknown };
}): { status: number; body?: unknown } => {
  if (!isAppRouteResponse(response)) return response;
  const evaluation = evaluateResponse({
    appRoute,
    response,
    validateBody: true,
  });
  if (!evaluation.success) {
    throw new TsRestResponseValidationError(appRoute, evaluation.error);
  }
  return { status: evaluation.metadata.status, body: evaluation.body };
};
