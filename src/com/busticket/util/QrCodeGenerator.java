package com.busticket.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import java.io.IOException;
import java.io.OutputStream;

/** Generates a PNG QR image from the ticket text stored in the database. */
public final class QrCodeGenerator {

    private QrCodeGenerator() {
    }

    public static void writePng(String content, OutputStream outputStream)
            throws WriterException, IOException {
        BitMatrix matrix = new QRCodeWriter().encode(
                content, BarcodeFormat.QR_CODE, 300, 300);
        MatrixToImageWriter.writeToStream(matrix, "PNG", outputStream);
    }
}
