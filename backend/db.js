import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");

// Helper to ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database helper functions
export const db = {
  // Read database table
  read(table) {
    const filePath = path.join(DATA_DIR, `${table}.json`);
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf8");
        return [];
      }
      const rawData = fs.readFileSync(filePath, "utf8");
      return JSON.parse(rawData || "[]");
    } catch (error) {
      console.error(`Error reading table ${table}:`, error);
      return [];
    }
  },

  // Write database table
  write(table, data) {
    const filePath = path.join(DATA_DIR, `${table}.json`);
    try {
      // Write to temp file then rename (atomic write)
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
      fs.renameSync(tempPath, filePath);
      return true;
    } catch (error) {
      console.error(`Error writing table ${table}:`, error);
      return false;
    }
  },

  // Find all items matching a query
  find(table, filterFn = () => true) {
    const data = this.read(table);
    return data.filter(filterFn);
  },

  // Find one item matching a query
  findOne(table, filterFn) {
    const data = this.read(table);
    return data.find(filterFn);
  },

  // Insert a new item
  insert(table, item) {
    const data = this.read(table);
    const newItem = {
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      ...item,
    };
    data.push(newItem);
    this.write(table, data);
    return newItem;
  },

  // Update item by ID
  update(table, id, updates) {
    const data = this.read(table);
    const index = data.findIndex((i) => i.id === id);
    if (index === -1) return null;

    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.write(table, data);
    return data[index];
  },

  // Delete item by ID
  delete(table, id) {
    const data = this.read(table);
    const filtered = data.filter((i) => i.id !== id);
    if (data.length === filtered.length) return false;
    this.write(table, filtered);
    return true;
  },
};
