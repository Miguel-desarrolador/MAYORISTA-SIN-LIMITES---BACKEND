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

    // Encabezado azul
    doc.setFillColor(40, 116, 240);
    doc.rect(0, 0, 595.28, 60, "F");

    // Logo: usa ruta absoluta desde la raíz del proyecto
    const logoPath = path.join(process.cwd(), "img", "productos", "logo2.jpg");
    if (fs.existsSync(logoPath)) {
      const bufferLogo = fs.readFileSync(logoPath);
      // Determinar tipo: jpeg o png
      const extLogo = path.extname(logoPath).substring(1).toLowerCase();
      const mimeLogo = extLogo === "png" ? "image/png" : "image/jpeg";
      const logoBase64 = `data:${mimeLogo};base64,${bufferLogo.toString("base64")}`;
      // addImage requiere indicar el tipo adecuado: "JPEG" o "PNG"
      doc.addImage(logoBase64, extLogo === "png" ? "PNG" : "JPEG", margen, 5, 50, 50);
    }

    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Factura de Compra", 595.28 / 2, 40, { align: "center" });
    y += 70;

    // Datos cliente
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Datos del Cliente:", margen, y);
    y += 20;

    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    for (let key in datosCliente) {
      doc.setFont("helvetica", "bold");
      doc.text(`${capitalize(key)}:`, margen + 10, y);
      doc.setFont("helvetica", "normal");
      const value = datosCliente[key] !== undefined && datosCliente[key] !== null ? String(datosCliente[key]) : "";
      doc.text(value, margen + 120, y);
      y += 18;
    }

    // Encabezado de tabla (función auxiliar)
    function dibujarEncabezadoTablaLocal(doc, yPos, margenLocal) {
      const posNombre = margenLocal + 100;
      const posPrecio = margenLocal + 260;
      const posCantidad = margenLocal + 340;
      const posSubtotal = margenLocal + 420;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setFillColor(240, 240, 240);
      doc.rect(margenLocal, yPos, 515, 25, "F");
      doc.setTextColor(0, 0, 0);
      doc.text("Producto", posNombre, yPos + 17);
      doc.text("Precio", posPrecio, yPos + 17);
      doc.text("Cantidad", posCantidad, yPos + 17);
      doc.text("Subtotal", posSubtotal, yPos + 17);

      return yPos + 30;
    }

    y = dibujarEncabezadoTablaLocal(doc, y, margen);

    let total = 0;

    for (let p of carrito) {
      const subtotal = (Number(p.precio) || 0) * (Number(p.cantidad) || 0);
      total += subtotal;

      if (y + 120 > 800) {
        doc.addPage();
        y = 40;
        y = dibujarEncabezadoTablaLocal(doc, y, margen);
      }

      // Imagen del producto desde disco
      let imgData = "";
      try {
        const imagePath = path.join(process.cwd(), "img", "productos", p.imagen || "");
        if (p.imagen && fs.existsSync(imagePath)) {
          const buffer = fs.readFileSync(imagePath);
          const ext = path.extname(imagePath).substring(1).toLowerCase();
          const mime = ext === "png" ? "image/png" : "image/jpeg";
          imgData = `data:${mime};base64,${buffer.toString("base64")}`;
          // Si la imagen es PNG, usar "PNG", sino "JPEG"
          doc.addImage(imgData, ext === "png" ? "PNG" : "JPEG", margen, y, 90, 90);
        }
      } catch (err) {
        console.error("Error cargando imagen:", err);
      }

      // Texto del producto
      const posNombre = margen + 100;
      const posPrecio = margen + 260;
      const posCantidad = margen + 340;
      const posSubtotal = margen + 420;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      // Acortar nombre largo para que no desborde
      const nombreRender = String(p.nombre || "").slice(0, 60);
      doc.text(nombreRender, posNombre, y + 25);
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

    // Total
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Total: $${total}`, margen + 370, y);

    y += 30;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("¡Gracias por tu compra!", margen, y);

    // Guardar PDF: obtener buffer y escribir con fs
    const uploadsPath = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

    // Sanear nombre de archivo
    const safeName = String(datosCliente.nombre || "cliente").replace(/[^a-z0-9_\-\.]/gi, "_");
    const fileName = `Compra_${safeName}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsPath, fileName);

    // doc.output('arraybuffer') devuelve ArrayBuffer
    const arrayBuffer = doc.output("arraybuffer");
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // Construir link público usando el host real de la petición
    const host = req.get("host");
    const protocol = req.protocol;
    const linkPublico = `${protocol}://${host}/uploads/${encodeURIComponent(fileName)}`;

    const numero = "543413047240"; // número para WhatsApp
    const mensaje = `Hola! Aquí está tu factura: ${linkPublico}`;
    const urlWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

    return res.json({ filePath, urlWhatsApp, linkPublico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al generar PDF", error: err.message });
  }
});
