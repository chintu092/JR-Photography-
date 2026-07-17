sed -i 's/background-color: #0c0b11; color: #ffffff;/background-color: #ffffff; color: #333333;/g' server.ts
sed -i 's/border: 1px solid rgba(255,255,255,0.05);/border: 1px solid #e0e0e0;/g' server.ts
sed -i 's/border-bottom: 2px solid #cfb53b;/border-bottom: 1px solid #eeeeee;/g' server.ts
sed -i 's/color: #cfb53b;/color: #333333;/g' server.ts
sed -i 's/color: rgba(255,255,255,0.4);/color: #888888;/g' server.ts
sed -i 's/color: rgba(255,255,255,0.85);/color: #444444;/g' server.ts
sed -i 's/color: rgba(255,255,255,0.3);/color: #999999;/g' server.ts
sed -i 's/border-top: 1px solid rgba(255,255,255,0.05);/border-top: 1px solid #eeeeee;/g' server.ts
sed -i 's/text: finalBody.replace(\/<\[^>\]\*>\/g, ""), \/\/ strip HTML tags/text: finalBody.replace(\/<br\\s*\\/?>\/gi, "\\n").replace(\/<\\/p>\/gi, "\\n\\n").replace(\/<\\/div>\/gi, "\\n").replace(\/<\[^>\]\*>\\s*\/gi, "").trim(),/g' server.ts
