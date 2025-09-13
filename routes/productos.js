import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";       
import { Producto } from "../models/Producto.js";

const router = express.Router();

// ==========================
// CONFIGURACIÓN MULTER
// ==========================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "img/productos"); // carpeta donde se guardan las imágenes
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// ==========================
// GET todos los productos
// ==========================
router.get("/", async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los productos" });
  }
});

// ==========================
// POST agregar producto nuevo con imagen
// ==========================
router.post("/", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, categoria, precio, stock } = req.body;

    if (!nombre || !categoria || !precio || !stock || !req.file) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    // Generar id incremental basado en el último producto
    const lastProducto = await Producto.findOne().sort({ id: -1 });
    const id = lastProducto ? lastProducto.id + 1 : 1;

    const nuevoProducto = new Producto({
      id,
      nombre,
      categoria,
      precio,
      stock,
      imagen: req.file.filename // nombre del archivo guardado
    });

    await nuevoProducto.save();
    res.json(nuevoProducto);

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al agregar producto" });
  }
});

// ==========================
// PUT actualizar producto (stock, nombre, precio o categoría)
// ==========================
router.put("/:id", async (req, res) => {
  try {
    const { nombre, categoria, precio, stock } = req.body;

    // Validación básica
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ msg: "Stock inválido" });
    }

    // Construimos un objeto dinámico con los campos a actualizar
    const camposActualizar = {};
    if (nombre !== undefined) camposActualizar.nombre = nombre;
    if (categoria !== undefined) camposActualizar.categoria = categoria;
    if (precio !== undefined) camposActualizar.precio = precio;
    if (stock !== undefined) camposActualizar.stock = stock;

    const producto = await Producto.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      camposActualizar,
      { new: true }
    );

    if (!producto) return res.status(404).json({ msg: "Producto no encontrado" });

    res.json(producto);

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al actualizar producto" });
  }
});

// ==========================
// DELETE un producto por su id
// ==========================
router.delete("/:id", async (req, res) => {
  try {
    const producto = await Producto.findOneAndDelete({ id: parseInt(req.params.id) });

    if (!producto) return res.status(404).json({ msg: "Producto no encontrado" });

    // Eliminar la imagen del servidor
    const imagenPath = path.join("img/productos", producto.imagen);
    fs.unlink(imagenPath, (err) => {
      if (err) {
        console.error("No se pudo eliminar la imagen:", err);
      } else {
        console.log("Imagen eliminada correctamente:", producto.imagen);
      }
    });

    res.json({ msg: `Producto "${producto.nombre}" eliminado correctamente.` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar producto" });
  }
});

export default router;
