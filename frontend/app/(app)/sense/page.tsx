import React from "react";
import Link from "next/link";
const datasources = [
  { icon: "🗄️", label: "Demo Database" },
  { icon: "🌱", label: "MongoDB" },
  { icon: "🐬", label: "MySQL" },
  { icon: "🐘", label: "PostgreSQL" },
  { icon: "🧬", label: "PGVector" },
  { icon: "🅰️", label: "Microsoft Access" },
  { icon: "📊", label: "Airtable" },
  { icon: "🟦", label: "Amazon Aurora" },
  { icon: "🔎", label: "Google BigQuery" },
  { icon: "💱", label: "Binance" },
  { icon: "📧", label: "Gmail" },
  { icon: "📅", label: "Google Calendar" },
  { icon: "👁️", label: "Cassandra" },
  { icon: "📊", label: "ClickHouse" },
  { icon: "🟥", label: "Ckan" },
];

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0 0 48px 0"
      }}
    >
        <Link href="/aidol">
            Hiero
        </Link>
      <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", padding: "48px 0 0 0" }}>
        <h1 style={{ textAlign: "center", fontWeight: 700, fontSize: 36, marginBottom: 10, letterSpacing: -1 }}>
          Select your datasource
        </h1>
        <div style={{ textAlign: "center", color: "#6b7280", fontSize: 18, marginBottom: 32, fontWeight: 400 }}>
          Don&apos;t see what you&apos;re looking for?{' '}
          <a href="#" style={{ color: "#222", textDecoration: "underline", fontWeight: 500 }}>Make a request</a>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div style={{ position: "relative", width: 370 }}>
            <span
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#bdbdbd",
                fontSize: 20
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search datasource"
              style={{
                width: "100%",
                padding: "12px 16px 12px 44px",
                borderRadius: 12,
                border: "1.5px solid #e5e7eb",
                fontSize: 17,
                outline: "none",
                background: "#fff",
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
                transition: "border 0.2s",
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 32,
            justifyItems: "center",
            maxWidth: 1100,
            margin: "0 auto"
          }}
        >
          {datasources.map((ds, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 2px 16px 0 rgba(0,0,0,0.06)",
                padding: "38px 0 22px 0",
                width: 200,
                minHeight: 180,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                border: "1.5px solid #f3f4f6",
              }}
              
            >
              {/* Play icon for Demo Database */}
              {i === 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 16,
                    background: "#f3f4f6",
                    borderRadius: "50%",
                    padding: 6,
                    fontSize: 18,
                  }}
                >
                  ▶️
                </span>
              )}
              <span style={{ fontSize: 54, marginBottom: 18 }}>{ds.icon}</span>
              <span style={{ fontWeight: 500, fontSize: 19, color: "#222", letterSpacing: -0.5 }}>{ds.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
