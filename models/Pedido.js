// models/Pedido.js
import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true }, // identificador único de la factura/pedido
  items: [
    {
      productoId: { type: Number, required: true }, // corresponde al campo "id" numérico de Producto
      cantidad: { type: Number, required: true, min: 1 }
    }
  ],
  estado: { 
    type: String, 
    enum: ["activo", "cancelado"], 
    default: "activo" 
  }, // activo | cancelado
  fecha: { type: Date, default: Date.now }
}, {
  timestamps: true // agrega createdAt y updatedAt automáticamente
});

// Exportar modelo
export const Pedido = mongoose.model("Pedido", pedidoSchema);
