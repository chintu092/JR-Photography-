import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc as fsDoc, getDoc as fsGetDoc } from "firebase/firestore";
import fs from "fs";
import { initializeApp as initAdminApp, getApps as getAdminApps, getApp as getAdminApp } from "firebase-admin/app";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

// Load environment configurations
dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initialize secure server-side Firebase Client
  let dbInstance: any = null;
  let adminDbInstance: any = null;
  let firebaseClientConfig: any = null;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      firebaseClientConfig = config;
      const firebaseApp = initializeApp(config, "server-app-unique");
      dbInstance = getFirestore(firebaseApp, config.firestoreDatabaseId);
      console.log("[Firebase Server Setup] Server-side Firestore client fully constructed!");

      if (getAdminApps().length === 0) {
        initAdminApp({
          projectId: config.projectId,
        });
      }
      adminDbInstance = getAdminFirestore(getAdminApp(), config.firestoreDatabaseId || "(default)");
      console.log("[Firebase Server Setup] Server-side Firestore Admin SDK fully constructed!");
    }
  } catch (error) {
    console.error("[Firebase Server Setup] Failed to build Firestore reference:", error);
  }

  function unwrapFirestoreFields(fields: any): any {
    if (!fields) return {};
    const result: any = {};
    for (const [key, valueObj] of Object.entries(fields)) {
      if (valueObj && typeof valueObj === "object") {
        const valueType = Object.keys(valueObj)[0];
        const rawValue = (valueObj as any)[valueType];
        if (valueType === "mapValue" && rawValue && rawValue.fields) {
          result[key] = unwrapFirestoreFields(rawValue.fields);
        } else if (valueType === "arrayValue" && rawValue && rawValue.values) {
          result[key] = rawValue.values.map((v: any) => {
            if (!v || typeof v !== "object") return v;
            const valType = Object.keys(v)[0];
            const innerVal = v[valType];
            if (valType === "mapValue" && innerVal && innerVal.fields) {
              return unwrapFirestoreFields(innerVal.fields);
            }
            return innerVal;
          });
        } else if (valueType === "integerValue") {
          result[key] = parseInt(rawValue, 10);
        } else if (valueType === "doubleValue") {
          result[key] = parseFloat(rawValue);
        } else if (valueType === "booleanValue") {
          result[key] = !!rawValue;
        } else {
          result[key] = rawValue;
        }
      }
    }
    return result;
  }

  async function fetchFirestoreDocumentRest(collection: string, documentId: string): Promise<any> {
    if (!firebaseClientConfig) {
      throw new Error("Firebase client configuration not found.");
    }
    const { projectId, firestoreDatabaseId, apiKey } = firebaseClientConfig;
    const dbId = firestoreDatabaseId || "(default)";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collection}/${documentId}?key=${apiKey}`;
    
    console.log(`[Firestore REST] Fetching: ${collection}/${documentId}`);
    try {
      const res = await fetch(url);
      if (res.status === 404) {
        console.warn(`[Firestore REST] Document not found: ${collection}/${documentId}`);
        return null;
      }
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Firestore REST] Error detail:`, errText);
        throw new Error(`REST status ${res.status}: ${errText}`);
      }
      const data = await res.json();
      return unwrapFirestoreFields(data.fields);
    } catch (err: any) {
      console.error(`[Firestore REST] Request failed for ${collection}/${documentId}:`, err.message);
      throw err;
    }
  }

  // Initialize secure server-side Gemini Client
  const geminiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  
  if (geminiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI SDK:", e);
    }
  }

  // API router health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebase: "configured", geminiConnected: !!ai });
  });

  // Test connection to MongoDB or MySQL
  app.post("/api/database/test", async (req: any, res: any) => {
    const { type, config } = req.body;
    if (!type) {
      return res.status(400).json({ success: false, message: "Type is required." });
    }

    if (type === "mongodb") {
      const { connectionString } = config || {};
      if (!connectionString) {
        return res.status(400).json({ success: false, message: "Connection String is required for MongoDB." });
      }
      try {
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(connectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        
        // Fetch databases to check authorization
        const adminDb = client.db().admin();
        const dbs = await adminDb.listDatabases();
        
        await client.close();
        return res.json({ 
          success: true, 
          message: "Successfully connected to MongoDB Cluster!",
          details: {
            databasesCount: dbs.databases.length,
            srvUrl: connectionString.substring(0, 15) + "..."
          }
        });
      } catch (err: any) {
        console.error("MongoDB test connection failed:", err);
        return res.json({ success: false, message: `MongoDB Connection Failed: ${err.message}` });
      }
    }

    if (type === "mysql") {
      const { host, port, user, password, database } = config || {};
      if (!host || !user || !database) {
        return res.status(400).json({ success: false, message: "Host, User, and Database are required for MySQL." });
      }
      try {
        const mysql = await import("mysql2/promise");
        const connConfig = {
          host,
          port: port ? parseInt(port, 10) : 3306,
          user,
          password: password || "",
          database,
          connectTimeout: 5000
        };
        const connection = await mysql.createConnection(connConfig);
        await connection.ping();
        
        // Query to check table counts
        const [rows]: any = await connection.query("SHOW TABLES");
        const tablesCount = Array.isArray(rows) ? rows.length : 0;
        
        await connection.end();
        return res.json({ 
          success: true, 
          message: `Successfully connected to MySQL database: '${database}'!`,
          details: {
            tablesCount,
            host: `${host}:${port || 3306}`
          }
        });
      } catch (err: any) {
        console.error("MySQL test connection failed:", err);
        return res.json({ success: false, message: `MySQL Connection Failed: ${err.message}` });
      }
    }

    return res.status(400).json({ success: false, message: "Invalid database type" });
  });

  // Query database in sandbox console
  app.post("/api/database/query", async (req: any, res: any) => {
    const { type, config, query } = req.body;
    if (!type || !query) {
      return res.status(400).json({ success: false, message: "Database type and query are required." });
    }

    if (type === "mongodb") {
      const { connectionString, database } = config || {};
      if (!connectionString) {
        return res.status(400).json({ success: false, message: "Connection string is required." });
      }
      try {
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(connectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        
        // Selected database
        const parsedUrl = new URL(connectionString);
        const dbName = database || parsedUrl.pathname.replace("/", "") || "test";
        const dbInstance = client.db(dbName);
        
        let results = [];
        const cleanQuery = query.trim();
        if (cleanQuery.startsWith("db.")) {
          const parts = cleanQuery.split(".");
          const colName = parts[1] || "";
          const operation = parts[2] || "find()";
          
          if (colName) {
            const collection = dbInstance.collection(colName);
            if (operation.includes("find")) {
              results = await collection.find({}).limit(20).toArray();
            } else if (operation.includes("count")) {
              const count = await collection.countDocuments({});
              results = [{ count }];
            } else {
              results = [{ message: "Only find/count query parsing is supported client-side in the Sandbox environment." }];
            }
          }
        } else {
          // General list collections
          results = await dbInstance.listCollections().toArray();
        }
        
        await client.close();
        return res.json({ success: true, results });
      } catch (err: any) {
        return res.json({ success: false, message: err.message });
      }
    }

    if (type === "mysql") {
      const { host, port, user, password, database } = config || {};
      if (!host || !user || !database) {
        return res.status(400).json({ success: false, message: "MySQL configuration mismatch." });
      }
      try {
        const mysql = await import("mysql2/promise");
        const connection = await mysql.createConnection({
          host,
          port: port ? parseInt(port, 10) : 3306,
          user,
          password: password || "",
          database,
          connectTimeout: 5000
        });
        
        const [results]: any = await connection.query(query);
        await connection.end();
        return res.json({ success: true, results });
      } catch (err: any) {
        return res.json({ success: false, message: err.message });
      }
    }

    return res.status(400).json({ success: false, message: "Unsupported database type." });
  });

  // Migrate Data from Firebase Firestore (passed as payload) to MongoDB / MySQL
  app.post("/api/database/migrate", async (req: any, res: any) => {
    const { type, config, payload } = req.body;
    if (!type || !payload) {
      return res.status(400).json({ success: false, message: "Database type and Firestore collections payload are required." });
    }

    if (type === "mongodb") {
      const { connectionString, database } = config || {};
      if (!connectionString) {
        return res.status(400).json({ success: false, message: "MongoDB Connection string is required." });
      }
      try {
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(connectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        
        // Define DB
        const parsedUrl = new URL(connectionString);
        const dbName = database || parsedUrl.pathname.replace("/", "") || "jrphotography";
        const dbInstance = client.db(dbName);
        
        let migratedCollectionsCount = 0;
        let totalRecordsMigrated = 0;

        for (const colName of Object.keys(payload)) {
          const records = payload[colName];
          if (!Array.isArray(records) || records.length === 0) continue;
          
          const collection = dbInstance.collection(colName);
          // Drop existing to ensure clean migration overlay
          try {
            await collection.deleteMany({});
          } catch (e) {
            console.warn(`Could not drop mongodb collection '${colName}':`, e);
          }
          
          const cleanRecords = records.map((r: any) => {
            const docCopy = { ...r };
            if (docCopy.id) {
              docCopy._id = docCopy.id;
            }
            return docCopy;
          });

          await collection.insertMany(cleanRecords);
          migratedCollectionsCount++;
          totalRecordsMigrated += cleanRecords.length;
        }

        await client.close();
        return res.json({
          success: true,
          message: `Firestore sync to MongoDB completed successfully!`,
          details: {
            migratedCollectionsCount,
            totalRecordsMigrated,
            database: dbName
          }
        });
      } catch (err: any) {
        console.error("MongoDB migration error:", err);
        return res.json({ success: false, message: `MongoDB Migration Failure: ${err.message}` });
      }
    }

    if (type === "mysql") {
      const { host, port, user, password, database } = config || {};
      if (!host || !user || !database) {
        return res.status(400).json({ success: false, message: "MySQL host, user and database configuration is required." });
      }

      // Helper to redact sensitive credentials before writing to dynamic values
      const redactSecrets = (obj: any): any => {
        if (!obj || typeof obj !== "object") return obj;
        
        if (Array.isArray(obj)) {
          return obj.map(item => redactSecrets(item));
        }

        const copy = { ...obj };
        for (const key of Object.keys(copy)) {
          const lowercaseKey = key.toLowerCase();
          
          if (
            lowercaseKey === "password" || 
            lowercaseKey === "pass" || 
            lowercaseKey === "mysqlpass" ||
            lowercaseKey === "dbpass" || 
            lowercaseKey === "secret" ||
            lowercaseKey === "passcode"
          ) {
            copy[key] = "";
          } else if (lowercaseKey === "connectionstring" || lowercaseKey === "uri") {
            const val = copy[key];
            if (typeof val === "string" && val.includes("://") && val.includes("@")) {
              try {
                const urlObj = new URL(val);
                if (urlObj.password) {
                  urlObj.password = "REDACTED";
                }
                copy[key] = urlObj.toString();
              } catch (e) {
                copy[key] = val.replace(/(:\/\/.*?):(.*?)@/, "$1:REDACTED@");
              }
            } else {
              copy[key] = "REDACTED";
            }
          } else if (typeof copy[key] === "object") {
            copy[key] = redactSecrets(copy[key]);
          }
        }
        return copy;
      };

      // Helper to dynamically infer optimal MySQL data type
      const inferColumnType = (fieldName: string, values: any[]): string => {
        let hasBoolean = false;
        let hasNumber = false;
        let hasFloat = false;
        let hasObjectOrArray = false;
        let hasText = false;

        for (const val of values) {
          if (val === null || val === undefined) continue;
          
          if (typeof val === "boolean") {
            hasBoolean = true;
          } else if (typeof val === "number") {
            hasNumber = true;
            if (!Number.isInteger(val)) {
              hasFloat = true;
            }
          } else if (typeof val === "object") {
            hasObjectOrArray = true;
          } else {
            hasText = true;
          }
        }

        if (hasObjectOrArray) {
          return "JSON";
        }
        if (hasText) {
          return "TEXT";
        }
        if (hasFloat) {
          return "DOUBLE";
        }
        if (hasNumber) {
          return "INT";
        }
        if (hasBoolean) {
          return "TINYINT(1)";
        }
        return "TEXT";
      };

      try {
        const mysql = await import("mysql2/promise");
        const connection = await mysql.createConnection({
          host,
          port: port ? parseInt(port, 10) : 3306,
          user,
          password: password || "",
          database,
          connectTimeout: 5000,
          multipleStatements: true
        });

        let migratedCollectionsCount = 0;
        let totalRecordsMigrated = 0;

        for (const colName of Object.keys(payload)) {
          const records = payload[colName];
          if (!Array.isArray(records) || records.length === 0) continue;

          await connection.query(`DROP TABLE IF EXISTS \`${colName}\``);

          // 1. Scan all items to gather every unique key across all records
          const allKeys = new Set<string>();
          for (const item of records) {
            Object.keys(item).forEach(k => {
              if (k !== "id") {
                allKeys.add(k);
              }
            });
          }

          // 2. Infer data type for each key based on populated samples
          const columnDefinitions: string[] = [];
          const keyTypes: { [key: string]: string } = {};

          allKeys.forEach(k => {
            const values = records.map(r => r[k]);
            const colType = inferColumnType(k, values);
            keyTypes[k] = colType;
            columnDefinitions.push(`\`${k}\` ${colType} DEFAULT NULL`);
          });

          // 3. Create the database table with the dynamically computed schema
          const createTableSQL = `
            CREATE TABLE \`${colName}\` (
              \`id\` VARCHAR(128) NOT NULL,
              ${columnDefinitions.length > 0 ? columnDefinitions.join(",\n") + "," : ""}
              \`raw_data\` LONGTEXT DEFAULT NULL,
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
          `;
          
          await connection.query(createTableSQL);

          // 4. Safely insert each record with dynamic columns and redacted secrets
          for (const item of records) {
            const safeItem = redactSecrets(item);
            const id = safeItem.id || `doc_${Math.random().toString(36).substr(2, 9)}`;
            
            const valuesMap: any = {};
            allKeys.forEach(k => {
              if (k in safeItem) {
                const val = safeItem[k];
                if (val !== null && val !== undefined) {
                  if (typeof val === "object") {
                    valuesMap[k] = JSON.stringify(val);
                  } else if (typeof val === "boolean") {
                    valuesMap[k] = val ? 1 : 0;
                  } else {
                    valuesMap[k] = val;
                  }
                } else {
                  valuesMap[k] = null;
                }
              } else {
                valuesMap[k] = null;
              }
            });

            const keys = ["id", ...Array.from(allKeys), "raw_data"];
            const placeholders = keys.map(() => "?").join(", ");
            const rawDataJson = JSON.stringify(safeItem);
            const queryParams = [id, ...Array.from(allKeys).map(k => valuesMap[k]), rawDataJson];

            const insertSQL = `INSERT INTO \`${colName}\` (${keys.map(k => `\`${k}\``).join(", ")}) VALUES (${placeholders})`;
            await connection.query(insertSQL, queryParams);
            totalRecordsMigrated++;
          }
          migratedCollectionsCount++;
        }

        await connection.end();
        return res.json({
          success: true,
          message: `Firestore sync to MySQL completed successfully! Dynamic relational tables with properly mapped columns have been generated. All database passwords and secrets have been redacted.`,
          details: {
            migratedCollectionsCount,
            totalRecordsMigrated,
            database
          }
        });
      } catch (err: any) {
        console.error("MySQL migration error:", err);
        return res.json({ success: false, message: `MySQL Migration Failure: ${err.message}` });
      }
    }

    return res.status(400).json({ success: false, message: "Unsupported migration database target." });
  });

  // Pull data from MongoDB or MySQL to return to Firestore client-side for writing
  app.post("/api/database/pull", async (req: any, res: any) => {
    const { type, config, collections } = req.body;
    if (!type || !Array.isArray(collections)) {
      return res.status(400).json({ success: false, message: "Database type and collections list are required." });
    }

    if (type === "mongodb") {
      const { connectionString, database } = config || {};
      if (!connectionString) {
        return res.status(400).json({ success: false, message: "MongoDB connection string is required." });
      }
      try {
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(connectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();

        const parsedUrl = new URL(connectionString);
        const dbName = database || parsedUrl.pathname.replace("/", "") || "jrphotography";
        const dbInstance = client.db(dbName);

        const payload: { [key: string]: any[] } = {};

        for (const colName of collections) {
          try {
            const collection = dbInstance.collection(colName);
            const docs = await collection.find({}).toArray();
            payload[colName] = docs.map((doc: any) => {
              const docCopy = { ...doc };
              if (docCopy._id) {
                docCopy.id = String(docCopy._id);
                delete docCopy._id;
              }
              return docCopy;
            });
          } catch (e: any) {
            console.warn(`Query failed for MongoDB collection ${colName}:`, e);
            payload[colName] = [];
          }
        }

        await client.close();
        return res.json({ success: true, payload });
      } catch (err: any) {
        console.error("MongoDB pull failed:", err);
        return res.status(500).json({ success: false, message: `MongoDB Pull Failed: ${err.message}` });
      }
    }

    if (type === "mysql") {
      const { host, port, user, password, database } = config || {};
      if (!host || !user || !database) {
        return res.status(400).json({ success: false, message: "MySQL configuration is incomplete." });
      }
      try {
        const mysql = await import("mysql2/promise");
        const connection = await mysql.createConnection({
          host,
          port: port ? parseInt(port, 10) : 3306,
          user,
          password: password || "",
          database,
          connectTimeout: 5000
        });

        const payload: { [key: string]: any[] } = {};

        for (const tableName of collections) {
          try {
            const [tables]: any = await connection.query("SHOW TABLES LIKE ?", [tableName]);
            if (Array.isArray(tables) && tables.length > 0) {
              const [rows]: any = await connection.query(`SELECT * FROM \`${tableName}\``);
              if (Array.isArray(rows)) {
                payload[tableName] = rows.map((row: any) => {
                  if (row.raw_data) {
                    try {
                      const parsed = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
                      if (parsed && typeof parsed === 'object') {
                        return { id: row.id, ...parsed };
                      }
                    } catch (e) {
                      console.warn(`Failed to parse raw_data field for ${tableName}`, e);
                    }
                  }
                  const { raw_data, ...rest } = row;
                  return rest;
                });
              } else {
                payload[tableName] = [];
              }
            } else {
              payload[tableName] = [];
            }
          } catch (e: any) {
            console.warn(`Query failed for MySQL table ${tableName}:`, e);
            payload[tableName] = [];
          }
        }

        await connection.end();
        return res.json({ success: true, payload });
      } catch (err: any) {
        console.error("MySQL pull failed:", err);
        return res.status(500).json({ success: false, message: `MySQL Pull Failed: ${err.message}` });
      }
    }

    return res.status(400).json({ success: false, message: "Unsupported database type." });
  });

  // Configure active database selection
  app.post("/api/database/set-active", async (req: any, res: any) => {
    const { activeEngine, mongodb, mysql } = req.body;
    if (!activeEngine) {
      return res.status(400).json({ success: false, message: "activeEngine is required." });
    }

    const activeDbPath = path.join(process.cwd(), "active-db.json");
    try {
      const fs = await import("fs/promises");
      let currentConfig: any = {};
      try {
        const raw = await fs.readFile(activeDbPath, "utf-8");
        currentConfig = JSON.parse(raw);
      } catch (err) {
        // Init empty
      }

      currentConfig.activeEngine = activeEngine;
      if (mongodb) currentConfig.mongodb = mongodb;
      if (mysql) currentConfig.mysql = mysql;

      await fs.writeFile(activeDbPath, JSON.stringify(currentConfig, null, 2), "utf-8");
      
      return res.json({ 
        success: true, 
        message: `Successfully updated active database engine to: ${activeEngine.toUpperCase()}`,
        activeEngine 
      });
    } catch (e: any) {
      console.error("Set active engine failed:", e);
      return res.status(500).json({ success: false, message: `Failed to set active engine: ${e.message}` });
    }
  });

  // Serve public collection content depending on active database engine
  app.get("/api/content/:collectionName", async (req: any, res: any) => {
    const { collectionName } = req.params;
    
    let activeEngine = "firestore";
    const activeDbPath = path.join(process.cwd(), "active-db.json");
    try {
      const fs = await import("fs/promises");
      const data = await fs.readFile(activeDbPath, "utf-8");
      const config = JSON.parse(data);
      activeEngine = config.activeEngine || "firestore";
    } catch (e) {
      // Ignored, defaults to firestore
    }

    if (activeEngine === "firestore") {
      return res.json([]);
    }

    let dbConfig: any = null;
    try {
      const fs = await import("fs/promises");
      const data = await fs.readFile(activeDbPath, "utf-8");
      dbConfig = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ success: false, message: "Database configuration not found." });
    }

    if (activeEngine === "mongodb") {
      const mongoConfig = dbConfig.mongodb;
      if (!mongoConfig?.connectionString) {
        return res.status(400).json({ success: false, message: "MongoDB connection config is missing." });
      }
      try {
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(mongoConfig.connectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();

        const parsedUrl = new URL(mongoConfig.connectionString);
        const dbName = mongoConfig.database || parsedUrl.pathname.replace("/", "") || "jrphotography";
        const dbInstance = client.db(dbName);

        const collection = dbInstance.collection(collectionName);
        const docs = await collection.find({}).toArray();
        const results = docs.map((doc: any) => {
          const docCopy = { ...doc };
          if (docCopy._id) {
            docCopy.id = String(docCopy._id);
            delete docCopy._id;
          }
          return docCopy;
        });

        await client.close();
        return res.json(results);
      } catch (err: any) {
        console.error("MongoDB content read failed:", err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (activeEngine === "mysql") {
      const mysqlConfig = dbConfig.mysql;
      if (!mysqlConfig?.host || !mysqlConfig?.user || !mysqlConfig?.database) {
        return res.status(400).json({ success: false, message: "MySQL configuration is missing." });
      }
      try {
        const mysql = await import("mysql2/promise");
        const connection = await mysql.createConnection({
          host: mysqlConfig.host,
          port: mysqlConfig.port ? parseInt(mysqlConfig.port, 10) : 3306,
          user: mysqlConfig.user,
          password: mysqlConfig.password || "",
          database: mysqlConfig.database,
          connectTimeout: 5000
        });

        const [tables]: any = await connection.query("SHOW TABLES LIKE ?", [collectionName]);
        if (Array.isArray(tables) && tables.length > 0) {
          const [rows]: any = await connection.query(`SELECT * FROM \`${collectionName}\``);
          let results = [];
          if (Array.isArray(rows)) {
            results = rows.map((row: any) => {
              if (row.raw_data) {
                try {
                  const parsed = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data;
                  if (parsed && typeof parsed === 'object') {
                    return { id: row.id, ...parsed };
                  }
                } catch (e) {
                  // Fallback
                }
              }
              const { raw_data, ...rest } = row;
              return rest;
            });
          }
          await connection.end();
          return res.json(results);
        } else {
          await connection.end();
          return res.json([]);
        }
      } catch (err: any) {
        console.error("MySQL content read failed:", err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    return res.status(400).json({ success: false, message: "Unsupported database engine." });
  });

  // AI SEO Generator proxy endpoint
  app.post("/api/seo/generate", async (req: any, res: any) => {
    const { field, title, summary, keyword, content, type } = req.body;

    if (!ai) {
      // Elegant mocked feedback if no valid server-side API Key is configured yet, 
      // preventing startup crashes as mandated in the sandbox instructions.
      console.warn("GEMINI_API_KEY missing in environment. Using smart heuristic generator.");
      const generated = generateSEOHeuristics(field, title, summary, keyword, type);
      return res.json({ text: generated });
    }

    try {
      let prompt = "";
      if (field === "title") {
        prompt = `Generate an optimized SEO Title for a ${type} item titled "${title}". Focus Keyword: "${keyword}". It must be emotional, premium, between 50-60 characters, with Kolkata or wedding photographic accents if relevant.`;
      } else if (field === "description") {
        prompt = `Generate an optimized Meta Description/Summary for a ${type} item titled "${title}". Description/Summary: "${summary}". Keywords: "${keyword}". Length must be exactly between 140-160 characters, containing the focus keyword organically. Tone: high-end luxury editorial.`;
      } else if (field === "keywords") {
        prompt = `Generate a comma-separated list of 5 focused keywords or long-tail topics for a ${type} titled "${title}". Focus Keyword is "${keyword}".`;
      } else if (field === "schema") {
        prompt = `Generate valid Schema JSON-LD markup for a ${type} with Title: "${title}", Summary: "${summary}". Return ONLY raw JSON, do not include markdown blocks like \`\`\`json.`;
      } else {
        prompt = `Generate premium Open graph metadata for ${field} on a ${type} with title "${title}".`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      let responseText = response.text || "";
      // Strip markdown braces if returned inside schema JSON
      if (field === "schema") {
        responseText = responseText.replace(/```json|```/gi, "").trim();
      }

      res.json({ text: responseText.trim() });
    } catch (error: any) {
      console.error("Gemini call failed:", error);
      const backup = generateSEOHeuristics(field, title, summary, keyword, type);
      res.json({ text: backup, warning: "Using fallback generator due to API constraints." });
    }
  });

  // Smart local heuristic generator for seamless offline execution
  function generateSEOHeuristics(field: string, title: string, summary: string, keyword: string, type: string) {
    const brand = "JR Photography";
    const loc = "Kolkata";
    const cleanWord = keyword || "Best Wedding Photographer";
    
    if (field === "title") {
      const basic = `${title} | Premium ${cleanWord} in ${loc}`;
      return basic.length > 60 ? basic.substring(0, 57) + "..." : basic;
    }
    if (field === "description") {
      const base = `${summary || title}. Handcrafted candid framing by top award-winning photography services in ${loc}, West Bengal. Explore luxury pre-wedding & cinematics now.`;
      return base.length > 160 ? base.substring(0, 157) + "..." : base;
    }
    if (field === "keywords") {
      return `${cleanWord}, ${keyword || "wedding cinematography"}, photography studio ${loc}, premium candid portraits, luxury events photography`;
    }
    if (field === "schema") {
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": type === "posts" ? "BlogPosting" : "CreativeWork",
        "name": title,
        "description": summary || title,
        "provider": {
          "@type": "LocalBusiness",
          "name": brand,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": loc,
            "addressCountry": "IN"
          }
        }
      }, null, 2);
    }
    return `${title} Open Graph Custom Metadata`;
  }

  // SMTP Test Mail endpoint
  app.post("/api/mail/test-smtp", async (req: any, res: any) => {
    const { host, port, username, password, secure, fromEmail, fromName, toEmail, subject, body } = req.body;
    
    if (!host || !port || !toEmail) {
      return res.status(400).json({ success: false, message: "Host, Port, and Recipient Email are required." });
    }

    const logs: string[] = [];
    const customLogger = {
      info: (msg: any, ...args: any[]) => {
        logs.push(`[INFO] ${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`);
      },
      warn: (msg: any, ...args: any[]) => {
        logs.push(`[WARN] ${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`);
      },
      error: (msg: any, ...args: any[]) => {
        logs.push(`[ERROR] ${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`);
      }
    };

    try {
      logs.push(`[SYSTEM] Initializing nodemailer SMTP connection with ${host}:${port}...`);
      
      const nodemailer = await import("nodemailer");
      
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: secure === true || secure === "true",
        auth: username ? {
          user: username,
          pass: password || "",
        } : undefined,
        tls: {
          rejectUnauthorized: false
        },
        logger: customLogger as any,
        debug: true
      });

      logs.push(`[SYSTEM] Verifying SMTP connection...`);
      await transporter.verify();
      logs.push(`[SYSTEM] SMTP Connection verified successfully!`);

      logs.push(`[SYSTEM] Attempting to send test email to ${toEmail}...`);
      const info = await transporter.sendMail({
        from: `"${fromName || 'JR Photography Live Studio'}" <${fromEmail || username || 'no-reply@example.com'}>`,
        to: toEmail,
        subject: subject || "WP-SMTP Styled Test Mail - JR Photography Studio",
        text: body || "Hi there!\n\nThis is a test email confirming that your SMTP server connection is fully functional.\n\nWarm regards,\nJR Photography Studio",
        html: `
          <div style="font-family: sans-serif; padding: 24px; background-color: #0c0b11; color: #ffffff; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: auto;">
            <div style="border-bottom: 2px solid #cfb53b; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="font-family: serif; color: #cfb53b; margin: 0; font-style: italic;">JR PHOTOGRAPHY</h2>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4);">SMTP Connection Test Dashboard</span>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.85);">
              Hello! This is a secure verification message confirming that your SMTP settings are successfully synchronized and authenticated in the Admin Suite.
            </p>
            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; margin-block: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #cfb53b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Connection Metadata</h4>
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: rgba(255,255,255,0.4); width: 120px;">SMTP Gateway:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #ffffff;">${host}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: rgba(255,255,255,0.4);">Port Configured:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #ffffff;">${port}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: rgba(255,255,255,0.4);">Security Mode:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #ffffff;">${secure ? 'SSL/TLS (Implicit)' : 'STARTTLS / Standard'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: rgba(255,255,255,0.4);">Sender Signature:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #ffffff;">&ldquo;${fromName || 'JR Studio'}&rdquo; &lt;${fromEmail || username || 'no-reply@example.com'}&gt;</td>
                </tr>
              </table>
            </div>
            <p style="font-size: 11px; color: rgba(255,255,255,0.3); text-align: center; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
              © 2026 JR Photography Studio. Decisive frames of Kolkata, West Bengal.
            </p>
          </div>
        `
      });

      logs.push(`[SYSTEM] Mail dispatched successfully! Response ID: ${info.messageId}`);
      
      return res.json({
        success: true,
        message: "SMTP Test Email Sent Successfully!",
        messageId: info.messageId,
        logs
      });

    } catch (err: any) {
      logs.push(`[FATAL ERROR] ${err.message}`);
      if (err.stack) {
        logs.push(`[STACK] ${err.stack}`);
      }
      return res.json({
        success: false,
        message: `SMTP Test Failed: ${err.message}`,
        logs
      });
    }
  });

  // General Wayfic Mail Dispatcher
  app.post("/api/mail/send", async (req: any, res: any) => {
    const { formId, formData, mailSubject, mailBody, customRecipient } = req.body;

    if (!dbInstance && !adminDbInstance) {
      return res.status(500).json({ success: false, message: "Server-side Database connection not configured." });
    }

    try {
      console.log(`[Wayfic Mailer] Processing submission dispatch for Form ID: ${formId}`);

      // 1. Retrieve the latest form layout configuration directly from the Firestore collection
      let finalSubject = mailSubject;
      let finalBody = mailBody;
      let recipientObj = customRecipient;
      let formTitle = "";

      if (formId) {
        try {
          let formConfig: any = null;
          
          // 1. Try Admin SDK first
          if (adminDbInstance) {
            try {
              const formSnap = await adminDbInstance.collection("wayfic_forms").doc(formId).get();
              if (formSnap.exists) {
                formConfig = formSnap.data();
              }
            } catch (adminErr: any) {
              console.log("[Wayfic Mailer] Admin SDK wayfic_forms lookup skipped (using fallback).");
            }
          }

          // 2. Try REST API fallback if Admin SDK failed or didn't run
          if (!formConfig && firebaseClientConfig) {
            try {
              formConfig = await fetchFirestoreDocumentRest("wayfic_forms", formId);
            } catch (restErr: any) {
              console.log("[Wayfic Mailer] REST API wayfic_forms lookup skipped (using fallback).");
            }
          }

          // 3. Try standard client SDK fallback
          if (!formConfig && dbInstance) {
            try {
              const formSnap = await fsGetDoc(fsDoc(dbInstance, "wayfic_forms", formId));
              if (formSnap.exists()) {
                formConfig = formSnap.data();
              }
            } catch (fsErr: any) {
              console.log("[Wayfic Mailer] Client SDK wayfic_forms lookup skipped.");
            }
          }

          if (formConfig) {
            formTitle = formConfig.title || "";
            if (!recipientObj) recipientObj = formConfig.mailto;
            if (!finalSubject) finalSubject = formConfig.subject;
            if (!finalBody) finalBody = formConfig.bodyTemplate;
            console.log(`[Wayfic Mailer] Loaded live database form metadata - Title: "${formTitle}", mailto: "${recipientObj}"`);
          } else {
            console.warn(`[Wayfic Mailer] Form blueprint not found, using request inputs.`);
          }
        } catch (dbErr: any) {
          console.log("[Wayfic Mailer] Form layout final check completed.");
        }
      }

      // 2. Load SMTP configurations
      let smtp: any = null;
      try {
        // 1. Try Admin SDK first
        if (adminDbInstance) {
          try {
            const smtpSnap = await adminDbInstance.collection("settings").doc("smtp").get();
            if (smtpSnap.exists) {
              smtp = smtpSnap.data();
            }
          } catch (adminErr: any) {
            console.log("[Wayfic Mailer] Admin SDK SMTP lookup skipped (using fallback).");
          }
        }

        // 2. Try REST API fallback if Admin SDK failed or didn't run
        if (!smtp && firebaseClientConfig) {
          try {
            smtp = await fetchFirestoreDocumentRest("settings", "smtp");
          } catch (restErr: any) {
            console.log("[Wayfic Mailer] REST API SMTP lookup skipped (using fallback).");
          }
        }

        // 3. Try standard client SDK fallback
        if (!smtp && dbInstance) {
          try {
            const smtpSnap = await fsGetDoc(fsDoc(dbInstance, "settings", "smtp"));
            if (smtpSnap.exists()) {
              smtp = smtpSnap.data();
            }
          } catch (fsErr: any) {
            console.log("[Wayfic Mailer] Client SDK SMTP lookup skipped.");
          }
        }
      } catch (dbErr: any) {
        console.log("[Wayfic Mailer] SMTP lookup fallback final check completed.");
      }

      if (!smtp) {
        console.warn("[Wayfic Mailer] SMTP settings do not exist. Skipping delivery.");
        return res.json({ success: false, message: "SMTP server settings are not configured in the Admin panel." });
      }

      if (!smtp.host || !smtp.port) {
        console.warn("[Wayfic Mailer] SMTP server configuration has missing host/port. Skipping delivery.");
        return res.json({ success: false, message: "Incomplete SMTP connection settings in administration panel." });
      }

      // 3. Fallbacks and defaults
      if (!finalSubject) {
        finalSubject = `New Inquiry on [${formTitle || formId || 'Form Portal'}]`;
      }
      if (!finalBody) {
        finalBody = "";
      }

      // Handle form title and id replacements
      if (formTitle) {
        finalSubject = finalSubject.replace(/{form_title}/g, formTitle);
        finalBody = finalBody.replace(/{form_title}/g, formTitle);
      }
      if (formId) {
        finalSubject = finalSubject.replace(/{form_id}/g, formId);
        finalBody = finalBody.replace(/{form_id}/g, formId);
      }

      // Replace placeholders if formData is present
      if (formData && typeof formData === "object") {
        if (!finalBody) {
          // Construct default fallback details table if no template is saved
          finalBody = `<h2>New Form Submission via Form [${formTitle || formId || 'Inquiry'}]</h2><br/>`;
          finalBody += `<table style="width: 100%; max-width: 600px; border-collapse: collapse; font-family: sans-serif; font-size: 14px;">`;
          for (const [key, val] of Object.entries(formData)) {
            finalBody += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">`;
            finalBody += `<td style="padding: 10px; font-weight: bold; width: 150px; color: #cfb53b;">${key}:</td>`;
            finalBody += `<td style="padding: 10px; color: #ffffff;">${typeof val === 'object' ? JSON.stringify(val) : val}</td>`;
            finalBody += `</tr>`;
          }
          finalBody += `</table>`;
        } else {
          // Robustly replace placeholder fields from submission data
          for (const [key, val] of Object.entries(formData)) {
            const regex = new RegExp(`{${key}}`, "g");
            const replacementValue = val !== undefined && val !== null ? String(val) : "";
            finalSubject = finalSubject.replace(regex, replacementValue);
            finalBody = finalBody.replace(regex, replacementValue);
          }
        }
      }

      // Trim and clean delivery target
      const recipient = typeof recipientObj === "string" ? recipientObj.trim() : "";
      const finalRecipient = recipient || smtp.fromEmail || smtp.username;

      if (!finalRecipient) {
        console.warn("[Wayfic Mailer] No recipient email resolved.");
        return res.status(400).json({ success: false, message: "No recipient address found (either in form template 'Deliver To' or SMTP configuration)." });
      }

      console.log(`[Wayfic Mailer] Form routing target recipient: "${finalRecipient}"`);

      // 4. Initialize NodeMailer Transporter
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: parseInt(smtp.port, 10),
        secure: smtp.secure === true || smtp.secure === "true",
        auth: smtp.username ? {
          user: smtp.username,
          pass: smtp.password || "",
        } : undefined,
        tls: {
          rejectUnauthorized: false
        }
      });

      // Renders premium HTML wrap or clean text block
      const processedHtml = finalBody.includes("<") && finalBody.includes(">") 
        ? `
          <div style="font-family: sans-serif; padding: 24px; background-color: #0c0b11; color: #ffffff; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 600px; margin: auto;">
            <div style="border-bottom: 2px solid #cfb53b; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="font-family: serif; color: #cfb53b; margin: 0; font-style: italic;">WAYFIC SECURE SECRETS</h2>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4);">${formTitle ? formTitle.toUpperCase() : "Outbound Correspondence Router"}</span>
            </div>
            <div style="line-height: 1.6; color: rgba(255,255,255,0.85); font-size: 14px;">
              ${finalBody}
            </div>
            <p style="font-size: 11px; color: rgba(255,255,255,0.3); text-align: center; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
              © 2026 JR Photography Studio. Decisive frames of Kolkata. Secure SMTP Delivery.
            </p>
          </div>
        `
        : `Wayfic Form Submission:\n\n${finalBody}`;

      // 5. Send message
      const info = await transporter.sendMail({
        from: `"${smtp.fromName || 'Wayfic Form Portal'}" <${smtp.fromEmail || smtp.username || 'no-reply@example.com'}>`,
        to: finalRecipient,
        subject: finalSubject,
        text: finalBody.replace(/<[^>]*>/g, ""), // strip HTML tags
        html: processedHtml
      });

      console.log(`[Wayfic Mailer] Routed submission mail successfully to ${finalRecipient}. Message ID: ${info.messageId}`);
      return res.json({ success: true, message: "Submission details sent successfully!", messageId: info.messageId });

    } catch (err: any) {
      console.error("[Wayfic Mailer] Message delivery failed:", err.message);
      return res.json({ success: false, message: `SMTP Server Relay Error: ${err.message}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
