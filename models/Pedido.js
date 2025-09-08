// models/Pedido.js
import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema({
  nombreFactura: { type: String, required: true, unique: true },
  carrito: [
    {
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
      cantidad: { type: Number, required: true, min: 1 },
      precio: { type: Number, required: true },
      nombre: { type: String, required: true },
      imagen: { type: String }
    }
  ],
  datosCliente: { type: Object, required: true },
  total: { type: Number, required: true },
  estado: { type: String, enum: ["activo", "cancelado"], default: "activo" },
  fecha: { type: Date, default: Date.now }
});

export default mongoose.model("Pedido", pedidoSchema);
