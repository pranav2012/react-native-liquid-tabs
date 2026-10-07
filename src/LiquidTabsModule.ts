import { NativeModule, requireNativeModule } from 'expo';

declare class LiquidTabsModule extends NativeModule<{}> {
  hello(): string;
}

export default requireNativeModule<LiquidTabsModule>('LiquidTabs');
