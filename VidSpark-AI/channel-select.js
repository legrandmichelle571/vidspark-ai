/**
 * VidSpark Channel Select — External Script
 * Moved from inline script to comply with CSP v3
 */

console.log('[VidSpark Channel Select] Script loaded');

function initChannelSelect() {
  console.log('[VidSpark Channel Select] initChannelSelect() called');

  const channelsList = document.getElementById('channelsList');
  const continueBtn = document.getElementById('continueBtn');
  const backBtn = document.getElementById('backBtn');
  const errorMessage = document.getElementById('errorMessage');
  const greeting = document.getElementById('greeting');

  console.log('[VidSpark Channel Select] Elements found:', {
    channelsList: !!channelsList,
    continueBtn: !!continueBtn,
    backBtn: !!backBtn,
    errorMessage: !!errorMessage,
    greeting: !!greeting
  });

  if (!channelsList || !continueBtn || !backBtn) {
    console.error('[VidSpark Channel Select] Critical elements missing!');
    return;
  }

  let selectedChannelId = null;
  let channels = [];

  async function loadChannels() {
    console.log('[VidSpark Channel Select] Loading channels...');
    try {
      // Get user data and token
      const result = await chrome.storage.local.get(['accessToken', 'currentUser']);
      const token = result.accessToken;
      const user = result.currentUser;

      console.log('[VidSpark Channel Select] Storage retrieved:', { hasToken: !!token, hasUser: !!user });

      if (!token || !user) {
        throw new Error('Not authenticated');
      }

      // Update greeting
      greeting.textContent = `Welcome, ${user.name || 'Creator'}!`;

      // Fetch channels from backend
      console.log('[VidSpark Channel Select] Fetching channels from backend...');
      const response = await fetch('http://localhost:3001/api/user/youtube-channels', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[VidSpark Channel Select] Backend response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw new Error('Failed to load channels');
      }

      const data = await response.json();
      channels = data.channels || [];

      console.log('[VidSpark Channel Select] Channels loaded:', { count: channels.length, channels });

      if (channels.length === 0) {
        channelsList.innerHTML = `
          <div style="text-align: center; padding: 32px; color: #8b949e;">
            <p>No YouTube channels found.</p>
            <p style="font-size: 13px; margin-top: 8px;">Make sure your Google account has YouTube channels.</p>
          </div>
        `;
        return;
      }

      // Render channels
      renderChannels();
    } catch (err) {
      console.error('[VidSpark Channel Select] Error loading channels:', err);
      errorMessage.textContent = err.message || 'Failed to load channels. Please try again.';
      errorMessage.classList.add('show');
      channelsList.innerHTML = '<div style="padding: 20px; color: #8b949e;">Error loading channels</div>';
    }
  }

  function renderChannels() {
    console.log('[VidSpark Channel Select] Rendering channels...');
    channelsList.innerHTML = channels
      .map(
        (channel) => `
      <div class="channel-item" data-channel-id="${channel.id}">
        <div class="channel-radio"></div>
        <div class="channel-info">
          <div class="channel-name">
            ${channel.title}
            ${channel.isVerified ? '<span class="channel-badge">✓ Verified</span>' : ''}
          </div>
          <div class="channel-subscribers">
            ${channel.subscriberCount ? `${channel.subscriberCount} subscribers` : 'Subscribers info unavailable'}
          </div>
        </div>
      </div>
    `
      )
      .join('');

    // Attach click handlers
    document.querySelectorAll('.channel-item').forEach((item) => {
      item.addEventListener('click', () => {
        console.log('[VidSpark Channel Select] Channel clicked:', item.dataset.channelId);
        selectChannel(item.dataset.channelId, item);
      });
    });
    console.log('[VidSpark Channel Select] Channel click handlers attached');
  }

  function selectChannel(channelId, element) {
    console.log('[VidSpark Channel Select] Selecting channel:', channelId);
    // Remove previous selection
    document.querySelectorAll('.channel-item').forEach((item) => {
      item.classList.remove('selected');
    });

    // Select new channel
    element.classList.add('selected');
    selectedChannelId = channelId;
    continueBtn.disabled = false;
    console.log('[VidSpark Channel Select] Channel selected, continue button enabled');
  }

  continueBtn.addEventListener('click', async () => {
    console.log('[VidSpark Channel Select] Continue button clicked');
    if (!selectedChannelId) {
      console.warn('[VidSpark Channel Select] No channel selected');
      return;
    }

    continueBtn.disabled = true;
    const selectedChannel = channels.find((ch) => ch.id === selectedChannelId);

    console.log('[VidSpark Channel Select] Saving channel:', selectedChannel);

    try {
      const result = await chrome.storage.local.get('accessToken');
      console.log('[VidSpark Channel Select] Making API call to set-primary-channel...');

      const response = await fetch('http://localhost:3001/api/user/set-primary-channel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${result.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: selectedChannelId,
          channelTitle: selectedChannel.title,
          channelUrl: `https://youtube.com/channel/${selectedChannelId}`
        })
      });

      console.log('[VidSpark Channel Select] API response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw new Error('Failed to set primary channel');
      }

      // Save to local storage and close
      console.log('[VidSpark Channel Select] Saving to storage and closing...');
      chrome.storage.local.set(
        {
          primaryChannelId: selectedChannelId,
          primaryChannelName: selectedChannel.title,
          onboardingComplete: true
        },
        () => {
          console.log('[VidSpark Channel Select] Storage updated, closing window');
          window.close();
        }
      );
    } catch (err) {
      console.error('[VidSpark Channel Select] Error setting primary channel:', err);
      errorMessage.textContent = err.message || 'Failed to save channel. Please try again.';
      errorMessage.classList.add('show');
      continueBtn.disabled = false;
    }
  });

  backBtn.addEventListener('click', () => {
    console.log('[VidSpark Channel Select] Back button clicked');
    window.history.back();
  });

  console.log('[VidSpark Channel Select] All listeners attached');
  loadChannels();
}

// Run initialization when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChannelSelect);
  console.log('[VidSpark Channel Select] Waiting for DOMContentLoaded');
} else {
  initChannelSelect();
  console.log('[VidSpark Channel Select] DOM already loaded, initializing now');
}
