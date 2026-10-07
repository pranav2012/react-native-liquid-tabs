package expo.modules.liquidtabs

import android.content.Context
import android.graphics.Canvas
import android.graphics.RenderNode
import android.os.Build
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Wraps the content a [LiquidBlurView] blurs. On Android 12+ its children are recorded into a
 * RenderNode each frame, which blur views draw (cropped and blurred) without re-rendering the views.
 * A blur view must not be inside its own target.
 */
class LiquidBlurTargetView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  internal val renderNode: RenderNode? = if (Build.VERSION.SDK_INT >= 31) RenderNode("LiquidBlurTarget") else null

  override fun dispatchDraw(canvas: Canvas) {
    val node = renderNode
    if (node == null || !canvas.isHardwareAccelerated || Build.VERSION.SDK_INT < 31) {
      super.dispatchDraw(canvas)
      return
    }
    node.setPosition(0, 0, width, height)
    val recording = node.beginRecording(width, height)
    super.dispatchDraw(recording)
    node.endRecording()
    canvas.drawRenderNode(node)
  }
}
