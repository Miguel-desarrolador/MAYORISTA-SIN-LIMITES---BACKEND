import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// GET: listar PDFs con URL pública
router.get("/", (req, res) => {
  const uploadsPath = path.join("uploads");

  if (!fs.existsSync(uploadsPath)) return res.json([]);

  const archivos = fs.readdirSync(uploadsPath).filter(f => f.endsWith(".pdf"));

  // 🚀 usamos BASE_URL definida en .env (Railway)
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

  const listaConUrls = archivos.map(nombre => ({
    nombre,
    url: `${baseUrl}/uploads/${encodeURIComponent(nombre)}`,
  }));

  res.json(listaConUrls);
});


// DELETE: eliminar PDF
router.delete("/:nombre", (req, res) => {
  const { nombre } = req.params;
  const filePath = path.join("uploads", nombre);

  if (!fs.existsSync(filePath))
    return res.status(404).json({ msg: "Archivo no encontrado" });

  fs.unlinkSync(filePath);
  res.json({ msg: "Archivo eliminado correctamente" });
});

export default router;
