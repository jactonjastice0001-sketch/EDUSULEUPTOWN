import { useState } from "react";

export default function LocationCapture({ onCapture, location }) {
  const [status, setStatus] = useState(location ? "ok" : "idle");
  const [error, setError] = useState("");

  function capture() {
    if (!("geolocation" in navigator)) {
      setStatus("err");
      setError("Your browser doesn't support location sharing. You can still type your address.");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus("ok");
        setError("");
        onCapture({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => {
        setStatus("err");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. You can still type your address below."
            : "Couldn't get your location. You can still type your address below."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="location-box">
      <div>
        <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>Share your exact location</div>
        <div className={`location-status ${status === "ok" ? "ok" : status === "err" ? "err" : ""}`}>
          {status === "idle" && "Helps the rider find you fast, on top of your address."}
          {status === "loading" && "Getting your location…"}
          {status === "ok" && location && `Captured: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
          {status === "err" && error}
        </div>
      </div>
      <button type="button" className="btn btn-outline btn-sm" onClick={capture} disabled={status === "loading"}>
        {status === "ok" ? "Update location" : "Share location"}
      </button>
    </div>
  );
}
