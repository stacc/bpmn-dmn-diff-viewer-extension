import { exampleThemeStorage } from '@bpmn-diff-viewer-extension/storage';

export async function toggleTheme() {
  console.log('initial theme:', await exampleThemeStorage.get());
  await exampleThemeStorage.toggle();
  console.log('toggled theme:', await exampleThemeStorage.get());
}
