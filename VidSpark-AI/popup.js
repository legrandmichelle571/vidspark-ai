const BACKEND_URL = 'https://vidspark-ai-production-9ac7.up.railway.app/api';

// Éléments DOM
const stateInitial = document.querySelector('.state-initial');
const stateForm = document.querySelector('.state-form');
const stateActivated = document.querySelector('.state-activated');

const btnPlan = document.getElementById('btnPlan');
const btnConnect = document.getElementById('btnConnect');
const btnActivate = document.getElementById('btnActivate');
const btnBackForm = document.getElementById('btnBackForm');
const btnNewActivation = document.getElementById('btnNewActivation');

const inputId = document.getElementById('inputId');
const inputSecret = document.getElementById('inputSecret');
const statusForm = document.getElementById('statusForm');
const daysRemaining = document.getElementById('daysRemaining');

// Vérifier si déjà activé au démarrage
chrome.storage.local.get(['activation_id', 'activation_secret', 'subscription_expiry'], (data) => {
  if (data.activation_id && data.activation_secret && data.subscription_expiry) {
    const expiry = new Date(data.subscription_expiry);
    if (expiry > new Date()) {
      showActivatedState(data);
    } else {
      // Forfait expiré
      switchState('initial');
    }
  }
});

// Bouton Plan → ouvre le site web
btnPlan.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://vidspark-site.pages.dev/dashboard' });
});

// Bouton Connecte → affiche le formulaire
btnConnect.addEventListener('click', () => {
  switchState('form');
  inputId.focus();
});

// Bouton Activer → valide auprès du backend
btnActivate.addEventListener('click', async () => {
  const id = inputId.value.trim();
  const secret = inputSecret.value.trim();

  if (!id || !secret) {
    setStatus('⚠️ Entrez ID et Secret', 'error');
    return;
  }

  btnActivate.disabled = true;
  btnActivate.textContent = '⏳ Vérification...';
  setStatus('Vérification en cours...', 'info');

  try {
    const res = await fetch(\\/activation/activate\, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activation_id: id, activation_secret: secret })
    });

    const body = await res.json();

    if (!res.ok) {
      setStatus('❌ ' + (body.error || 'Erreur'), 'error');
      btnActivate.disabled = false;
      btnActivate.textContent = '✅ Activer';
      return;
    }

    // Succès → sauvegarder et afficher
    const expiryDate = new Date(body.subscription.expiry);
    chrome.storage.local.set({
      activation_id: id,
      activation_secret: secret,
      subscription_expiry: expiryDate.toISOString(),
      user_email: body.user.email,
      user_name: body.user.name
    }, () => {
      setStatus('✅ Extension activée !', 'success');
      setTimeout(() => {
        showActivatedState({ activation_id: id, subscription_expiry: expiryDate.toISOString() });
      }, 1000);
    });
  } catch (e) {
    setStatus('❌ Erreur réseau: ' + e.message, 'error');
    btnActivate.disabled = false;
    btnActivate.textContent = '✅ Activer';
  }
});

// Bouton Retour
btnBackForm.addEventListener('click', () => {
  switchState('initial');
  inputId.value = '';
  inputSecret.value = '';
  setStatus('', '');
});

// Bouton Nouvelle activation
btnNewActivation.addEventListener('click', () => {
  chrome.storage.local.remove(['activation_id', 'activation_secret', 'subscription_expiry']);
  switchState('initial');
});

// Utilitaires
function switchState(state) {
  stateInitial.classList.remove('active');
  stateForm.classList.remove('active');
  stateActivated.classList.remove('active');

  if (state === 'initial') stateInitial.classList.add('active');
  if (state === 'form') stateForm.classList.add('active');
  if (state === 'activated') stateActivated.classList.add('active');
}

function setStatus(msg, type) {
  statusForm.textContent = msg;
  statusForm.className = 'status-message';
  if (type === 'error') statusForm.classList.add('status-error');
  if (type === 'success') statusForm.classList.add('status-success');
  if (type === 'info') statusForm.classList.add('status-info');
}

function showActivatedState(data) {
  switchState('activated');
  const expiryDate = new Date(data.subscription_expiry);
  const now = new Date();
  const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, daysLeft);

  // Afficher la durée
  if (remaining === 0) {
    daysRemaining.textContent = 'Expiré';
    daysRemaining.style.color = '#fa6d6d';
  } else if (remaining === 1) {
    daysRemaining.textContent = '1 jour';
  } else {
    daysRemaining.textContent = remaining + ' jours';
  }
}
