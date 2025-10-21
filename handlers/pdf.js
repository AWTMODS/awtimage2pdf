const PDFDocument = require("pdfkit");
const fs = require("fs");
const Tesseract = require("tesseract.js");
const path = require("path");

// Clean PDF generator
async function createPDF(images, outputPath, settings) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ autoFirstPage: false });
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      for (const imgPath of images) {
        if (!fs.existsSync(imgPath)) continue;

        const { width, height } = doc.openImage(imgPath);
        doc.addPage({ size: [width, height] });
        doc.image(imgPath, 0, 0, { width, height });

        // Optional OCR (invisible text layer)
        if (settings.includeOCR) {
          try {
            const { data: { text } } = await Tesseract.recognize(imgPath, settings.ocrLang || "eng");
            doc.text(text, 0, 0, { width, height, opacity: 0 });
          } catch (err) {
            console.error("OCR failed for image:", imgPath, err);
          }
        }

        // Footer only
        if (settings.footer) {
          doc.text(`Page ${doc.page.index + 1}`, 50, height - 30);
        }
      }

      doc.end();
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { createPDF };
