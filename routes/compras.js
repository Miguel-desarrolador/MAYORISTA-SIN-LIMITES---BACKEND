import express from "express";
import path from "path";
import fs from "fs";
import { jsPDF } from "jspdf";

const router = express.Router();

// Función para dibujar encabezado de tabla
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

  return y + 30; // nueva posición Y después del encabezado
}

// POST generar PDF
router.post("/pdf", async (req, res) => {
  try {
    const { datosCliente, carrito } = req.body;

    if (!carrito || carrito.length === 0) {
      return res.status(400).json({ msg: "El carrito está vacío" });
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const margen = 40;
    let y = margen;

    // ======================
    // Encabezado con fondo azul y logo
    // ======================
    doc.setFillColor(40, 116, 240); // azul
    doc.rect(0, 0, 595, 60, "F");

    // Logo
    const logoPath = path.join("/img/productos", "logo2.jpg"); // ruta local
    if (fs.existsSync(logoPath)) {
      const bufferLogo = fs.readFileSync(logoPath);
      const logoBase64 = `data:image/jpeg;base64,${bufferLogo.toString("base64")}`;
      doc.addImage(logoBase64, "JPEG", margen, 5, 50, 50);
    }

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Factura de Compra", 595 / 2, 40, { align: "center" });
    y += 70;

    // ======================
    // Datos cliente
    // ======================
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Datos del Cliente:", margen, y);
    y += 20;

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    for (let key in datosCliente) {
      doc.setFont("helvetica", "bold");
      doc.text(`${capitalize(key)}:`, margen + 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${datosCliente[key]}`, margen + 120, y);
      y += 18;
    }

    // ======================
    // Encabezado de tabla productos
    // ======================
    y = dibujarEncabezadoTabla(doc, y, margen);

    let total = 0;

    for (let p of carrito) {
      const subtotal = p.precio * p.cantidad;
      total += subtotal;

      // Si no hay suficiente espacio, crear nueva página
      if (y + 100 > 800) {
        doc.addPage();
        y = 40;
        y = dibujarEncabezadoTabla(doc, y, margen);
      }

      // Imagen del producto
      let imgData = "";
      try {
        const imagePath = path.join("img/productos", p.imagen); // ruta local
        if (fs.existsSync(imagePath)) {
          const buffer = fs.readFileSync(imagePath);
          const ext = path.extname(p.imagen).substring(1).toLowerCase();
          imgData = `data:image/${ext};base64,${buffer.toString("base64")}`;
        }
      } catch (err) {
        console.error("Error cargando imagen:", err);
      }

      if (imgData) {
        doc.addImage(imgData, "JPEG", margen, y, 90, 90); // 90x90
      }

      // Texto del producto
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

      y += 100; // ajustar según el alto de la imagen
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(margen, y, 555, y);
      y += 5;
    }

    // ======================
    // Total y mensaje de gracias
    // ======================
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Total: $${total}`, margen + 370, y);

    y += 30;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("¡Gracias por tu compra!", margen, y);

    // ======================
    // Guardar PDF en backend
    // ======================
    const uploadsPath = path.join("uploads");
    if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

    const fileName = `Compra_${datosCliente.nombre}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsPath, fileName);
    doc.save(filePath); // guarda en Node

    // ======================
    // Link público y WhatsApp
    // ======================
    const linkPublico = `http://localhost:${process.env.PORT}/uploads/${fileName}`;
    const numero = "543413047240"; // 54 = Argentina + tu número sin 0 inicial
    const mensaje = `Hola! Aquí está tu factura: ${linkPublico}`;
    const urlWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

    res.json({ filePath, urlWhatsApp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al generar PDF" });
  }
});

export default router;
