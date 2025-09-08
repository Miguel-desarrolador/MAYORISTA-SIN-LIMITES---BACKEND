
import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  items: [
    {
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto" },
      cantidad: { type: Number, required: true }
    }
  ],
  fecha: { type: Date, default: Date.now }
});

export default mongoose.model("Pedido", pedidoSchema);