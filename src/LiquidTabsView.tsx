import { requireNativeView } from 'expo';
import * as React from 'react';

import { LiquidTabsViewProps } from './LiquidTabs.types';

const NativeView: React.ComponentType<LiquidTabsViewProps> = requireNativeView('LiquidTabs');

export default function LiquidTabsView(props: LiquidTabsViewProps) {
  return <NativeView {...props} />;
}
