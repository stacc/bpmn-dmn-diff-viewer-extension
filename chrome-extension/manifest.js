import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */

const manifest = Object.assign({
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extensionName__',
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  permissions: ['storage'],
  options_page: 'options/index.html',
  background: {
    service_worker: 'background.iife.js',
    type: 'module',
  },
  action: {
    default_icon: 'icon-34.png',
    default_title: 'Open the settings',
  },
  host_permissions: ['https://github.com/', 'https://api.github.com/', 'https://media.githubusercontent.com/'],
  icons: {
    128: 'icon-128.png',
  },
  content_scripts: [
    {
      matches: ['https://github.com/*'],
      js: ['content-ui/index.iife.js'],
    },
    {
      matches: ['https://github.com/*'],
      css: ['content.css'], // public folder
    },
  ],
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg', 'icon-128.png', 'icon-34.png'],
      matches: ['*://*/*'],
    },
  ],
});

export default manifest;
