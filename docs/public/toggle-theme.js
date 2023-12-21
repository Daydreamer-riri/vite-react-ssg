const primaryColorScheme = '' // "light" | "dark"

// Get theme data from local storage
const currentTheme = localStorage.getItem('theme')

function getPreferTheme() {
  // return theme value in local storage if it is set
  if (currentTheme)
    return currentTheme

  // return primary color scheme if it is set
  if (primaryColorScheme)
    return primaryColorScheme

  // return user device's prefer color scheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

let themeValue = getPreferTheme()

function setPreference() {
  localStorage.setItem('theme', themeValue)
  reflectPreference()
}

function reflectPreference() {
  document.firstElementChild.setAttribute('data-theme', themeValue)
  document.firstElementChild.className = themeValue
}

// set early so no page flashes / CSS is made aware
reflectPreference()

window.onload = () => {
  // set on load so screen readers can get the latest value on the button
  reflectPreference()
}

// sync with system changes
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', ({ matches: isDark }) => {
    themeValue = isDark ? 'dark' : 'light'
    setPreference()
  })

window.toggleTheme = () => {
  themeValue = themeValue === 'dark' ? 'light' : 'dark'
  setPreference()
}
