import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// GET: listar PDFs
router.get("/", (req, res) => {
  const uploadsPath = path.join("uploads");
  if (!fs.existsSync(uploadsPath)) return res.json([]);
  const archivos = fs.readdirSync(uploadsPath).filter(f => f.endsWith(".pdf"));
  res.json(archivos);
});

// DELETE: eliminar PDF
router.delete("/:nombre", (req, res) => {
  const { nombre } = req.params;
  const filePath = path.join("uploads", nombre);

  if (!fs.existsSync(filePath)) return res.status(404).json({ msg: "Archivo no encontrado" });

  fs.unlinkSync(filePath);
  res.json({ msg: "Archivo eliminado correctamente" });
});

export default router; // ✅ esto es crucial
