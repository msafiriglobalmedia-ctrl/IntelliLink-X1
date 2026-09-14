from flask import Flask, jsonify, send_from_directory
from datetime import datetime, timezone
from statistics import mean
import time, urllib.request, urllib.error, threading

app = Flask(__name__, static_folder=".", static_url_path="")
VERSION = "1.0"
PORT = 5000
TARGETS = [
    "https://www.google.com/generate_204",
    "https://www.cloudflare.com/",
    "https://www.microsoft.com/"
]
PROBES_PER_TARGET = 2
TIMEOUT = 8
history = []
lock = threading.Lock()

def now():
    return datetime.now(timezone.utc).isoformat()

def probe(url):
    start = time.perf_counter()
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"IntelliLink-X1/1.0"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            ms = (time.perf_counter()-start)*1000
            return {"target":url,"success":True,"status":r.status,"latency_ms":round(ms,2)}
    except urllib.error.HTTPError as e:
        ms = (time.perf_counter()-start)*1000
        return {"target":url,"success":True,"status":e.code,"latency_ms":round(ms,2)}
    except Exception as e:
        ms = (time.perf_counter()-start)*1000
        return {"target":url,"success":False,"status":None,"latency_ms":round(ms,2),"error":str(e)}

def network_engine():
    results = [probe(t) for t in TARGETS for _ in range(PROBES_PER_TARGET)]
    good = [r for r in results if r["success"]]
    lat = [r["latency_ms"] for r in good]
    total, ok = len(results), len(good)
    failed = total-ok
    online = ok > 0
    loss = failed/total*100 if total else 100
    avg = mean(lat) if lat else 0
    mn, mx = (min(lat), max(lat)) if lat else (0,0)
    jitter = mean(abs(lat[i]-lat[i-1]) for i in range(1,len(lat))) if len(lat)>1 else 0

    if not online: quality = "OFFLINE"
    elif avg <= 50 and jitter <= 20 and loss <= 5: quality = "EXCELLENT"
    elif avg <= 100 and jitter <= 50 and loss <= 10: quality = "GOOD"
    elif avg <= 200 and jitter <= 100 and loss <= 20: quality = "FAIR"
    elif avg <= 500: quality = "SLOW"
    else: quality = "POOR"

    confidence = "HIGH" if ok == total and total else ("MEDIUM" if ok >= total*.6 else "LOW")
    return {
        "engine":"INTELLILINK NETWORK ENGINE 1.0",
        "online":online, "status":"ONLINE" if online else "OFFLINE",
        "probes":total, "successful_probes":ok, "failed_probes":failed,
        "latency_avg_ms":round(avg,2), "latency_min_ms":round(mn,2),
        "latency_max_ms":round(mx,2), "jitter_ms":round(jitter,2),
        "probe_loss_percent":round(loss,2), "quality":quality,
        "confidence":confidence, "test_method":"REAL_HTTP_PROBES",
        "raw_results":results
    }

def health_engine(n):
    a = n["successful_probes"]/n["probes"]*100 if n["probes"] else 0
    x = n["latency_avg_ms"]
    j = n["jitter_ms"]
    l = n["probe_loss_percent"]
    ls = 100 if x<=50 else 80 if x<=100 else 60 if x<=200 else 30 if x<=500 else 10
    js = 100 if j<=20 else 80 if j<=50 else 60 if j<=100 else 30 if j<=200 else 10
    ps = 100 if l<=1 else 90 if l<=5 else 75 if l<=10 else 50 if l<=20 else 25 if l<=50 else 0
    score = round(a*.20 + ls*.35 + js*.20 + ps*.25)
    status = "OFFLINE" if not n["online"] else "EXCELLENT" if score>=80 else "GOOD" if score>=60 else "DEGRADED" if score>=40 else "CRITICAL"
    return {
        "engine":"INTELLILINK HEALTH ENGINE 1.0","score":score,"status":status,
        "components":{"availability_score":round(a),"latency_score":ls,"jitter_score":js,"loss_score":ps},
        "weights":{"availability":20,"latency":35,"jitter":20,"loss":25}
    }

def decision_engine(n,h):
    s,l,j,loss = h["score"],n["latency_avg_ms"],n["jitter_ms"],n["probe_loss_percent"]
    if not n["online"]:
        return decision("CHECK_CONNECTION","OFFLINE","CRITICAL","Internet unavailable. Check mobile data or Wi-Fi.")
    if loss>=30: return decision("CHECK_CONNECTION","HIGH_PACKET_LOSS","CRITICAL","High probe loss detected. Check connection stability.")
    if l>500: return decision("MONITOR_LATENCY","HIGH_LATENCY","HIGH","Very high latency detected. Monitor the connection.")
    if j>100: return decision("MONITOR_JITTER","HIGH_JITTER","HIGH","High jitter detected. Monitor connection stability.")
    if s<40: return decision("INVESTIGATE_NETWORK","CRITICAL","HIGH","Network health is critical. Investigate the connection.")
    if s<60: return decision("MONITOR_NETWORK","DEGRADED","MEDIUM","Network quality is degraded. Continue monitoring.")
    if s<80: return decision("MONITOR_NETWORK","GOOD","LOW","Network is operating normally.")
    return decision("NO_ACTION","EXCELLENT","LOW","Network is healthy and stable.")

def decision(action, condition, priority, recommendation):
    return {"engine":"INTELLILINK DECISION ENGINE 1.0","action":action,"condition":condition,
            "priority":priority,"recommendation":recommendation}

def analysis():
    ts = now()
    n = network_engine()
    h = health_engine(n)
    dec = decision_engine(n,h)
    rec = {"timestamp":ts,"online":n["online"],"health_score":h["score"],
           "health_status":h["status"],"latency_ms":n["latency_avg_ms"],
           "jitter_ms":n["jitter_ms"],"loss_percent":n["probe_loss_percent"],
           "quality":n["quality"],"confidence":n["confidence"],
           "action":dec["action"],"condition":dec["condition"],"priority":dec["priority"]}
    with lock:
        history.append(rec)
        del history[:-100]
    return {"system":"INTELLILINK X1","version":VERSION,"timestamp":ts,
            "status":n["status"],"network":n,"health":h,"decision":dec,"history_record":rec}

@app.route("/")
def root():
    return jsonify({"system":"INTELLILINK X1","version":VERSION,"status":"RUNNING",
                    "dashboard":"/dashboard","api":["/api/status","/api/health","/api/history","/api/test"]})

@app.route("/dashboard")
def dashboard():
    return send_from_directory(".", "index.html")

@app.route("/api/status")
def status():
    try:
        n=network_engine()
        return jsonify({"system":"INTELLILINK X1","version":VERSION,"status":n["status"],
                        "online":n["online"],"quality":n["quality"],"confidence":n["confidence"],"timestamp":now()})
    except Exception as e:
        return jsonify({"status":"ERROR","error":str(e)}),500

@app.route("/api/health")
@app.route("/api/test")
def test():
    try: return jsonify(analysis())
    except Exception as e: return jsonify({"status":"ERROR","error":str(e)}),500

@app.route("/api/history")
def get_history():
    with lock: h=list(history)
    return jsonify({"system":"INTELLILINK X1","version":VERSION,"count":len(h),"history":h})

@app.errorhandler(404)
def missing(_):
    return jsonify({"system":"INTELLILINK X1","error":"Endpoint not found"}),404

if __name__=="__main__":
    print("="*55)
    print("INTELLILINK X1 - REAL NETWORK MONITOR")
    print("Dashboard: http://127.0.0.1:5000/dashboard")
    print("API:       http://127.0.0.1:5000/api/health")
    print("="*55)
    app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
