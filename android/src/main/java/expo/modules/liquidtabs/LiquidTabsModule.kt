package expo.modules.liquidtabs

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LiquidTabsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LiquidTabs")

    Function("hello") {
      "Hello world! 👋"
    }

    View(LiquidTabsView::class) {
    }
  }
}
