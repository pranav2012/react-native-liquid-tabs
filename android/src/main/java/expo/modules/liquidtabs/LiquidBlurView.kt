package expo.modules.liquidtabs

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.Shader
import android.os.Build
import android.util.Log
import android.view.View
import android.view.ViewTreeObserver
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Frosted glass over a [LiquidBlurTargetView]. Records only the area behind this view (plus a
 * margin for the blur's reach) at 1/[SCALE] size and blurs that, instead of the whole target at
 * full size, so a moving bar stays cheap enough for 120 Hz. Below Android 12 it draws the overlay
 * colour only.
 */
@SuppressLint("ViewConstructor")
class LiquidBlurView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var target: LiquidBlurTargetView? = null
  private var targetId: Int? = null
  private var blurRadius = 0f
  private var overlayColor = 0
  private val node: RenderNode? = if (Build.VERSION.SDK_INT >= 31) RenderNode("LiquidBlur") else null
  private var appliedRadius = -1f
  private val targetLocation = IntArray(2)
  private val viewLocation = IntArray(2)
  private var lastLeft = Int.MIN_VALUE
  private var lastTop = Int.MIN_VALUE

  // Content behind the view updates through the target's RenderNode on its own; only a move of the
  // view itself (scroll, transforms on a parent) needs a re-record.
  private val preDraw = ViewTreeObserver.OnPreDrawListener {
    if (target != null && locate()) invalidate()
    true
  }

  init {
    setWillNotDraw(false)
  }

  fun setTargetId(id: Int?) {
    if (id == targetId && target != null) return
    targetId = id
    resolveTarget()
  }

  fun setBlurRadius(radius: Float) {
    blurRadius = radius
    invalidate()
  }

  fun setOverlayColor(color: Int) {
    if (overlayColor == color) return
    overlayColor = color
    invalidate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    viewTreeObserver.addOnPreDrawListener(preDraw)
    if (target == null) resolveTarget()
  }

  override fun onDetachedFromWindow() {
    viewTreeObserver.removeOnPreDrawListener(preDraw)
    node?.discardDisplayList()
    super.onDetachedFromWindow()
  }

  private fun resolveTarget() {
    val id = targetId
    val found = if (id == null) null else appContext.findView<LiquidBlurTargetView>(id)
    // A view inside its own target would draw itself recursively.
    target = if (found != null && isInside(found)) {
      Log.w(TAG, "LiquidBlurView is inside its own BlurTarget; blur is off. Render the glass outside the target.")
      null
    } else {
      found
    }
    lastLeft = Int.MIN_VALUE
    invalidate()
  }

  private fun isInside(ancestor: View): Boolean {
    var parent = parent
    while (parent is View) {
      if (parent === ancestor) return true
      parent = parent.parent
    }
    return false
  }

  // Returns true when this view's offset within the target changed since the last call.
  private fun locate(): Boolean {
    val t = target ?: return false
    t.getLocationOnScreen(targetLocation)
    getLocationOnScreen(viewLocation)
    val left = viewLocation[0] - targetLocation[0]
    val top = viewLocation[1] - targetLocation[1]
    val moved = left != lastLeft || top != lastTop
    lastLeft = left
    lastTop = top
    return moved
  }

  override fun draw(canvas: Canvas) {
    drawBlur(canvas)
    super.draw(canvas)
  }

  private fun drawBlur(canvas: Canvas) {
    val t = target
    val sourceNode = t?.renderNode
    val blurNode = node
    if (t == null || sourceNode == null || blurNode == null || !canvas.isHardwareAccelerated || Build.VERSION.SDK_INT < 31 || width == 0 || height == 0) {
      if (overlayColor != 0) canvas.drawColor(overlayColor)
      return
    }
    locate()

    val pad = blurRadius * 2f
    val smallWidth = Math.ceil(((width + pad * 2f) / SCALE).toDouble()).toInt()
    val smallHeight = Math.ceil(((height + pad * 2f) / SCALE).toDouble()).toInt()
    blurNode.setPosition(0, 0, smallWidth, smallHeight)
    val recording = blurNode.beginRecording(smallWidth, smallHeight)
    recording.scale(1f / SCALE, 1f / SCALE)
    recording.translate(pad - lastLeft, pad - lastTop)
    rootView?.background?.draw(recording)
    recording.drawRenderNode(sourceNode)
    blurNode.endRecording()
    val smallRadius = blurRadius / SCALE
    if (smallRadius != appliedRadius) {
      appliedRadius = smallRadius
      // A zero-radius blur effect throws, so no blur is no effect.
      blurNode.setRenderEffect(if (smallRadius > 0f) RenderEffect.createBlurEffect(smallRadius, smallRadius, Shader.TileMode.CLAMP) else null)
    }

    canvas.save()
    canvas.translate(-pad, -pad)
    canvas.scale(SCALE, SCALE)
    canvas.drawRenderNode(blurNode)
    canvas.restore()
    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), noisePaint(context))
    if (overlayColor != 0) canvas.drawColor(overlayColor)
  }

  companion object {
    private const val TAG = "LiquidTabs"
    private const val SCALE = 4f
    private const val NOISE_ALPHA = 38
    private var noise: Paint? = null

    // A faint blue-noise grain over the blur, as frosted glass has (texture from Dimezis' BlurView).
    private fun noisePaint(context: Context): Paint {
      noise?.let { return it }
      val source = BitmapFactory.decodeResource(context.resources, R.drawable.liquidtabs_blue_noise)
      val faded = Bitmap.createBitmap(source.width, source.height, Bitmap.Config.ARGB_8888)
      Canvas(faded).drawBitmap(source, 0f, 0f, Paint().apply { alpha = NOISE_ALPHA })
      return Paint().apply {
        isAntiAlias = true
        xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_ATOP)
        shader = BitmapShader(faded, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT)
      }.also { noise = it }
    }
  }
}
