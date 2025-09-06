import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// ======================
// GET: listar PDFs con URL pública
// ======================
router.get("/", (req, res) => {
  try {
    const uploadsPath = path.join("uploads");

    if (!fs.existsSync(uploadsPath)) return res.json([]);

    const archivos = fs.readdirSync(uploadsPath).filter(f => f.endsWith(".pdf"));

    // 🚀 Usamos BASE_URL definida en .env (Railway) o localhost
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const listaConUrls = archivos.map(nombre => {
      const filePath = path.join(uploadsPath, nombre);
      const stats = fs.statSync(filePath);

      return {
        nombre,
        url: `${baseUrl}/uploads/${encodeURIComponent(nombre)}`,
        fecha: stats.mtime, // última modificación (puede servir como "fecha de creación")
        tamañoKB: (stats.size / 1024).toFixed(2) // tamaño en KB
      };
    });

    res.json(listaConUrls);
  } catch (err) {
    console.error("❌ Error al listar facturas:", err);
    res.status(500).json({ msg: "Error al listar facturas" });
  }
});

// ======================
// DELETE: eliminar PDF
// ======================
router.delete("/:nombre", (req, res) => {
  try {
    const { nombre } = req.params;
    const filePath = path.join("uploads", nombre);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ msg: "Archivo no encontrado" });
    }

    fs.unlinkSync(filePath);
    res.json({ msg: "Archivo eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar factura:", err);
    res.status(500).json({ msg: "Error al eliminar factura" });
  }
});

export default router;
