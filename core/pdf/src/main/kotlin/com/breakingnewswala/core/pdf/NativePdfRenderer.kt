package com.breakingnewswala.core.pdf

import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

class NativePdfEngine(private val pdfFile: File) : AutoCloseable {

    private var fileDescriptor: ParcelFileDescriptor? = null
    private var renderer: PdfRenderer? = null

    init {
        fileDescriptor = ParcelFileDescriptor.open(pdfFile, ParcelFileDescriptor.MODE_READ_ONLY)
        renderer = PdfRenderer(fileDescriptor!!)
    }

    val pageCount: Int
        get() = renderer?.pageCount ?: 0

    suspend fun renderPage(pageIndex: Int, scaleFactor: Float = 2.0f): Bitmap? = withContext(Dispatchers.IO) {
        val currentRenderer = renderer ?: return@withContext null
        if (pageIndex < 0 || pageIndex >= currentRenderer.pageCount) return@withContext null

        synchronized(currentRenderer) {
            val page = currentRenderer.openPage(pageIndex)
            val width = (page.width * scaleFactor).toInt()
            val height = (page.height * scaleFactor).toInt()

            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            page.close()
            bitmap
        }
    }

    override fun close() {
        renderer?.close()
        fileDescriptor?.close()
        renderer = null
        fileDescriptor = null
    }
}

@Composable
fun EpaperPageRenderer(
    bitmap: Bitmap?,
    modifier: Modifier = Modifier
) {
    if (bitmap == null) {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .height(400.dp),
            contentAlignment = Alignment.Center
        ) {
            androidx.compose.material3.CircularProgressIndicator()
        }
        return
    }

    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    val state = rememberTransformableState { zoomChange, offsetChange, _ ->
        scale = (scale * zoomChange).coerceIn(1f, 5f)
        offset = if (scale > 1f) offset + offsetChange else Offset.Zero
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .transformable(state = state),
        contentAlignment = Alignment.Center
    ) {
        Image(
            bitmap = bitmap.asImageBitmap(),
            contentDescription = "ई-पेपर पृष्ठ",
            modifier = Modifier
                .fillMaxWidth()
                .graphicsLayer(
                    scaleX = scale,
                    scaleY = scale,
                    translationX = offset.x,
                    translationY = offset.y
                )
        )
    }
}

