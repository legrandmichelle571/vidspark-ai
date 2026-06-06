/**
 * VidSpark Onboarding — External Script
 * Moved from inline script to comply with CSP v3
 */

console.log('[VidSpark Onboarding] Script loaded');

function initOnboarding() {
  console.log('[VidSpark Onboarding] initOnboarding() called');

  const tosCheck = document.getElementById('tosCheck');
  const privacyCheck = document.getElementById('privacyCheck');
  const googleButton = document.getElementById('googleButton');
  const errorMessage = document.getElementById('errorMessage');
  const skipLink = document.getElementById('skipLink');

  console.log('[VidSpark Onboarding] Elements found:', {
    tosCheck: !!tosCheck,
    privacyCheck: !!privacyCheck,
    googleButton: !!googleButton,
    errorMessage: !!errorMessage,
    skipLink: !!skipLink
  });

  if (!tosCheck || !privacyCheck || !googleButton) {
    console.error('[VidSpark Onboarding] Critical elements missing!');
    return;
  }

  // Enable button only when both checkboxes are checked
  const updateButtonState = () => {
    const bothChecked = tosCheck.checked && privacyCheck.checked;
    googleButton.disabled = !bothChecked;
    console.log('[VidSpark Onboarding] Button state updated:', {
      disabled: googleButton.disabled,
      tosCheck: tosCheck.checked,
      privacyCheck: privacyCheck.checked
    });
  };

  tosCheck.addEventListener('change', updateButtonState);
  privacyCheck.addEventListener('change', updateButtonState);
  console.log('[VidSpark Onboarding] Checkbox listeners attached');

  // Google login
  googleButton.addEventListener('click', async (e) => {
    console.log('[VidSpark Onboarding] Google button clicked', { disabled: googleButton.disabled });
    e.preventDefault();

    if (googleButton.disabled) {
      console.log('[VidSpark Onboarding] Button is disabled, returning');
      return;
    }

    googleButton.classList.add('loading');
    googleButton.disabled = true;
    errorMessage.classList.remove('show');
    console.log('[VidSpark Onboarding] Sending auth message to background');

    try {
      // Send message to background script to trigger Google auth
      chrome.runtime.sendMessage(
        { type: 'VIDSPARK_AUTH', payload: { action: 'google' } },
        (response) => {
          console.log('[VidSpark Onboarding] Auth response received:', response);
          googleButton.classList.remove('loading');

          if (response?.error) {
            console.error('[VidSpark Onboarding] Auth error:', response.error);
            errorMessage.textContent = response.error;
            errorMessage.classList.add('show');
            googleButton.disabled = false;
          } else if (response?.user) {
            // Success - close popup and wait for channel selection
            console.log('[VidSpark Onboarding] Auth successful, waiting for channel selection');
            // Don't close immediately - wait for channel selection popup
            setTimeout(() => window.close(), 1000);
          } else {
            console.warn('[VidSpark Onboarding] Unexpected response:', response);
            googleButton.disabled = false;
          }
        }
      );
    } catch (err) {
      console.error('[VidSpark Onboarding] Error:', err);
      errorMessage.textContent = 'Authentication failed. Please try again.';
      errorMessage.classList.add('show');
      googleButton.classList.remove('loading');
      googleButton.disabled = false;
    }
  });
  console.log('[VidSpark Onboarding] Google button listener attached');

  // Skip link - open in read-only mode
  skipLink.addEventListener('click', (e) => {
    console.log('[VidSpark Onboarding] Skip link clicked');
    e.preventDefault();
    chrome.storage.local.set({ onboardingSkipped: true });
    window.close();
  });
  console.log('[VidSpark Onboarding] Skip link listener attached');
}

// Run initialization when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnboarding);
  console.log('[VidSpark Onboarding] Waiting for DOMContentLoaded');
} else {
  initOnboarding();
  console.log('[VidSpark Onboarding] DOM already loaded, initializing now');
}
