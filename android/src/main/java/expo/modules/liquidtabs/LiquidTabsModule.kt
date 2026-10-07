package expo.modules.liquidtabs

import android.os.Build
import android.view.Display
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LiquidTabsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LiquidTabs")

    // Asks for the display's top refresh rate (e.g. 120 Hz on adaptive screens) while `high` is true,
    // and hands the choice back to the system when it's false.
    Function("setHighFrameRate") { high: Boolean ->
      val activity = appContext.currentActivity ?: return@Function
      activity.runOnUiThread {
        val window = activity.window ?: return@runOnUiThread
        val display: Display? = if (Build.VERSION.SDK_INT >= 30) activity.display else {
          @Suppress("DEPRECATION")
          activity.windowManager.defaultDisplay
        }
        val top = display?.supportedModes?.maxOfOrNull { it.refreshRate } ?: 0f
        val attrs = window.attributes
        val wanted = if (high) top else 0f
        if (attrs.preferredRefreshRate != wanted) {
          attrs.preferredRefreshRate = wanted
          window.attributes = attrs
        }
        if (Build.VERSION.SDK_INT >= 35) window.setFrameRatePowerSavingsBalanced(!high)
      }
    }

    View(LiquidBlurTargetView::class) {
      Name("LiquidBlurTargetView")
    }

    View(LiquidBlurView::class) {
      Name("LiquidBlurView")

      Prop("targetId") { view: LiquidBlurView, targetId: Int? ->
        view.setTargetId(targetId)
      }

      Prop("blurRadius") { view: LiquidBlurView, radius: Float ->
        view.setBlurRadius(radius)
      }

      Prop("overlayColor") { view: LiquidBlurView, color: Int ->
        view.setOverlayColor(color)
      }
    }
  }
}
