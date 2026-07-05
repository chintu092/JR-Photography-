import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, getDoc, doc, setDoc } from "firebase/firestore";
import defaultFirebaseConfig from "../../../firebase-applet-config.json";
import { 
  Download, Upload, Database, Loader2, AlertTriangle, ShieldAlert,
  Server, RefreshCw, Play, Terminal, ArrowRight, CheckCircle2, Save, Sparkles, DatabaseZap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function DatabaseManager() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"firestore" | "mongodb" | "mysql" | "sandbox">("firestore");
  const [processing, setProcessing] = useState(false);
  const [message, setMessageRaw] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const setMessage = (msg: { type: "success" | "error"; text: string } | null) => {
    setMessageRaw(msg);
    if (msg) {
      if (msg.type === "success") {
        toast.success(msg.text);
      } else {
        toast.error(msg.text);
      }
    }
  };
  
  // Backups and Restore state
  const [showConfirm, setShowConfirm] = useState(false);
  const [importData, setImportData] = useState<any>(null);

  // MongoDB configuration state
  const [mongoUri, setMongoUri] = useState("");
  const [mongoDbName, setMongoDbName] = useState("jrphotography");
  const [mongoTesting, setMongoTesting] = useState(false);
  const [mongoTestResult, setMongoTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // MySQL configuration state
  const [mysqlHost, setMysqlHost] = useState("");
  const [mysqlPort, setMysqlPort] = useState("3306");
  const [mysqlUser, setMysqlUser] = useState("");
  const [mysqlPass, setMysqlPass] = useState("");
  const [mysqlDb, setMysqlDb] = useState("jrphotography");
  const [mysqlTesting, setMysqlTesting] = useState(false);
  const [mysqlTestResult, setMysqlTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  // Query Sandbox states
  const [sandboxTarget, setSandboxTarget] = useState<"mongodb" | "mysql">("mongodb");
  const [sandboxQuery, setSandboxQuery] = useState("db.blog.find()");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);

  // Firestore stats state
  const [counts, setCounts] = useState<{ [key: string]: number }>({});
  const [loadingCounts, setLoadingCounts] = useState(false);

  // MongoDB stats state
  const [mongoCounts, setMongoCounts] = useState<{ [key: string]: number }>({});
  const [loadingMongoCounts, setLoadingMongoCounts] = useState(false);

  // Active database engine state
  const [activeEngine, setActiveEngine] = useState<"firestore" | "mongodb" | "mysql">("firestore");

  // Custom Firebase configuration states
  const [customApiKey, setCustomApiKey] = useState("");
  const [customAuthDomain, setCustomAuthDomain] = useState("");
  const [customProjectId, setCustomProjectId] = useState("");
  const [customDatabaseId, setCustomDatabaseId] = useState("");
  const [customStorageBucket, setCustomStorageBucket] = useState("");
  const [customSenderId, setCustomSenderId] = useState("");
  const [customAppId, setCustomAppId] = useState("");
  const [customMeasurementId, setCustomMeasurementId] = useState("");
  const [isUsingCustomFirebase, setIsUsingCustomFirebase] = useState(false);

  // Define collections to export/import
  const collectionsToBackup = [
    "portfolio",
    "blog",
    "testimonials",
    "services",
    "contacts",
    "subscribers",
    "faq_pages",
    "whatsapp_clicks",
    "admins",
    "settings",
    "settings_hero",
    "settings_seo",
    "settings_seo_pages"
  ];

  // Fetch count statistics for Firestore collections
  const fetchCounts = async () => {
    setLoadingCounts(true);
    try {
      const newCounts: { [key: string]: number } = {};
      for (const colName of collectionsToBackup) {
        try {
          if (colName === "settings_hero") {
            const hSnap = await getDoc(doc(db, "settings", "hero"));
            newCounts[colName] = hSnap.exists() ? 1 : 0;
          } else if (colName === "settings_seo") {
            const sSnap = await getDoc(doc(db, "settings", "seo"));
            newCounts[colName] = sSnap.exists() ? 1 : 0;
          } else if (colName === "settings_seo_pages") {
            const snapshot = await getDocs(collection(db, "settings", "seo", "pages"));
            newCounts[colName] = snapshot.size;
          } else {
            const snapshot = await getDocs(collection(db, colName));
            newCounts[colName] = snapshot.size;
          }
        } catch (e) {
          newCounts[colName] = 0;
        }
      }
      setCounts(newCounts);
    } catch (err) {
      console.error("Error fetching collections statistics:", err);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Fetch count statistics for MongoDB collections
  const fetchMongoCounts = async () => {
    if (!mongoUri) return;
    setLoadingMongoCounts(true);
    try {
      const res = await fetch("/api/database/mongodb/counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionString: mongoUri,
          database: mongoDbName,
          collections: collectionsToBackup
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.counts) {
          setMongoCounts(data.counts);
        }
      }
    } catch (err) {
      console.error("Error fetching MongoDB counts:", err);
    } finally {
      setLoadingMongoCounts(false);
    }
  };

  // Refresh MongoDB counts when active tab or configuration changes
  useEffect(() => {
    if (activeTab === "mongodb" && mongoUri) {
      fetchMongoCounts();
    }
  }, [activeTab, mongoUri, mongoDbName]);

  // Load database connections settings when mounting
  useEffect(() => {
    async function loadConfig() {
      if (!isAdmin) return;
      try {
        const docSnap = await getDoc(doc(db, "settings", "database"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.activeEngine) {
            setActiveEngine(data.activeEngine);
            setActiveTab(data.activeEngine);
          }
          if (data.mongodb) {
            setMongoUri(data.mongodb.connectionString || "");
            setMongoDbName(data.mongodb.database || "jrphotography");
          }
          if (data.mysql) {
            setMysqlHost(data.mysql.host || "");
            setMysqlPort(data.mysql.port || "3306");
            setMysqlUser(data.mysql.user || "");
            setMysqlPass(data.mysql.password || "");
            setMysqlDb(data.mysql.database || "jrphotography");
          }
        }
      } catch (e) {
        console.error("Failed to load connection settings", e);
      }
    }

    // Load custom Firebase overrides if present
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem("CUSTOM_FIREBASE_CONFIG");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            setCustomApiKey(parsed.apiKey || "");
            setCustomAuthDomain(parsed.authDomain || "");
            setCustomProjectId(parsed.projectId || "");
            setCustomDatabaseId(parsed.firestoreDatabaseId || "");
            setCustomStorageBucket(parsed.storageBucket || "");
            setCustomSenderId(parsed.messagingSenderId || "");
            setCustomAppId(parsed.appId || "");
            setCustomMeasurementId(parsed.measurementId || "");
            setIsUsingCustomFirebase(true);
          }
        } else {
          // Pre-populate with defaults as placeholders
          setCustomApiKey(defaultFirebaseConfig.apiKey || "");
          setCustomAuthDomain(defaultFirebaseConfig.authDomain || "");
          setCustomProjectId(defaultFirebaseConfig.projectId || "");
          setCustomDatabaseId(defaultFirebaseConfig.firestoreDatabaseId || "");
          setCustomStorageBucket(defaultFirebaseConfig.storageBucket || "");
          setCustomSenderId(defaultFirebaseConfig.messagingSenderId || "");
          setCustomAppId(defaultFirebaseConfig.appId || "");
          setCustomMeasurementId(defaultFirebaseConfig.measurementId || "");
          setIsUsingCustomFirebase(false);
        }
      } catch (err) {
        console.error("Failed to load custom firebase credentials in component", err);
      }
    }

    loadConfig();
    fetchCounts();
  }, [isAdmin]);

  const saveCustomFirebaseConfig = () => {
    setMessage(null);
    try {
      const config = {
        apiKey: customApiKey.trim(),
        authDomain: customAuthDomain.trim(),
        projectId: customProjectId.trim(),
        firestoreDatabaseId: customDatabaseId.trim(),
        storageBucket: customStorageBucket.trim(),
        messagingSenderId: customSenderId.trim(),
        appId: customAppId.trim(),
        measurementId: customMeasurementId.trim(),
      };

      if (!config.apiKey || !config.projectId) {
        setMessage({ type: "error", text: "API Key and Project ID are required to configure a custom Firebase instance." });
        return;
      }

      localStorage.setItem("CUSTOM_FIREBASE_CONFIG", JSON.stringify(config));
      setIsUsingCustomFirebase(true);
      setMessage({
        type: "success",
        text: "Custom Firebase credentials committed to local storage! Please refresh this page to establish a session with your custom database layout."
      });
    } catch (e: any) {
      setMessage({ type: "error", text: `Failed to commit custom database keys: ${e.message}` });
    }
  };

  const resetCustomFirebaseConfig = () => {
    setMessage(null);
    try {
      localStorage.removeItem("CUSTOM_FIREBASE_CONFIG");
      setIsUsingCustomFirebase(false);
      
      // Reset values back to defaults
      setCustomApiKey(defaultFirebaseConfig.apiKey || "");
      setCustomAuthDomain(defaultFirebaseConfig.authDomain || "");
      setCustomProjectId(defaultFirebaseConfig.projectId || "");
      setCustomDatabaseId(defaultFirebaseConfig.firestoreDatabaseId || "");
      setCustomStorageBucket(defaultFirebaseConfig.storageBucket || "");
      setCustomSenderId(defaultFirebaseConfig.messagingSenderId || "");
      setCustomAppId(defaultFirebaseConfig.appId || "");
      setCustomMeasurementId(defaultFirebaseConfig.measurementId || "");

      setMessage({
        type: "success",
        text: "Database configuration restored to Applet system defaults! Please refresh the page to restore default Firestore connectivity."
      });
    } catch (e: any) {
      setMessage({ type: "error", text: `Failed to clear custom database configuration: ${e.message}` });
    }
  };

  // Handle saving connection configurations to settings collection
  const saveConnectionConfig = async (dbType: "mongodb" | "mysql") => {
    setProcessing(true);
    setMessage(null);
    try {
      const databaseDocRef = doc(db, "settings", "database");
      const currentSnap = await getDoc(databaseDocRef);
      const currentData = currentSnap.exists() ? currentSnap.data() : {};

      if (dbType === "mongodb") {
        currentData.mongodb = {
          connectionString: mongoUri,
          database: mongoDbName,
          updatedAt: new Date().toISOString()
        };
      } else {
        currentData.mysql = {
          host: mysqlHost,
          port: mysqlPort,
          user: mysqlUser,
          password: mysqlPass,
          database: mysqlDb,
          updatedAt: new Date().toISOString()
        };
      }

      await setDoc(databaseDocRef, currentData);
      setMessage({ type: "success", text: `${dbType === "mongodb" ? "MongoDB Atlas" : "MySQL"} server configuration committed and saved.` });
      if (dbType === "mongodb") {
        fetchMongoCounts();
      }
    } catch (e: any) {
      setMessage({ type: "error", text: `Failed to save configurations: ${e.message}` });
    } finally {
      setProcessing(false);
    }
  };

  // Test active connection on server-side
  const testConnection = async (dbType: "mongodb" | "mysql") => {
    if (dbType === "mongodb") {
      setMongoTesting(true);
      setMongoTestResult(null);
    } else {
      setMysqlTesting(true);
      setMysqlTestResult(null);
    }

    try {
      const configPayload = dbType === "mongodb" ? {
        connectionString: mongoUri,
        database: mongoDbName
      } : {
        host: mysqlHost,
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPass,
        database: mysqlDb
      };

      const res = await fetch("/api/database/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: dbType, config: configPayload })
      });
      const data = await res.json();

      if (dbType === "mongodb") {
        setMongoTestResult({ success: data.success, message: data.message, details: data.details });
        if (data.success) {
          fetchMongoCounts();
        }
      } else {
        setMysqlTestResult({ success: data.success, message: data.message, details: data.details });
      }
    } catch (err: any) {
      const errorMsg = `HTTP Connection error: ${err.message}`;
      if (dbType === "mongodb") {
        setMongoTestResult({ success: false, message: errorMsg });
      } else {
        setMysqlTestResult({ success: false, message: errorMsg });
      }
    } finally {
      if (dbType === "mongodb") {
        setMongoTesting(false);
      } else {
        setMysqlTesting(false);
      }
    }
  };

  // Build full payload of firestore data to send to server mapping/migration
  const runMigration = async (dbType: "mongodb" | "mysql") => {
    setProcessing(true);
    setMessage(null);
    try {
      const payload: { [key: string]: any[] } = {};
      
      // Pull and aggregate all firestore documentation records
      for (const colName of collectionsToBackup) {
        if (colName === "settings_hero") {
          const docSnap = await getDoc(doc(db, "settings", "hero"));
          payload[colName] = docSnap.exists() ? [{ id: docSnap.id, ...docSnap.data() }] : [];
        } else if (colName === "settings_seo") {
          const docSnap = await getDoc(doc(db, "settings", "seo"));
          payload[colName] = docSnap.exists() ? [{ id: docSnap.id, ...docSnap.data() }] : [];
        } else if (colName === "settings_seo_pages") {
          const querySnapshot = await getDocs(collection(db, "settings", "seo", "pages"));
          payload[colName] = [];
          querySnapshot.forEach((doc) => {
            payload[colName].push({ id: doc.id, ...doc.data() });
          });
        } else {
          const querySnapshot = await getDocs(collection(db, colName));
          payload[colName] = [];
          querySnapshot.forEach((doc) => {
            payload[colName].push({ id: doc.id, ...doc.data() });
          });
        }
      }

      const configPayload = dbType === "mongodb" ? {
        connectionString: mongoUri,
        database: mongoDbName
      } : {
        host: mysqlHost,
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPass,
        database: mysqlDb
      };

      const syncRes = await fetch("/api/database/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: dbType, config: configPayload, payload })
      });
      const syncResult = await syncRes.json();

      if (syncResult.success) {
        setMessage({ 
          type: "success", 
          text: `Synchronization completed! Migrated ${syncResult.details?.totalRecordsMigrated} records in ${syncResult.details?.migratedCollectionsCount} tables/collections.` 
        });
        if (dbType === "mongodb") {
          fetchMongoCounts();
        }
      } else {
        setMessage({ type: "error", text: `Migration error: ${syncResult.message}` });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: `Migration HTTP call failed: ${err.message}` });
    } finally {
      setProcessing(false);
    }
  };

  // Configure any engine as the active database engine
  const makeActiveEngine = async (engine: "firestore" | "mongodb" | "mysql") => {
    setProcessing(true);
    setMessage(null);
    try {
      const configPayload = {
        mongodb: {
          connectionString: mongoUri,
          database: mongoDbName
        },
        mysql: {
          host: mysqlHost,
          port: mysqlPort,
          user: mysqlUser,
          password: mysqlPass,
          database: mysqlDb
        }
      };

      const res = await fetch("/api/database/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeEngine: engine, ...configPayload })
      });
      const data = await res.json();

      if (data.success) {
        // Persist setting in client firestore configuration
        const databaseDocRef = doc(db, "settings", "database");
        await setDoc(databaseDocRef, {
          activeEngine: engine,
          mongodb: configPayload.mongodb,
          mysql: configPayload.mysql,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        setActiveEngine(engine);
        setMessage({
          type: "success",
          text: `The active database engine has been updated to ${engine.toUpperCase()}. Dynamic feeds are reading live from this target.`
        });
      } else {
        setMessage({ type: "error", text: `Failed to set active database: ${data.message}` });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: `Failed to communicate database switch: ${err.message}` });
    } finally {
      setProcessing(false);
    }
  };

  // Pull records from MongoDB or MySQL and import them back into Firestore
  const pullAndImportToFirestore = async (dbType: "mongodb" | "mysql") => {
    setProcessing(true);
    setMessage(null);
    try {
      const configPayload = dbType === "mongodb" ? {
        connectionString: mongoUri,
        database: mongoDbName
      } : {
        host: mysqlHost,
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPass,
        database: mysqlDb
      };

      const res = await fetch("/api/database/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: dbType,
          config: configPayload,
          collections: collectionsToBackup
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to fetch records from ${dbType.toUpperCase()}`);
      }

      const data = await res.json();
      if (!data.success || !data.payload) {
        throw new Error(data.message || "Invalid database response payload.");
      }

      let totalImported = 0;
      let collectionsImported = 0;

      for (const colName of Object.keys(data.payload)) {
        const items = data.payload[colName];
        if (!Array.isArray(items) || items.length === 0) continue;

        for (const item of items) {
          const docId = item.id;
          if (!docId) continue;

          let docRef;
          if (colName === "settings_seo_pages") {
            docRef = doc(db, "settings", "seo", "pages", docId);
          } else if (colName === "settings_hero") {
            docRef = doc(db, "settings", "hero");
          } else if (colName === "settings_seo") {
            docRef = doc(db, "settings", "seo");
          } else {
            docRef = doc(db, colName, docId);
          }
          await setDoc(docRef, item);
          totalImported++;
        }
        collectionsImported++;
      }

      await fetchCounts();
      if (dbType === "mongodb") {
        fetchMongoCounts();
      }

      setMessage({
        type: "success",
        text: `Success! Pulled and imported ${totalImported} records across ${collectionsImported} collections from ${dbType.toUpperCase()} into Firebase Firestore.`
      });
    } catch (err: any) {
      console.error("Bidirectional sync failed:", err);
      setMessage({ type: "error", text: `Failed to import records: ${err.message}` });
    } finally {
      setProcessing(false);
    }
  };

  // Run dynamic console query in Sandbox
  const runConsoleQuery = async () => {
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const configPayload = sandboxTarget === "mongodb" ? {
        connectionString: mongoUri,
        database: mongoDbName
      } : {
        host: mysqlHost,
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPass,
        database: mysqlDb
      };

      const res = await fetch("/api/database/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: sandboxTarget, config: configPayload, query: sandboxQuery })
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err: any) {
      setQueryResult({ success: false, message: `Query Execution HTTP Error: ${err.message}` });
    } finally {
      setQueryLoading(false);
    }
  };

  const downloadDatabaseBackup = async (engine: "firestore" | "mongodb" | "mysql") => {
    setProcessing(true);
    setMessage(null);
    try {
      if (engine === "firestore") {
        const exportJson: any = {};
        for (const colName of collectionsToBackup) {
          try {
            if (colName === "settings_hero") {
              const docSnap = await getDoc(doc(db, "settings", "hero"));
              exportJson[colName] = docSnap.exists() ? [{ id: docSnap.id, ...docSnap.data() }] : [];
            } else if (colName === "settings_seo") {
              const docSnap = await getDoc(doc(db, "settings", "seo"));
              exportJson[colName] = docSnap.exists() ? [{ id: docSnap.id, ...docSnap.data() }] : [];
            } else if (colName === "settings_seo_pages") {
              const querySnapshot = await getDocs(collection(db, "settings", "seo", "pages"));
              exportJson[colName] = [];
              querySnapshot.forEach((doc) => {
                exportJson[colName].push({ id: doc.id, ...doc.data() });
              });
            } else {
              const querySnapshot = await getDocs(collection(db, colName));
              exportJson[colName] = [];
              querySnapshot.forEach((doc) => {
                exportJson[colName].push({ id: doc.id, ...doc.data() });
              });
            }
          } catch (e) {
            console.warn(`Export failed for Firestore collection ${colName}:`, e);
            exportJson[colName] = [];
          }
        }

        const settingsExport: any = {};
        try {
          const settingsSnap = await getDocs(collection(db, "settings"));
          settingsSnap.forEach((docSnap) => {
            let data: any = { id: docSnap.id, ...docSnap.data() };
            // Redact credentials
            if (docSnap.id === "database") {
              if (data.mysql && typeof data.mysql === "object") {
                data.mysql = { ...data.mysql, password: "" };
              }
              if (data.mongodb && typeof data.mongodb === "object") {
                data.mongodb = { ...data.mongodb, connectionString: "" };
              }
            }
            settingsExport[docSnap.id] = data;
          });
        } catch (e) {
          console.warn(`Failed to export settings collection`, e);
        }

        try {
          const seoDocs = await getDocs(collection(db, "settings/seo/pages"));
          settingsExport["seo_pages"] = [];
          seoDocs.forEach((d) => {
            settingsExport["seo_pages"].push({ id: d.id, ...d.data() });
          });
        } catch (e) {
          console.warn("Failed to export seo/pages", e);
        }
        exportJson["settings"] = settingsExport;

        const jsonString = JSON.stringify(exportJson, (key, value) => {
          if (value && typeof value === "object" && "seconds" in value && "nanoseconds" in value) {
            return {
              __type: "timestamp",
              seconds: value.seconds,
              nanoseconds: value.nanoseconds
            };
          }
          return value;
        }, 2);

        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `jrphotography-firestore-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setMessage({ type: "success", text: "Google Firestore database exported successfully!" });
        return;
      }

      // MongoDB or MySQL backup download
      const configPayload = engine === "mongodb" ? {
        connectionString: mongoUri,
        database: mongoDbName
      } : {
        host: mysqlHost,
        port: mysqlPort,
        user: mysqlUser,
        password: mysqlPass,
        database: mysqlDb
      };

      if (engine === "mongodb" && !mongoUri) {
        throw new Error("MongoDB Connection URI is not configured.");
      }
      if (engine === "mysql" && (!mysqlHost || !mysqlUser || !mysqlDb)) {
        throw new Error("MySQL connection configurations are incomplete.");
      }

      const res = await fetch("/api/database/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: engine,
          config: configPayload,
          collections: collectionsToBackup
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Failed to pull records from ${engine.toUpperCase()}`);
      }

      const data = await res.json();
      if (!data.success || !data.payload) {
        throw new Error(data.message || "Invalid response payload from server.");
      }

      const jsonString = JSON.stringify(data.payload, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `jrphotography-${engine}-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: `${engine.toUpperCase()} database exported and downloaded successfully!` });
    } catch (error: any) {
      console.error(`${engine} export error:`, error);
      setMessage({ type: "error", text: `Failed to download ${engine.toUpperCase()} database: ` + error.message });
    } finally {
      setProcessing(false);
    }
  };

  const exportDatabase = async () => {
    await downloadDatabaseBackup("firestore");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setMessage({ type: "error", text: "Please select a valid JSON backup file." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setImportData(json);
        setShowConfirm(true);
      } catch (error) {
        setMessage({ type: "error", text: "Invalid JSON format." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const importDatabase = async () => {
    if (!importData) return;
    setProcessing(true);
    setMessage(null);
    setShowConfirm(false);

    try {
      const processData = (data: any): any => {
        if (data === null || data === undefined) return data;
        if (Array.isArray(data)) {
          return data.map(item => processData(item));
        }
        if (typeof data === 'object') {
          if (data.__type === 'timestamp' && 'seconds' in data) {
            return new Date(data.seconds * 1000);
          }
          const newData: any = {};
          for (const key in data) {
            newData[key] = processData(data[key]);
          }
          return newData;
        }
        return data;
      };

      for (const colName of collectionsToBackup) {
        if (importData[colName] && Array.isArray(importData[colName])) {
           for (const item of importData[colName]) {
             if (item.id) {
               const { id, ...dataToProcess } = item;
               let docRef;
               if (colName === "settings_seo_pages") {
                 docRef = doc(db, "settings", "seo", "pages", item.id);
               } else if (colName === "settings_hero") {
                 docRef = doc(db, "settings", "hero");
               } else if (colName === "settings_seo") {
                 docRef = doc(db, "settings", "seo");
               } else {
                 docRef = doc(db, colName, item.id);
               }
               await setDoc(docRef, processData(dataToProcess));
             }
           }
        }
      }

      if (importData['settings']) {
        const settingsParams = importData['settings'];
        for (const key in settingsParams) {
          if (key !== 'seo_pages') {
            const data = settingsParams[key];
            if (data.id) {
              const { id, ...dataToProcess } = data;
              await setDoc(doc(db, "settings", data.id), processData(dataToProcess));
            }
          }
        }
        
        if (settingsParams['seo_pages'] && Array.isArray(settingsParams['seo_pages'])) {
          for (const item of settingsParams['seo_pages']) {
            if (item.id) {
              const { id, ...dataToProcess } = item;
              await setDoc(doc(db, "settings", "seo", "pages", item.id), processData(dataToProcess));
            }
          }
        }
      }

      setMessage({ type: "success", text: "Database imported successfully! Refreshing local counts..." });
      setImportData(null);
      fetchCounts();
    } catch (error: any) {
      console.error("Import error:", error);
      setMessage({ type: "error", text: "Failed to import database: " + error.message });
    } finally {
      setProcessing(false);
    }
  };

  const getFriendlyName = (colName: string) => {
    switch (colName) {
      case "portfolio": return "Portfolio Images & Works";
      case "blog": return "Blog Article Posts";
      case "testimonials": return "Reviews & Testimonials";
      case "services": return "Services & Packages";
      case "contacts": return "Inquiries & Leads";
      case "subscribers": return "Newsletter Subscribers";
      case "faq_pages": return "FAQ Page Sections";
      case "whatsapp_clicks": return "WhatsApp Trackers";
      case "admins": return "Authorized Administrators";
      case "settings": return "Global Settings & Navigation Links";
      case "settings_hero": return "Hero Home Layout Settings";
      case "settings_seo": return "SEO Optimization Settings";
      case "settings_seo_pages": return "Dynamic SEO Page Records";
      default: return colName;
    }
  };

  return (
    <section className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-luxury-gold uppercase tracking-[0.2em] font-mono text-[10px]">
            <Server className="w-3.5 h-3.5" />
            <span>Multi-Database Configuration Core</span>
          </div>
          <h2 className="text-3xl font-serif text-white tracking-tight lowercase">
            Database <span className="text-luxury-gold italic">Specification Hub</span>
          </h2>
          <p className="text-luxury-cream/40 text-xs">
            Export, import, sync and cross-query database instances including Google Firestore, MongoDB, and MySQL.
          </p>
        </div>
        <button
          onClick={fetchCounts}
          disabled={loadingCounts}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] uppercase font-bold text-luxury-cream/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none"
        >
          {loadingCounts ? <Loader2 className="w-3.5 h-3.5 animate-spin text-luxury-gold" /> : <RefreshCw className="w-3.5 h-3.5 text-luxury-gold" />}
          <span>Refresh Database Statistics</span>
        </button>
      </div>

      {/* Quick Download of Active Database Panel */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0b0a11]/90 border border-luxury-gold/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-luxury-gold/5 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-white text-base font-semibold flex items-center gap-2">
              <span>Active Database Engine:</span>
              <span className="text-luxury-gold italic uppercase font-mono tracking-wider">
                {activeEngine === "firestore" && "Google Firestore (Native)"}
                {activeEngine === "mongodb" && "MongoDB Atlas"}
                {activeEngine === "mysql" && "MySQL Relational"}
              </span>
            </h3>
          </div>
          <p className="text-luxury-cream/50 text-xs max-w-xl">
            This database is currently serving all public content feeds, website traffic, and contact registrations. Click the quick download to fetch a complete JSON backup of the active database instance.
          </p>
        </div>

        <button
          onClick={() => downloadDatabaseBackup(activeEngine)}
          disabled={processing}
          className="w-full md:w-auto px-6 py-4 bg-luxury-gold text-black hover:bg-white hover:text-black rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 shrink-0 cursor-pointer disabled:opacity-50 z-10 shadow-lg shadow-luxury-gold/10"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Download className="w-4 h-4 text-black" />}
          <span>Download Current Database (JSON)</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 border border-white/5 rounded-2xl">
        <button
          onClick={() => setActiveTab("firestore")}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
            activeTab === "firestore"
              ? "bg-[#1d163a] text-white border border-[#3e2e85] shadow-lg shadow-indigo-950/40"
              : "text-luxury-cream/40 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Database className="w-4 h-4 text-orange-400" />
          <span>Google Firestore (Native)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("mongodb");
            setSandboxQuery("db.blog.find()");
          }}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
            activeTab === "mongodb"
              ? "bg-[#12281a] text-white border border-[#234b33] shadow-lg shadow-green-950/40"
              : "text-luxury-cream/40 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <DatabaseZap className="w-4 h-4 text-emerald-400" />
          <span>MongoDB Atlas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("mysql");
            setSandboxQuery("SELECT * FROM blog LIMIT 5");
          }}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
            activeTab === "mysql"
              ? "bg-[#0f2430] text-white border border-[#1b3d52] shadow-lg shadow-sky-950/40"
              : "text-luxury-cream/40 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Server className="w-4 h-4 text-sky-400" />
          <span>MySQL (Relational)</span>
        </button>

        <button
          onClick={() => setActiveTab("sandbox")}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
            activeTab === "sandbox"
              ? "bg-[#1a111a] text-white border border-[#3d213d] shadow-lg shadow-fuchsia-950/40"
              : "text-luxury-cream/40 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Terminal className="w-4 h-4 text-fuchsia-400" />
          <span>Query Sandbox</span>
        </button>
      </div>

      {/* Main tab wrapper info */}
      <div className="space-y-6">
        {/* TAB 1: Google Firestore */}
        {activeTab === "firestore" && (
          <div className="space-y-6">
            {/* Active Engine Status Control */}
            <div className="p-6 md:p-8 rounded-3xl bg-luxury-black/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden backdrop-blur-sm">
              <div className="space-y-1">
                <h4 className="text-white text-base font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-400" />
                  <span>Google Firestore Live Engine</span>
                </h4>
                <p className="text-luxury-cream/40 text-xs">Configure this target to act as the primary, live content feed for the public website documents.</p>
              </div>
              {activeEngine === "firestore" ? (
                <span className="px-5 py-3 bg-[#cfb53b]/10 border border-luxury-gold/40 text-[#cfb53b] text-xs font-mono font-bold uppercase rounded-xl tracking-widest">
                  ★ Primary Live Feed Active
                </span>
              ) : (
                <button 
                  onClick={() => makeActiveEngine("firestore")}
                  disabled={processing}
                  className="px-6 py-3.5 bg-white/5 hover:bg-[#cfb53b] hover:text-black hover:border-transparent border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Set As Active Live Feed
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Card */}
              <div className="bg-luxury-black/40 border border-white/5 p-8 rounded-3xl backdrop-blur-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#cfb53b]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="mb-6 w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-luxury-gold" />
                </div>
                <h3 className="font-serif text-xl tracking-tight text-white mb-2">Export Local Snapshot</h3>
                <p className="text-zinc-400 text-xs font-mono leading-relaxed mb-8">
                  Create a secure JSON snapshot of all your database records including portfolio, blog, settings, and CRM elements.
                </p>
                <button
                  onClick={exportDatabase}
                  disabled={processing}
                  className="w-full py-4 bg-white/5 border border-white/10 hover:bg-luxury-gold hover:text-black hover:border-transparent text-white rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {processing ? "Exporting Data..." : "Download Backup JSON"}
                </button>
              </div>

              {/* Import Card */}
              <div className="bg-luxury-black/40 border border-red-500/10 p-8 rounded-3xl backdrop-blur-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="mb-6 w-12 h-12 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-serif text-xl tracking-tight text-red-500 mb-2">Restore database</h3>
                <p className="text-zinc-500 text-xs font-mono leading-relaxed mb-8">
                  Restore database records from a previously generated JSON file. Existing items with the same IDs will be overridden.
                </p>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleFileChange}
                    disabled={processing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                  />
                  <button
                    disabled={processing}
                    className="w-full py-4 bg-red-500/5 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Select Local Snapshot</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Collections Schema Map */}
            <div className="bg-luxury-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="font-serif text-lg text-white mb-6 flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-400" />
                <span>Active Firestore Metadata Mapping</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectionsToBackup.map((colName) => (
                  <div key={colName} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col justify-between min-h-[110px] relative group hover:border-[#846df7]/30 transition-all duration-300">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#846df7] uppercase tracking-widest block truncate">{colName}</span>
                      <span className="text-[11px] text-luxury-cream/40 block leading-normal">{getFriendlyName(colName)}</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="text-2xl font-sans font-bold text-white">
                        {loadingCounts ? "..." : counts[colName] ?? 0}
                      </span>
                      <span className="text-[9px] text-[#cfb53b] uppercase font-bold tracking-wider">records</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Firebase Setup Credentials Controller */}
            <div className="bg-luxury-black/40 border border-[#cfb53b]/20 rounded-3xl p-8 backdrop-blur-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="space-y-1">
                  <h3 className="font-serif text-xl text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#cfb53b]" />
                    <span>Firebase Engine Target Router</span>
                  </h3>
                  <p className="text-luxury-cream/40 text-xs">
                    View active credentials or redirect live data reads/writes to your custom corporate Firebase instance.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-mono tracking-wider font-semibold ${isUsingCustomFirebase ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"}`}>
                    {isUsingCustomFirebase ? "🔌 Custom Project Target Active" : "📦 Applet Default Sandbox Active"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block">Project ID</label>
                  <input
                    type="text"
                    value={customProjectId}
                    onChange={(e) => setCustomProjectId(e.target.value)}
                    placeholder="my-project-1234"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block">API Key</label>
                  <input
                    type="text"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block">Auth Domain</label>
                  <input
                    type="text"
                    value={customAuthDomain}
                    onChange={(e) => setCustomAuthDomain(e.target.value)}
                    placeholder="my-project-1234.firebaseapp.com"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block">Firestore Database ID</label>
                  <input
                    type="text"
                    value={customDatabaseId}
                    onChange={(e) => setCustomDatabaseId(e.target.value)}
                    placeholder="(default) or custom database name"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block">Storage Bucket URL</label>
                  <input
                    type="text"
                    value={customStorageBucket}
                    onChange={(e) => setCustomStorageBucket(e.target.value)}
                    placeholder="my-project-1234.appspot.com"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block">Messaging Sender ID</label>
                  <input
                    type="text"
                    value={customSenderId}
                    onChange={(e) => setCustomSenderId(e.target.value)}
                    placeholder="826038..."
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block">Firebase App ID</label>
                  <input
                    type="text"
                    value={customAppId}
                    onChange={(e) => setCustomAppId(e.target.value)}
                    placeholder="1:826038:web:abcdef..."
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5 justify-end">
                {isUsingCustomFirebase && (
                  <button
                    onClick={resetCustomFirebaseConfig}
                    className="px-6 py-3.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-xs cursor-pointer"
                  >
                    Reset to System Defaults
                  </button>
                )}
                <button
                  onClick={saveCustomFirebaseConfig}
                  className="px-8 py-3.5 bg-[#cfb53b] hover:bg-yellow-400 text-black border border-transparent rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Apply & Bind Custom Firebase Target</span>
                </button>
              </div>

              <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-yellow-400">Important Hand-off Notice</p>
                  <p className="text-[10px] text-luxury-cream/40 leading-relaxed">
                    Overwriting your Firebase target migrates client-side read, write, and authentication flows to your selected Firestore catalog. For security rules and session continuity, make sure that your target project has standard email/password authentication enabled. Refresh the page after applying changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MongoDB Atlas */}
        {activeTab === "mongodb" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Config & Controls column */}
            <div className="lg:col-span-2 bg-luxury-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm space-y-6">
              {/* Active Engine Status Control */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-white text-sm font-semibold flex items-center gap-2">
                    <DatabaseZap className="w-4 h-4 text-emerald-400" />
                    <span>MongoDB Live Switch</span>
                  </h4>
                  <p className="text-luxury-cream/40 text-[10px]">Route the public website to pull content directly from your MongoDB Atlas cluster.</p>
                </div>
                {activeEngine === "mongodb" ? (
                  <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-[10px] font-mono font-bold uppercase rounded-lg tracking-wider">
                    ★ Active Public Feed
                  </span>
                ) : (
                  <button 
                    onClick={() => makeActiveEngine("mongodb")}
                    disabled={processing || !mongoUri}
                    className="px-4 py-2 bg-white/5 hover:bg-emerald-500 hover:text-black hover:border-transparent border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Set Live Active
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-xl text-white">MongoDB Sync Protocol</h3>
                <p className="text-luxury-cream/40 text-xs">Configure your MongoDB connection string and database destination settings.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono block">Connection URI String</label>
                  <input
                    type="text"
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    placeholder="mongodb+srv://adminUser:passkey@cluster.mongodb.net/test"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-green-400/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono block">Target Collection Database Name</label>
                  <input
                    type="text"
                    value={mongoDbName}
                    onChange={(e) => setMongoDbName(e.target.value)}
                    placeholder="jrphotography"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-green-400/40 transition-all font-mono"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    onClick={() => testConnection("mongodb")}
                    disabled={mongoTesting || !mongoUri}
                    className="flex-1 py-4 bg-white/5 text-luxury-cream hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-xs border border-white/5 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {mongoTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Test Cluster Connection</span>
                  </button>

                  <button
                    onClick={() => saveConnectionConfig("mongodb")}
                    disabled={processing}
                    className="flex-1 py-4 bg-[#1b4329] text-emerald-100 hover:bg-emerald-800 rounded-xl font-bold uppercase tracking-widest text-xs border border-[#2b6d43] flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-40"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save Connection Specs</span>
                  </button>
                </div>
              </div>

              {/* Status block info */}
              {mongoTestResult && (
                <div className={`p-4 rounded-2xl text-xs uppercase tracking-wider font-semibold border ${
                  mongoTestResult.success 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  <p>{mongoTestResult.message}</p>
                  {mongoTestResult.success && mongoTestResult.details && (
                    <p className="text-[10px] font-mono mt-1 text-green-500">
                      Found {mongoTestResult.details.databasesCount} databases on Atlas Server.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bidirectional Synchronization */}
            <div className={`bg-luxury-black/40 border ${activeEngine === "mongodb" ? "border-emerald-500/20" : "border-white/5"} rounded-3xl p-8 backdrop-blur-sm flex flex-col justify-between space-y-6`}>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-[#cfb53b]">
                  <DatabaseZap className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-lg text-white">Bidirectional Migrator</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-mono">
                    Perfect bidirectional sync: Push your active website records directly into Atlas MongoDB collections, or pull Atlas data back down and import it into Firestore.
                  </p>
                </div>
                
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex gap-2.5 items-start text-[10px] text-zinc-400 uppercase font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Converts document IDs and formats natively. Push as source, or pull back as clone.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => runMigration("mongodb")}
                  disabled={processing || !mongoUri}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-black" />}
                  <span>Push Firestore to Atlas</span>
                </button>

                <button
                  onClick={() => pullAndImportToFirestore("mongodb")}
                  disabled={processing || !mongoUri}
                  className="w-full py-4 bg-transparent border border-white/10 hover:bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-400" />}
                  <span>Pull Atlas to Firestore</span>
                </button>

                <button
                  onClick={() => downloadDatabaseBackup("mongodb")}
                  disabled={processing || !mongoUri}
                  className="w-full py-4 bg-[#12281a]/40 border border-[#234b33]/40 hover:bg-emerald-500 hover:text-black hover:border-transparent text-emerald-400 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Download Atlas JSON Backup</span>
                </button>
              </div>
            </div>
          </div>
            
            {/* Active MongoDB Metadata Mapping */}
            <div className="bg-luxury-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="font-serif text-lg text-white mb-6 flex items-center gap-2">
                <DatabaseZap className="w-4 h-4 text-emerald-400" />
                <span>Active MongoDB Metadata Mapping</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collectionsToBackup.map((colName) => (
                  <div key={colName} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col justify-between min-h-[110px] relative group hover:border-emerald-500/30 transition-all duration-300">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block truncate">{colName}</span>
                      <span className="text-[11px] text-luxury-cream/40 block leading-normal">{getFriendlyName(colName)}</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="text-2xl font-sans font-bold text-white">
                        {loadingMongoCounts ? "..." : mongoCounts[colName] ?? 0}
                      </span>
                      <span className="text-[9px] text-[#cfb53b] uppercase font-bold tracking-wider">records</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MySQL */}
        {activeTab === "mysql" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Config & Controls column */}
            <div className="lg:col-span-2 bg-luxury-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm space-y-6">
              {/* Active Engine Status Control */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-white text-sm font-semibold flex items-center gap-2">
                    <Server className="w-4 h-4 text-sky-400" />
                    <span>MySQL Live Switch</span>
                  </h4>
                  <p className="text-luxury-cream/40 text-[10px]">Route the public website to pull content directly from your MySQL table structures.</p>
                </div>
                {activeEngine === "mysql" ? (
                  <span className="px-4 py-2 bg-sky-500/20 border border-sky-500 text-sky-400 text-[10px] font-mono font-bold uppercase rounded-lg tracking-wider">
                    ★ Active Public Feed
                  </span>
                ) : (
                  <button 
                    onClick={() => makeActiveEngine("mysql")}
                    disabled={processing || !mysqlHost || !mysqlUser || !mysqlDb}
                    className="px-4 py-2 bg-white/5 hover:bg-sky-500 hover:text-black hover:border-transparent border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Set Live Active
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-xl text-white">MySQL Connection Spec</h3>
                <p className="text-luxury-cream/40 text-xs">Configure host credentials to link your relational engine securely.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono block">Host</label>
                  <input
                    type="text"
                    value={mysqlHost}
                    onChange={(e) => setMysqlHost(e.target.value)}
                    placeholder="localhost or 12.34.56.78"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-xs text-luxury-cream focus:outline-none focus:border-sky-400/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono block">Port</label>
                  <input
                    type="text"
                    value={mysqlPort}
                    onChange={(e) => setMysqlPort(e.target.value)}
                    placeholder="3306"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-xs text-luxury-cream focus:outline-none focus:border-sky-400/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono block">Username</label>
                  <input
                    type="text"
                    value={mysqlUser}
                    onChange={(e) => setMysqlUser(e.target.value)}
                    placeholder="root"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-xs text-luxury-cream focus:outline-none focus:border-sky-400/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono block">Password</label>
                  <input
                    type="password"
                    value={mysqlPass}
                    onChange={(e) => setMysqlPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-xs text-luxury-cream focus:outline-none focus:border-sky-400/40 transition-all font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono block">Database Name</label>
                  <input
                    type="text"
                    value={mysqlDb}
                    onChange={(e) => setMysqlDb(e.target.value)}
                    placeholder="jrphotography"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-xs text-luxury-cream focus:outline-none focus:border-sky-400/40 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  onClick={() => testConnection("mysql")}
                  disabled={mysqlTesting || !mysqlHost || !mysqlUser || !mysqlDb}
                  className="flex-1 py-4 bg-white/5 text-luxury-cream hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-xs border border-white/5 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  {mysqlTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Test SQL Connection</span>
                </button>

                <button
                  onClick={() => saveConnectionConfig("mysql")}
                  disabled={processing}
                  className="flex-1 py-4 bg-[#102b3c] text-sky-100 hover:bg-sky-900 rounded-xl font-bold uppercase tracking-widest text-xs border border-[#1b4c6a] flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5 text-sky-400" />
                  <span>Save configurations</span>
                </button>
              </div>

              {mysqlTestResult && (
                <div className={`p-4 rounded-2xl text-xs uppercase tracking-wider font-semibold border ${
                  mysqlTestResult.success 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  <p>{mysqlTestResult.message}</p>
                  {mysqlTestResult.success && mysqlTestResult.details && (
                    <p className="text-[10px] font-mono mt-1 text-sky-500">
                      Host target verified. Already contains {mysqlTestResult.details.tablesCount} tables.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sync column */}
            <div className={`bg-luxury-black/40 border ${activeEngine === "mysql" ? "border-sky-500/20" : "border-white/5"} rounded-3xl p-8 backdrop-blur-sm flex flex-col justify-between space-y-6`}>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-sky-500">
                  <Database className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-lg text-white">Relational Migrator</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-mono">
                    Keep your cloud databases fully synchronized. You can push your Firestore records directly to MySQL, or pull MySQL data back down to import it into Firestore.
                  </p>
                </div>
                
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex gap-2.5 items-start text-[9px] text-zinc-400 uppercase font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>Packs and maps tables and schema structures backwards and forwards with native JSON mapping safely.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => runMigration("mysql")}
                  disabled={processing || !mysqlHost || !mysqlUser || !mysqlDb}
                  className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-black rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <RefreshCw className="w-4 h-4 text-black" />}
                  <span>Push Firestore to MySQL</span>
                </button>

                <button
                  onClick={() => pullAndImportToFirestore("mysql")}
                  disabled={processing || !mysqlHost || !mysqlUser || !mysqlDb}
                  className="w-full py-4 bg-transparent border border-white/10 hover:bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-sky-400" />}
                  <span>Pull MySQL to Firestore</span>
                </button>

                <button
                  onClick={() => downloadDatabaseBackup("mysql")}
                  disabled={processing || !mysqlHost || !mysqlUser || !mysqlDb}
                  className="w-full py-4 bg-[#0f2430]/40 border border-[#1b3d52]/40 hover:bg-sky-500 hover:text-black hover:border-transparent text-sky-400 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Download MySQL JSON Backup</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Query Sandbox Console */}
        {activeTab === "sandbox" && (
          <div className="bg-luxury-black/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-serif text-xl text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-fuchsia-400" />
                  <span>Interactive SQL & Mongo Console Sandbox</span>
                </h3>
                <p className="text-luxury-cream/40 text-xs">Execute dynamic commands directly to verify records and troubleshoot connections.</p>
              </div>

              <div className="flex items-center gap-2 p-1 bg-[#0b0a11] rounded-xl border border-white/5 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSandboxTarget("mongodb");
                    setSandboxQuery("db.blog.find()");
                  }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                    sandboxTarget === "mongodb" ? "bg-emerald-500/10 text-emerald-400" : "text-luxury-cream/40 hover:text-white"
                  }`}
                >
                  MongoDB Console
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSandboxTarget("mysql");
                    setSandboxQuery("SELECT * FROM blog LIMIT 5");
                  }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                    sandboxTarget === "mysql" ? "bg-sky-500/10 text-sky-400" : "text-luxury-cream/40 hover:text-white"
                  }`}
                >
                  MySQL Console
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Dynamic Query command line Input */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono flex items-center justify-between">
                    <span>Shell Script Code Editor</span>
                    <span className="text-fuchsia-400 font-bold lowercase tracking-normal">
                      {sandboxTarget === "mongodb" ? "db.collection.operation()" : "standard raw sql"}
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    value={sandboxQuery}
                    onChange={(e) => setSandboxQuery(e.target.value)}
                    className="w-full flex-1 min-h-[160px] bg-[#050407] border border-white/5 rounded-2xl px-6 py-4 text-xs text-fuchsia-300 font-mono focus:outline-none focus:border-fuchsia-500/40 transition-all resize-none shadow-inner"
                  />
                </div>

                <button
                  onClick={runConsoleQuery}
                  disabled={queryLoading}
                  className="w-full py-4 bg-fuchsia-500 hover:bg-fuchsia-600 font-bold uppercase tracking-widest text-xs text-black rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  {queryLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                  <span>Execute Query Code</span>
                </button>
              </div>

              {/* Dynamic query responses terminal block */}
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Response Console Output</label>
                <div className="flex-1 min-h-[220px] bg-[#020104] border border-white/5 rounded-2xl p-6 font-mono text-[10px] text-zinc-300 overflow-auto scrollbar-none max-h-[300px]">
                  {queryLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" />
                      <span className="uppercase tracking-widest text-[9px]">Awaiting system pipeline response...</span>
                    </div>
                  )}

                  {!queryLoading && !queryResult && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center">
                      <Terminal className="w-8 h-8 opacity-20 mb-2 text-fuchsia-400" />
                      <p className="uppercase tracking-widest text-[9px]">Terminal output empty.</p>
                      <p className="text-[8px] uppercase tracking-wider text-zinc-500 mt-1 max-w-xs">Run a query to view JSON documents or SQL relational response datasets from the server.</p>
                    </div>
                  )}

                  {!queryLoading && queryResult && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="uppercase text-[8px] font-bold text-zinc-500">Pipeline execution state</span>
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
                          queryResult.success ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {queryResult.success ? "Success 200 OK" : "Execution failed"}
                        </span>
                      </div>

                      {queryResult.success ? (
                        <pre className="text-green-400 leading-relaxed overflow-x-auto">
                          {JSON.stringify(queryResult.results ?? queryResult, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-red-400 space-y-1">
                          <p className="font-bold">Error Message:</p>
                          <p>{queryResult.message || "An unspecified database exception has occurred."}</p>
                          <p className="text-[8px] text-zinc-500 uppercase mt-2">Ensure your targeted database configurations are saved, tested and online before querying.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global message reporting feedback */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-center text-xs uppercase tracking-widest font-medium ${
            message.type === "success" 
              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-red-500/30 max-w-sm w-full p-8 rounded-3xl text-center space-y-6 shadow-2xl shadow-red-900/20"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-serif text-white leading-snug">Confirm overwrite</h3>
                <p className="text-zinc-500 text-xs">
                  This action will overwrite existing records with the data from the imported file. Duplicate entries will be updated. Are you absolutely certain?
                </p>
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-400 uppercase tracking-widest text-left leading-relaxed">
                      Only proceed if you know what you are implementing. Operation cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setImportData(null);
                  }}
                  className="flex-1 py-3 bg-white/5 text-zinc-400 hover:text-white rounded-xl font-bold uppercase tracking-widest text-[10px] border border-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={importDatabase}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 transition-colors"
                >
                  Confirm Upload
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
