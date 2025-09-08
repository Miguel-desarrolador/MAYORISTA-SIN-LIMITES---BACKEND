import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true }, // mismo nombre que el PDF, sin .pdf
  items: [
    {
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto" },
      cantidad: { type: Number, required: true }
    }
  ],
  fecha: { type: Date, default: Date.now }
});

export default mongoose.model("Pedido", pedidoSchema);
