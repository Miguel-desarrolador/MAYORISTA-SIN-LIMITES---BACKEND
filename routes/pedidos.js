// routes/pedidos.js
import express from "express";
import { Pedido } from "../models/Pedido.js";
import { Producto } from "../models/Producto.js";

const router = express.Router();

// Listar todos los pedidos
router.get("/", async (req, res) => {
  try {
    const pedidos = await Pedido.find();
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ msg: "Error al obtener pedidos" });
  }
});

// Cancelar un pedido
router.put("/:id/cancelar", async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ msg: "Pedido no encontrado" });

    if (pedido.estado === "cancelado") 
      return res.status(400).json({ msg: "El pedido ya está cancelado" });

    // Devolver stock de cada producto
    for (const item of pedido.items) {
      await Producto.findOneAndUpdate(
        { id: item.productoId },
        { $inc: { stock: item.cantidad } }
      );
    }

    pedido.estado = "cancelado";
    await pedido.save();

    res.json({ msg: "Pedido cancelado y stock devuelto correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al cancelar el pedido" });
  }
});

export default router;
