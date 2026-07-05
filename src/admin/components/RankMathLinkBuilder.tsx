import React, { useState, useEffect } from "react";
import { 
  Plus, Trash, Save, Loader2, Link2, Info, CheckSquare, Square, Settings
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useToast } from "../../context/ToastContext";

interface LinkRule {
  id: string;
  keyword: string;
  destination: string;
  caseSensitive: boolean;
  replaceFirstOnly: boolean;
  addNofollow: boolean;
}

const DEFAULT_RULES: LinkRule[] = [
  {
    id: "rule-1",
    keyword: "Paris photoshoot",
    destination: "/works/paris-editorial",
    caseSensitive: false,
    replaceFirstOnly: true,
    addNofollow: false
  },
  {
    id: "rule-2",
    keyword: "commercial portfolio",
    destination: "/services",
    caseSensitive: true,
    replaceFirstOnly: false,
    addNofollow: false
  },
  {
    id: "rule-3",
    keyword: "bridal studio",
    destination: "/contact",
    caseSensitive: false,
    replaceFirstOnly: true,
    addNofollow: false
  }
];

export default function RankMathLinkBuilder() {
  const toast = useToast();
  const [rules, setRules] = useState<LinkRule[]>(DEFAULT_RULES);
  const [loading, setLoading] = useState(false);

  // New Rule inputs
  const [newKeyword, setNewKeyword] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [replaceFirstOnly, setReplaceFirstOnly] = useState(true);
  const [addNofollow, setAddNofollow] = useState(false);

  useEffect(() => {
    async function loadRules() {
      try {
        const docSnap = await getDoc(doc(db, "settings", "seo_link_rules"));
        if (docSnap.exists()) {
          setRules(docSnap.data().rules || DEFAULT_RULES);
        }
      } catch (error) {
        console.error("Failed to load link builder rules:", error);
      }
    }
    loadRules();
  }, []);

  const handleAddRule = () => {
    if (!newKeyword.trim() || !newDestination.trim()) {
      toast.error("Please fill in both the keyword and the target destination URL.");
      return;
    }

    const rule: LinkRule = {
      id: `rule-${Date.now()}`,
      keyword: newKeyword.trim(),
      destination: newDestination.trim(),
      caseSensitive,
      replaceFirstOnly,
      addNofollow
    };

    const updated = [...rules, rule];
    setRules(updated);
    setNewKeyword("");
    setNewDestination("");
    setCaseSensitive(false);
    setReplaceFirstOnly(true);
    setAddNofollow(false);
    toast.success("Keyword internal link rule appended. Save changes to commit!");
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    toast.success("Rule staging deleted.");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "seo_link_rules"), { rules }, { merge: true });
      toast.success("Internal Link Builder rules saved and applied!");
    } catch (e: any) {
      toast.error(`Error saving rules: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-500">
      
      {/* Create rule inputs panel */}
      <div className="lg:col-span-5 bg-luxury-black/30 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-4 h-fit">
        <div className="space-y-1 pb-4 border-b border-white/5">
          <h4 className="font-serif text-lg text-white font-medium">New Internal Link Rule</h4>
          <p className="text-luxury-cream/40 text-xs">Register high-value keywords to automatically convert them to links on your blog or portfolio pages.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Target Keyword / Phrase</label>
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g. fine art tutorial"
              className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Destination Redirect URL Base</label>
            <input
              type="text"
              value={newDestination}
              onChange={(e) => setNewDestination(e.target.value)}
              placeholder="e.g. /works/fine-art"
              className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-mono"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            {[
              { label: "Case-Sensitive Match Only", state: caseSensitive, setter: setCaseSensitive, desc: "Matches exact uppercase/lowercase characters." },
              { label: "Replace First Occurrence Only", state: replaceFirstOnly, setter: setReplaceFirstOnly, desc: "Bypasses repeating links to prevent keyword clutter." },
              { label: "Add rel=\"nofollow\" attribute", state: addNofollow, setter: setAddNofollow, desc: "Blocks PageRank transfer on this specific outbound target." },
            ].map((opt, idx) => (
              <div 
                key={idx} 
                onClick={() => opt.setter(!opt.state)}
                className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/[0.01] transition-all cursor-pointer"
              >
                <button type="button" className="text-[#cfb53b] mt-0.5 shrink-0">
                  {opt.state ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5 text-zinc-600" />}
                </button>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-white uppercase tracking-wider">{opt.label}</p>
                  <p className="text-[9px] text-zinc-500 leading-tight">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddRule}
            className="w-full bg-[#cfb53b] hover:bg-white text-luxury-black py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Link Rule</span>
          </button>
        </div>
      </div>

      {/* Rules list right column */}
      <div className="lg:col-span-7 bg-luxury-black/30 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="space-y-1 pb-4 border-b border-white/5">
            <h4 className="font-serif text-lg text-white font-medium">Staged Internal Link Rules</h4>
            <p className="text-luxury-cream/40 text-xs">Live replace directives applied during public content requests.</p>
          </div>

          {rules.length === 0 ? (
            <div className="p-12 text-center bg-zinc-950/20 border border-white/5 rounded-2xl space-y-3">
              <Info className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-bold uppercase text-zinc-500">No Link Rules Active</p>
              <p className="text-[10px] text-zinc-500">Add key phrases to automatically establish strong internal links networks.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1.5">
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center justify-between font-mono gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#cfb53b]">{rule.keyword}</span>
                      <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 uppercase font-sans font-bold">
                        {rule.caseSensitive ? "CS" : "CI"}
                      </span>
                      <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 uppercase font-sans font-bold">
                        {rule.replaceFirstOnly ? "First Occurrence" : "All Instances"}
                      </span>
                    </div>

                    <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-[#cfb53b]" />
                      <span>Destination: {rule.destination}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 border border-white/5 rounded-lg transition-all cursor-pointer shrink-0"
                    title="Remove rule"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-[#cfb53b] hover:bg-white text-luxury-black py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Rules and Apply</span>
        </button>

      </div>
    </div>
  );
}
