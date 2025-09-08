router.post("/cancelar/:pedidoId", async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.pedidoId);
    if (!pedido) return res.status(404).json({ msg: "Pedido no encontrado" });

    if (pedido.estado === "cancelado") return res.status(400).json({ msg: "Pedido ya cancelado" });

    // Restaurar stock
    for (let item of pedido.carrito) {
      await Producto.updateOne({ id: item.productoId }, { $inc: { stock: item.cantidad } });
    }

    pedido.estado = "cancelado";
    await pedido.save();

    res.json({ msg: "Pedido cancelado y stock restaurado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error al cancelar pedido", error: err.message });
  }
});
