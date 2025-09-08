  import express from "express";
  import fs from "fs";
  import path from "path";
  import { Producto } from "../models/Producto.js";

  const router = express.Router();

  // POST: Cancelar pedido y restaurar stock
  router.post("/cancelar/:nombre", async (req, res) => {
    try {
      const { nombre } = req.params;
      const uploadsPath = path.join(process.cwd(), "uploads");
      const jsonPath = path.join(uploadsPath, nombre.replace(".pdf", ".json"));

      if (!fs.existsSync(jsonPath))
        return res.status(404).json({ msg: "Factura no encontrada" });

      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

      for (const item of data.carrito) {
        await Producto.findByIdAndUpdate(item.id, { $inc: { stock: item.cantidad } });
      }

      res.json({ msg: "Pedido cancelado y stock restaurado correctamente" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error al cancelar pedido", error: err.message });
    }
  });

  // GET: Listar PDFs
  router.get("/", (req, res) => {
    try {
      const uploadsPath = path.join("uploads");
      if (!fs.existsSync(uploadsPath)) return res.json([]);

      const archivos = fs.readdirSync(uploadsPath).filter(f => f.endsWith(".pdf"));
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

      const listaConUrls = archivos.map(nombre => {
        const filePath = path.join(uploadsPath, nombre);
        const stats = fs.statSync(filePath);
        return {
          nombre,
          url: `${baseUrl}/uploads/${encodeURIComponent(nombre)}`,
          fecha: stats.mtime,
          tamañoKB: (stats.size / 1024).toFixed(2)
        };
      });

      res.json(listaConUrls);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error al listar facturas" });
    }
  });

  // DELETE: Eliminar PDF
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
      console.error(err);
      res.status(500).json({ msg: "Error al eliminar factura" });
    }
  });

  export default router;
