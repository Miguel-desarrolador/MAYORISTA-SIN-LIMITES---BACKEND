import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema({
  nombreFactura: { type: String, required: true, unique: true },
  carrito: [
    {
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
      cantidad: { type: Number, required: true, min: 1 }
    }
  ],
  datosCliente: { type: Object, required: true },
  fecha: { type: Date, default: Date.now }
});

export default mongoose.model("Pedido", pedidoSchema);
