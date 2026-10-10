#!/usr/bin/env bash
#
# Wait for a Railway service's newest deployment to finish, and fail if it did not succeed.
#
#   scripts/await-railway-deployment.sh thrive-api
#
# Pointing a service at an image tag returns as soon as Railway has accepted it, long
# before the container is running. Without this the next step would deploy against a
# service that is still starting, and a crash loop would read as a green deploy.
#
# Needs RAILWAY_API_TOKEN in the environment, as every Railway command here does, and —
# because a workspace-scoped token belongs to no project in particular —
# RAILWAY_PROJECT_ID and RAILWAY_ENVIRONMENT_NAME to say which service is meant.

set -euo pipefail

SERVICE="${1:?usage: await-railway-deployment.sh <service>}"
TIMEOUT_SECONDS="${2:-600}"
INTERVAL_SECONDS=10

: "${RAILWAY_PROJECT_ID:?RAILWAY_PROJECT_ID is not set}"
: "${RAILWAY_ENVIRONMENT_NAME:?RAILWAY_ENVIRONMENT_NAME is not set}"

# Railway's own vocabulary. Anything outside both lists means the deployment is still
# moving, so we keep waiting.
SUCCEEDED="SUCCESS"
FAILED="FAILED CRASHED REMOVED SKIPPED"

deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))

while :; do
  # `|| true`: a transient API error should cost one interval, not the deployment.
  listing=$(railway deployment list \
    --project "$RAILWAY_PROJECT_ID" \
    --environment "$RAILWAY_ENVIRONMENT_NAME" \
    --service "$SERVICE" \
    --limit 1 --json 2>/dev/null || true)
  status=$(printf '%s' "$listing" | jq -r 'if type == "array" then .[0].status else .deployments[0].status // empty end' 2>/dev/null || true)

  case " $SUCCEEDED " in
    *" $status "*)
      echo "$SERVICE: $status"
      exit 0
      ;;
  esac

  case " $FAILED " in
    *" $status "*)
      echo "::error::$SERVICE deployment ended as $status"
      echo "::error::Logs: railway logs --project $RAILWAY_PROJECT_ID --environment $RAILWAY_ENVIRONMENT_NAME --service $SERVICE"
      exit 1
      ;;
  esac

  if [ "$(date +%s)" -ge "$deadline" ]; then
    # An empty status here means the listing could not be read at all, which is a
    # different problem from a slow deployment — say which one it was.
    if [ -z "${status:-}" ]; then
      echo "::error::$SERVICE: could not read a deployment status in ${TIMEOUT_SECONDS}s."
      echo "::error::Last response: ${listing:-<empty>}"
    else
      echo "::error::$SERVICE: still $status after ${TIMEOUT_SECONDS}s."
    fi
    exit 1
  fi

  echo "$SERVICE: ${status:-unknown}, waiting…"
  sleep "$INTERVAL_SECONDS"
done
