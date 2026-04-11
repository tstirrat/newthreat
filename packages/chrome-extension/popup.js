/**
 * popup.js — manages the prod/localhost mode toggle.
 */

const modeDisplay = document.getElementById('mode-display')
const toggleBtn = document.getElementById('toggle-btn')

function render(mode) {
  if (mode === 'local') {
    modeDisplay.textContent = 'Localhost :5173'
    toggleBtn.textContent = 'Switch to Production'
    toggleBtn.className = 'active-local'
  } else {
    modeDisplay.textContent = 'Production'
    toggleBtn.textContent = 'Switch to Localhost :5173'
    toggleBtn.className = ''
  }
}

chrome.storage.local.get({ mode: 'prod' }, ({ mode }) => {
  render(mode)
})

toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get({ mode: 'prod' }, ({ mode }) => {
    const next = mode === 'prod' ? 'local' : 'prod'
    chrome.storage.local.set({ mode: next }, () => {
      render(next)
    })
  })
})
