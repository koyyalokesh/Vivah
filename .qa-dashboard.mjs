import { writeFile } from 'node:fs/promises';

const webUrl = process.env.QA_WEB_URL ?? 'http://localhost:5173';
const debugUrl = process.env.QA_DEBUG_URL ?? 'http://127.0.0.1:9223';
const signupUrl = new URL('/signup', webUrl).href;
const newPageUrl = new URL('/json/new', debugUrl);
newPageUrl.search = encodeURIComponent(signupUrl);

const target = await fetch(newPageUrl, { method: 'PUT' }).then((response) =>
  response.json(),
);
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let messageId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  if (message.error) handler.reject(new Error(message.error.message));
  else handler.resolve(message.result);
});

function send(method, params = {}) {
  const id = ++messageId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
  return result.result.value;
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function assert(condition, message) {
  if (!condition) throw new Error(`Dashboard QA failed: ${message}`);
}

async function pressKey(key, modifiers = 0) {
  await send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
    code: key,
    modifiers,
  });
  await send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
    code: key,
    modifiers,
  });
}

await send('Page.enable');
await send('Runtime.enable');
await wait(1000);

const email = `dashboard.qa.${Date.now()}@example.com`;
const signup = await evaluate(`fetch('/api/auth/signup', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'Dashboard QA', email: ${JSON.stringify(email)}, password: 'VivahQa!2026'})
}).then(async response => ({status: response.status, body: await response.json()}))`);
if (signup.status !== 201)
  throw new Error(`Signup failed: ${JSON.stringify(signup)}`);

const wedding = await evaluate(`fetch('/api/wedding', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    brideName: 'Sakshi',
    groomName: 'Dhoni',
    title: 'Sakshi & Dhoni Wedding',
    weddingDate: '2027-12-12',
    timeZone: 'Asia/Kolkata',
    location: {formattedAddress: 'Hyderabad, Telangana'},
    description: 'Dashboard QA wedding'
  })
}).then(async response => ({status: response.status, body: await response.json()}))`);
if (wedding.status !== 201)
  throw new Error(`Wedding creation failed: ${JSON.stringify(wedding)}`);

await evaluate(`location.assign('/app')`);
await wait(1300);
const desktop = await evaluate(`({
  url: location.pathname,
  heading: document.querySelector('h1')?.textContent?.trim(),
  title: document.querySelector('.workspace-topbar-title')?.textContent?.trim(),
  role: document.querySelector('.workspace-role-badge')?.textContent?.trim(),
  nav: [...document.querySelectorAll('.workspace-nav-link')].map(node => node.textContent.trim()),
  contextBlockCount: document.querySelectorAll('.workspace-wedding-context').length,
  themeLocation: Boolean(document.querySelector('.workspace-topbar .theme-selector')),
  memberCount: document.querySelector('.dashboard-summary strong')?.textContent?.trim(),
  overflow: document.documentElement.scrollWidth > window.innerWidth
})`);
const desktopShot = await send('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
});
await writeFile(
  '.qa-dashboard-desktop.png',
  Buffer.from(desktopShot.data, 'base64'),
);

const theme = await evaluate(`(async () => {
  document.querySelector('[aria-label="Use dark appearance"]').click();
  await new Promise(resolve => setTimeout(resolve, 100));
  const dark = document.documentElement.dataset.theme;
  document.querySelector('[aria-label="Use light appearance"]').click();
  await new Promise(resolve => setTimeout(resolve, 100));
  return {dark, light: document.documentElement.dataset.theme};
})()`);

await evaluate(`document.querySelector('a[href="/app/members"]').click()`);
await wait(800);
const members = await evaluate(
  `({url: location.pathname, heading: document.querySelector('h1')?.textContent?.trim(), shellCount: document.querySelectorAll('.workspace-layout').length})`,
);
await evaluate(`document.querySelector('a[href="/app/wedding/edit"]').click()`);
await wait(800);
const edit = await evaluate(
  `({url: location.pathname, heading: document.querySelector('h1')?.textContent?.trim(), shellCount: document.querySelectorAll('.workspace-layout').length})`,
);

await send('Emulation.setDeviceMetricsOverride', {
  width: 320,
  height: 700,
  deviceScaleFactor: 1,
  mobile: true,
});
await evaluate(`location.assign('/app')`);
await wait(900);
const mobileClosed = await evaluate(`({
  menuVisible: getComputedStyle(document.querySelector('.workspace-menu-button')).display !== 'none',
  drawerHidden: document.querySelector('.workspace-mobile-drawer').getAttribute('aria-hidden'),
  drawerInert: document.querySelector('.workspace-mobile-drawer').inert,
  overflow: document.documentElement.scrollWidth > window.innerWidth
})`);
await evaluate(`document.querySelector('.workspace-menu-button').click()`);
await wait(200);
const mobileOpen = await evaluate(`({
  drawerHidden: document.querySelector('.workspace-mobile-drawer').getAttribute('aria-hidden'),
  drawerInert: document.querySelector('.workspace-mobile-drawer').inert,
  overviewVisible: document.querySelector('.workspace-mobile-drawer a[href="/app"]').getBoundingClientRect().width > 0,
  initialFocus: document.activeElement?.getAttribute('aria-label')
})`);
await pressKey('Tab', 8);
const focusWrappedBackward = await evaluate(
  `document.activeElement?.getAttribute('href')`,
);
await pressKey('Tab');
const focusWrappedForward = await evaluate(
  `document.activeElement?.getAttribute('aria-label')`,
);
await pressKey('Escape');
const mobileClosedWithKeyboard = await evaluate(`({
  drawerHidden: document.querySelector('.workspace-mobile-drawer').getAttribute('aria-hidden'),
  restoredFocus: document.activeElement?.getAttribute('aria-label')
})`);
const mobileShot = await send('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
});
await writeFile(
  '.qa-dashboard-mobile.png',
  Buffer.from(mobileShot.data, 'base64'),
);

assert(desktop.url === '/app', 'dashboard route did not load');
assert(
  desktop.heading === 'Welcome back, Dashboard',
  'dashboard heading is incorrect',
);
assert(desktop.role === 'Admin', 'membership role is incorrect');
assert(desktop.memberCount === '1', 'member count did not load');
assert(!desktop.overflow, 'desktop layout overflows horizontally');
assert(
  theme.dark === 'dark' && theme.light === 'light',
  'theme controls failed',
);
assert(
  members.url === '/app/members' && members.heading === 'Wedding members',
  'members navigation failed',
);
assert(
  edit.url === '/app/wedding/edit' && edit.heading === 'Edit wedding details',
  'wedding details navigation failed',
);
assert(mobileClosed.menuVisible, 'mobile menu button is hidden');
assert(mobileClosed.drawerHidden === 'true', 'closed drawer is exposed');
assert(mobileClosed.drawerInert, 'closed drawer is interactive');
assert(!mobileClosed.overflow, '320px layout overflows horizontally');
assert(mobileOpen.drawerHidden === 'false', 'open drawer remains hidden');
assert(!mobileOpen.drawerInert, 'open drawer remains inert');
assert(mobileOpen.overviewVisible, 'open drawer navigation is not visible');
assert(
  mobileOpen.initialFocus === 'Close navigation',
  'drawer did not receive focus',
);
assert(
  focusWrappedBackward === '/app/wedding/edit',
  'Shift+Tab escaped the drawer',
);
assert(focusWrappedForward === 'Close navigation', 'Tab escaped the drawer');
assert(
  mobileClosedWithKeyboard.drawerHidden === 'true',
  'Escape did not close the drawer',
);
assert(
  mobileClosedWithKeyboard.restoredFocus === 'Open navigation',
  'focus was not restored after closing the drawer',
);

console.log(
  JSON.stringify(
    {
      signup: signup.status,
      wedding: wedding.status,
      desktop,
      theme,
      members,
      edit,
      mobileClosed,
      mobileOpen,
      focusWrappedBackward,
      focusWrappedForward,
      mobileClosedWithKeyboard,
    },
    null,
    2,
  ),
);
socket.close();
