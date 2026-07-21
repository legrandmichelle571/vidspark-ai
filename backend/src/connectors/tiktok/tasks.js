/**
 * Tâches déclarées dans manifest.tasks — chacune enveloppée par withProviderCall (fourni par
 * l'appelant via deps, jamais importé en dur ici pour rester testable sans DB/réseau).
 */
const { fetchProfile, verifyScopes } = require('./api');
const { createProviderCallWrapper } = require('../../utils/withProviderCall');
const manifest = require('./manifest');

/**
 * @param {{accessToken:string, grantedScopes?:string[]}} account
 * @param {{observability?:object, withProviderCall?:function}} deps
 */
async function syncProfile(account, deps = {}) {
  const withProviderCall = deps.withProviderCall || createProviderCallWrapper(deps.observability || {});
  return withProviderCall(manifest.key, account && account.id, 'sync_profile', () => fetchProfile(account.accessToken));
}

/** @param {{grantedScopes?:string[]}} account @param {object} deps */
async function verifyScopesTask(account, deps = {}) {
  const withProviderCall = deps.withProviderCall || createProviderCallWrapper(deps.observability || {});
  return withProviderCall(manifest.key, account && account.id, 'verify_scopes', () => verifyScopes(account));
}

module.exports = { syncProfile, verifyScopes: verifyScopesTask };
