import time
import os
import sys

try:
    from zapv2 import ZAPv2
except ImportError:
    print("Warning: 'zapv2' Python library is not installed. To run this automation script, run:")
    print("  pip install python-owasp-zap-v2.4")
    ZAPv2 = None

# ZAP API Connection Configuration
ZAP_API_KEY = "9l8fe0dspspej0kunprvi5ljkv"
ZAP_PROXY_ADDRESS = "127.0.0.1"
ZAP_PROXY_PORT = "8080"
TARGET_URL = "http://localhost:5000"

def run_security_scan():
    if not ZAPv2:
        print("Error: ZAPv2 library missing. Install via pip first.")
        sys.exit(1)

    zap = ZAPv2(
        proxies={
            'http': f'http://{ZAP_PROXY_ADDRESS}:{ZAP_PROXY_PORT}',
            'https': f'http://{ZAP_PROXY_ADDRESS}:{ZAP_PROXY_PORT}'
        },
        apikey=ZAP_API_KEY
    )

    print("Connecting to OWASP ZAP API...")
    try:
        # Check connection by fetching ZAP version
        zap_version = zap.core.version
        print(f"Successfully connected to OWASP ZAP version: {zap_version}")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to connect to ZAP proxy at {ZAP_PROXY_ADDRESS}:{ZAP_PROXY_PORT}")
        print("Please ensure OWASP ZAP is running on your machine and listening on port 8090.")
        sys.exit(1)

    # 1. Load context file
    context_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sme_platform.context")
    if os.path.exists(context_file):
        print(f"Loading ZAP context from: {context_file}")
        try:
            context_id = zap.context.import_context(context_file)
            print(f"Context loaded successfully. Context ID: {context_id}")
        except Exception as e:
            print(f"Warning: Failed to load context file: {e}")
    else:
        print(f"Context file not found at: {context_file}. Running standard scan.")

    # 2. Spider scan target to discover endpoints
    print(f"\nStarting Spider scan against: {TARGET_URL}")
    spider_scan_id = zap.spider.scan(TARGET_URL)
    
    while int(zap.spider.status(spider_scan_id)) < 100:
        print(f"Spider progress: {zap.spider.status(spider_scan_id)}%")
        time.sleep(2)
    print("Spider scan complete. Discovered endpoints mapped.")

    # Wait for passive scan to finish analyzing
    print("Waiting for passive scanner queue to clear...")
    while int(zap.pscan.records_to_scan) > 0:
        print(f"Records remaining to scan: {zap.pscan.records_to_scan}")
        time.sleep(2)
    print("Passive scan complete.")

    # 3. Active scan targets
    print(f"\nStarting Active Vulnerability Scan against: {TARGET_URL}")
    active_scan_id = zap.ascan.scan(TARGET_URL)
    
    while int(zap.ascan.status(active_scan_id)) < 100:
        print(f"Active scan progress: {zap.ascan.status(active_scan_id)}%")
        time.sleep(5)
    print("Active scan complete.")

    # 4. Generate report
    report_format = "html"
    report_name = "sme_platform_security_report.html"
    report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), report_name)
    
    print(f"\nExporting HTML report to: {report_path}")
    try:
        # ZAP 2.14+ API uses core.htmlreport
        report_data = zap.core.htmlreport()
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report_data)
        print("HTML report successfully generated.")
    except Exception as e:
        print(f"Error generating report: {e}")

    # Summary of findings
    print("\n" + "="*50)
    print("               SCAN SUMMARY DETAILS")
    print("="*50)
    alerts = zap.core.alerts(baseurl=TARGET_URL)
    severities = {"High": 0, "Medium": 0, "Low": 0, "Informational": 0}
    for alert in alerts:
        risk = alert.get("risk")
        if risk in severities:
            severities[risk] += 1
            
    print(f"  🔴 High Severity Alerts:          {severities['High']}")
    print(f"  🟡 Medium Severity Alerts:        {severities['Medium']}")
    print(f"  🟢 Low Severity Alerts:           {severities['Low']}")
    print(f"  🔵 Informational Alerts:          {severities['Informational']}")
    print("="*50)
    print("Scan finished. Review the exported HTML report for remediation actions.")

if __name__ == "__main__":
    run_security_scan()
