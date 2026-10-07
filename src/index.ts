// Reexport the native module. On web, it will be resolved to LiquidTabsModule.web.ts
// and on native platforms to LiquidTabsModule.ts
export { default } from './LiquidTabsModule';
export { default as LiquidTabsView } from './LiquidTabsView';
export * from './LiquidTabs.types';
