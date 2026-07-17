import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

// Load environment configurations
dotenv.config();

async function startServer() {
  const app = express();
  const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next);
  app.use(express.json());
  const PORT = 3000;

    // We only use REST API in the server to avoid WebChannel socket crashes in Serverless
  let firebaseClientConfig: any = null;

  try {
    let configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      configPath = path.join(process.cwd(), "..", "firebase-applet-config.json");
    }

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      firebaseClientConfig = config;
      console.log("[Firebase Server Setup] Loaded Firebase config for REST API!");
    }
  } catch (error) {
    console.error("[Firebase Server Setup] Failed to load config:", error);
  }

  function escapeMongoURI(uri: string): string {
    if (!uri) return uri;
    try {
      const protocolMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/);
      if (!protocolMatch) return uri;
      const [_, protocol, rest] = protocolMatch;
      
      const lastAtIndex = rest.lastIndexOf('@');
      if (lastAtIndex === -1) {
        return uri;
      }
      
      const userinfo = rest.substring(0, lastAtIndex);
      const hostAndRest = rest.substring(lastAtIndex + 1);
      
      const firstColonIndex = userinfo.indexOf(':');
      if (firstColonIndex === -1) {
        let decoded = userinfo;
        try {
          decoded = decodeURIComponent(userinfo);
        } catch (_) {}
        return protocol + encodeURIComponent(decoded) + '@' + hostAndRest;
      }
      
      const username = userinfo.substring(0, firstColonIndex);
      const password = userinfo.substring(firstColonIndex + 1);
      
      let decodedUsername = username;
      try {
        decodedUsername = decodeURIComponent(username);
      } catch (_) {}
      
      let decodedPassword = password;
      try {
        decodedPassword = decodeURIComponent(password);
      } catch (_) {}
      
      const safeUsername = encodeURIComponent(decodedUsername);
      const safePassword = encodeURIComponent(decodedPassword);
      
      return protocol + safeUsername + ':' + safePassword + '@' + hostAndRest;
    } catch (err) {
      console.warn("Failed to automatically escape MongoDB URI:", err);
      return uri;
    }
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

  async function createFirestoreDocumentRest(collection: string, data: any): Promise<any> {
    if (!firebaseClientConfig) {
      console.warn("[Firestore REST] Cannot write without firebase config");
      return null;
    }
    const { projectId, firestoreDatabaseId, apiKey } = firebaseClientConfig;
    const dbId = firestoreDatabaseId || "(default)";
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collection}?key=${apiKey}`;
    
    const fields: any = {};
    for (const [k, v] of Object.entries(data)) {
        if (v === null || v === undefined) continue;
        if (typeof v === 'string') fields[k] = { stringValue: v };
        else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
        else if (typeof v === 'number') {
            if (Number.isInteger(v)) fields[k] = { integerValue: v.toString() };
            else fields[k] = { doubleValue: v };
        }
        else if (typeof v === 'object' && 'timestampValue' in v) {
            fields[k] = { timestampValue: (v as any).timestampValue };
        } else if (typeof v === 'object') {
            fields[k] = { stringValue: JSON.stringify(v) };
        }
    }

    try {
      const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Firestore REST] Write error:`, errText);
      }
      return await res.json();
    } catch (err: any) {
      console.error(`[Firestore REST] Write failed:`, err.message);
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
        const escapedConnectionString = escapeMongoURI(connectionString);
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(escapedConnectionString, { serverSelectionTimeoutMS: 5000 });
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

  // Fetch collection counts for MongoDB
  app.post("/api/database/mongodb/counts", async (req: any, res: any) => {
    const { connectionString, database, collections } = req.body;
    if (!connectionString) {
      return res.status(400).json({ success: false, message: "Connection string is required." });
    }
    try {
      const escapedConnectionString = escapeMongoURI(connectionString);
      const { MongoClient } = await import("mongodb");
      const client = new MongoClient(escapedConnectionString, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      
      const parsedUrl = new URL(escapedConnectionString);
      const dbName = database || parsedUrl.pathname.replace("/", "") || "jrphotography";
      const dbInstance = client.db(dbName);
      
      const counts: { [key: string]: number } = {};
      const cols = Array.isArray(collections) ? collections : [];
      for (const colName of cols) {
        try {
          const count = await dbInstance.collection(colName).countDocuments();
          counts[colName] = count;
        } catch (e) {
          counts[colName] = 0;
        }
      }
      
      await client.close();
      return res.json({ success: true, counts });
    } catch (err: any) {
      console.error("Failed to fetch MongoDB collection counts:", err);
      return res.json({ success: false, message: err.message });
    }
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
        const escapedConnectionString = escapeMongoURI(connectionString);
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(escapedConnectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        
        // Selected database
        const parsedUrl = new URL(escapedConnectionString);
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
        const escapedConnectionString = escapeMongoURI(connectionString);
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(escapedConnectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        
        // Define DB
        const parsedUrl = new URL(escapedConnectionString);
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
        const escapedConnectionString = escapeMongoURI(connectionString);
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(escapedConnectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();

        const parsedUrl = new URL(escapedConnectionString);
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

  // Get active database configuration
  app.get("/api/database/active", async (req: any, res: any) => {
    let activeEngine = "firestore";
    const activeDbPath = path.join(process.cwd(), "active-db.json");
    try {
      const fs = await import("fs/promises");
      const data = await fs.readFile(activeDbPath, "utf-8");
      const config = JSON.parse(data);
      activeEngine = config.activeEngine || "firestore";
    } catch (e) {
      // Defaults to firestore
    }
    return res.json({ activeEngine });
  });

  // Get Google OAuth URL for Independent Google Authentication
  app.get("/api/auth/google/url", (req: any, res: any) => {
    const rawClientId = process.env.VITE_GOOGLE_CLIENT_ID;
    if (!rawClientId) {
      return res.json({ url: null });
    }
    const clientId = rawClientId.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/+$/, "");
    
    // Resolve origin from query parameter or headers
    let origin = "";
    if (req.query.origin) {
      try {
        const decodedOrigin = decodeURIComponent(req.query.origin as string);
        if (decodedOrigin.startsWith("http://") || decodedOrigin.startsWith("https://")) {
          origin = new URL(decodedOrigin).origin;
        }
      } catch (_) {}
    }
    
    if (!origin) {
      const rawHost = req.headers["x-forwarded-host"] || req.headers["host"] || "";
      const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
      const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("3000");
      const rawProto = req.headers["x-forwarded-proto"] || (isLocal ? "http" : "https");
      const proto = Array.isArray(rawProto) ? rawProto[0] : rawProto;
      origin = `${proto}://${host}`;
    }

    const callbackPath = origin.includes("vercel.app") ? "/api/auth/callback/google" : "/api/auth/google/callback";
    const redirectUri = `${origin}${callbackPath}`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account&state=${encodeURIComponent(origin)}`;
    return res.json({ url });
  });

  // Handle Google OAuth Callback
  const handleGoogleCallback = async (req: any, res: any) => {
    try {
      const { code, state } = req.query || {};
      if (!code) {
        return res.redirect("/admin?oauth_error=no_code_provided");
      }
      const rawClientId = process.env.VITE_GOOGLE_CLIENT_ID;
      const clientId = rawClientId ? rawClientId.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/+$/, "") : "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      // Resolve origin from Google's redirect 'state' query parameter
      let origin = "";
      if (state) {
        try {
          const decodedState = decodeURIComponent(state as string);
          if (decodedState.startsWith("http://") || decodedState.startsWith("https://")) {
            origin = new URL(decodedState).origin;
          }
        } catch (e) {
          console.warn("[OAuth Handshake] Failed to parse origin from state:", e);
        }
      }

      // Fallback if state is missing or invalid
      if (!origin) {
        const rawHost = req.headers["x-forwarded-host"] || req.headers["host"] || "";
        const host = Array.isArray(rawHost) ? rawHost[0] : rawHost;
        const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("3000");
        const rawProto = req.headers["x-forwarded-proto"] || (isLocal ? "http" : "https");
        const proto = Array.isArray(rawProto) ? rawProto[0] : rawProto;
        origin = `${proto}://${host}`;
      }

      const callbackPath = origin.includes("vercel.app") ? "/api/auth/callback/google" : "/api/auth/google/callback";
      const redirectUri = `${origin}${callbackPath}`;
      
      // Exchange authorization code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId || "",
          client_secret: clientSecret || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      
      if (!tokenRes.ok) {
        const errorData = await tokenRes.text();
        throw new Error(`Token exchange failed: ${errorData}`);
      }
      
      const tokens = await tokenRes.json();
      const accessToken = tokens.access_token;
      
      // Fetch user profile from Google UserInfo endpoint
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (!userRes.ok) {
        throw new Error("Failed to fetch Google user info");
      }
      
      const googleUser = await userRes.json();
      const email = googleUser.email?.toLowerCase().trim();
      const name = googleUser.name || "";
      const picture = googleUser.picture || "";
      
      let matchedAdmin: any = null;

      try {
         const restData = await fetchFirestoreDocumentRest("admins", email);
         if (restData) {
           matchedAdmin = restData;
         }
      } catch(restErr) {
         console.error("[OAuth Handshake] Fallback REST fetch failed", restErr);
      }

      if (email === 'supriyos9@gmail.com') {
        matchedAdmin = {
          ...matchedAdmin,
          email: 'supriyos9@gmail.com',
          name: name || matchedAdmin?.name || 'Supriyo (Root Super Admin)',
          role: 'super_admin',
          permissions: ['*'],
          approved: true
        };
      } else if (!matchedAdmin) {
        matchedAdmin = {
          email: email,
          name: name || email,
          role: 'writer',
          permissions: ['blog'],
          approved: false,
          addedAt: new Date().toISOString(),
          addedBy: 'self_registration_google'
        };
      }
      
      if (picture) matchedAdmin.picture = picture;

      // Return HTML page that communicates via postMessage (if in a popup) or redirects (if same window)
      res.setHeader("Content-Type", "text/html"); return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-color: #0f172a;
              color: #f8fafc;
              margin: 0;
            }
            .card {
              text-align: center;
              padding: 2.5rem;
              background-color: #1e293b;
              border-radius: 12px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
              max-width: 400px;
              width: 90%;
            }
            h2 {
              color: #84cc16;
              margin-top: 0;
              margin-bottom: 0.75rem;
              font-size: 1.5rem;
            }
            p {
              color: #94a3b8;
              font-size: 0.95rem;
              margin-bottom: 2rem;
              line-height: 1.5;
            }
            .spinner {
              border: 3px solid #334155;
              border-top: 3px solid #84cc16;
              border-radius: 50%;
              width: 28px;
              height: 28px;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Google Authentication Successful!</h2>
            <p>Completing secure handshake with main application...</p>
            <div class="spinner"></div>
          </div>
          <script>
            const email = ${JSON.stringify(email)};
            const name = ${JSON.stringify(name)};
            const picture = ${JSON.stringify(picture)};
            const role = ${JSON.stringify(matchedAdmin.role)};
            const permissions = ${JSON.stringify(matchedAdmin.permissions)};
            const approved = ${JSON.stringify(matchedAdmin.approved)};
            
            let messageSent = false;
            
            // Try communicating with parent window / opener
            if (window.opener) {
              try {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  email: email,
                  name: name,
                  picture: picture,
                  role: role,
                  permissions: permissions,
                  approved: approved
                }, '*');
                messageSent = true;
                setTimeout(() => {
                  window.close();
                }, 800);
              } catch (e) {
                console.warn("[OAuth Popup Callback] Failed to postMessage to opener:", e);
              }
            }
            
            if (!messageSent) {
              // Direct fallback to redirect if not a popup or postMessage failed
              const redirectUrl = "/admin?oauth_success=true" + 
                "&email=" + encodeURIComponent(email) + 
                "&name=" + encodeURIComponent(name) + 
                "&picture=" + encodeURIComponent(picture) +
                "&role=" + encodeURIComponent(role) +
                "&permissions=" + encodeURIComponent(JSON.stringify(permissions)) +
                "&approved=" + encodeURIComponent(approved ? "true" : "false");
              window.location.href = redirectUrl;
            }
          </script>
        </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Google OAuth Callback Error:", error);
      res.setHeader("Content-Type", "text/html");
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-color: #0f172a;
              color: #f8fafc;
              margin: 0;
            }
            .card {
              text-align: center;
              padding: 2.5rem;
              background-color: #1e293b;
              border-radius: 12px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
              max-width: 450px;
              width: 90%;
            }
            h2 {
              color: #ef4444;
              margin-top: 0;
              margin-bottom: 0.75rem;
              font-size: 1.5rem;
            }
            p {
              color: #94a3b8;
              font-size: 0.95rem;
              margin-bottom: 2rem;
              line-height: 1.5;
            }
            .btn {
              display: inline-block;
              background-color: #3b82f6;
              color: white;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 500;
              transition: background-color 0.2s;
            }
            .btn:hover {
              background-color: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authentication Failed</h2>
            <p>Error: ${error.message || "Unknown error during authentication"}</p>
            <a href="/admin" class="btn" id="close-btn">Return to App</a>
          </div>
          <script>
            if (window.opener) {
              try {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_FAILURE',
                  error: ${JSON.stringify(error.message || "Authentication failed")}
                }, '*');
                setTimeout(() => {
                  window.close();
                }, 2000);
              } catch (e) {}
            }
            document.getElementById("close-btn").addEventListener("click", (e) => {
              if (window.opener) {
                e.preventDefault();
                window.close();
              }
            });
          </script>
        </body>
        </html>
      `);
    }
  };

  app.get("/api/auth/google/callback", (req, res, next) => handleGoogleCallback(req, res).catch(next));
  app.get("/api/auth/callback/google", (req, res, next) => handleGoogleCallback(req, res).catch(next));

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
        const escapedConnectionString = escapeMongoURI(mongoConfig.connectionString);
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(escapedConnectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();

        const parsedUrl = new URL(escapedConnectionString);
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

  // Save dynamic collection document depending on active database engine
  app.post("/api/content/:collectionName/:id", async (req: any, res: any) => {
    const { collectionName, id } = req.params;
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, message: "No data payload provided." });
    }

    let activeEngine = "firestore";
    const activeDbPath = path.join(process.cwd(), "active-db.json");
    try {
      const fs = await import("fs/promises");
      const configData = await fs.readFile(activeDbPath, "utf-8");
      const config = JSON.parse(configData);
      activeEngine = config.activeEngine || "firestore";
    } catch (e) {
      // Ignored, defaults to firestore
    }

    if (activeEngine === "firestore") {
      return res.json({ success: true, message: "Success. Firestore is updated client-side." });
    }

    let dbConfig: any = null;
    try {
      const fs = await import("fs/promises");
      const configData = await fs.readFile(activeDbPath, "utf-8");
      dbConfig = JSON.parse(configData);
    } catch (e) {
      return res.status(500).json({ success: false, message: "Database configuration not found." });
    }

    if (activeEngine === "mongodb") {
      const mongoConfig = dbConfig.mongodb;
      if (!mongoConfig?.connectionString) {
        return res.status(400).json({ success: false, message: "MongoDB connection config is missing." });
      }
      try {
        const escapedConnectionString = escapeMongoURI(mongoConfig.connectionString);
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(escapedConnectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();

        const parsedUrl = new URL(escapedConnectionString);
        const dbName = mongoConfig.database || parsedUrl.pathname.replace("/", "") || "jrphotography";
        const dbInstance = client.db(dbName);

        const collection = dbInstance.collection(collectionName);
        
        // Prepare document
        const docCopy = { ...data };
        docCopy._id = id;
        docCopy.id = id;

        await collection.replaceOne({ _id: id }, docCopy, { upsert: true });

        await client.close();
        return res.json({ success: true, message: "Document saved to MongoDB" });
      } catch (err: any) {
        console.error("MongoDB content write failed:", err);
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
          connectTimeout: 5000,
          multipleStatements: true
        });

        const [tables]: any = await connection.query("SHOW TABLES LIKE ?", [collectionName]);
        if (!Array.isArray(tables) || tables.length === 0) {
          await connection.query(`
            CREATE TABLE \`${collectionName}\` (
              \`id\` VARCHAR(128) NOT NULL,
              \`raw_data\` LONGTEXT DEFAULT NULL,
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
          `);
        }

        const [columns]: any = await connection.query(`DESCRIBE \`${collectionName}\``);
        const colNames = columns.map((c: any) => c.Field);

        const safeItem = data;
        const rawDataJson = JSON.stringify(safeItem);

        const updateFields: string[] = [];
        const queryParams: any[] = [];

        const keys = ["id"];
        const placeholders = ["?"];
        queryParams.push(id);

        for (const col of colNames) {
          if (col === "id") continue;
          if (col === "raw_data") {
            keys.push("raw_data");
            placeholders.push("?");
            queryParams.push(rawDataJson);
            updateFields.push("`raw_data` = VALUES(`raw_data`)");
          } else if (col in safeItem) {
            keys.push(`\`${col}\``);
            placeholders.push("?");
            const val = safeItem[col];
            if (val !== null && val !== undefined) {
              if (typeof val === "object") {
                queryParams.push(JSON.stringify(val));
              } else if (typeof val === "boolean") {
                queryParams.push(val ? 1 : 0);
              } else {
                queryParams.push(val);
              }
            } else {
              queryParams.push(null);
            }
            updateFields.push(`\`${col}\` = VALUES(\`${col}\`)`);
          }
        }

        const insertSQL = `
          INSERT INTO \`${collectionName}\` (${keys.join(", ")}) 
          VALUES (${placeholders.join(", ")}) 
          ON DUPLICATE KEY UPDATE ${updateFields.join(", ")}
        `;
        await connection.query(insertSQL, queryParams);

        await connection.end();
        return res.json({ success: true, message: "Document saved to MySQL" });
      } catch (err: any) {
        console.error("MySQL content write failed:", err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    return res.status(400).json({ success: false, message: "Unsupported database engine." });
  });

  // Delete dynamic collection document depending on active database engine
  app.delete("/api/content/:collectionName/:id", async (req: any, res: any) => {
    const { collectionName, id } = req.params;

    let activeEngine = "firestore";
    const activeDbPath = path.join(process.cwd(), "active-db.json");
    try {
      const fs = await import("fs/promises");
      const configData = await fs.readFile(activeDbPath, "utf-8");
      const config = JSON.parse(configData);
      activeEngine = config.activeEngine || "firestore";
    } catch (e) {
      // Ignored, defaults to firestore
    }

    if (activeEngine === "firestore") {
      return res.json({ success: true, message: "Success. Firestore is updated client-side." });
    }

    let dbConfig: any = null;
    try {
      const fs = await import("fs/promises");
      const configData = await fs.readFile(activeDbPath, "utf-8");
      dbConfig = JSON.parse(configData);
    } catch (e) {
      return res.status(500).json({ success: false, message: "Database configuration not found." });
    }

    if (activeEngine === "mongodb") {
      const mongoConfig = dbConfig.mongodb;
      if (!mongoConfig?.connectionString) {
        return res.status(400).json({ success: false, message: "MongoDB connection config is missing." });
      }
      try {
        const escapedConnectionString = escapeMongoURI(mongoConfig.connectionString);
        const { MongoClient } = await import("mongodb");
        const client = new MongoClient(escapedConnectionString, { serverSelectionTimeoutMS: 5000 });
        await client.connect();

        const parsedUrl = new URL(escapedConnectionString);
        const dbName = mongoConfig.database || parsedUrl.pathname.replace("/", "") || "jrphotography";
        const dbInstance = client.db(dbName);

        const collection = dbInstance.collection(collectionName);

        await collection.deleteOne({ _id: id });

        await client.close();
        return res.json({ success: true, message: "Document deleted from MongoDB" });
      } catch (err: any) {
        console.error("MongoDB content delete failed:", err);
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
          await connection.query(`DELETE FROM \`${collectionName}\` WHERE \`id\` = ?`, [id]);
        }

        await connection.end();
        return res.json({ success: true, message: "Document deleted from MySQL" });
      } catch (err: any) {
        console.error("MySQL content delete failed:", err);
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
          <div style="font-family: sans-serif; padding: 24px; background-color: #ffffff; color: #333333; border-radius: 16px; border: 1px solid #e0e0e0; max-width: 600px; margin: auto;">
            <div style="border-bottom: 1px solid #eeeeee; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="font-family: serif; color: #333333; margin: 0; font-style: italic;">JR PHOTOGRAPHY</h2>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888888;">SMTP Connection Test Dashboard</span>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #444444;">
              Hello! This is a secure verification message confirming that your SMTP settings are successfully synchronized and authenticated in the Admin Suite.
            </p>
            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid #e0e0e0; padding: 16px; border-radius: 12px; margin-block: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #333333; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Connection Metadata</h4>
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #888888; width: 120px;">SMTP Gateway:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #ffffff;">${host}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #888888;">Port Configured:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #ffffff;">${port}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #888888;">Security Mode:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #ffffff;">${secure ? 'SSL/TLS (Implicit)' : 'STARTTLS / Standard'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #888888;">Sender Signature:</td>
                  <td style="padding: 4px 0; font-family: monospace; color: #ffffff;">&ldquo;${fromName || 'JR Studio'}&rdquo; &lt;${fromEmail || username || 'no-reply@example.com'}&gt;</td>
                </tr>
              </table>
            </div>
            <p style="font-size: 11px; color: #999999; text-align: center; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 12px;">
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
          
          // 1. Try REST API
          if (!formConfig && firebaseClientConfig) {
            try {
              formConfig = await fetchFirestoreDocumentRest("wayfic_forms", formId);
            } catch (restErr: any) {
              console.log("[Wayfic Mailer] REST API wayfic_forms lookup skipped (using fallback).");
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
        // 1. Try REST API
        if (!smtp && firebaseClientConfig) {
          try {
            smtp = await fetchFirestoreDocumentRest("settings", "smtp");
          } catch (restErr: any) {
            console.log("[Wayfic Mailer] REST API SMTP lookup skipped (using fallback).");
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
            finalBody += `<td style="padding: 10px; font-weight: bold; width: 150px; color: #333333;">${key}:</td>`;
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
          <div style="font-family: sans-serif; padding: 24px; background-color: #ffffff; color: #333333; border-radius: 16px; border: 1px solid #e0e0e0; max-width: 600px; margin: auto;">
            <div style="border-bottom: 1px solid #eeeeee; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="font-family: serif; color: #333333; margin: 0; font-style: italic;">${smtp.fromName || "Studio Administration"}</h2>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888888;">${formTitle ? formTitle.toUpperCase() : "System Notification"}</span>
            </div>
            <div style="line-height: 1.6; color: #444444; font-size: 14px;">
              ${finalBody}
            </div>
            <p style="font-size: 11px; color: #999999; text-align: center; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 12px;">
              © 2026 JR Photography Studio. Decisive frames of Kolkata. 
            </p>
          </div>
        `
        : `Wayfic Form Submission:\n\n${finalBody}`;

      const textVersion = finalBody.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<\/div>/gi, '\n').replace(/<[^>]*>/g, '').trim();

      // 5. Send message
      const info = await transporter.sendMail({
        from: `"${smtp.fromName || 'Studio Administration'}" <${smtp.fromEmail || smtp.username || 'no-reply@example.com'}>`,
        to: finalRecipient,
        subject: finalSubject,
        text: textVersion,
        html: processedHtml
      });

      console.log(`[Wayfic Mailer] Routed submission mail successfully to ${finalRecipient}. Message ID: ${info.messageId}`);
      try {
        await createFirestoreDocumentRest("email_logs", {
           recipient: finalRecipient,
           subject: finalSubject,
           status: "success",
           messageId: info.messageId,
           timestamp: { timestampValue: new Date().toISOString() }
        });
      } catch(e) {}
      return res.json({ success: true, message: "Submission details sent successfully!", messageId: info.messageId });

    } catch (err: any) {
      console.error("[Wayfic Mailer] Message delivery failed:", err.message);
      try {
        await createFirestoreDocumentRest("email_logs", {
           recipient: req.body?.customRecipient || "unknown",
           subject: req.body?.mailSubject || "Form Email",
           status: "error",
           errorMessage: err.message,
           timestamp: { timestampValue: new Date().toISOString() }
        });
      } catch(e) {}
      return res.json({ success: false, message: `SMTP Server Relay Error: ${err.message}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const viteModule = await eval('import("vite")');
    const vite = await viteModule.createServer({
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

  // Only listen in standalone environments, not inside Vercel serverless
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
appPromise.catch((err) => {
  console.error("Failed to start server:", err);
});
