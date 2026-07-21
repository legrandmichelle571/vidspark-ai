// Fixture volontairement cassée AU CHARGEMENT (pas juste un contrat invalide) — simule un
// Provider avec une erreur de syntaxe/runtime dans son propre code. Doit être capturée par
// le try/catch de loadRegistry() autour de require(), avec un message qui identifie le dossier.
throw new Error('erreur simulée au chargement du module');
