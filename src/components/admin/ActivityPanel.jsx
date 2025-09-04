import React, { useEffect, useState } from "react";

const ActivityPanel = () => {
  const [recent, setRecent] = useState([]);
  const [daily, setDaily] = useState({
    sales: 0,
    listings: 0,
    offers: 0,
    cancellations: 0,
  });

  useEffect(() => {
    try {
      const activity = JSON.parse(localStorage.getItem("marketplace_activity") || "[]");

      const today = new Date().toDateString();
      const dailyStats = {
        sales: 0,
        listings: 0,
        offers: 0,
        cancellations: 0,
      };

      const sorted = activity
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10);

      setRecent(sorted);

      activity.forEach((act) => {
        if (new Date(act.time).toDateString() === today) {
          if (act.type === "sold") dailyStats.sales++;
          else if (act.type === "listed") dailyStats.listings++;
          else if (act.type === "offer_made") dailyStats.offers++;
          else if (act.type === "cancelled") dailyStats.cancellations++;
        }
      });

      setDaily(dailyStats);
    } catch (err) {
      console.error("Error to load activities:", err);
    }
  }, []);

  return (
    <div className="admin-card">
      <h4>Recent activities</h4>

      <div className="form-group">
        <h3 className="activities-label">📆 Today:</h3>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Sold</div><div className="stat-value">{daily.sales}</div></div>
          <div className="stat-card"><div className="stat-label">Listed</div><div className="stat-value">{daily.listings}</div></div>
          <div className="stat-card"><div className="stat-label">Offers</div><div className="stat-value">{daily.offers}</div></div>
          <div className="stat-card"><div className="stat-label">Canceled</div><div className="stat-value">{daily.cancellations}</div></div>
        </div>
      </div>

      <div className="form-group last-activities">
        <h3 className="activities-label">📆 Last activities:</h3>
        {recent.length === 0 ? (
          <p style={{ color: "#888" }}>No recent activities</p>
        ) : (
          <div >
            {recent.map((act, idx) => (
              <div className="collection-card"
                key={idx}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  borderLeft: "4px solid #667eea",
                  borderRadius: "6px",
                }}
              >
                <strong>{act.type?.toUpperCase()}</strong> - {act.nft || "NFT necunoscut"} <br />
                <small style={{ color: "#666" }}>
                  {act.user && <>{act.user.slice(0, 10)}...{act.user.slice(-4)} | </>}
                  {act.price && <>{act.price} ETH</>}
                  {act.newPrice && <>{act.oldPrice} -> {act.newPrice} ETH</>}
                  {act.method && <> | {act.method}</>}
                </small>
                <div style={{ fontSize: "12px", color: "#aaa" }}>
                  {new Date(act.time).toLocaleDateString()} {new Date(act.time).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPanel;
