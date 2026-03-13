import type {
  FacetAiAccessContext,
  FacetAiAccessDecision,
  FacetAiFeatureKey,
  FacetEntitlementStatus,
} from '../types/hosted'

const HOSTED_ALLOWED_STATUSES = new Set<FacetEntitlementStatus>(['trial', 'active', 'grace'])

export function resolveAiAccess(
  context: FacetAiAccessContext,
  feature: FacetAiFeatureKey,
): FacetAiAccessDecision {
  if (context.deploymentMode === 'self-hosted') {
    return context.selfHostedAi.proxyConfigured
      ? {
          allowed: true,
          source: 'self-hosted-operator',
          reason: null,
        }
      : {
          allowed: false,
          source: 'none',
          reason: 'self_hosted_proxy_unavailable',
        }
  }

  const entitlement = context.entitlement
  if (!entitlement || !entitlement.features.includes(feature)) {
    return {
      allowed: false,
      source: 'none',
      reason: 'upgrade_required',
    }
  }

  if (HOSTED_ALLOWED_STATUSES.has(entitlement.status)) {
    return {
      allowed: true,
      source: 'hosted-entitlement',
      reason: null,
    }
  }

  if (entitlement.status === 'delinquent') {
    return {
      allowed: false,
      source: 'none',
      reason: 'billing_issue',
    }
  }

  return {
    allowed: false,
    source: 'none',
    reason: 'upgrade_required',
  }
}
