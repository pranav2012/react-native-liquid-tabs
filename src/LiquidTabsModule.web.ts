import { registerWebModule, NativeModule } from 'expo';

// LiquidTabsModule is not available on the web platform.
class LiquidTabsModule extends NativeModule<{}> {}

export default registerWebModule(LiquidTabsModule, 'LiquidTabsModule');
