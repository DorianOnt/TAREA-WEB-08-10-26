import { Request, Response } from "express";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../conf/dbConnection";

interface ProductInput {
  name: string;
  price: number;
  stock: number;
  description: string;
  brand: string | null;
  img: string | null;
}

const parseId = (value: string): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const isValidPrice = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const validateBody = (
  body: unknown
): { data?: ProductInput; error?: string } => {
  const b = (body ?? {}) as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim() === "")
    return { error: "name es obligatorio y debe ser texto" };
  if (!isValidPrice(b.price))
    return { error: "price debe ser un número mayor que cero" };
  if (!Number.isInteger(b.stock) || (b.stock as number) < 0)
    return { error: "stock debe ser un entero mayor o igual a cero" };
  if (typeof b.description !== "string" || b.description.trim() === "")
    return { error: "description es obligatorio y debe ser texto" };
  if (b.brand != null && typeof b.brand !== "string")
    return { error: "brand debe ser texto" };
  if (b.img != null && typeof b.img !== "string")
    return { error: "img debe ser texto" };

  return {
    data: {
      name: b.name.trim(),
      price: b.price,
      stock: b.stock as number,
      description: b.description.trim(),
      brand: (b.brand as string | null | undefined) ?? null,
      img: (b.img as string | null | undefined) ?? null,
    },
  };
};

const serverError = (res: Response, error: unknown) => {
  console.error(error); // el detalle solo se ve en tu consola
  return res.status(500).json({ message: "Error interno del servidor" });
};

export const getAll = async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM products WHERE active = ?",
      [true]
    );
    return res.status(200).json(rows);
  } catch (error) {
    return serverError(res, error);
  }
};

export const getById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id as string);
  if (id === null) return res.status(400).json({ message: "ID inválido" });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM products WHERE id = ? AND active = ?",
      [id, true]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    return res.status(200).json(rows[0]);
  } catch (error) {
    return serverError(res, error);
  }
};

export const create = async (req: Request, res: Response) => {
  const { data, error } = validateBody(req.body);
  if (!data) return res.status(400).json({ message: error });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products (name, price, stock, description, brand, img)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.name, data.price, data.stock, data.description, data.brand, data.img]
    );
    return res
      .status(201)
      .json({ message: "Producto creado", id: result.insertId });
  } catch (error) {
    return serverError(res, error);
  }
};

export const update = async (req: Request, res: Response) => {
  const id = parseId(req.params.id as string);
  if (id === null) return res.status(400).json({ message: "ID inválido" });

  const { data, error } = validateBody(req.body);
  if (!data) return res.status(400).json({ message: error });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE products
       SET name = ?, price = ?, stock = ?, description = ?, brand = ?, img = ?
       WHERE id = ? AND active = ?`,
      [data.name, data.price, data.stock, data.description, data.brand, data.img, id, true]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    return res.status(200).json({ message: "Producto actualizado" });
  } catch (error) {
    return serverError(res, error);
  }
};

export const remove = async (req: Request, res: Response) => {
  const id = parseId(req.params.id as string);
  if (id === null) return res.status(400).json({ message: "ID inválido" });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE products SET active = ? WHERE id = ? AND active = ?",
      [false, id, true]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    return res.status(200).json({ message: "Producto dado de baja" });
  } catch (error) {
    return serverError(res, error);
  }
};

export const changePrice = async (req: Request, res: Response) => {
  const id = parseId(req.params.id as string);
  if (id === null) return res.status(400).json({ message: "ID inválido" });

  const price = (req.body ?? {}).price as unknown;
  if (!isValidPrice(price))
    return res
      .status(400)
      .json({ message: "price debe ser un número mayor que cero" });

  try {
    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE products SET price = ? WHERE id = ? AND active = ?",
      [price, id, true]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Producto no encontrado" });
    return res.status(200).json({ message: "Precio actualizado" });
  } catch (error) {
    return serverError(res, error);
  }
};