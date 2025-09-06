import express from "express";
import path from "path";
import fs from "fs";
import { jsPDF } from "jspdf";
import fetch from "node-fetch";

const router = express.Router();

function dibujarEncabezadoTabla(doc, y, margen) {
  const posNombre = margen + 100;
  const posPrecio = margen + 260;
  const posCantidad = margen + 340;
  const posSubtotal = margen + 420;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setFillColor(240, 240, 240);
  doc.rect(margen, y, 515, 25, "F");
  doc.setTextColor(0, 0, 0);
  doc.text("Producto", posNombre, y + 17);
  doc.text("Precio", posPrecio, y + 17);
  doc.text("Cantidad", posCantidad, y + 17);
  doc.text("Subtotal", posSubtotal, y + 17);

  return y + 30;
}

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

async function imageURLtoBase64(url) {
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    return `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
  } catch (err) {
    console.error("Error convirtiendo imagen a base64:", err);
    return null;
  }
}

router.post("/pdf", async (req, res) => {
  try {
    const { datosCliente, carrito } = req.body;

    if (!carrito || carrito.length === 0) {
      return res.status(400).json({ msg: "El carrito está vacío" });
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const margen = 40;
    let y = margen;

    // Encabezado azul
    doc.setFillColor(40, 116, 240);
    doc.rect(0, 0, 595, 60, "F");

    // Logo
    const logoURL = "https://mayorista-sin-limites-backend-production.up.railway.app/img/productos/logo2.jpg";
    const logoBase64 = await imageURLtoBase64(logoURL);
    if (logoBase64) doc.addImage(logoBase64, "JPEG", margen, 5, 50, 50);

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Factura de Compra", 595 / 2, 40, { align: "center" });
    y += 70;

    // Datos cliente
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Datos del Cliente:", margen, y);
    y += 20;

    for (let key in datosCliente) {
      doc.setFont("helvetica", "bold");
      doc.text(`${capitalize(key)}:`, margen + 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${datosCliente[key]}`, margen + 120, y);
      y += 18;
    }

    // Encabezado tabla
    y = dibujarEncabezadoTabla(doc, y, margen);

    let total = 0;

    // Convertir todas las imágenes a base64 en paralelo
    const imagesBase64 = await Promise.all(
      carrito.map((p) => {
        const imgURL = `https://mayorista-sin-limites-backend-production.up.railway.app/img/productos/${p.imagen}`;
        return imageURLtoBase64(imgURL);
      })
    );

    for (let i = 0; i < carrito.length; i++) {
      const p = carrito[i];
      const subtotal = p.precio * p.cantidad;
      total += subtotal;

      if (y + 100 > 800) {
        doc.addPage();
        y = 40;
        y = dibujarEncabezadoTabla(doc, y, margen);
      }

      const imgBase64 = imagesBase64[i];
      if (imgBase64) doc.addImage(imgBase64, "JPEG", margen, y, 90, 90);

      const posNombre = margen + 100;
      const posPrecio = margen + 260;
      const posCantidad = margen + 340;
      const posSubtotal = margen + 420;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(p.nombre, posNombre, y + 25);
      doc.setFontSize(11);
      doc.text(`$${p.precio}`, posPrecio, y + 25);
      doc.text(`${p.cantidad}`, posCantidad, y + 25);
      doc.text(`$${subtotal}`, posSubtotal, y + 25);

      y += 100;
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(margen, y, 555, y);
      y += 5;
    }

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Total: $${total}`, margen + 370, y);

    y += 30;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("¡Gracias por tu compra!", margen, y);

    // Guardar PDF
    const uploadsPath = path.join("uploads");
    if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

    const safeName = datosCliente.nombre.replace(/[^a-z0-9]/gi, "_");
    const fileName = `Compra_${safeName}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsPath, fileName);

    const pdfBytes = doc.output("nodebuffer");
    fs.writeFileSync(filePath, pdfBytes);

    // Link público y WhatsApp
    const linkPublico = `https://mayorista-sin-limites-backend-production.up.railway.app/uploads/${fileName}`;
    const numero = "5493329317141"; // WhatsApp
    const mensaje = `Hola! Aquí está tu factura: ${linkPublico}`;
    const urlWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

    res.json({ filePath, urlWhatsApp });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al generar PDF" });
  }
});

export default router;
