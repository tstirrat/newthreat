/**
 * content.js — injects a "Threat" tab button into WCL report pages.
 *
 * Builds a deep-link to wow-threat.web.app (or localhost:5173) using the
 * report code, fight ID, and selected source from the current WCL URL.
 */

const PROD_BASE = 'https://wow-threat.web.app'
const LOCAL_BASE = 'http://localhost:5173'
const BUTTON_ID = 'wow-threat-link'

/** Extract the WCL report code from the current pathname. */
function getReportCode() {
  return location.pathname.match(/\/reports\/([A-Za-z0-9]+)/)?.[1] ?? null
}

/** Build the wow-threat deep-link URL from the current page state. */
function buildUrl(baseUrl) {
  const reportCode = getReportCode()
  if (!reportCode) return null

  // WCL puts fight and source in the query string (?fight=26&source=113)
  const params = new URLSearchParams(location.search)
  const fightId = params.get('fight')
  const sourceId = params.get('source')

  if (!fightId || fightId === 'last') {
    return `${baseUrl}/report/${reportCode}`
  }

  const url = new URL(`${baseUrl}/report/${reportCode}/fight/${fightId}`)
  if (sourceId) {
    const sources = sourceId.split(',')
    if (sources.length === 1) {
      url.searchParams.set('focusId', sourceId)
    } else {
      url.searchParams.set('players', sourceId)
    }
  }
  return url.toString()
}

/** Create or update the threat tab button href. */
function updateButton(baseUrl) {
  const existing = document.getElementById(BUTTON_ID)
  const url = buildUrl(baseUrl)

  if (existing) {
    if (url) {
      existing.href = url
    }
    return
  }

  if (!url) return

  const tabContainer = document.getElementById('top-level-view-tabs')
  if (!tabContainer) return

  const link = document.createElement('a')
  link.id = BUTTON_ID
  link.className = 'big-tab view-type-tab'
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.style.cssText = 'position: relative; overflow: visible;'

  const icon = document.createElement('span')
  icon.className = 'zmdi zmdi-chart'

  const label = document.createElement('span')
  label.className = 'big-tab-text'
  label.innerHTML = '<br>Threat'

  const stamp = document.createElement('span')
  stamp.textContent = 'WoW Threat'
  stamp.style.cssText = [
    'position: absolute',
    'top: 2px',
    'right: -4px',
    'font-size: 7px',
    'font-weight: 700',
    'letter-spacing: 0.03em',
    'color: #cc2200',
    'transform: rotate(12deg)',
    'transform-origin: top right',
    'pointer-events: none',
    'line-height: 1',
    'white-space: nowrap',
    'text-shadow: 0 0 4px rgba(0,0,0,0.8)',
  ].join('; ')

  link.appendChild(icon)
  link.appendChild(label)
  link.appendChild(stamp)

  tabContainer.appendChild(link)
}

/** Wait for the tab container to appear then inject the button. */
function waitForTabContainer(baseUrl) {
  const existing = document.getElementById('top-level-view-tabs')
  if (existing) {
    updateButton(baseUrl)
    return
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById('top-level-view-tabs')) {
      observer.disconnect()
      updateButton(baseUrl)
    }
  })

  // At document_start, document.body may not exist yet — observe from the root
  observer.observe(document.documentElement, { childList: true, subtree: true })

  // Stop observing after 10 seconds to avoid leaking
  setTimeout(() => observer.disconnect(), 10_000)
}

/** Re-read storage and refresh the button href. */
function onUrlChange() {
  chrome.storage.local.get({ mode: 'prod' }, ({ mode }) => {
    updateButton(mode === 'local' ? LOCAL_BASE : PROD_BASE)
  })
}

/**
 * Patch history.pushState and history.replaceState to fire a custom event.
 * WCL is a SPA that navigates via pushState — hashchange won't fire.
 */
function patchHistory() {
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method].bind(history)
    history[method] = (...args) => {
      original(...args)
      window.dispatchEvent(new Event('wow-threat:urlchange'))
    }
  }
  window.addEventListener('popstate', onUrlChange)
  window.addEventListener('wow-threat:urlchange', onUrlChange)
}

/** Initialise the extension: load mode from storage and set up the button. */
chrome.storage.local.get({ mode: 'prod' }, ({ mode }) => {
  const baseUrl = mode === 'local' ? LOCAL_BASE : PROD_BASE
  patchHistory()
  waitForTabContainer(baseUrl)
})
