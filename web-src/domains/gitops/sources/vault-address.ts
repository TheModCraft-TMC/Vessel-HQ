/**
 * Example shown for the optional internal Vault address. Vault's listener is
 * often plain HTTP inside a private Docker or Kubernetes network, and the
 * backend accepts any http(s) address here, so the hint keeps that form.
 */
export const VAULT_INTERNAL_ADDRESS_PLACEHOLDER = 'http://vault:8200'; // NOSONAR -- example text for a supported private-network HTTP listener, not a request target
