const PDFDocument = require("pdfkit");
const fs = require("fs");
const Tesseract = require("tesseract.js");
const { rgb, StandardFonts } = require("pdf-lib");

async function createPDF(images, outputPath, settings) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ autoFirstPage: false });
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      for (const imgPath of images) {
        const { width, height } = doc.openImage(imgPath);
        doc.addPage({ size: [width, height] }).image(imgPath, 0, 0, { width, height });

        if (settings.includeOCR) {
          const { data: { text } } = await Tesseract.recognize(imgPath, "eng");
          doc.text(text, 10, 10, { width: width - 20 });
        }
      }

      // Header/Footer
      if (settings.header || settings.footer) {
        const pages = doc.bufferedPageRange().count;
        for (let i = 0; i < pages; i++) {
          if (settings.header) doc.text("My PDF Bot Header", 50, 20);
          if (settings.footer) doc.text(`Page ${i + 1}`, 50, doc.page.height - 30);
        }
      }

      // Password protection (optional via pdf-lib later)

      doc.end();
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { createPDF };
