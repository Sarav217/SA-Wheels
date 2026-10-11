package com.busticket.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.OutputStream;

/** Generates a PNG QR image from the ticket text stored in the database. */
public final class QrCodeGenerator {

    private static final int SIZE = 300;

    /** The QR is shrunk to this size before being enlarged again for the blurred version. */
    private static final int BLUR_SIZE = 22;

    private QrCodeGenerator() {
    }

    public static void writePng(String content, OutputStream outputStream)
            throws WriterException, IOException {
        MatrixToImageWriter.writeToStream(encode(content), "PNG", outputStream);
    }

    /**
     * Writes a blurred QR for an expired ticket. The image is shrunk to a few
     * pixels and enlarged again, so it still looks like a QR code but can no
     * longer be scanned, even if the image file is downloaded.
     */
    public static void writeBlurredPng(String content, OutputStream outputStream)
            throws WriterException, IOException {
        BufferedImage sharp = MatrixToImageWriter.toBufferedImage(encode(content));
        BufferedImage small = resize(sharp, BLUR_SIZE);
        ImageIO.write(resize(small, SIZE), "PNG", outputStream);
    }

    private static BitMatrix encode(String content) throws WriterException {
        return new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, SIZE, SIZE);
    }

    private static BufferedImage resize(BufferedImage source, int size) {
        BufferedImage target = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = target.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        graphics.drawImage(source, 0, 0, size, size, null);
        graphics.dispose();
        return target;
    }
}
