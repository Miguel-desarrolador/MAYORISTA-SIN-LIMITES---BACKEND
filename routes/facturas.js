import express from "express";
import fs from "fs";
import path from "path";
import Pedido from "../models/Pedido.js";   // 👈 faltaba esto
import { Producto } from "../models/Producto.js";

const router = express.Router();

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

// DELETE: Eliminar PDF + JSON
router.delete("/:nombre", (req, res) => {
  try {
    const { nombre } = req.params;
    const uploadsPath = path.join("uploads");
    const filePath = path.join(uploadsPath, nombre);
    const jsonPath = filePath.replace(".pdf", ".json");

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ msg: "Archivo no encontrado" });
    }

    fs.unlinkSync(filePath); // Elimina PDF
    if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath); // Elimina JSON

    res.json({ msg: "Factura y datos del pedido eliminados correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al eliminar factura" });
  }
});

// POST: Cancelar pedido
router.post("/cancelar/:id", async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ msg: "Pedido no encontrado" });

    if (pedido.estado === "cancelado") {
      return res.status(400).json({ msg: "El pedido ya fue cancelado" });
    }

    // devolver stock
    for (let item of pedido.carrito) {
      await Producto.findByIdAndUpdate(item.productoId, {
        $inc: { stock: item.cantidad }
      });
    }

    pedido.estado = "cancelado";
    await pedido.save();

    res.json({ msg: "Pedido cancelado y stock devuelto correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al cancelar pedido", error: err.message });
  }
});

export default router;
